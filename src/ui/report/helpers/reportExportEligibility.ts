import type {
  Infra,
  InventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";

/** RVTools payloads often omit `hosts` / `totalHosts` but still include `hostPowerStates`. */
export const countHostsInInfra = (viewInfra?: Infra): number => {
  if (!viewInfra) {
    return 0;
  }
  if (viewInfra.totalHosts > 0) {
    return viewInfra.totalHosts;
  }
  const listedHosts = viewInfra.hosts?.length ?? 0;
  if (listedHosts > 0) {
    return listedHosts;
  }
  const powerStates = viewInfra.hostPowerStates;
  if (!powerStates) {
    return 0;
  }
  return Object.values(powerStates).reduce(
    (sum, count) => sum + (typeof count === "number" ? count : 0),
    0,
  );
};

export const hasClusterResourcesForExport = (
  viewInfra?: Infra,
  viewVms?: VMs,
): boolean => {
  const hasHosts = countHostsInInfra(viewInfra) > 0;
  const hasVms = (viewVms?.total ?? 0) > 0;
  return hasHosts && hasVms;
};

const mapHasExportableCluster = (
  clusters: Record<string, InventoryData> | undefined,
): boolean => {
  if (!clusters) {
    return false;
  }
  return Object.values(clusters).some((cluster) =>
    hasClusterResourcesForExport(cluster.infra, cluster.vms),
  );
};

/**
 * Whether the report has enough inventory to enable PDF/HTML/PNG export.
 * The active scoped view may omit host metadata from the v2 vCenter API while
 * embedded per-cluster payloads on the assessment snapshot still have it.
 */
export const canExportAssessmentReport = ({
  viewInfra,
  viewVms,
  scopedClusters,
  embeddedClusterMaps = [],
}: {
  viewInfra?: Infra;
  viewVms?: VMs;
  scopedClusters?: Record<string, InventoryData>;
  embeddedClusterMaps?: Array<Record<string, InventoryData> | undefined>;
}): boolean => {
  if (hasClusterResourcesForExport(viewInfra, viewVms)) {
    return true;
  }
  if (mapHasExportableCluster(scopedClusters)) {
    return true;
  }
  return embeddedClusterMaps.some((map) => mapHasExportableCluster(map));
};
