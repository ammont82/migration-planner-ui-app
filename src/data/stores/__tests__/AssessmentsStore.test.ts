import type { AssessmentApiInterface } from "@openshift-migration-advisor/planner-sdk";
import type { Assessment } from "@openshift-migration-advisor/planner-sdk";
import { ResponseError } from "@openshift-migration-advisor/planner-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AssessmentListResponse,
  AssessmentsStore,
} from "../AssessmentsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAssessment = (overrides: Partial<Assessment> = {}): Assessment =>
  ({
    id: "a-1",
    name: "Test Assessment",
    snapshots: [],
    ...overrides,
  }) as Assessment;

const createMockApi = (): AssessmentApiInterface =>
  ({
    listAssessments: vi.fn(),
    getAssessment: vi.fn(),
    getVcenter: vi.fn(),
    getVcenterCluster: vi.fn(),
    createAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
    calculateAssessmentClusterRequirements: vi.fn(),
    getAssessmentEnhancementData: vi.fn(),
    saveAssessmentEnhancementData: vi.fn(),
  }) as unknown as AssessmentApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AssessmentsStore", () => {
  let api: AssessmentApiInterface;
  let store: AssessmentsStore;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMockApi();
    store = new AssessmentsStore(api);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual([]);
  });

  it("list() normalizes array response", async () => {
    const items = [
      makeAssessment({ id: "a-1", name: "A" }),
      makeAssessment({ id: "a-2", name: "B" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);

    const result = await store.list();

    expect(api.listAssessments).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("A");
    expect(result[0]).toHaveProperty("ownerFullName");
    expect(result[0]).toHaveProperty("hasUsefulData");
  });

  it("list() normalizes {items} response", async () => {
    const items = [makeAssessment({ id: "a-1", name: "Item" })];
    const response: AssessmentListResponse = { items };
    vi.mocked(api.listAssessments).mockResolvedValue(response as Assessment[]);

    const result = await store.list();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("Item");
  });

  it("list() normalizes {assessments} response", async () => {
    const assessments = [makeAssessment({ id: "a-1", name: "Assessment" })];
    const response: AssessmentListResponse = { assessments };
    vi.mocked(api.listAssessments).mockResolvedValue(response as Assessment[]);

    const result = await store.list();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("Assessment");
  });

  it("get() fetches and upserts a single assessment", async () => {
    const raw = makeAssessment({ id: "a-1", name: "Detailed" });
    vi.mocked(api.getAssessment).mockResolvedValue(raw);

    const result = await store.get("a-1");

    expect(api.getAssessment).toHaveBeenCalledWith({ id: "a-1" }, undefined);
    expect(result.id).toBe("a-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getById("a-1")?.name).toBe("Detailed");
  });

  it("get() replaces an existing assessment in local state", async () => {
    const listed = makeAssessment({ id: "a-1", name: "Listed" });
    vi.mocked(api.listAssessments).mockResolvedValue([listed]);
    await store.list();

    const detailed = makeAssessment({ id: "a-1", name: "Detailed" });
    vi.mocked(api.getAssessment).mockResolvedValue(detailed);

    await store.get("a-1");

    expect(store.getById("a-1")?.name).toBe("Detailed");
    expect(store.getSnapshot()).toHaveLength(1);
  });

  it("list() preserves subsetInventories from a prior get() when list omits the field", async () => {
    const snapshotCreatedAt = new Date("2026-01-02T12:00:00.000Z");
    const inventory = {
      vcenterId: "vc-1",
      clusters: { "cluster-a": { infra: {}, vms: { total: 3 } } },
    };
    const subsetInventories = [
      {
        id: "all",
        name: "Empty Group",
        vcenterId: "vc-1",
        vmsCount: 3,
        createdAt: snapshotCreatedAt,
        inventory,
      },
    ];

    const detailed = makeAssessment({
      id: "a-1",
      snapshots: [
        {
          createdAt: snapshotCreatedAt,
          inventory,
          subsetInventories,
        },
      ] as unknown as Assessment["snapshots"],
    });
    vi.mocked(api.getAssessment).mockResolvedValue(detailed);
    await store.get("a-1");

    const listed = makeAssessment({
      id: "a-1",
      name: "Listed",
      snapshots: [
        {
          createdAt: snapshotCreatedAt,
          inventory,
        },
      ] as unknown as Assessment["snapshots"],
    });
    vi.mocked(api.listAssessments).mockResolvedValue([listed]);
    await store.list();

    expect(store.getById("a-1")?.snapshotsSorted[0].subsetInventories).toEqual(
      subsetInventories,
    );
  });

  it("list() maps results to AssessmentModel (has ownerFullName, hasUsefulData etc.)", async () => {
    const raw = makeAssessment({
      id: "a-1",
      name: "Test",
      ownerFirstName: "john",
      ownerLastName: "doe",
    });
    vi.mocked(api.listAssessments).mockResolvedValue([raw]);

    const result = await store.list();

    expect(result[0].ownerFullName).toBe("John Doe");
    expect(typeof result[0].hasUsefulData).toBe("boolean");
    expect(result[0]).toHaveProperty("latestSnapshot");
    expect(result[0]).toHaveProperty("snapshotsSorted");
  });

  it("getById() returns found item or undefined", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    expect(store.getById("a-1")).toBeDefined();
    expect(store.getById("a-1")?.id).toBe("a-1");
    expect(store.getById("a-2")?.id).toBe("a-2");
    expect(store.getById("a-3")).toBeUndefined();
  });

  it("create() adds new item", async () => {
    const created = makeAssessment({ id: "a-1", name: "New" });
    vi.mocked(api.createAssessment).mockResolvedValue(created);

    const form = { name: "New" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];
    const result = await store.create(form);

    expect(api.createAssessment).toHaveBeenCalledWith(
      { assessmentForm: form },
      undefined,
    );
    expect(result.id).toBe("a-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].name).toBe("New");
  });

  it("create() extracts error message from ResponseError with JSON body", async () => {
    const mockResponse = {
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: 'assessment with name "dup" already exists',
        }),
      ),
      status: 409,
      ok: false,
      statusText: "Conflict",
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse, "Response error");
    vi.mocked(api.createAssessment).mockRejectedValue(responseError);

    const form = { name: "dup" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];

    await expect(store.create(form)).rejects.toThrow(
      'assessment with name "dup" already exists',
    );
  });

  it("create() extracts error message from ResponseError with name validation error", async () => {
    const mockResponse = {
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: "The provided name: aaa aaa is invalid.",
        }),
      ),
      status: 400,
      ok: false,
      statusText: "Bad Request",
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse, "Response error");
    vi.mocked(api.createAssessment).mockRejectedValue(responseError);

    const form = { name: "aaa aaa" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];

    await expect(store.create(form)).rejects.toThrow(
      "The provided name: aaa aaa is invalid.",
    );
  });

  it("create() uses fallback message when error is not a ResponseError", async () => {
    vi.mocked(api.createAssessment).mockRejectedValue(
      new Error("Network failure"),
    );

    const form = { name: "test" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];

    await expect(store.create(form)).rejects.toThrow("Network failure");
  });

  it("update() replaces existing item", async () => {
    const initial = makeAssessment({ id: "a-1", name: "Old" });
    vi.mocked(api.listAssessments).mockResolvedValue([initial]);
    await store.list();

    const updated = makeAssessment({ id: "a-1", name: "Updated" });
    vi.mocked(api.updateAssessment).mockResolvedValue(updated);

    const form = {} as Parameters<
      AssessmentApiInterface["updateAssessment"]
    >[0]["assessmentUpdate"];
    const result = await store.update("a-1", form);

    expect(api.updateAssessment).toHaveBeenCalledWith(
      { id: "a-1", assessmentUpdate: form },
      undefined,
    );
    expect(result.name).toBe("Updated");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].name).toBe("Updated");
  });

  it("update() extracts error message from ResponseError with JSON body", async () => {
    const initial = makeAssessment({ id: "a-1", name: "Old" });
    vi.mocked(api.listAssessments).mockResolvedValue([initial]);
    await store.list();

    const mockResponse = {
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          message: "The provided name: bad name is invalid.",
        }),
      ),
      status: 400,
      ok: false,
      statusText: "Bad Request",
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse, "Response error");
    vi.mocked(api.updateAssessment).mockRejectedValue(responseError);

    const form = { name: "bad name" } as Parameters<
      AssessmentApiInterface["updateAssessment"]
    >[0]["assessmentUpdate"];

    await expect(store.update("a-1", form)).rejects.toThrow(
      "The provided name: bad name is invalid.",
    );
  });

  it("remove() filters out item and refreshes from server", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    vi.mocked(api.deleteAssessment).mockResolvedValue(
      makeAssessment({ id: "a-1" }),
    );
    // After deletion, list() is called to refresh from server
    vi.mocked(api.listAssessments).mockResolvedValue([
      makeAssessment({ id: "a-2" }),
    ]);

    const result = await store.remove("a-1");

    expect(api.deleteAssessment).toHaveBeenCalledWith({ id: "a-1" }, undefined);
    expect(api.listAssessments).toHaveBeenCalledTimes(2); // Initial list + refresh after delete
    expect(result.id).toBe("a-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("remove() suppresses ResponseError with status 200 (parsing error after successful deletion)", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    const mockResponse = new Response(null, { status: 200 });
    const responseError = new ResponseError(
      mockResponse,
      "Failed to parse response",
    );
    vi.mocked(api.deleteAssessment).mockRejectedValue(responseError);
    // After deletion, list() is called to refresh from server
    vi.mocked(api.listAssessments).mockResolvedValue([
      makeAssessment({ id: "a-2" }),
    ]);

    const result = await store.remove("a-1");

    expect(result.id).toBe("a-1");
    expect(api.listAssessments).toHaveBeenCalledTimes(2); // Initial list + refresh after delete
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("remove() rethrows ResponseError with non-200 status", async () => {
    const items = [makeAssessment({ id: "a-1" })];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    const mockResponse = new Response(null, { status: 404 });
    const responseError = new ResponseError(mockResponse, "Not found");
    vi.mocked(api.deleteAssessment).mockRejectedValue(responseError);

    await expect(store.remove("a-1")).rejects.toThrow(responseError);
    expect(store.getSnapshot()).toHaveLength(1);
  });

  it("remove() rethrows non-ResponseError exceptions", async () => {
    const items = [makeAssessment({ id: "a-1" })];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    const networkError = new Error("Network failure");
    vi.mocked(api.deleteAssessment).mockRejectedValue(networkError);

    await expect(store.remove("a-1")).rejects.toThrow("Network failure");
    expect(store.getSnapshot()).toHaveLength(1);
  });

  it("remove() suppresses TypeError from JSON parsing (malformed backend response)", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    // Simulate the exact error from the backend: TypeError during JSON parsing
    const typeError = new TypeError(
      "Cannot read properties of null (reading 'map')",
    );
    vi.mocked(api.deleteAssessment).mockRejectedValue(typeError);
    // After deletion, list() is called to refresh from server
    vi.mocked(api.listAssessments).mockResolvedValue([
      makeAssessment({ id: "a-2" }),
    ]);

    const result = await store.remove("a-1");

    expect(result.id).toBe("a-1");
    expect(api.listAssessments).toHaveBeenCalledTimes(2); // Initial list + refresh after delete
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("remove() rethrows unrelated TypeErrors (not backend parsing errors)", async () => {
    const items = [makeAssessment({ id: "a-1" })];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    // Simulate an unrelated TypeError (not the specific backend parsing error)
    const unrelatedError = new TypeError(
      "Cannot call method 'map' of undefined",
    );
    vi.mocked(api.deleteAssessment).mockRejectedValue(unrelatedError);

    await expect(store.remove("a-1")).rejects.toThrow(TypeError);
    expect(api.listAssessments).toHaveBeenCalledTimes(1); // Only the initial list, no refresh
    expect(store.getSnapshot()).toHaveLength(1); // Item not removed from local state
  });

  it("remove() prevents deleted item from reappearing if backend is slow", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items);
    await store.list();

    vi.mocked(api.deleteAssessment).mockResolvedValue(
      makeAssessment({ id: "a-1" }),
    );
    // Simulate slow backend: first list() call still returns the deleted item
    vi.mocked(api.listAssessments).mockResolvedValueOnce(items);
    // Second list() call (after backend processes) returns without the deleted item
    vi.mocked(api.listAssessments).mockResolvedValueOnce([
      makeAssessment({ id: "a-2" }),
    ]);

    await store.remove("a-1");

    // Even though the backend returned a-1 in the first refresh, it should be filtered out
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");

    // Simulate polling call - deleted ID cache should still filter it out
    await store.list();
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("list(sourceId) keeps assessments for that source", async () => {
    vi.mocked(api.listAssessments).mockResolvedValue([
      makeAssessment({ id: "a-1", sourceId: "source-a" }),
      makeAssessment({ id: "a-2", sourceId: "source-b" }),
    ]);

    const result = await store.list("source-a");

    expect(result.map((assessment) => assessment.id)).toEqual(["a-1"]);
  });

  it("list(sourceId) does not clear deleted-ID cache for other sources", async () => {
    const allItems = [
      makeAssessment({ id: "a-1", name: "Assessment 1" }),
      makeAssessment({ id: "a-2", name: "Assessment 2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(allItems);
    await store.list();

    // Delete a-1 (adds it to deletedAssessmentIds cache)
    vi.mocked(api.deleteAssessment).mockResolvedValue(
      makeAssessment({ id: "a-1" }),
    );
    // Mock the background refresh after delete to still include a-1 (slow backend)
    vi.mocked(api.listAssessments).mockResolvedValueOnce(allItems);
    await store.remove("a-1");

    // Verify a-1 is filtered out (deleted cache is working)
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");

    // Now call list() with a sourceId (filtered response)
    const filteredItems = [makeAssessment({ id: "a-2" })];
    vi.mocked(api.listAssessments).mockResolvedValueOnce(filteredItems);
    await store.list("someOtherSource");

    // Verify that a-1 is still in the deleted cache by calling an unfiltered list()
    vi.mocked(api.listAssessments).mockResolvedValueOnce(allItems);
    await store.list();

    // a-1 should still be filtered out (deleted cache was not cleared by the filtered call)
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("subscribe — listener called on mutation", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeAssessment({ id: "a-1" });
    vi.mocked(api.createAssessment).mockResolvedValue(created);
    const form = { name: "New" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];
    await store.create(form);

    expect(listener).toHaveBeenCalled();
  });

  it("polling — startPolling triggers periodic list()", async () => {
    vi.mocked(api.listAssessments)
      .mockResolvedValueOnce([makeAssessment({ id: "a-1" })])
      .mockResolvedValueOnce([
        makeAssessment({ id: "a-1" }),
        makeAssessment({ id: "a-2" }),
      ]);

    store.startPolling(1000);
    expect(store.getSnapshot()).toEqual([]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listAssessments).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listAssessments).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toHaveLength(2);

    store.stopPolling();
  });

  describe("enhancement data", () => {
    it("getEnhancementData returns stored data", async () => {
      const enhancement = {
        vsphereCore: { vmEncryptionEnabled: true, srmEnabled: false },
      };
      vi.mocked(api.getAssessmentEnhancementData).mockResolvedValue(
        enhancement,
      );

      await expect(store.getEnhancementData("a-1")).resolves.toEqual(
        enhancement,
      );
      expect(api.getAssessmentEnhancementData).toHaveBeenCalledWith(
        { id: "a-1" },
        undefined,
      );
    });

    it("getEnhancementData treats 404 as no saved details", async () => {
      vi.mocked(api.getAssessmentEnhancementData).mockRejectedValue(
        new ResponseError(new Response(null, { status: 404 }), "Not found"),
      );

      await expect(store.getEnhancementData("a-1")).resolves.toBeNull();
    });

    it("getEnhancementData surfaces other API errors", async () => {
      vi.mocked(api.getAssessmentEnhancementData).mockRejectedValue(
        new ResponseError(
          new Response(JSON.stringify({ message: "unavailable" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
          "unavailable",
        ),
      );

      await expect(store.getEnhancementData("a-1")).rejects.toThrow(
        "unavailable",
      );
    });

    it("saveEnhancementData posts the payload", async () => {
      const enhancement = {
        customerDetails: { targetHardware: "Dell" },
      };
      vi.mocked(api.saveAssessmentEnhancementData).mockResolvedValue(
        enhancement,
      );

      await expect(
        store.saveEnhancementData("a-1", enhancement),
      ).resolves.toEqual(enhancement);
      expect(api.saveAssessmentEnhancementData).toHaveBeenCalledWith(
        { id: "a-1", enhancementData: enhancement },
        undefined,
      );
    });
  });

  describe("v2 inventory", () => {
    it("getVcenter delegates to the assessment API", async () => {
      const payload = {
        data: {
          id: "vc-1",
          data: { infra: {} as never, vms: {} as never },
        },
        clusters: [],
      };
      vi.mocked(api.getVcenter).mockResolvedValue(payload);

      await expect(store.getVcenter("a-1", "vc-1")).resolves.toEqual(payload);
      expect(api.getVcenter).toHaveBeenCalledWith(
        { id: "a-1", vid: "vc-1" },
        undefined,
      );
    });

    it("getVcenterCluster delegates to the assessment API", async () => {
      const payload = {
        infra: {} as never,
        vms: { total: 3 } as never,
      };
      vi.mocked(api.getVcenterCluster).mockResolvedValue(payload);

      await expect(
        store.getVcenterCluster("a-1", "vc-1", "cluster-1"),
      ).resolves.toEqual(payload);
      expect(api.getVcenterCluster).toHaveBeenCalledWith(
        { id: "a-1", vid: "vc-1", cid: "cluster-1" },
        undefined,
      );
    });
  });
});
