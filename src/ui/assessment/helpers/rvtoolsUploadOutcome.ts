import type {
  RvtoolsUploadOutcomeContext,
  RvtoolsUploadOutcomeSummary,
} from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";

export type { RvtoolsPendingUploadBatch } from "../../../data/stores/rvtoolsLocalPersistence";
export type { RvtoolsUploadOutcomeContext, RvtoolsUploadOutcomeSummary };

export const buildAppendRvtoolsToastMessage = (
  summary: RvtoolsUploadOutcomeSummary,
): { variant: "success" | "warning"; message: string } | null => {
  const { validFileNames, invalidResults, attemptedCount } = summary;
  if (attemptedCount === 0) {
    return null;
  }
  if (validFileNames.length === 0 && invalidResults.length > 0) {
    return {
      variant: "warning",
      message:
        "No files added. The selected files couldn't be processed. Your assessment results have not changed.",
    };
  }
  if (invalidResults.length > 0) {
    const added = validFileNames.length;
    const failed = invalidResults.length;
    return {
      variant: "success",
      message:
        added === 1
          ? `1 file added to this assessment. Results updated. ${failed} file couldn't be processed.`
          : `${added} files added to this assessment. Results updated. ${failed} files couldn't be processed.`,
    };
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

export { getActiveRvtoolsPendingBatch } from "../../../data/stores/rvtoolsLocalPersistence";
