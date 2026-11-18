import type {
  AssessmentSubsetInventory,
  AssessmentVCenterV2,
  InventoryData,
} from "@openshift-migration-advisor/planner-sdk";

import type { ReportInventorySource } from "./groupInventoryFilter";
import { getSubsetInventoryLabel } from "./groupViewModel";

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

/** Union of cluster ids within a single vCenter scope (dropdown options). */
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

/** Total clusters across RVTools subsets — same MOID on different vCenters counts separately. */
export const countClustersAcrossSubsets = (
  subsets: AssessmentSubsetInventory[],
): number =>
  subsets.reduce(
    (total, subset) =>
      total +
      clusterIdsFromReportInventory(
        subset.inventory as ReportInventorySource | undefined,
      ).length,
    0,
  );

export const sumClusterCountsFromVcenters = (
  responses: AssessmentVCenterV2[],
): number =>
  responses.reduce(
    (total, response) => total + clusterIdsFromVcenterV2(response).length,
    0,
  );

export const aggregateClusterDisplayKey = (
  clusterId: string,
  subset: AssessmentSubsetInventory,
  multiVcenter: boolean,
): string =>
  multiVcenter
    ? `${clusterId} — ${getSubsetInventoryLabel(subset)}`
    : clusterId;

/**
 * Build cluster map for All vCenters when aggregate snapshot clusters are empty.
 * Uses unique display keys when the same cluster id appears on multiple vCenters.
 */
export const buildAggregateClustersFromSubsets = (
  subsets: AssessmentSubsetInventory[],
): Record<string, InventoryData> => {
  const map: Record<string, InventoryData> = {};
  const multiVcenter = subsets.length > 1;
  for (const subset of subsets) {
    const inventory = subset.inventory as ReportInventorySource | undefined;
    for (const clusterId of clusterIdsFromReportInventory(inventory)) {
      const payload = inventory?.clusters?.[clusterId];
      if (!payload) {
        continue;
      }
      let key = aggregateClusterDisplayKey(clusterId, subset, multiVcenter);
      if (map[key]) {
        key = `${clusterId} — ${subset.vcenterId ?? subset.id}`;
      }
      map[key] = payload;
    }
  }
  return map;
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
