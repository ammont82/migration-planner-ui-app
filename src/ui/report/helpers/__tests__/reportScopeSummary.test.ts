import { describe, expect, it } from "vitest";

import { ALL_CLUSTERS_ID } from "../clusterViewModel";
import { ALL_VMS_GROUP_ID } from "../groupViewModel";
import {
  buildViewingScopeCounts,
  formatReportScopeCounts,
} from "../reportScopeSummary";

describe("formatReportScopeCounts", () => {
  it("formats singular and plural labels", () => {
    expect(
      formatReportScopeCounts({
        vmCount: 64,
        vcenterCount: 1,
        clusterCount: 2,
      }),
    ).toBe("64 VMs - 1 vCenter - 2 clusters");
  });
});

describe("buildViewingScopeCounts", () => {
  it("counts all vCenters when none is selected", () => {
    const counts = buildViewingScopeCounts({
      vmTotal: 64,
      showVcenterFilter: true,
      selectedVcenterScopeId: ALL_VMS_GROUP_ID,
      allVmsGroupId: ALL_VMS_GROUP_ID,
      totalVcenterCount: 3,
      selectedClusterId: ALL_CLUSTERS_ID,
      allClustersId: ALL_CLUSTERS_ID,
      clustersInScope: {},
    });
    expect(counts.vcenterCount).toBe(3);
    expect(counts.clusterCount).toBe(0);
  });
});
