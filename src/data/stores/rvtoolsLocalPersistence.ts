import type { RvtoolsFileUploadResult } from "./JobsStore";

export type RvtoolsPendingUploadBatch = {
  includedCount: number;
  attemptedCount: number;
  failures: RvtoolsFileUploadResult[];
  /** `created` on first partial create; `updated` after append batches. */
  context: "created" | "updated";
};

/** Session-only state; cleared on full page refresh. */
const pendingBatchByAssessmentId = new Map<string, RvtoolsPendingUploadBatch>();

/** Clears all in-memory RVTools persistence (for unit tests). */
export const clearRvtoolsPersistenceForTests = (): void => {
  pendingBatchByAssessmentId.clear();
};

const readPendingBatch = (
  assessmentId: string,
): RvtoolsPendingUploadBatch | null =>
  pendingBatchByAssessmentId.get(assessmentId) ?? null;

export const saveRvtoolsPendingUploadBatch = (
  assessmentId: string,
  batch: RvtoolsPendingUploadBatch,
): void => {
  pendingBatchByAssessmentId.set(assessmentId, batch);
};

export const getRvtoolsPendingUploadBatch = (
  assessmentId: string,
): RvtoolsPendingUploadBatch | null => readPendingBatch(assessmentId);

export const mergeRvtoolsPendingFailures = (
  assessmentId: string,
  failures: RvtoolsFileUploadResult[],
  options: {
    includedCount: number;
    attemptedCount: number;
    context: "created" | "updated";
  },
): void => {
  if (failures.length === 0) {
    return;
  }
  const existing = readPendingBatch(assessmentId);
  const mergedFailures = [...(existing?.failures ?? []), ...failures].filter(
    (entry, index, all) =>
      all.findIndex(
        (other) =>
          other.fileName === entry.fileName &&
          other.fileSize === entry.fileSize &&
          other.errorMessage === entry.errorMessage,
      ) === index,
  );
  saveRvtoolsPendingUploadBatch(assessmentId, {
    includedCount: options.includedCount,
    attemptedCount: options.attemptedCount,
    failures: mergedFailures,
    context: options.context,
  });
};

export const removeRvtoolsPendingFailure = (
  assessmentId: string,
  fileName: string,
  fileSize: number,
): void => {
  const existing = readPendingBatch(assessmentId);
  if (!existing) {
    return;
  }
  const failures = existing.failures.filter(
    (entry) => !(entry.fileName === fileName && entry.fileSize === fileSize),
  );
  if (failures.length === 0) {
    clearRvtoolsPendingUploadBatch(assessmentId);
    return;
  }
  saveRvtoolsPendingUploadBatch(assessmentId, { ...existing, failures });
};

export const clearRvtoolsPendingUploadBatch = (assessmentId: string): void => {
  pendingBatchByAssessmentId.delete(assessmentId);
};

export const getActiveRvtoolsPendingBatch = (
  assessmentId: string,
): RvtoolsPendingUploadBatch | null => {
  const batch = getRvtoolsPendingUploadBatch(assessmentId);
  if (!batch || batch.failures.length === 0) {
    return null;
  }
  return batch;
};
