import type {
  AssessmentVCenterV2,
  InventoryData,
} from "@openshift-migration-advisor/planner-sdk";
import { useEffect, useMemo, useState } from "react";

import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { parseApiError } from "../../../lib/common/ErrorParser";
import {
  buildClustersMapForOptions,
  clusterIdsFromVcenterV2,
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
  aggregateInventory,
  assessmentsStore,
}: {
  enabled: boolean;
  assessmentId?: string;
  userSelectedClusterId: string | null;
  /** When set, load cluster inventory from the v2 vCenter APIs. */
  scopedVcenterApiId: string | undefined;
  aggregateInventory: ReportInventorySource | undefined;
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
    const clusterIds = clusterIdsFromVcenterV2(vcenterResponse);
    return buildClustersMapForOptions(clusterIds, loadedClusters);
  }, [loadedClusters, vcenterMatchesSelection, vcenterResponse]);

  const selectedClusterId = useMemo(
    () => resolveSelectedClusterId(userSelectedClusterId, clustersForSelection),
    [clustersForSelection, userSelectedClusterId],
  );

  const clustersMatchSelection =
    vcenterMatchesSelection && clustersVcenterId === selectedVcenterId;

  useEffect(() => {
    if (
      !enabled ||
      !assessmentId ||
      !selectedVcenterId ||
      !vcenterMatchesSelection ||
      selectedClusterId === ALL_CLUSTERS_ID ||
      loadedClusters[selectedClusterId]
    ) {
      return;
    }

    let cancelled = false;

    void assessmentsStore
      .getVcenterCluster(assessmentId, selectedVcenterId, selectedClusterId)
      .then((clusterData) => {
        if (!cancelled) {
          setLoadedClusters((previous) => ({
            ...previous,
            [selectedClusterId]: clusterData,
          }));
          setClusterLoadError(undefined);
        }
      })
      .catch(async (err) => {
        if (!cancelled) {
          setClusterLoadError(
            await parseApiError(err, "Failed to load cluster inventory"),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    assessmentsStore,
    assessmentId,
    enabled,
    loadedClusters,
    selectedClusterId,
    selectedVcenterId,
    vcenterMatchesSelection,
  ]);

  const vcenterInventoryLoading = Boolean(
    selectedVcenterId && loadedVcenterId !== selectedVcenterId,
  );

  const clusterInventoryLoading = Boolean(
    selectedVcenterId &&
    vcenterMatchesSelection &&
    clustersMatchSelection &&
    selectedClusterId !== ALL_CLUSTERS_ID &&
    !loadedClusters[selectedClusterId],
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
    const clusterIds = clusterIdsFromVcenterV2(vcenterResponse);
    const clustersForInventory = clustersMatchSelection ? loadedClusters : {};
    return vcenterV2ToReportSource(
      vcenterResponse,
      buildClustersMapForOptions(clusterIds, clustersForInventory),
    );
  }, [
    aggregateInventory,
    clustersMatchSelection,
    enabled,
    loadedClusters,
    scopedVcenterApiId,
    vcenterMatchesSelection,
    vcenterResponse,
  ]);

  return {
    activeInventory,
    inventoryLoading,
    vcenterLoadError,
    clusterLoadError,
  };
};
