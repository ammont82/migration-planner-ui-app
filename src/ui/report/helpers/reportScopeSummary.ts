export type ReportScopeCounts = {
  vmCount: number;
  vcenterCount: number;
  clusterCount: number;
};

const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

export const formatReportScopeCounts = (counts: ReportScopeCounts): string => {
  const parts = [
    `${counts.vmCount} VMs`,
    `${counts.vcenterCount} ${pluralize(counts.vcenterCount, "vCenter", "vCenters")}`,
    `${counts.clusterCount} ${pluralize(counts.clusterCount, "cluster", "clusters")}`,
  ];
  return parts.join(" - ");
};

export const buildViewingScopeCounts = ({
  vmTotal,
  showVcenterFilter,
  selectedVcenterScopeId,
  allVmsGroupId,
  totalVcenterCount,
  selectedClusterId,
  allClustersId,
  clustersInScope,
}: {
  vmTotal: number;
  showVcenterFilter: boolean;
  selectedVcenterScopeId: string;
  allVmsGroupId: string;
  totalVcenterCount: number;
  selectedClusterId: string;
  allClustersId: string;
  clustersInScope?: { [key: string]: unknown };
}): ReportScopeCounts => {
  const clusterKeys = clustersInScope ? Object.keys(clustersInScope) : [];
  const vcenterCount =
    showVcenterFilter && selectedVcenterScopeId === allVmsGroupId
      ? Math.max(totalVcenterCount, 1)
      : 1;
  const clusterCount =
    selectedClusterId !== allClustersId ? 1 : clusterKeys.length;

  return {
    vmCount: vmTotal,
    vcenterCount,
    clusterCount,
  };
};

export const buildInventoryScopeCounts = ({
  vmTotal,
  vcenterCount,
  clusterCount,
}: {
  vmTotal?: number;
  vcenterCount: number;
  clusterCount: number;
}): ReportScopeCounts | undefined => {
  if (clusterCount <= 0 && (vmTotal == null || vmTotal <= 0)) {
    return undefined;
  }
  return {
    vmCount: vmTotal ?? 0,
    vcenterCount: Math.max(vcenterCount, 1),
    clusterCount,
  };
};
