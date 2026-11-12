import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ALL_CLUSTERS_ID } from "../../helpers/clusterViewModel";
import { ALL_VMS_GROUP_ID } from "../../helpers/groupViewModel";
import { getExampleInventory } from "../../views/example-data/inventoryFixture";
import { getExampleSubsetInventories } from "../../views/example-data/subsetInventoryFixture";
import { useExampleReportViewModel } from "../useExampleReportViewModel";

describe("useExampleReportViewModel", () => {
  it("shows group filter options from example subset inventories", () => {
    const { result } = renderHook(() => useExampleReportViewModel());

    expect(result.current.viewingGroupView.showGroupFilter).toBe(true);
    expect(result.current.viewingGroupView.groupOptions.length).toBeGreaterThan(
      1,
    );
    expect(result.current.selectedGroupId).toBe(ALL_VMS_GROUP_ID);
  });

  it("includes every OS support tier in the example inventory", () => {
    const { result } = renderHook(() => useExampleReportViewModel());
    const tiers = new Set(
      Object.values(result.current.vms?.osInfo ?? {}).map(
        (info) => info.supportTier,
      ),
    );

    expect(tiers).toEqual(
      new Set([
        "certified",
        "vendor_supported",
        "community_supported",
        "special_handling",
      ]),
    );
  });

  it("scopes dashboard data when a group is selected", () => {
    const fullInventory = getExampleInventory();
    const subsets = getExampleSubsetInventories(fullInventory);
    const targetGroup = subsets[0];

    const { result } = renderHook(() => useExampleReportViewModel());
    const fullVmTotal = result.current.clusterView.viewVms?.total;

    act(() => {
      result.current.handleGroupSelect(undefined, targetGroup.id);
    });

    expect(result.current.selectedGroupId).toBe(targetGroup.id);
    expect(result.current.clusterView.viewVms?.total).toBe(
      targetGroup.inventory?.vcenter?.vms?.total,
    );
    expect(result.current.clusterView.viewVms?.total).not.toBe(fullVmTotal);
    expect(result.current.inventoryScopeSummary).toContain(
      String(fullInventory.vcenter?.vms?.total),
    );
  });

  it("resets cluster selection when group changes", () => {
    const { result } = renderHook(() => useExampleReportViewModel());

    act(() => {
      result.current.handleClusterSelect(undefined, ALL_CLUSTERS_ID);
    });
    expect(result.current.selectedClusterId).toBe(ALL_CLUSTERS_ID);

    const subsets = getExampleSubsetInventories(getExampleInventory());
    act(() => {
      result.current.handleGroupSelect(undefined, subsets[0].id);
    });

    expect(result.current.selectedClusterId).toBe(ALL_CLUSTERS_ID);
  });

  it("uses the all-clusters sizing fixture for aggregate totals", () => {
    const { result } = renderHook(() => useExampleReportViewModel());
    const totalVMs = getExampleInventory().vcenter?.vms?.total;

    expect(result.current.selectedClusterId).toBe(ALL_CLUSTERS_ID);
    expect(result.current.exampleSizing?.result.inventoryTotals.totalVMs).toBe(
      totalVMs,
    );
    expect(result.current.inventoryScopeSummary).toContain(String(totalVMs));
  });

  it("uses the selected cluster sizing fixture", () => {
    const { result } = renderHook(() => useExampleReportViewModel());

    act(() => {
      result.current.handleClusterSelect(undefined, "domain-c34");
    });

    expect(result.current.exampleSizing?.clusterName).toBe(
      "Cluster domain-c34",
    );
    expect(result.current.exampleSizing?.result.inventoryTotals.totalVMs).toBe(
      350,
    );
  });

  it("clears the recommendation tool when group changes", () => {
    const { result } = renderHook(() => useExampleReportViewModel());

    act(() => {
      result.current.handleClusterSelect(undefined, "domain-c34");
      result.current.openRecommendationTool("architecture");
    });
    expect(result.current.selectedRecommendationTool).toBe("architecture");

    const subsets = getExampleSubsetInventories(getExampleInventory());
    act(() => {
      result.current.handleGroupSelect(undefined, subsets[0].id);
    });

    expect(result.current.selectedRecommendationTool).toBeNull();
  });
});
