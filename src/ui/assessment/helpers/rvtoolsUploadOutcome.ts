import type {
  RvtoolsUploadOutcomeContext,
  RvtoolsUploadOutcomeSummary,
} from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";

export type { RvtoolsPendingUploadBatch } from "../../../data/stores/rvtoolsLocalPersistence";
export type { RvtoolsUploadOutcomeContext, RvtoolsUploadOutcomeSummary };

export const RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE = "No files added";

export const RVTOOLS_APPEND_ALL_FAILED_MODAL_MESSAGE =
  "None of the files could be processed. Replace the files or select different files. Your assessment has not changed.";

export const buildAppendRvtoolsToastMessage = (
  summary: RvtoolsUploadOutcomeSummary,
): { variant: "success" | "warning"; message: string } | null => {
  const { validFileNames, invalidResults, attemptedCount } = summary;
  if (attemptedCount === 0) {
    return null;
  }
  if (invalidResults.length > 0) {
    return null;
  }
  if (validFileNames.length > 0) {
    return {
      variant: "success",
      message:
        validFileNames.length === 1
          ? "1 file added to this assessment. Results updated."
          : `${validFileNames.length} files added to this assessment. Results updated.`,
    };
  }
  return null;
};

export const buildReplaceSuccessToastMessage = (): string =>
  "File replaced. Assessment results updated.";

export {
  getActiveRvtoolsPendingBatch,
  getActiveRvtoolsPendingBatches,
} from "../../../data/stores/rvtoolsLocalPersistence";
