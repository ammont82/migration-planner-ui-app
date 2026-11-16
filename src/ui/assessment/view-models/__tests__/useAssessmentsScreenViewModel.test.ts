import type { Assessment } from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_POLLING_DELAY } from "../../../../lib/mvvm/PollableStore";
import {
  type AssessmentModel,
  createAssessmentModel,
} from "../../../../models/AssessmentModel";
import { useAssessmentsScreenViewModel } from "../useAssessmentsScreenViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({ rvtoolsOpenToken: "some-token" }),
}));

vi.mock("react-use", async () => {
  const actual = await vi.importActual<typeof import("react-use")>("react-use");
  return {
    ...actual,
    useMount: (fn: () => void) => {
      useEffect(
        () => {
          fn();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- useMount runs once on mount
        [],
      );
    },
    useUnmount: (fn: () => void) => {
      useEffect(
        () => () => fn(),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- useUnmount runs cleanup only on unmount
        [],
      );
    },
  };
});

let mockAssessmentsStore: {
  list: ReturnType<typeof vi.fn>;
  startPolling: ReturnType<typeof vi.fn>;
  stopPolling: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

let assessmentsData: AssessmentModel[];
let assessmentsListeners: Set<() => void>;

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

const makeAssessment = (overrides: Partial<Assessment> = {}): AssessmentModel =>
  createAssessmentModel({
    id: "a-1",
    name: "Test",
    snapshots: [],
    ...overrides,
  } as Assessment);

const setAssessmentsData = (data: AssessmentModel[]): void => {
  assessmentsData = data;
  assessmentsListeners.forEach((fn) => fn());
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAssessmentsScreenViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentsData = [];
    assessmentsListeners = new Set();

    mockAssessmentsStore = {
      list: vi.fn().mockResolvedValue([]),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      subscribe: vi.fn((listener: () => void) => {
        assessmentsListeners.add(listener);
        return () => assessmentsListeners.delete(listener);
      }),
      getSnapshot: vi.fn(() => assessmentsData),
    };
  });

  it("returns file-upload assessments from the store snapshot", async () => {
    const rvtools = makeAssessment({
      id: "a-1",
      name: "RVTools Assessment",
      sourceType: "rvtools",
    });
    const discovery = makeAssessment({
      id: "a-2",
      name: "Discovery Assessment",
      sourceType: "source",
    });
    const { result } = renderHook(() => useAssessmentsScreenViewModel());

    await act(async () => {
      setAssessmentsData([rvtools, discovery]);
      await Promise.resolve();
    });

    expect(result.current.assessments).toEqual([rvtools]);
  });

  it("calls list() on mount", async () => {
    renderHook(() => useAssessmentsScreenViewModel());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockAssessmentsStore.list).toHaveBeenCalledTimes(1);
  });

  it("starts polling with DEFAULT_POLLING_DELAY on mount", async () => {
    renderHook(() => useAssessmentsScreenViewModel());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockAssessmentsStore.startPolling).toHaveBeenCalledWith(
      DEFAULT_POLLING_DELAY,
    );
  });

  it("stops polling on unmount", () => {
    const { unmount } = renderHook(() => useAssessmentsScreenViewModel());
    expect(mockAssessmentsStore.stopPolling).not.toHaveBeenCalled();

    unmount();

    expect(mockAssessmentsStore.stopPolling).toHaveBeenCalled();
  });

  it("returns rvtoolsOpenToken from outlet context", async () => {
    const { result } = renderHook(() => useAssessmentsScreenViewModel());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.rvtoolsOpenToken).toBe("some-token");
  });

  it("isLoading is true while list() is pending", async () => {
    let resolveList!: () => void;
    mockAssessmentsStore.list.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveList = resolve;
      }),
    );

    const { result } = renderHook(() => useAssessmentsScreenViewModel());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveList();
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("hasInitialLoad becomes true after first list() completes", async () => {
    mockAssessmentsStore.list.mockResolvedValue([]);

    const { result } = renderHook(() => useAssessmentsScreenViewModel());

    expect(result.current.hasInitialLoad).toBe(false);

    await waitFor(() => {
      expect(result.current.hasInitialLoad).toBe(true);
    });
  });
});
