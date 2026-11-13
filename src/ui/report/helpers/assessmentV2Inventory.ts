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

/**
 * Cluster map for report/export: API-loaded payloads plus embedded snapshot
 * clusters so aggregate views can detect exportable inventory before a cluster
 * is selected in the dropdown.
 */
export const buildClustersMapWithEmbeddedFallback = (
  clusterIds: string[],
  loaded: Record<string, InventoryData>,
  scopedSubsetInventory?: ReportInventorySource,
  aggregateFallback?: ReportInventorySource,
): Record<string, InventoryData> => {
  const map = buildClustersMapForOptions(clusterIds, loaded);
  for (const clusterId of clusterIds) {
    if (!clusterInventoryHasPayload(map[clusterId])) {
      const embedded =
        resolveEmbeddedClusterInventory(scopedSubsetInventory, clusterId) ??
        resolveEmbeddedClusterInventory(aggregateFallback, clusterId);
      if (embedded) {
        map[clusterId] = embedded;
      }
    }
  }
  return map;
};

/** Cluster ids from embedded assessment / subset snapshot inventory. */
export const clusterIdsFromReportInventory = (
  inventory: ReportInventorySource | undefined,
): string[] => {
  const clusters = inventory?.clusters;
  if (!clusters) {
    return [];
  }
  return Object.keys(clusters);
};

export const mergeClusterIds = (...idLists: string[][]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const ids of idLists) {
    for (const clusterId of ids) {
      if (!seen.has(clusterId)) {
        seen.add(clusterId);
        merged.push(clusterId);
      }
    }
  }
  return merged;
};

const clusterInventoryHasPayload = (data: InventoryData): boolean =>
  Boolean(data.infra || data.vms);

/** Snapshot cluster payload used when v2 per-cluster GET is unavailable. */
export const resolveEmbeddedClusterInventory = (
  inventory: ReportInventorySource | undefined,
  clusterId: string,
): InventoryData | undefined => {
  const cluster = inventory?.clusters?.[clusterId];
  if (!cluster || !clusterInventoryHasPayload(cluster)) {
    return undefined;
  }
  return cluster;
};
