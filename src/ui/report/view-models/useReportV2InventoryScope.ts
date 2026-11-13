import type {
  AssessmentVCenterV2,
  InventoryData,
} from "@openshift-migration-advisor/planner-sdk";
import { useEffect, useMemo, useState } from "react";

import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { parseApiError } from "../../../lib/common/ErrorParser";
import {
  buildClustersMapForOptions,
  buildClustersMapWithEmbeddedFallback,
  clusterIdsFromReportInventory,
  clusterIdsFromVcenterV2,
  mergeClusterIds,
  resolveEmbeddedClusterInventory,
  vcenterV2ToReportSource,
} from "../helpers/assessmentV2Inventory";
import {
  ALL_CLUSTERS_ID,
  resolveSelectedClusterId,
} from "../helpers/clusterViewModel";
import type { ReportInventorySource } from "../helpers/groupInventoryFilter";

export const useReportV2InventoryScope = ({
  enabled,
  assessmentId,
  userSelectedClusterId,
  scopedVcenterApiId,
  scopedSubsetInventory,
  aggregateInventory,
  allowAggregateClusterFallback = true,
  assessmentsStore,
}: {
  enabled: boolean;
  assessmentId?: string;
  userSelectedClusterId: string | null;
  /** When set, load cluster inventory from the v2 vCenter APIs. */
  scopedVcenterApiId: string | undefined;
  /** Subset snapshot for the active vCenter (embedded cluster payloads). */
  scopedSubsetInventory?: ReportInventorySource;
  aggregateInventory: ReportInventorySource | undefined;
  /** When false, do not read cluster payloads from the assessment-wide snapshot. */
  allowAggregateClusterFallback?: boolean;
  assessmentsStore: IAssessmentsStore;
}): {
  activeInventory: ReportInventorySource | undefined;
  inventoryLoading: boolean;
  vcenterLoadError: Error | undefined;
  clusterLoadError: Error | undefined;
} => {
  const [vcenterResponse, setVcenterResponse] = useState<
    AssessmentVCenterV2 | undefined
  >();
  const [loadedVcenterId, setLoadedVcenterId] = useState<string | undefined>();
  const [loadedClusters, setLoadedClusters] = useState<
    Record<string, InventoryData>
  >({});
  const [clustersVcenterId, setClustersVcenterId] = useState<
    string | undefined
  >();
  const [vcenterLoadError, setVcenterLoadError] = useState<Error | undefined>();
  const [clusterLoadError, setClusterLoadError] = useState<Error | undefined>();

  const selectedVcenterId = useMemo(() => {
    if (!enabled) {
      return undefined;
    }
    return scopedVcenterApiId;
  }, [enabled, scopedVcenterApiId]);

  useEffect(() => {
    if (!enabled || !assessmentId || !selectedVcenterId) {
      return;
    }

    let cancelled = false;

    void assessmentsStore
      .getVcenter(assessmentId, selectedVcenterId)
      .then((response) => {
        if (!cancelled) {
          setVcenterResponse(response);
          setLoadedVcenterId(selectedVcenterId);
          setLoadedClusters({});
          setClustersVcenterId(selectedVcenterId);
          setVcenterLoadError(undefined);
          setClusterLoadError(undefined);
        }
      })
      .catch(async (err) => {
        if (!cancelled) {
          setVcenterLoadError(
            await parseApiError(err, "Failed to load vCenter inventory"),
          );
          setVcenterResponse(undefined);
          setLoadedVcenterId(selectedVcenterId);
          setLoadedClusters({});
          setClustersVcenterId(selectedVcenterId);
          setClusterLoadError(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentsStore, assessmentId, enabled, selectedVcenterId]);

  const vcenterMatchesSelection =
    Boolean(selectedVcenterId) && loadedVcenterId === selectedVcenterId;

  const clustersForSelection = useMemo(() => {
    if (!vcenterResponse || !vcenterMatchesSelection) {
      return undefined;
    }
    const clusterIds = mergeClusterIds(
      clusterIdsFromVcenterV2(vcenterResponse),
      clusterIdsFromReportInventory(scopedSubsetInventory),
      clusterIdsFromReportInventory(
        allowAggregateClusterFallback ? aggregateInventory : undefined,
      ),
    );
    return buildClustersMapForOptions(clusterIds, loadedClusters);
  }, [
    aggregateInventory,
    allowAggregateClusterFallback,
    loadedClusters,
    scopedSubsetInventory,
    vcenterMatchesSelection,
    vcenterResponse,
  ]);

  const selectedClusterId = useMemo(
    () => resolveSelectedClusterId(userSelectedClusterId, clustersForSelection),
    [clustersForSelection, userSelectedClusterId],
  );

  const clustersMatchSelection =
    vcenterMatchesSelection && clustersVcenterId === selectedVcenterId;

  const vcenterApiId = vcenterResponse?.data?.id ?? selectedVcenterId;

  const aggregateFallback = allowAggregateClusterFallback
    ? aggregateInventory
    : undefined;

  const embeddedClusterForSelection = useMemo((): InventoryData | undefined => {
    if (!vcenterMatchesSelection || selectedClusterId === ALL_CLUSTERS_ID) {
      return undefined;
    }
    const existing = loadedClusters[selectedClusterId];
    if (existing && Boolean(existing.infra || existing.vms)) {
      return undefined;
    }
    return (
      resolveEmbeddedClusterInventory(
        scopedSubsetInventory,
        selectedClusterId,
      ) ?? resolveEmbeddedClusterInventory(aggregateFallback, selectedClusterId)
    );
  }, [
    aggregateFallback,
    loadedClusters,
    scopedSubsetInventory,
    selectedClusterId,
    vcenterMatchesSelection,
  ]);

  const loadedClustersWithEmbedded = useMemo((): Record<
    string,
    InventoryData
  > => {
    if (!embeddedClusterForSelection) {
      return loadedClusters;
    }
    return {
      ...loadedClusters,
      [selectedClusterId]: embeddedClusterForSelection,
    };
  }, [embeddedClusterForSelection, loadedClusters, selectedClusterId]);

  const applyLoadedCluster = (
    clusterId: string,
    clusterData: InventoryData,
    cancelled: boolean,
  ): void => {
    if (cancelled) {
      return;
    }
    setLoadedClusters((previous) => ({
      ...previous,
      [clusterId]: clusterData,
    }));
    setClusterLoadError(undefined);
  };

  useEffect(() => {
    if (
      !enabled ||
      !assessmentId ||
      !vcenterMatchesSelection ||
      selectedClusterId === ALL_CLUSTERS_ID
    ) {
      return;
    }

    const existing = loadedClusters[selectedClusterId];
    if (existing && Boolean(existing.infra || existing.vms)) {
      return;
    }

    if (embeddedClusterForSelection) {
      return;
    }

    if (!vcenterApiId) {
      return;
    }

    let cancelled = false;

    const tryFetchCluster = (vid: string): Promise<InventoryData> =>
      assessmentsStore.getVcenterCluster(assessmentId, vid, selectedClusterId);

    const vidsToTry = [
      ...new Set(
        [vcenterApiId, selectedVcenterId].filter((vid): vid is string =>
          Boolean(vid),
        ),
      ),
    ];

    const loadCluster = async (): Promise<void> => {
      let lastError: unknown;
      for (const vid of vidsToTry) {
        try {
          const clusterData = await tryFetchCluster(vid);
          applyLoadedCluster(selectedClusterId, clusterData, cancelled);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      const fallback =
        resolveEmbeddedClusterInventory(
          scopedSubsetInventory,
          selectedClusterId,
        ) ??
        resolveEmbeddedClusterInventory(aggregateFallback, selectedClusterId);
      if (fallback) {
        applyLoadedCluster(selectedClusterId, fallback, cancelled);
        return;
      }

      if (!cancelled) {
        setClusterLoadError(
          await parseApiError(lastError, "Failed to load cluster inventory"),
        );
      }
    };

    void loadCluster();

    return () => {
      cancelled = true;
    };
  }, [
    aggregateFallback,
    assessmentsStore,
    assessmentId,
    enabled,
    loadedClusters,
    scopedSubsetInventory,
    embeddedClusterForSelection,
    selectedClusterId,
    selectedVcenterId,
    vcenterApiId,
    vcenterMatchesSelection,
  ]);

  const selectedClusterHasPayload = Boolean(
    embeddedClusterForSelection ||
    (loadedClusters[selectedClusterId] &&
      Boolean(
        loadedClusters[selectedClusterId].infra ||
        loadedClusters[selectedClusterId].vms,
      )),
  );

  const vcenterInventoryLoading = Boolean(
    selectedVcenterId && loadedVcenterId !== selectedVcenterId,
  );

  const clusterInventoryLoading = Boolean(
    selectedVcenterId &&
    vcenterMatchesSelection &&
    clustersMatchSelection &&
    selectedClusterId !== ALL_CLUSTERS_ID &&
    !selectedClusterHasPayload,
  );

  const inventoryLoading = vcenterInventoryLoading || clusterInventoryLoading;

  const activeInventory = useMemo((): ReportInventorySource | undefined => {
    if (!enabled) {
      return undefined;
    }
    if (!scopedVcenterApiId) {
      return aggregateInventory;
    }
    if (!vcenterResponse || !vcenterMatchesSelection) {
      return undefined;
    }
    const clusterIds = mergeClusterIds(
      clusterIdsFromVcenterV2(vcenterResponse),
      clusterIdsFromReportInventory(scopedSubsetInventory),
      clusterIdsFromReportInventory(
        allowAggregateClusterFallback ? aggregateInventory : undefined,
      ),
    );
    const loaded = clustersMatchSelection ? loadedClustersWithEmbedded : {};
    const clustersForInventory = buildClustersMapWithEmbeddedFallback(
      clusterIds,
      loaded,
      scopedSubsetInventory,
      aggregateFallback,
    );
    return vcenterV2ToReportSource(vcenterResponse, clustersForInventory);
  }, [
    aggregateFallback,
    aggregateInventory,
    allowAggregateClusterFallback,
    clustersMatchSelection,
    enabled,
    loadedClustersWithEmbedded,
    scopedSubsetInventory,
    scopedVcenterApiId,
    vcenterMatchesSelection,
    vcenterResponse,
  ]);

  const resolvedClusterLoadError =
    selectedClusterId === ALL_CLUSTERS_ID ? undefined : clusterLoadError;

  return {
    activeInventory,
    inventoryLoading,
    vcenterLoadError,
    clusterLoadError: resolvedClusterLoadError,
  };
};
