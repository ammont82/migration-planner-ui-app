import type {
  Inventory,
  Snapshot,
} from "@openshift-migration-advisor/planner-sdk";

import type { AssessmentModel } from "./AssessmentModel";
import { sortSnapshotsDesc } from "./SnapshotParser";

const timestampToMs = (value: unknown): number | undefined => {
  if (value == null || value === "") {
    return undefined;
  }
  const ms = new Date(value as string | number | Date).getTime();
  return Number.isNaN(ms) ? undefined : ms;
};

/** Normalized source collection time for inventory payloads (list stubs may omit it). */
export const getInventoryCollectionTime = (
  inventory: Inventory | undefined,
): Date | undefined => {
  const ms = timestampToMs(inventory?.collectionTime);
  return ms === undefined ? undefined : new Date(ms);
};

const collectionTimeFromInventory = (
  inventory: Inventory | undefined,
): number | undefined => getInventoryCollectionTime(inventory)?.getTime();

/** Newest snapshot that includes inventory (list stubs may omit collection time). */
const latestSnapshotWithInventory = (
  snapshots: Snapshot[] | undefined,
): Snapshot | undefined => sortSnapshotsDesc(snapshots)[0];

/**
 * When vCenter inventory was collected at the source (agent / RVTools metadata).
 * Absent on list responses until the API includes collection metadata.
 */
export const getAssessmentDataCollectedMs = (
  assessment: AssessmentModel,
): number | undefined => {
  const snapshot = latestSnapshotWithInventory(assessment.snapshots);
  const fromMain = collectionTimeFromInventory(snapshot?.inventory);
  if (fromMain !== undefined) {
    return fromMain;
  }

  const subsets = snapshot?.subsetInventories;
  if (!Array.isArray(subsets) || subsets.length === 0) {
    return undefined;
  }

  let newestSubsetMs: number | undefined;
  for (const subset of subsets) {
    const ms = collectionTimeFromInventory(subset.inventory);
    if (ms === undefined) {
      continue;
    }
    if (newestSubsetMs === undefined || ms > newestSubsetMs) {
      newestSubsetMs = ms;
    }
  }
  return newestSubsetMs;
};

/** When the assessment was first created / imported into Migration Advisor. */
export const getAssessmentImportedMs = (
  assessment: AssessmentModel,
): number | undefined => timestampToMs(assessment.createdAt);
