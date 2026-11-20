import type {
  Assessment,
  Snapshot,
} from "@openshift-migration-advisor/planner-sdk";

import { type AssessmentModel, createAssessmentModel } from "./AssessmentModel";
import { getInventoryCollectionTime } from "./assessmentTimestamps";
import { sortSnapshotsDesc } from "./SnapshotParser";

const snapshotHasCollectionMetadata = (
  snapshot: Snapshot | undefined,
): boolean => {
  if (!snapshot) {
    return false;
  }
  if (snapshot.inventory?.collectionTime != null) {
    return true;
  }
  const subsets = snapshot.subsetInventories;
  if (!Array.isArray(subsets)) {
    return false;
  }
  return subsets.some((subset) => subset.inventory?.collectionTime != null);
};

const mergeSnapshotDetailFromExisting = (
  incoming: Snapshot,
  existing: Snapshot,
): Snapshot => {
  let merged: Snapshot = incoming;

  const incomingInventory = incoming.inventory;
  const existingCollectionTime = getInventoryCollectionTime(existing.inventory);
  const incomingCollectionTime = getInventoryCollectionTime(incomingInventory);
  if (incomingInventory && existingCollectionTime && !incomingCollectionTime) {
    merged = {
      ...merged,
      inventory: {
        ...incomingInventory,
        collectionTime: existingCollectionTime,
      },
    };
  }

  const shouldCopySubsets =
    !Object.prototype.hasOwnProperty.call(incoming, "subsetInventories") &&
    existing.subsetInventories != null;

  if (shouldCopySubsets) {
    merged = {
      ...merged,
      subsetInventories: existing.subsetInventories,
    };
  }

  return merged;
};

/**
 * LIST responses often omit `subsetInventories` and `collection_time` on
 * snapshots while GET includes them. List stubs also use `assessment.createdAt`
 * for `snapshot.createdAt`, which can differ from GET. When background polling
 * refreshes the list, preserve detail already fetched by ID.
 */
export const mergeListedAssessmentPreservingSubsetInventories = (
  incoming: AssessmentModel,
  existing: AssessmentModel,
): AssessmentModel => {
  const incomingSnapshots = incoming.snapshots;
  if (!incomingSnapshots?.length) {
    return incoming;
  }

  const latestIncoming = sortSnapshotsDesc(incomingSnapshots)[0];
  if (snapshotHasCollectionMetadata(latestIncoming)) {
    return incoming;
  }

  const existingSorted = existing.snapshotsSorted;
  if (!existingSorted.length) {
    return incoming;
  }

  const latestExisting = existingSorted[0];
  const canMergeFromExisting =
    snapshotHasCollectionMetadata(latestExisting) ||
    (Array.isArray(latestExisting.subsetInventories) &&
      latestExisting.subsetInventories.length > 0);

  if (!canMergeFromExisting) {
    return incoming;
  }

  const latestIncomingTime = new Date(latestIncoming.createdAt).getTime();
  const mergedSnapshots = incomingSnapshots.map((snapshot) => {
    const isLatestIncoming =
      new Date(snapshot.createdAt).getTime() === latestIncomingTime;
    if (!isLatestIncoming) {
      return snapshot;
    }
    return mergeSnapshotDetailFromExisting(snapshot, latestExisting);
  });

  return createAssessmentModel({
    ...(incoming as Assessment),
    snapshots: mergedSnapshots,
  });
};
