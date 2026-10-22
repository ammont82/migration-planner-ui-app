import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";

import { ALL_VMS_GROUP_ID } from "./groupViewModel";
import { resolveSubsetVcenterApiId } from "./resolveSubsetVcenterApiId";

/** Subset inventories from the latest snapshot (not cleared for RVTools UI filters). */
export const rvtoolsSubsetInventoriesFromSnapshot = (
  sourceType: string | undefined,
  subsetInventories: AssessmentSubsetInventory[] | null | undefined,
): AssessmentSubsetInventory[] => {
  if (sourceType !== "rvtools") {
    return [];
  }
  return subsetInventories ?? [];
};

/**
 * Which subset row drives v2 vCenter inventory. A single vCenter auto-scopes;
 * multiple vCenters require an explicit pick (otherwise aggregate / no clusters).
 */
export const resolveRvtoolsEffectiveVcenterSubsetId = (
  subsets: AssessmentSubsetInventory[],
  userSelectedSubsetId: string | null,
): string => {
  if (subsets.length === 0) {
    return ALL_VMS_GROUP_ID;
  }
  if (subsets.length === 1) {
    return subsets[0].id;
  }
  if (userSelectedSubsetId !== null) {
    const isValid = subsets.some(
      (subset) => subset.id === userSelectedSubsetId,
    );
    if (isValid) {
      return userSelectedSubsetId;
    }
  }
  return ALL_VMS_GROUP_ID;
};

/** v2 API path parameter `vid` for the active RVTools vCenter scope. */
export const resolveRvtoolsScopedVcenterApiId = (
  subsets: AssessmentSubsetInventory[],
  effectiveSubsetId: string,
): string | undefined => {
  if (effectiveSubsetId === ALL_VMS_GROUP_ID) {
    return undefined;
  }
  return resolveSubsetVcenterApiId(subsets, effectiveSubsetId);
};
