import type { RvtoolsFileUploadResult } from "./JobsStore";

export type RvtoolsPendingUploadBatch = {
  /** Stable id for dismiss and review UI. */
  id: string;
  /** Files successfully processed in this upload attempt. */
  includedCount: number;
  attemptedCount: number;
  failures: RvtoolsFileUploadResult[];
  /** `created` on first partial create; `updated` after append batches. */
  context: "created" | "updated";
};

/** Session-only state; cleared on full page refresh. */
const pendingBatchesByAssessmentId = new Map<
  string,
  RvtoolsPendingUploadBatch[]
>();

/** Clears all in-memory RVTools persistence (for unit tests). */
export const clearRvtoolsPersistenceForTests = (): void => {
  pendingBatchesByAssessmentId.clear();
};

const createBatchId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readPendingBatches = (
  assessmentId: string,
): RvtoolsPendingUploadBatch[] =>
  pendingBatchesByAssessmentId.get(assessmentId) ?? [];

export const appendRvtoolsPendingUploadBatch = (
  assessmentId: string,
  batch: Omit<RvtoolsPendingUploadBatch, "id"> & { id?: string },
): RvtoolsPendingUploadBatch => {
  const nextBatch: RvtoolsPendingUploadBatch = {
    ...batch,
    id: batch.id ?? createBatchId(),
  };
  pendingBatchesByAssessmentId.set(assessmentId, [
    ...readPendingBatches(assessmentId),
    nextBatch,
  ]);
  return nextBatch;
};

export const getRvtoolsPendingUploadBatches = (
  assessmentId: string,
): RvtoolsPendingUploadBatch[] => readPendingBatches(assessmentId);

export const removeRvtoolsPendingFailure = (
  assessmentId: string,
  batchId: string,
  fileName: string,
  fileSize: number,
): void => {
  const batches = readPendingBatches(assessmentId);
  if (batches.length === 0) {
    return;
  }
  const nextBatches = batches
    .map((batch) => {
      if (batch.id !== batchId) {
        return batch;
      }
      const failures = batch.failures.filter(
        (entry) =>
          !(entry.fileName === fileName && entry.fileSize === fileSize),
      );
      return failures.length === 0 ? null : { ...batch, failures };
    })
    .filter((batch): batch is RvtoolsPendingUploadBatch => batch !== null);

  if (nextBatches.length === 0) {
    pendingBatchesByAssessmentId.delete(assessmentId);
    return;
  }
  pendingBatchesByAssessmentId.set(assessmentId, nextBatches);
};

export const clearRvtoolsPendingUploadBatches = (
  assessmentId: string,
): void => {
  pendingBatchesByAssessmentId.delete(assessmentId);
};

export const getActiveRvtoolsPendingBatches = (
  assessmentId: string,
): RvtoolsPendingUploadBatch[] =>
  readPendingBatches(assessmentId).filter((batch) => batch.failures.length > 0);

/** @deprecated Use getActiveRvtoolsPendingBatches */
export const getActiveRvtoolsPendingBatch = (
  assessmentId: string,
): RvtoolsPendingUploadBatch | null =>
  getActiveRvtoolsPendingBatches(assessmentId)[0] ?? null;

/** @deprecated Use getRvtoolsPendingUploadBatches */
export const getRvtoolsPendingUploadBatch = (
  assessmentId: string,
): RvtoolsPendingUploadBatch | null =>
  getActiveRvtoolsPendingBatch(assessmentId);
