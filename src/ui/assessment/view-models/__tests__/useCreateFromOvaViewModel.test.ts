import type { Source } from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSourceModel,
  type SourceModel,
} from "../../../../models/SourceModel";
import { useCreateFromOvaViewModel } from "../useCreateFromOvaViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
let mockLocationState:
  { reset?: boolean; preselectedSourceId?: string } | undefined = undefined;

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: mockLocationState,
    pathname: "/create",
    search: "",
    hash: "",
  }),
}));

let mockAssessmentsStore: {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

let mockEnvVm: {
  sources: SourceModel[];
  sourceCreatedId: string | null;
  sourceSelected: SourceModel | null;
  isDownloadingSource: boolean;
  errorUpdatingInventory: Error | undefined;
  assessmentFromAgentState: boolean;
  getSourceById: ReturnType<typeof vi.fn>;
  listSources: ReturnType<typeof vi.fn>;
  inventoryUploadResult: { message: string; isError: boolean } | null;
  clearInventoryUploadResult: ReturnType<typeof vi.fn>;
};

vi.mock("../../../environment/view-models/EnvironmentPageContext", () => ({
  useEnvironmentPage: () => mockEnvVm,
}));

vi.mock("@openshift-migration-advisor/ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "AssessmentsStore") return mockAssessmentsStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSource = (overrides: Partial<Source> = {}): SourceModel =>
  createSourceModel({
    id: "s-1",
    name: "test-source",
    agent: { status: "up-to-date" },
    ...overrides,
  } as Source);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreateFromOvaViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = undefined;
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    mockAssessmentsStore = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "a-1" }),
    };

    mockEnvVm = {
      sources: [],
      sourceCreatedId: null,
      sourceSelected: null,
      isDownloadingSource: false,
      errorUpdatingInventory: undefined,
      assessmentFromAgentState: false,
      getSourceById: vi.fn(),
      listSources: vi.fn().mockResolvedValue([]),
      inventoryUploadResult: null,
      clearInventoryUploadResult: vi.fn(),
    };
  });

  it("initial form state: name is empty, useExisting is false", () => {
    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.name).toBe("");
    expect(result.current.useExisting).toBe(false);
    expect(result.current.selectedEnvironmentId).toBe("");
  });

  it("availableEnvironments filters out Example sources", () => {
    const src1 = makeSource({ id: "s-1", name: "Alpha" });
    const src2 = makeSource({ id: "s-2", name: "Example" });
    const src3 = makeSource({ id: "s-3", name: "Beta" });
    mockEnvVm.sources = [src1, src2, src3];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.availableEnvironments).toEqual([src1, src3]);
  });

  it("availableEnvironments sorts alphabetically by name", () => {
    const src1 = makeSource({ id: "s-1", name: "Charlie" });
    const src2 = makeSource({ id: "s-2", name: "Alpha" });
    const src3 = makeSource({ id: "s-3", name: "Beta" });
    mockEnvVm.sources = [src1, src2, src3];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.availableEnvironments.map((s) => s.name)).toEqual([
      "Alpha",
      "Beta",
      "Charlie",
    ]);
  });

  it("isSubmitDisabled is true when name is empty", () => {
    mockEnvVm.sourceCreatedId = "s-1";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("isSubmitDisabled is true when useExisting is true but no selectedEnvironmentId", () => {
    mockEnvVm.sources = [makeSource({ id: "s-1", name: "Test" })];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("My Assessment");
      result.current.setUseExisting(true);
    });

    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("hasNameError detects duplicate name error message", async () => {
    mockAssessmentsStore.create.mockRejectedValueOnce(
      new Error("An assessment with name 'Foo' already exists"),
    );
    const source = makeSource({ id: "s-1", name: "Test" });
    mockEnvVm.sourceCreatedId = "s-1";
    mockEnvVm.getSourceById.mockReturnValue(source);

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("Foo");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.hasNameError).toBe(true);
  });

  it("hasNameError detects backend name validation error", async () => {
    mockAssessmentsStore.create.mockRejectedValueOnce(
      new Error("The provided name: aaa aaa is invalid."),
    );
    const source = makeSource({ id: "s-1", name: "Test" });
    mockEnvVm.sourceCreatedId = "s-1";
    mockEnvVm.getSourceById.mockReturnValue(source);

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("aaa aaa");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.hasNameError).toBe(true);
    expect(result.current.hasGeneralApiError).toBe(false);
  });

  it("hasGeneralApiError is true for non-name-related errors", async () => {
    mockAssessmentsStore.create.mockRejectedValueOnce(
      new Error("Network error"),
    );
    const source = makeSource({ id: "s-1", name: "Test" });
    mockEnvVm.sourceCreatedId = "s-1";
    mockEnvVm.getSourceById.mockReturnValue(source);

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("MyAssessment");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.hasGeneralApiError).toBe(true);
    expect(result.current.hasNameError).toBe(false);
  });

  it("sources comes from envVm.sources", () => {
    const sources = [
      makeSource({ id: "s-1", name: "Source1" }),
      makeSource({ id: "s-2", name: "Source2" }),
    ];
    mockEnvVm.sources = sources;

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.sources).toEqual(sources);
  });

  it("sourceCreatedId comes from envVm.sourceCreatedId", () => {
    mockEnvVm.sourceCreatedId = "s-created-123";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.sourceCreatedId).toBe("s-created-123");
  });

  // ---- Submit flow ---------------------------------------------------------

  it("handleSubmit creates assessment and navigates to report", async () => {
    mockAssessmentsStore.create.mockResolvedValue({ id: "a-new" });
    mockEnvVm.sourceCreatedId = "s-1";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("My Assessment");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAssessmentsStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Assessment",
        sourceType: "agent",
        sourceId: "s-1",
      }),
    );
    expect(mockAssessmentsStore.list).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/assessments/a-new/report");
  });

  it("handleSubmit uses selectedEnvironmentId when useExisting is true", async () => {
    mockAssessmentsStore.create.mockResolvedValue({ id: "a-2" });
    const source = makeSource({ id: "s-existing" });
    mockEnvVm.sources = [source];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("Existing Env Assessment");
      result.current.setUseExisting(true);
      result.current.setSelectedEnvironmentId("s-existing");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAssessmentsStore.create).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: "s-existing" }),
    );
  });

  it("handleSubmit navigates when list refresh fails after create", async () => {
    mockAssessmentsStore.create.mockResolvedValue({ id: "a-shared" });
    mockAssessmentsStore.list.mockRejectedValue(
      new Error("failed to list assessments: record not found"),
    );
    const source = makeSource({ id: "s-shared" });
    mockEnvVm.sources = [source];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("Shared appliance assessment");
      result.current.setUseExisting(true);
      result.current.setSelectedEnvironmentId("s-shared");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAssessmentsStore.create).toHaveBeenCalled();
    expect(result.current.hasGeneralApiError).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/assessments/a-shared/report");
  });

  it("handleSubmit does nothing when no sourceId is available", async () => {
    mockEnvVm.sourceCreatedId = null;

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("No Source");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockAssessmentsStore.create).not.toHaveBeenCalled();
  });

  it("handleSubmit throws when create returns no id", async () => {
    mockAssessmentsStore.create.mockResolvedValue({});
    mockEnvVm.sourceCreatedId = "s-1";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("BadResponse");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.hasGeneralApiError).toBe(true);
  });

  // ---- Modal close flow ----------------------------------------------------

  it("handleSetupModalClose refreshes sources and preselects created source", async () => {
    mockEnvVm.sourceCreatedId = "new-src-1";
    mockEnvVm.listSources.mockResolvedValue([]);

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    await act(async () => {
      result.current.handleSetupModalClose();
      await Promise.resolve();
    });

    expect(mockEnvVm.listSources).toHaveBeenCalled();
  });

  // ---- isSelectedNotReady --------------------------------------------------

  it("isSelectedNotReady is true when useExisting and selected source is not ready", () => {
    const notReadySource = makeSource({
      id: "s-not-ready",
      name: "Not Ready",
      agent: { status: "not-connected" } as Source["agent"],
    });
    mockEnvVm.sources = [notReadySource];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setUseExisting(true);
      result.current.setSelectedEnvironmentId("s-not-ready");
    });

    expect(result.current.isSelectedNotReady).toBe(true);
  });

  // ---- isSubmitDisabled (useExisting paths) --------------------------------

  it("isSubmitDisabled is false when useExisting is true and selectedEnvironmentId is set", () => {
    mockEnvVm.sources = [makeSource({ id: "s-1" })];

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("Ready");
      result.current.setUseExisting(true);
      result.current.setSelectedEnvironmentId("s-1");
    });

    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it("isSubmitDisabled is false when useExisting is false and sourceCreatedId exists", () => {
    mockEnvVm.sourceCreatedId = "s-created";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("With Created Source");
    });

    expect(result.current.isSubmitDisabled).toBe(false);
  });

  // ---- Error dismiss via setApiError ----------------------------------------

  it("setApiError dismisses the current submit error", async () => {
    mockAssessmentsStore.create.mockRejectedValueOnce(
      new Error("Server Error"),
    );
    mockEnvVm.sourceCreatedId = "s-1";

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    act(() => {
      result.current.setName("ErrTest");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.apiError).toBeTruthy();

    act(() => {
      result.current.setApiError(null);
    });

    expect(result.current.apiError).toBeNull();
  });

  // ---- Draft persistence (restore) -----------------------------------------

  it("pre-selects environment when coming from environment page with reset flag", () => {
    const preselectedSource = makeSource({
      id: "s-preselected",
      name: "Preselected",
    });
    mockEnvVm.sources = [preselectedSource];
    mockLocationState = { preselectedSourceId: "s-preselected" };

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.name).toBe("");
    expect(result.current.useExisting).toBe(true);
    expect(result.current.selectedEnvironmentId).toBe("s-preselected");
  });

  it("pre-selects manually uploaded environment when coming from environment page", () => {
    const manuallyUploadedSource = makeSource({
      id: "s-manual",
      name: "Manually Uploaded",
      agent: undefined,
      onPremises: true,
      inventory: { vcenter: {} } as Source["inventory"],
    });
    mockEnvVm.sources = [manuallyUploadedSource];
    mockLocationState = { preselectedSourceId: "s-manual" };

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.name).toBe("");
    expect(result.current.useExisting).toBe(true);
    expect(result.current.selectedEnvironmentId).toBe("s-manual");
  });

  // ---- createdSource lookup -------------------------------------------------

  it("createdSource looks up source via getSourceById", () => {
    const source = makeSource({ id: "s-created" });
    mockEnvVm.sourceCreatedId = "s-created";
    mockEnvVm.getSourceById.mockReturnValue(source);

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.createdSource).toEqual(source);
    expect(mockEnvVm.getSourceById).toHaveBeenCalledWith("s-created");
  });

  it("createdSource is undefined when sourceCreatedId is null", () => {
    mockEnvVm.sourceCreatedId = null;

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.createdSource).toBeUndefined();
  });

  // ---- Modal state ---------------------------------------------------------

  it("manages modal open/close state", () => {
    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.isSetupModalOpen).toBe(false);
    expect(result.current.isStepsModalOpen).toBe(false);

    act(() => {
      result.current.setIsSetupModalOpen(true);
      result.current.setIsStepsModalOpen(true);
    });

    expect(result.current.isSetupModalOpen).toBe(true);
    expect(result.current.isStepsModalOpen).toBe(true);
  });

  // ---- Upload feedback passthrough -----------------------------------------

  it("uploadMessage and isUploadError come from envVm", () => {
    mockEnvVm.inventoryUploadResult = {
      message: "Upload succeeded",
      isError: false,
    };

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.uploadMessage).toBe("Upload succeeded");
    expect(result.current.isUploadError).toBe(false);
  });

  it("uploadMessage is null when envVm has no upload result", () => {
    mockEnvVm.inventoryUploadResult = null;

    const { result } = renderHook(() => useCreateFromOvaViewModel());

    expect(result.current.uploadMessage).toBeNull();
    expect(result.current.isUploadError).toBe(false);
  });

  it("clearInventoryUploadResult runs when environment changes but not on envVm rerender", () => {
    mockEnvVm.sources = [makeSource({ id: "s-1", name: "Alpha" })];

    const { result, rerender } = renderHook(() => useCreateFromOvaViewModel());

    expect(mockEnvVm.clearInventoryUploadResult).toHaveBeenCalledTimes(1);

    mockEnvVm.clearInventoryUploadResult.mockClear();

    act(() => {
      result.current.setSelectedEnvironmentId("s-1");
    });

    expect(mockEnvVm.clearInventoryUploadResult).toHaveBeenCalledTimes(1);

    mockEnvVm.clearInventoryUploadResult.mockClear();
    mockEnvVm.inventoryUploadResult = {
      message:
        "The uploaded file is using an old schema version and cannot be parsed.",
      isError: true,
    };
    rerender();

    expect(mockEnvVm.clearInventoryUploadResult).not.toHaveBeenCalled();
    expect(result.current.uploadMessage).toBe(
      "The uploaded file is using an old schema version and cannot be parsed.",
    );
  });
});
