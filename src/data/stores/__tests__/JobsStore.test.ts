import type { InitOverrideFunction } from "@openshift-migration-advisor/planner-sdk";
import type { JobApi } from "@openshift-migration-advisor/planner-sdk";
import type { Job } from "@openshift-migration-advisor/planner-sdk";
import { JobStatus } from "@openshift-migration-advisor/planner-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobsStore, TERMINAL_JOB_STATUSES } from "../JobsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  status: JobStatus.Pending,
  assessmentId: undefined,
  ...overrides,
});

const createMockApi = (): JobApi =>
  ({
    getJob: vi.fn(),
    cancelJob: vi.fn(),
    createRVToolsAssessmentV2: vi.fn(),
    uploadRvtoolsToAssessment: vi.fn(),
  }) as unknown as JobApi;

const testFiles = (): File[] => [new File([], "f.xlsx")];

const mockCreateJobSuccess = (api: JobApi, job: Job): void => {
  vi.mocked(api.createRVToolsAssessmentV2).mockResolvedValueOnce(job);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("JobsStore", () => {
  let api: JobApi;
  let store: JobsStore;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMockApi();
    store = new JobsStore(api);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -- Initial state --------------------------------------------------------

  it("has a clean initial state", () => {
    const snap = store.getSnapshot();
    expect(snap.currentJob).toBeNull();
    expect(snap.isCreating).toBe(false);
    expect(snap.createError).toBeUndefined();
  });

  // -- createRVToolsJob -----------------------------------------------------

  it("sets isCreating while the API call is in flight", async () => {
    let resolveCreate!: (job: Job) => void;
    vi.mocked(api.createRVToolsAssessmentV2).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const promise = store.createRVToolsJob("test", testFiles());
    expect(store.getSnapshot().isCreating).toBe(true);

    resolveCreate(makeJob());
    await promise;
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("calls createRVToolsAssessmentV2 with the first file only", async () => {
    const file = new File([], "east.xlsx");
    const job = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, job);

    await store.createRVToolsJob("Acme", [file]);

    expect(api.createRVToolsAssessmentV2).toHaveBeenCalledWith(
      { name: "Acme", file },
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
    expect(store.getSnapshot().currentJob).toEqual(job);
  });

  it("stores the created job in state (does NOT auto-start polling)", async () => {
    const job = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, job);

    await store.createRVToolsJob("test", testFiles());
    expect(store.getSnapshot().currentJob).toEqual(job);

    vi.mocked(api.getJob).mockResolvedValue(job);
    await vi.advanceTimersByTimeAsync(1100);
    expect(api.getJob).not.toHaveBeenCalled();
  });

  it("sets createError on failure", async () => {
    vi.mocked(api.createRVToolsAssessmentV2).mockRejectedValueOnce(
      new Error("boom"),
    );

    const result = await store.createRVToolsJob("test", testFiles());

    expect(result).toBeUndefined();
    expect(store.getSnapshot().currentJob?.status).toBe(JobStatus.Failed);
    expect(store.getSnapshot().createError).toEqual(new Error("boom"));
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("returns the next job when the first create API call fails and another file remains", async () => {
    const fileA = new File([], "a.xlsx");
    const fileB = new File([], "b.xlsx");
    const secondJob = makeJob({ id: 2, status: JobStatus.Parsing });

    vi.mocked(api.createRVToolsAssessmentV2)
      .mockRejectedValueOnce(new Error("not valid excel"))
      .mockResolvedValueOnce(secondJob);

    const result = await store.createRVToolsJob("multi", [fileA, fileB]);

    expect(result).toEqual(secondJob);
    expect(store.getSnapshot().rvtoolsUpload?.results[0]?.status).toBe(
      "invalid",
    );
    expect(store.getSnapshot().currentJob?.id).toBe(2);
  });

  it("stale call does not overwrite state when a newer call has started", async () => {
    let rejectFirst!: (err: Error) => void;
    vi.mocked(api.createRVToolsAssessmentV2)
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockRejectedValueOnce(new Error("second error"));

    const firstPromise = store.createRVToolsJob("first", testFiles());
    const secondPromise = store.createRVToolsJob("second", testFiles());

    rejectFirst(new Error("first error"));

    await firstPromise;
    await secondPromise;

    expect(store.getSnapshot().createError?.message).toBe("second error");
  });

  it("uploads additional files after the create job completes", async () => {
    const fileA = new File([], "a.xlsx");
    const fileB = new File([], "b.xlsx");
    const createJob = makeJob({ id: 1, status: JobStatus.Parsing });
    const uploadJob = makeJob({ id: 2, status: JobStatus.Parsing });

    mockCreateJobSuccess(api, createJob);
    vi.mocked(api.uploadRvtoolsToAssessment).mockResolvedValueOnce(uploadJob);

    await store.createRVToolsJob("multi", [fileA, fileB]);
    store.startPolling(1000);

    vi.mocked(api.getJob).mockResolvedValueOnce(
      makeJob({
        id: 1,
        status: JobStatus.Completed,
        assessmentId: "assessment-1",
      }),
    );

    await vi.advanceTimersByTimeAsync(1000);

    expect(api.uploadRvtoolsToAssessment).toHaveBeenCalledWith(
      { id: "assessment-1", file: fileB },
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
    expect(store.getSnapshot().currentJob?.id).toBe(2);

    store.stopPolling();
  });

  it("preserves partial assessment id when a later file fails during create", async () => {
    const fileA = new File([], "a.xlsx");
    const fileB = new File([], "b.xlsx");
    const createJob = makeJob({ id: 1, status: JobStatus.Parsing });
    const uploadJob = makeJob({ id: 2, status: JobStatus.Parsing });

    mockCreateJobSuccess(api, createJob);
    vi.mocked(api.uploadRvtoolsToAssessment).mockResolvedValueOnce(uploadJob);

    await store.createRVToolsJob("multi", [fileA, fileB]);
    store.startPolling(1000);

    vi.mocked(api.getJob).mockResolvedValueOnce(
      makeJob({
        id: 1,
        status: JobStatus.Completed,
        assessmentId: "assessment-partial",
      }),
    );
    await vi.advanceTimersByTimeAsync(1000);

    vi.mocked(api.getJob).mockResolvedValueOnce(
      makeJob({
        id: 2,
        status: JobStatus.Failed,
        error: "not a valid zip file",
        assessmentId: "assessment-partial",
      }),
    );
    await vi.advanceTimersByTimeAsync(1000);

    expect(store.getSnapshot().rvtoolsPartialAssessmentId).toBe(
      "assessment-partial",
    );
    expect(store.getSnapshot().rvtoolsUpload?.results[1]?.status).toBe(
      "invalid",
    );

    store.stopPolling();
  });

  // -- appendRvtoolsToAssessment --------------------------------------------

  it("calls uploadRvtoolsToAssessment with the first file", async () => {
    const file = new File([], "vc.xlsx");
    const job = makeJob();
    vi.mocked(api.uploadRvtoolsToAssessment).mockResolvedValueOnce(job);

    await store.appendRvtoolsToAssessment("id-1", [file]);

    expect(api.uploadRvtoolsToAssessment).toHaveBeenCalledWith(
      { id: "id-1", file },
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }),
    );
  });

  it("keeps upload results after a successful append job completes", async () => {
    const file = new File([], "vc.xlsx");
    const uploadJob = makeJob({ id: 2, status: JobStatus.Parsing });
    vi.mocked(api.uploadRvtoolsToAssessment).mockResolvedValueOnce(uploadJob);

    await store.appendRvtoolsToAssessment("assessment-1", [file]);
    store.startPolling(1000);

    vi.mocked(api.getJob).mockResolvedValueOnce(
      makeJob({
        id: 2,
        status: JobStatus.Completed,
        assessmentId: "assessment-1",
      }),
    );
    await vi.advanceTimersByTimeAsync(1000);

    expect(store.getSnapshot().rvtoolsUpload?.results).toEqual([
      expect.objectContaining({ fileName: "vc.xlsx", status: "valid" }),
    ]);

    store.stopPolling();
  });

  // -- Polling --------------------------------------------------------------

  it("polls the job and updates state on each tick", async () => {
    const initialJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, initialJob);
    await store.createRVToolsJob("t", testFiles());

    store.startPolling(1000);

    const updatedJob = makeJob({ status: JobStatus.Parsing, id: 1 });
    vi.mocked(api.getJob).mockResolvedValue(updatedJob);

    await vi.advanceTimersByTimeAsync(1000);

    const [firstArg, secondArg] = vi.mocked(api.getJob).mock.calls[0] as [
      { id: number },
      RequestInit | undefined,
    ];
    expect(firstArg).toEqual({ id: 1 });
    expect(secondArg?.signal).toBeInstanceOf(AbortSignal);

    expect(store.getSnapshot().currentJob).toEqual(updatedJob);

    store.stopPolling();
  });

  it("poll() is a no-op when job reaches terminal state", async () => {
    const initialJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, initialJob);
    await store.createRVToolsJob("t", testFiles());

    store.startPolling(1000);

    const completedJob = makeJob({
      status: JobStatus.Completed,
      assessmentId: "a-1",
    });
    vi.mocked(api.getJob).mockResolvedValue(completedJob);

    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getSnapshot().currentJob?.status).toBe(JobStatus.Completed);

    vi.mocked(api.getJob).mockClear();
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.getJob).not.toHaveBeenCalled();

    store.stopPolling();
  });

  // -- cancelRVToolsJob -----------------------------------------------------

  it("cancels a running job on the server and returns it", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, runningJob);
    await store.createRVToolsJob("t", testFiles());

    vi.mocked(api.getJob).mockResolvedValue(runningJob);
    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);

    const result = await store.cancelRVToolsJob();

    expect(api.cancelJob).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(runningJob);
    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("does NOT cancel an already-completed job on the server", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, runningJob);
    await store.createRVToolsJob("t", testFiles());

    const completedJob = makeJob({
      status: JobStatus.Completed,
      assessmentId: "a-1",
    });
    vi.mocked(api.getJob).mockResolvedValue(completedJob);

    const result = await store.cancelRVToolsJob();

    expect(api.cancelJob).not.toHaveBeenCalled();
    expect(result).toEqual(completedJob);
    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("returns null when there is no current job", async () => {
    const result = await store.cancelRVToolsJob();
    expect(result).toBeNull();
  });

  it("resets store state immediately (before the server getJob/cancelJob round-trips)", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, runningJob);
    await store.createRVToolsJob("t", testFiles());

    let resolveGetJob!: (job: Job) => void;
    vi.mocked(api.getJob).mockReturnValue(
      new Promise<Job>((resolve) => {
        resolveGetJob = resolve;
      }),
    );

    const cancelPromise = store.cancelRVToolsJob();

    expect(store.getSnapshot().currentJob).toBeNull();
    expect(store.getSnapshot().isCreating).toBe(false);

    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);
    resolveGetJob(runningJob);
    await cancelPromise;
  });

  it("stale in-flight poll response does not repopulate currentJob after cancel", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, runningJob);
    await store.createRVToolsJob("t", testFiles());

    let resolvePollGetJob!: (job: Job) => void;
    vi.mocked(api.getJob)
      .mockImplementationOnce(
        (_params, initOverrides?: RequestInit | InitOverrideFunction) =>
          new Promise<Job>((resolve, reject) => {
            resolvePollGetJob = resolve;
            const init =
              typeof initOverrides !== "function" ? initOverrides : undefined;
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      )
      .mockResolvedValueOnce(runningJob);

    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(1000);

    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);
    const cancelPromise = store.cancelRVToolsJob();

    resolvePollGetJob(runningJob);
    await cancelPromise;

    expect(store.getSnapshot().currentJob).toBeNull();
  });

  // -- clearCreateError ------------------------------------------------------

  it("clears createError", async () => {
    vi.mocked(api.createRVToolsAssessmentV2).mockRejectedValueOnce(
      new Error("name error"),
    );
    await store.createRVToolsJob("bad", [new File([], "f.xlsx")]);
    expect(store.getSnapshot().createError).toBeDefined();

    store.clearCreateError();

    expect(store.getSnapshot().createError).toBeUndefined();
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("also clears currentJob when it is in a terminal state", async () => {
    const failedJob = makeJob({ status: JobStatus.Failed, error: "boom" });
    mockCreateJobSuccess(api, makeJob({ status: JobStatus.Pending }));
    await store.createRVToolsJob("t", testFiles());

    vi.mocked(api.getJob).mockResolvedValue(failedJob);
    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(1000);
    store.stopPolling();
    expect(store.getSnapshot().currentJob?.status).toBe(JobStatus.Failed);

    store.clearCreateError();

    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("does NOT clear a non-terminal currentJob", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, runningJob);
    await store.createRVToolsJob("t", testFiles());

    store.clearCreateError();

    expect(store.getSnapshot().currentJob).toEqual(runningJob);
  });

  it("clearCreateError is a no-op when there is nothing to clear", () => {
    const listener = vi.fn();
    store.subscribe(listener);

    store.clearCreateError();

    expect(listener).not.toHaveBeenCalled();
  });

  it("removeRvtoolsUploadResult drops a matching file from upload results", async () => {
    const fileA = new File(["a"], "a.xlsx");
    const fileB = new File(["b"], "b.xlsx");
    mockCreateJobSuccess(api, makeJob({ status: JobStatus.Pending }));
    await store.createRVToolsJob("t", [fileA, fileB]);

    expect(store.getSnapshot().rvtoolsUpload?.results).toHaveLength(2);

    store.removeRvtoolsUploadResult(fileA.name, fileA.size);

    const results = store.getSnapshot().rvtoolsUpload?.results;
    expect(results).toHaveLength(1);
    expect(results?.[0].fileName).toBe("b.xlsx");
  });

  // -- reset ----------------------------------------------------------------

  it("clears state on reset (does NOT stop polling)", async () => {
    const job = makeJob({ status: JobStatus.Parsing });
    mockCreateJobSuccess(api, job);
    await store.createRVToolsJob("t", testFiles());

    store.reset();

    expect(store.getSnapshot().currentJob).toBeNull();
    expect(store.getSnapshot().isCreating).toBe(false);
    expect(store.getSnapshot().createError).toBeUndefined();
  });

  // -- subscribe / notify ---------------------------------------------------

  it("notifies subscribers on state changes", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const job = makeJob();
    mockCreateJobSuccess(api, job);
    await store.createRVToolsJob("t", testFiles());

    expect(listener).toHaveBeenCalled();
  });

  // -- TERMINAL_JOB_STATUSES ------------------------------------------------

  it("exports the correct terminal statuses", () => {
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Completed);
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Failed);
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Cancelled);
    expect(TERMINAL_JOB_STATUSES).toHaveLength(3);
  });
});
