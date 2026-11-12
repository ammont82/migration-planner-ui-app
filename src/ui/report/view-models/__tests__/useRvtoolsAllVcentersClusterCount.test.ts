import type {
  AssessmentSubsetInventory,
  InventoryData,
} from "@openshift-migration-advisor/planner-sdk";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  countEmbeddedClustersAcrossSubsets,
  useRvtoolsAllVcentersClusterCount,
} from "../useRvtoolsAllVcentersClusterCount";

const subset = (
  id: string,
  vcenterId: string,
  clusterIds: string[] = [],
): AssessmentSubsetInventory => ({
  id,
  name: id,
  vcenterId,
  vmsCount: 1,
  createdAt: new Date(),
  inventory: {
    vcenterId,
    clusters: Object.fromEntries(
      clusterIds.map((clusterId) => [
        clusterId,
        { vms: { total: 0 }, infra: { totalHosts: 0 } } as InventoryData,
      ]),
    ),
  },
});

describe("countEmbeddedClustersAcrossSubsets", () => {
  it("deduplicates cluster ids across subsets", () => {
    expect(
      countEmbeddedClustersAcrossSubsets([
        subset("s1", "vc-1", ["c1", "c2"]),
        subset("s2", "vc-2", ["c2", "c3"]),
      ]),
    ).toBe(3);
  });
});

describe("useRvtoolsAllVcentersClusterCount", () => {
  it("sums cluster ids from v2 vCenter responses", async () => {
    const getVcenter = vi.fn().mockImplementation((_id: string, vid: string) =>
      Promise.resolve({
        data: { id: vid, data: { infra: {}, vms: { total: 1 } } },
        clusters:
          vid === "vc-1"
            ? [{ id: "cluster-a" }, { id: "cluster-b" }]
            : [{ id: "cluster-c" }],
      }),
    );

    const { result } = renderHook(() =>
      useRvtoolsAllVcentersClusterCount({
        enabled: true,
        assessmentId: "assessment-1",
        subsets: [subset("s1", "vc-1"), subset("s2", "vc-2")],
        assessmentsStore: { getVcenter } as never,
      }),
    );

    await waitFor(() => {
      expect(result.current).toBe(3);
    });
    expect(getVcenter).toHaveBeenCalledWith("assessment-1", "vc-1");
    expect(getVcenter).toHaveBeenCalledWith("assessment-1", "vc-2");
  });
});
