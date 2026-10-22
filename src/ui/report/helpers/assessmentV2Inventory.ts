import type {
  AssessmentVCenterV2,
  InventoryData,
} from "@openshift-migration-advisor/planner-sdk";

import type { ReportInventorySource } from "./groupInventoryFilter";

/** Build report-scoped inventory from GET .../vcenters/{vid}. */
export const vcenterV2ToReportSource = (
  vcenter: AssessmentVCenterV2,
  clusters: Record<string, InventoryData> = {},
): ReportInventorySource => {
  const { id, data, vcenterVersion } = vcenter.data;
  return {
    vcenterId: id,
    vcenterVersion,
    vcenter: {
      id,
      infra: data.infra,
      vms: data.vms,
    },
    infra: data.infra,
    vms: data.vms,
    clusters,
  };
};

/** Cluster ids returned by v2 vCenter inventory (for dropdown options). */
export const clusterIdsFromVcenterV2 = (
  vcenter: AssessmentVCenterV2,
): string[] => vcenter.clusters.map((cluster) => cluster.id);

/** Merge cluster id list with loaded cluster payloads for cluster view model. */
export const buildClustersMapForOptions = (
  clusterIds: string[],
  loaded: Record<string, InventoryData>,
): Record<string, InventoryData> => {
  const map: Record<string, InventoryData> = { ...loaded };
  for (const clusterId of clusterIds) {
    if (!map[clusterId]) {
      map[clusterId] = {} as InventoryData;
    }
  }
  return map;
};
