import type {
  Assessment,
  Source,
} from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AssessmentModel,
  createAssessmentModel,
} from "../../../../models/AssessmentModel";
import {
  createSourceModel,
  type SourceModel,
} from "../../../../models/SourceModel";
import { useEnvironmentPageViewModel } from "../useEnvironmentPageViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockSourcesStore: {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  updateInventory: ReturnType<typeof vi.fn>;
  uploadInventoryFile: ReturnType<typeof vi.fn>;
  startPolling: ReturnType<typeof vi.fn>;
  stopPolling: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

let mockAssessmentsStore: {
  list: ReturnType<typeof vi.fn>;
  share: ReturnType<typeof vi.fn>;
  unshare: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  startPolling: ReturnType<typeof vi.fn>;
  stopPolling: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

let mockImagesStore: {
  headImage: ReturnType<typeof vi.fn>;
  getDownloadUrl: ReturnType<typeof vi.fn>;
  getDownloadUrlFromCache: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

let sourcesData: SourceModel[];
let sourcesListeners: Set<() => void>;
let assessmentsData: AssessmentModel[];
let assessmentsListeners: Set<() => void>;

vi.mock("@openshift-migration-advisor/ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "SourcesStore") return mockSourcesStore;
    if (key === "AssessmentsStore") return mockAssessmentsStore;
    if (key === "ImagesStore") return mockImagesStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSource = (overrides: Partial<Source> = {}): SourceModel =>
  createSourceModel({
    id: "src-1",
    name: "test-source",
    ...overrides,
  } as Source);

const makeAssessment = (overrides: Partial<Assessment> = {}): AssessmentModel =>
  createAssessmentModel({
    id: "assess-1",
    name: "test-assessment",
    ...overrides,
  } as Assessment);

const setSourcesData = (data: SourceModel[]): void => {
  sourcesData = data;
  sourcesListeners.forEach((fn) => fn());
};

const setAssessmentsData = (data: AssessmentModel[]): void => {
  assessmentsData = data;
  assessmentsListeners.forEach((fn) => fn());
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useEnvironmentPageViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    sourcesData = [];
    sourcesListeners = new Set();
    assessmentsData = [];
    assessmentsListeners = new Set();

    mockSourcesStore = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
      updateInventory: vi.fn(),
      uploadInventoryFile: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      subscribe: vi.fn((listener: () => void) => {
        sourcesListeners.add(listener);
        return () => sourcesListeners.delete(listener);
      }),
      getSnapshot: vi.fn(() => sourcesData),
    };

    mockAssessmentsStore = {
      list: vi.fn().mockResolvedValue([]),
      share: vi.fn().mockResolvedValue(undefined),
      unshare: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      subscribe: vi.fn((listener: () => void) => {
        assessmentsListeners.add(listener);
        return () => assessmentsListeners.delete(listener);
      }),
      getSnapshot: vi.fn(() => assessmentsData),
    };

    mockImagesStore = {
      headImage: vi.fn().mockResolvedValue(undefined),
      getDownloadUrl: vi
        .fn()
        .mockResolvedValue("https://example.com/image.ova"),
      getDownloadUrlFromCache: vi.fn().mockReturnValue(undefined),
      subscribe: vi.fn(() => () => {}),
      getSnapshot: vi.fn(() => ({})),
    };
  });

  // ---- Lifecycle -----------------------------------------------------------

  it("starts polling and initial fetch on mount", () => {
    renderHook(() => useEnvironmentPageViewModel());

    expect(mockSourcesStore.startPolling).toHaveBeenCalledTimes(1);
    expect(mockAssessmentsStore.startPolling).toHaveBeenCalledTimes(1);
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(1);
    expect(mockAssessmentsStore.list).toHaveBeenCalledTimes(1);
  });

  it("stops polling on unmount", () => {
    const { unmount } = renderHook(() => useEnvironmentPageViewModel());
    unmount();

    expect(mockSourcesStore.stopPolling).toHaveBeenCalledTimes(1);
    expect(mockAssessmentsStore.stopPolling).toHaveBeenCalledTimes(1);
  });

  // ---- Reactive data -------------------------------------------------------

  it("reflects sources data from the store", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.sources).toEqual([]);

    const src = makeSource();
    act(() => setSourcesData([src]));
    expect(result.current.sources).toEqual([src]);
  });

  it("reflects assessments data from the store", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.assessments).toEqual([]);

    const assessment = makeAssessment();
    act(() => setAssessmentsData([assessment]));
    expect(result.current.assessments).toEqual([assessment]);
  });

  // ---- Source selection ----------------------------------------------------

  it("selects a source by reference", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    const src = makeSource();

    act(() => result.current.selectSource(src));
    expect(result.current.sourceSelected).toEqual(src);

    act(() => result.current.selectSource(null));
    expect(result.current.sourceSelected).toBeNull();
  });

  it("selects a source by ID (from store cache)", () => {
    const src = makeSource({ id: "src-42" });
    mockSourcesStore.getById.mockReturnValue(src);

    const { result } = renderHook(() => useEnvironmentPageViewModel());
    act(() => result.current.selectSourceById("src-42"));

    expect(mockSourcesStore.getById).toHaveBeenCalledWith("src-42");
    expect(result.current.sourceSelected).toEqual(src);
  });

  it("delegates getSourceById to the store", () => {
    const src = makeSource({ id: "src-99" });
    mockSourcesStore.getById.mockReturnValue(src);

    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.getSourceById("src-99")).toEqual(src);
  });

  // ---- Source CRUD ---------------------------------------------------------

  it("delegates listSources to the store", async () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());

    mockSourcesStore.list.mockResolvedValue([makeSource()]);
    await act(() => result.current.listSources());

    // 1 call from mount + 1 from explicit call
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(2);
  });

  it("delegates deleteSource to the store and tracks loading", async () => {
    const deleted = makeSource({ id: "del-1" });
    mockSourcesStore.delete.mockResolvedValue(deleted);

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    let promise: Promise<SourceModel>;
    act(() => {
      promise = result.current.deleteSource("del-1");
    });

    expect(result.current.isDeletingSource).toBe(true);
    await act(() => promise!);
    expect(result.current.isDeletingSource).toBe(false);
    expect(mockSourcesStore.delete).toHaveBeenCalledWith("del-1");
  });

  // ---- Create download source flow ----------------------------------------

  it("orchestrates create → headImage → getDownloadUrl", async () => {
    const newSrc = makeSource({ id: "new-1" });
    mockSourcesStore.create.mockResolvedValue(newSrc);
    mockImagesStore.getDownloadUrl.mockResolvedValue(
      "https://dl.example.com/new.ova",
    );

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "my-env",
        sshPublicKey: "ssh-rsa AAAA",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );

    expect(mockSourcesStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my-env" }),
    );
    expect(mockImagesStore.headImage).toHaveBeenCalledWith("new-1");
    expect(mockImagesStore.getDownloadUrl).toHaveBeenCalledWith("new-1");
    expect(result.current.downloadSourceUrl).toBe(
      "https://dl.example.com/new.ova",
    );
    expect(result.current.sourceCreatedId).toBe("new-1");
    expect(result.current.isDownloadingSource).toBe(false);
  });

  it("sets errorDownloadingSource when create fails", async () => {
    mockSourcesStore.create.mockRejectedValue(new Error("create failed"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "bad",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );

    expect(result.current.errorDownloadingSource?.message).toBe(
      "create failed",
    );
  });

  // ---- Update source flow --------------------------------------------------

  it("orchestrates update → headImage → getDownloadUrl", async () => {
    const updated = makeSource({ id: "upd-1" });
    mockSourcesStore.update.mockResolvedValue(updated);
    mockImagesStore.getDownloadUrl.mockResolvedValue(
      "https://dl.example.com/updated.ova",
    );

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.updateSource({
        sourceId: "upd-1",
        sshPublicKey: "ssh-ed25519 BBB",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );

    expect(mockSourcesStore.update).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: "upd-1" }),
    );
    expect(mockImagesStore.headImage).toHaveBeenCalledWith("upd-1");
    expect(result.current.downloadSourceUrl).toBe(
      "https://dl.example.com/updated.ova",
    );
    expect(result.current.isUpdatingSource).toBe(false);
  });

  it("sets errorUpdatingSource when update fails", async () => {
    mockSourcesStore.update.mockRejectedValue(new Error("update failed"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.updateSource({
        sourceId: "fail-1",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );

    expect(result.current.errorUpdatingSource?.message).toBe("update failed");
  });

  // ---- Inventory upload ----------------------------------------------------

  it("exposes uploadInventoryFromFile as a callable function", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(typeof result.current.uploadInventoryFromFile).toBe("function");
  });

  it("exposes inventoryUploadResult and clearInventoryUploadResult", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.inventoryUploadResult).toBeNull();
    expect(typeof result.current.clearInventoryUploadResult).toBe("function");
  });

  it("surfaces the API error message when inventory file upload fails", async () => {
    const apiMessage =
      "failed to update source inventory: failed to create source subset inventories: already exists";
    mockSourcesStore.uploadInventoryFile.mockRejectedValue(
      new Error(apiMessage),
    );

    const appendChildSpy = vi.spyOn(document.body, "appendChild");

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    act(() => {
      result.current.uploadInventoryFromFile("src-1");
    });

    const input = appendChildSpy.mock.calls.at(-1)?.[0] as HTMLInputElement;
    const file = new File(["{}"], "inventory.zip", { type: "application/zip" });
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      await input.onchange?.({ target: input } as unknown as Event);
    });

    appendChildSpy.mockRestore();

    expect(result.current.inventoryUploadResult).toEqual({
      message: apiMessage,
      isError: true,
    });
    expect(result.current.inventoryUploadResult?.message).not.toMatch(
      /old schema version/i,
    );
  });

  // ---- Download URLs -------------------------------------------------------

  it("delegates getDownloadUrlForSource to ImagesStore cache", () => {
    mockImagesStore.getDownloadUrlFromCache.mockReturnValue(
      "https://cached.ova",
    );

    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.getDownloadUrlForSource("src-1")).toBe(
      "https://cached.ova",
    );
  });

  // ---- UI state helpers ----------------------------------------------------

  it("manages downloadSourceUrl and sourceCreatedId", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());

    act(() => result.current.setDownloadUrl("https://manual.ova"));
    expect(result.current.downloadSourceUrl).toBe("https://manual.ova");

    act(() => result.current.setDownloadUrl(""));
    expect(result.current.downloadSourceUrl).toBe("");
  });

  it("clears sourceCreatedId via deleteSourceCreated", async () => {
    const newSrc = makeSource({ id: "c-1" });
    mockSourcesStore.create.mockResolvedValue(newSrc);

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "tmp",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );
    expect(result.current.sourceCreatedId).toBe("c-1");

    act(() => result.current.deleteSourceCreated());
    expect(result.current.sourceCreatedId).toBeNull();
  });

  it("manages assessmentFromAgentState", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());
    expect(result.current.assessmentFromAgentState).toBe(false);

    act(() => result.current.setAssessmentFromAgent(true));
    expect(result.current.assessmentFromAgentState).toBe(true);
  });

  // ---- Error dismiss -------------------------------------------------------

  it("clears download error via clearErrors", async () => {
    mockSourcesStore.create.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "err",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );
    expect(result.current.errorDownloadingSource).toBeDefined();

    act(() => result.current.clearErrors({ downloading: true }));
    expect(result.current.errorDownloadingSource).toBeUndefined();
  });

  it("clears update error via clearErrors", async () => {
    mockSourcesStore.update.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.updateSource({
        sourceId: "x",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );
    expect(result.current.errorUpdatingSource).toBeDefined();

    act(() => result.current.clearErrors({ updating: true }));
    expect(result.current.errorUpdatingSource).toBeUndefined();
  });

  it("clearErrors with no options clears both download and update errors", async () => {
    mockSourcesStore.create.mockRejectedValue(new Error("dl fail"));
    mockSourcesStore.update.mockRejectedValue(new Error("up fail"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "err1",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );
    expect(result.current.errorDownloadingSource).toBeDefined();

    act(() => result.current.clearErrors());
    expect(result.current.errorDownloadingSource).toBeUndefined();
  });

  it("clearErrors with creating flag clears download error", async () => {
    mockSourcesStore.create.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() =>
      result.current.createDownloadSource({
        name: "err",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      }),
    );
    expect(result.current.errorDownloadingSource).toBeDefined();

    act(() => result.current.clearErrors({ creating: true }));
    expect(result.current.errorDownloadingSource).toBeUndefined();
  });

  // ---- selectSourceById fallback (source not yet loaded) -------------------

  it("selectSourceById fetches and then selects when source is not in cache", async () => {
    const src = makeSource({ id: "lazy-1" });
    mockSourcesStore.getById
      .mockReturnValueOnce(undefined) // first call: not found
      .mockReturnValueOnce(src); // after list: found
    mockSourcesStore.list.mockResolvedValue([src]);

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(async () => {
      result.current.selectSourceById("lazy-1");
      await Promise.resolve();
    });

    // list was called (once on mount + once for the fallback fetch)
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(2);
  });

  // ---- Composite actions ---------------------------------------------------

  it("deleteAndRefresh deletes then lists sources", async () => {
    const deleted = makeSource({ id: "d-1" });
    mockSourcesStore.delete.mockResolvedValue(deleted);
    mockSourcesStore.list.mockResolvedValue([]);

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() => result.current.deleteAndRefresh("d-1"));

    expect(mockSourcesStore.delete).toHaveBeenCalledWith("d-1");
    // Mount call + deleteAndRefresh call
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(2);
    expect(result.current.isDeletingAndRefreshing).toBe(false);
  });

  it("refreshOnFocus lists both sources and assessments", async () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() => result.current.refreshOnFocus());

    // Mount call + refreshOnFocus call
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(2);
    expect(mockAssessmentsStore.list).toHaveBeenCalledTimes(2);
  });

  // ---- Assessments ---------------------------------------------------------

  it("delegates listAssessments to the assessments store", async () => {
    const assessment = makeAssessment({ id: "a-1" });
    mockAssessmentsStore.list.mockResolvedValue([assessment]);

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() => result.current.listAssessments());

    // Mount call + explicit call
    expect(mockAssessmentsStore.list).toHaveBeenCalledTimes(2);
  });

  it("delegates share, unshare, and delete assessment to the assessments store", async () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());

    await act(() => result.current.shareAssessment("a-1"));
    await act(() => result.current.unshareAssessment("a-1"));
    await act(() => result.current.deleteAssessment("a-1"));

    expect(mockAssessmentsStore.share).toHaveBeenCalledWith("a-1");
    expect(mockAssessmentsStore.unshare).toHaveBeenCalledWith("a-1");
    expect(mockAssessmentsStore.remove).toHaveBeenCalledWith("a-1");
  });

  // ---- Polling custom delay ------------------------------------------------

  it("startPolling passes custom delay to both stores", () => {
    const { result } = renderHook(() => useEnvironmentPageViewModel());

    act(() => result.current.startPolling(5000));

    // 1 call from mount (default) + 1 explicit call
    expect(mockSourcesStore.startPolling).toHaveBeenCalledTimes(2);
    expect(mockSourcesStore.startPolling).toHaveBeenLastCalledWith(5000);
    expect(mockAssessmentsStore.startPolling).toHaveBeenLastCalledWith(5000);
  });

  // ---- Error suppressed while loading --------------------------------------

  it("errorDownloadingSource is undefined while download is loading", async () => {
    let rejectCreate!: (err: Error) => void;
    mockSourcesStore.create.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCreate = reject;
      }),
    );

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.createDownloadSource({
        name: "loading-test",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      });
    });

    // While loading, error should be suppressed
    expect(result.current.isDownloadingSource).toBe(true);
    expect(result.current.errorDownloadingSource).toBeUndefined();

    await act(async () => {
      rejectCreate(new Error("eventually failed"));
      try {
        await promise!;
      } catch {
        // expected
      }
    });

    expect(result.current.isDownloadingSource).toBe(false);
    expect(result.current.errorDownloadingSource?.message).toBe(
      "eventually failed",
    );
  });

  it("errorUpdatingSource is undefined while update is loading", async () => {
    let rejectUpdate!: (err: Error) => void;
    mockSourcesStore.update.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUpdate = reject;
      }),
    );

    const { result } = renderHook(() => useEnvironmentPageViewModel());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.updateSource({
        sourceId: "upd-loading",
        sshPublicKey: "",
        enableProxy: false,
        httpProxy: "",
        httpsProxy: "",
        noProxy: "",
      });
    });

    expect(result.current.isUpdatingSource).toBe(true);
    expect(result.current.errorUpdatingSource).toBeUndefined();

    await act(async () => {
      rejectUpdate(new Error("update eventually failed"));
      try {
        await promise!;
      } catch {
        // expected
      }
    });

    expect(result.current.errorUpdatingSource?.message).toBe(
      "update eventually failed",
    );
  });
});
