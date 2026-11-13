import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VersionInfo } from "../../../../models/VersionInfo";
import { useVersionInfoViewModel } from "../useVersionInfoViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockVersionInfo: VersionInfo = {
  ui: { name: "test", versionName: "v1", gitCommit: "" },
  api: { name: "api", versionName: "v2", gitCommit: "" },
  agent: { versionName: "v0.13.6", gitCommit: null },
};

let mockVersionsStore: {
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  getApiVersionInfo: ReturnType<typeof vi.fn>;
  getUiVersionInfo: ReturnType<typeof vi.fn>;
};

vi.mock("@openshift-migration-advisor/ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "VersionsStore") return mockVersionsStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

const WINDOW_KEY = "__MIGRATION_PLANNER_VERSION__";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useVersionInfoViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>)[WINDOW_KEY];

    mockVersionsStore = {
      subscribe: vi.fn(() => () => {}),
      getSnapshot: vi.fn(() => mockVersionInfo),
      getApiVersionInfo: vi.fn().mockResolvedValue(mockVersionInfo),
      getUiVersionInfo: vi.fn().mockResolvedValue(mockVersionInfo),
    };
  });

  it("returns versions info from the store snapshot", async () => {
    const { result } = renderHook(() => useVersionInfoViewModel());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current).toEqual(mockVersionInfo);
  });

  it("calls getApiVersionInfo() on mount", async () => {
    renderHook(() => useVersionInfoViewModel());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockVersionsStore.getApiVersionInfo).toHaveBeenCalledTimes(1);
  });

  it("sets window.__MIGRATION_PLANNER_VERSION__ when result resolves", async () => {
    renderHook(() => useVersionInfoViewModel());

    await waitFor(() => {
      expect(
        (window as unknown as Record<string, unknown>)[WINDOW_KEY],
      ).toEqual(mockVersionInfo);
    });
  });

  it("cleans up window.__MIGRATION_PLANNER_VERSION__ on unmount", async () => {
    const { unmount } = renderHook(() => useVersionInfoViewModel());

    await waitFor(() => {
      expect(
        (window as unknown as Record<string, unknown>)[WINDOW_KEY],
      ).toEqual(mockVersionInfo);
    });

    unmount();

    expect(
      (window as unknown as Record<string, unknown>)[WINDOW_KEY],
    ).toBeUndefined();
  });
});
