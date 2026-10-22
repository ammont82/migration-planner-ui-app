import type {
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";

export type ClusterSelection = string;

export type ClusterOption = { id: string; label: string };

/** Report filter value for the vCenter-wide aggregate (all clusters). */
export const ALL_CLUSTERS_ID = "all";

/**
 * Map the report cluster filter to the API `clusterId`.
 *
 * Migration estimation, complexity, and cluster-requirements treat an omitted
 * or empty `clusterId` as the vCenter-level aggregate. The UI sentinel
 * {@link ALL_CLUSTERS_ID} must not be sent as a cluster id.
 */
export const toApiClusterId = (selectionId: string): string =>
  selectionId === ALL_CLUSTERS_ID ? "" : selectionId;

export type ClusterViewModel = {
  viewInfra?: Infra;
  viewVms?: VMs;
  viewClusters?: { [key: string]: InventoryData };
  cpuCores?: VMResourceBreakdown;
  ramGB?: VMResourceBreakdown;
  nicCount?: VMResourceBreakdown;
  isAggregateView: boolean;
  selectionId: ClusterSelection;
  selectionLabel: string;
  clusterOptions: ClusterOption[];
  clusterFound: boolean;
};

/**
 * Domain-layer comparator: sorts cluster keys by VM count (descending), then by name (ascending).
 */
export const compareClustersByVmCount = (
  a: string,
  b: string,
  clusters?: { [key: string]: InventoryData },
): number => {
  const vmsA = clusters?.[a]?.vms?.total ?? 0;
  const vmsB = clusters?.[b]?.vms?.total ?? 0;
  return vmsB - vmsA || a.localeCompare(b);
};

export const resolveSelectedClusterId = (
  userSelectedClusterId: string | null,
  clusters?: { [key: string]: InventoryData },
): string => {
  if (userSelectedClusterId !== null) {
    const isValidSelection =
      userSelectedClusterId === ALL_CLUSTERS_ID ||
      Boolean(
        clusters &&
        Object.prototype.hasOwnProperty.call(clusters, userSelectedClusterId),
      );
    if (isValidSelection) {
      return userSelectedClusterId;
    }
  }

  const clusterKeys = clusters ? Object.keys(clusters) : [];

  if (clusterKeys.length === 0) {
    return ALL_CLUSTERS_ID;
  }

  const sortedKeys = [...clusterKeys].sort((a, b) =>
    compareClustersByVmCount(a, b, clusters),
  );

  return sortedKeys[0];
};

export const getClusterOptions = (clusters?: {
  [key: string]: InventoryData;
}): ClusterOption[] => {
  const keys = clusters ? Object.keys(clusters) : [];
  const sortedKeys = [...keys].sort((a, b) =>
    compareClustersByVmCount(a, b, clusters),
  );
  return [
    { id: ALL_CLUSTERS_ID, label: "All vSphere clusters" },
    ...sortedKeys.map((key) => ({ id: key, label: key })),
  ];
};

/**
 * Build a view model for the selected cluster.
 *
 * - When "all" is selected, return aggregate data.
 * - When a cluster is selected but data is missing, return an empty view (no infra/vms)
 *   so the UI can show a non-blocking empty state instead of falling back to aggregates.
 * - If the selected cluster no longer exists in the map, fall back to "all".
 */
export const buildClusterViewModel = ({
  infra,
  vms,
  clusters,
  selectedClusterId = ALL_CLUSTERS_ID,
}: {
  infra?: Infra;
  vms?: VMs;
  clusters?: { [key: string]: InventoryData };
  selectedClusterId?: ClusterSelection;
}): ClusterViewModel => {
  const options = getClusterOptions(clusters);
  const clusterExists =
    selectedClusterId === ALL_CLUSTERS_ID
      ? true
      : Boolean(
          clusters &&
          Object.prototype.hasOwnProperty.call(clusters, selectedClusterId),
        );
  const effectiveSelection =
    selectedClusterId === ALL_CLUSTERS_ID || clusterExists
      ? selectedClusterId
      : ALL_CLUSTERS_ID;

  if (effectiveSelection === ALL_CLUSTERS_ID) {
    return {
      viewInfra: infra,
      viewVms: vms,
      cpuCores: vms?.cpuCores,
      ramGB: vms?.ramGB,
      nicCount: vms?.nicCount,
      viewClusters: clusters,
      isAggregateView: true,
      selectionId: ALL_CLUSTERS_ID,
      selectionLabel: "All vSphere clusters",
      clusterOptions: options,
      clusterFound: true,
    };
  }

  const clusterData = clusters ? clusters[effectiveSelection] : undefined;
  const clusterInfra = clusterData?.infra;
  const clusterVms = clusterData?.vms;
  const selectionLabel = clusterData ? effectiveSelection : "Missing cluster";

  return {
    viewInfra: clusterInfra,
    viewVms: clusterVms,
    cpuCores: clusterVms?.cpuCores,
    ramGB: clusterVms?.ramGB,
    nicCount: clusterVms?.nicCount,
    viewClusters: clusterData
      ? { [effectiveSelection]: clusterData }
      : undefined,
    isAggregateView: false,
    selectionId: effectiveSelection,
    selectionLabel,
    clusterOptions: options,
    clusterFound: Boolean(clusterData),
  };
};
