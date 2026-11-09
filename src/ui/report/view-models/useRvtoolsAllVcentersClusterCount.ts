import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { useEffect, useMemo, useState } from "react";

import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import {
  clusterIdsFromReportInventory,
  clusterIdsFromVcenterV2,
  mergeClusterIds,
} from "../helpers/assessmentV2Inventory";
import type { ReportInventorySource } from "../helpers/groupInventoryFilter";
import { resolveSubsetVcenterApiId } from "../helpers/resolveSubsetVcenterApiId";

/** Cluster count embedded in subset snapshots (no v2 fetch). */
export const countEmbeddedClustersAcrossSubsets = (
  subsets: AssessmentSubsetInventory[],
): number =>
  mergeClusterIds(
    ...subsets.map((subset) =>
      clusterIdsFromReportInventory(
        subset.inventory as ReportInventorySource | undefined,
      ),
    ),
  ).length;

/**
 * When the report is scoped to All vCenters, cluster inventory is not merged
 * into the active view, but summary labels should still reflect the total
 * cluster count across uploaded vCenters (v2 metadata per subset).
 */
export const useRvtoolsAllVcentersClusterCount = ({
  enabled,
  assessmentId,
  subsets,
  assessmentsStore,
}: {
  enabled: boolean;
  assessmentId: string | undefined;
  subsets: AssessmentSubsetInventory[];
  assessmentsStore: IAssessmentsStore;
}): number | undefined => {
  const vcenterApiIds = useMemo((): string[] => {
    if (!enabled || subsets.length === 0) {
      return [];
    }
    const ids = subsets
      .map((subset) => resolveSubsetVcenterApiId(subsets, subset.id))
      .filter((vid): vid is string => Boolean(vid));
    return [...new Set(ids)];
  }, [enabled, subsets]);

  const shouldFetch =
    enabled && Boolean(assessmentId) && vcenterApiIds.length > 0;

  const requestKey = useMemo(() => {
    if (!shouldFetch || !assessmentId) {
      return "";
    }
    return `${assessmentId}:${vcenterApiIds.join("\0")}`;
  }, [assessmentId, shouldFetch, vcenterApiIds]);

  const [resultByKey, setResultByKey] = useState<
    { key: string; count: number } | undefined
  >();

  useEffect(() => {
    if (!requestKey || !assessmentId) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      vcenterApiIds.map((vid) =>
        assessmentsStore.getVcenter(assessmentId, vid),
      ),
    )
      .then((responses) => {
        if (cancelled) {
          return;
        }
        const clusterIds = mergeClusterIds(
          ...responses.map((response) => clusterIdsFromVcenterV2(response)),
        );
        setResultByKey({ key: requestKey, count: clusterIds.length });
      })
      .catch(() => {
        if (!cancelled) {
          setResultByKey(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentId, assessmentsStore, requestKey, vcenterApiIds]);

  if (!shouldFetch) {
    return undefined;
  }
  if (resultByKey?.key !== requestKey) {
    return undefined;
  }
  return resultByKey.count;
};
