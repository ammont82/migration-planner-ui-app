import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  RvtoolsFileUploadResult,
  RvtoolsUploadState,
} from "../../../data/stores/JobsStore";
import type { RvtoolsFileValidationResult } from "../rvtools";
import { type RvtoolsStagedFile, useRvtoolsFileStaging } from "../rvtools";

export type StagedRvtoolsFileStatus = RvtoolsStagedFile["status"];
export type StagedRvtoolsFile = RvtoolsStagedFile;
export type CreateRvtoolsAssessmentModalMode = "create" | "append";

export interface UseCreateRvtoolsAssessmentViewModelArgs {
  mode: CreateRvtoolsAssessmentModalMode;
  isOpen: boolean;
  isFormDisabled: boolean;
  maxFiles?: number;
  onClearError?: () => void;
  /** Clears persisted multi-file upload results so the modal does not re-apply a failed job. */
  onClearRvtoolsUpload?: () => void;
  onStagedFileRemoved?: (file: { fileName: string; fileSize: number }) => void;
  resumePartialAssessmentId?: string;
  onPartialAssessmentResolved?: () => void;
  rvtoolsUpload?: RvtoolsUploadState;
  defaultAssessmentName?: string;
  isLoading?: boolean;
  isJobProcessing?: boolean;
  isNavigatingToReport?: boolean;
  /** Progress of the in-flight backend job (0–100), for the active file row. */
  jobProgressValue?: number;
}

export interface CreateRvtoolsAssessmentViewModel {
  assessmentName: string;
  setAssessmentName: (name: string) => void;
  consentChecked: boolean;
  setConsentChecked: (checked: boolean) => void;
  stagedFiles: StagedRvtoolsFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  replaceFile: (id: string, file: File) => void;
  applyUploadResults: (results: RvtoolsFileUploadResult[]) => void;
  resetForm: () => void;
  filePickerError: string;
  nameValidationError: string;
  validFileCount: number;
  invalidFileCount: number;
  submitableFileCount: number;
  showReviewTable: boolean;
  canSubmit: boolean;
  primaryButtonLabel: string;
  validateForm: () => boolean;
  getStagedFilesForSubmit: () => File[];
  allUploadResultsTerminal: boolean;
}

const toValidationResults = (
  results: RvtoolsFileUploadResult[],
): RvtoolsFileValidationResult[] =>
  results.map((entry) => ({
    fileName: entry.fileName,
    fileSize: entry.fileSize,
    status: entry.status,
    errorMessage: entry.errorMessage,
  }));

export const useCreateRvtoolsAssessmentViewModel = ({
  mode,
  isOpen,
  isFormDisabled,
  onClearError,
  onClearRvtoolsUpload,
  onStagedFileRemoved,
  resumePartialAssessmentId,
  onPartialAssessmentResolved,
  maxFiles,
  rvtoolsUpload,
  defaultAssessmentName = "",
  jobProgressValue = 0,
}: UseCreateRvtoolsAssessmentViewModelArgs): CreateRvtoolsAssessmentViewModel => {
  const [assessmentName, setAssessmentName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [nameValidationError, setNameValidationError] = useState("");

  const staging = useRvtoolsFileStaging({
    mode,
    isActive: isOpen,
    isDisabled: isFormDisabled,
    resumePartialAssessmentId,
    onClearError,
    onStagedFileRemoved,
    onPartialAssessmentResolved,
    maxFiles,
  });

  const isResumingPartialCreate = Boolean(
    mode === "create" && resumePartialAssessmentId,
  );

  const hasStagingInProgress = useMemo(
    () => staging.stagedFiles.some((entry) => entry.status === "staging"),
    [staging.stagedFiles],
  );

  const canSubmit =
    staging.submitableFileCount > 0 &&
    !hasStagingInProgress &&
    (mode === "append" || consentChecked) &&
    (mode === "append" || assessmentName.trim().length > 0);

  const primaryButtonLabel = useMemo(() => {
    const submitCount = staging.submitableFileCount;
    if (mode === "append") {
      if (!staging.showReviewTable) {
        return "Add files and update assessment";
      }
      if (staging.invalidFileCount > 0) {
        return submitCount === 1
          ? "Add RVTools file"
          : `Add ${submitCount} RVTools files`;
      }
      return "Add files and update assessment";
    }
    if (staging.showReviewTable && staging.submitableFileCount > 0) {
      return staging.submitableFileCount === 1
        ? "Create assessment with 1 file"
        : `Create assessment with ${staging.submitableFileCount} files`;
    }
    if (isResumingPartialCreate) {
      return submitCount === 1
        ? "Add file to assessment"
        : `Add ${submitCount} files to assessment`;
    }
    return "Create assessment";
  }, [
    isResumingPartialCreate,
    mode,
    staging.invalidFileCount,
    staging.showReviewTable,
    staging.submitableFileCount,
  ]);

  const resetForm = useCallback((): void => {
    setAssessmentName("");
    setConsentChecked(false);
    setNameValidationError("");
    staging.reset();
  }, [staging]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    if (mode === "create" && !assessmentName.trim()) {
      setNameValidationError("Assessment name is required");
      isValid = false;
    } else {
      setNameValidationError("");
    }
    if (staging.submitableFileCount === 0) {
      isValid = false;
    }
    return isValid;
  }, [assessmentName, mode, staging.submitableFileCount]);

  const applyUploadResults = useCallback(
    (results: RvtoolsFileUploadResult[]): void => {
      staging.applyValidationResults(toValidationResults(results), {
        processingProgress: jobProgressValue,
      });
    },
    [jobProgressValue, staging],
  );

  const lastAppliedUploadResultsKeyRef = useRef("");

  const isAllInvalidJobFailureRecovery =
    staging.showReviewTable &&
    staging.validFileCount === 0 &&
    staging.invalidFileCount > 0;

  const allowRetryAfterJobFailure = useCallback((): void => {
    if (!isAllInvalidJobFailureRecovery) {
      return;
    }
    staging.prepareForJobRetry();
    onClearRvtoolsUpload?.();
    lastAppliedUploadResultsKeyRef.current = "";
  }, [isAllInvalidJobFailureRecovery, onClearRvtoolsUpload, staging]);

  const [defaultNameBoundToOpen, setDefaultNameBoundToOpen] = useState(false);

  if (
    isOpen &&
    !defaultNameBoundToOpen &&
    defaultAssessmentName &&
    mode === "create"
  ) {
    setDefaultNameBoundToOpen(true);
    setAssessmentName(defaultAssessmentName);
  }
  if (!isOpen && defaultNameBoundToOpen) {
    setDefaultNameBoundToOpen(false);
  }

  useEffect(() => {
    const results = rvtoolsUpload?.results;
    if (!results?.length) {
      lastAppliedUploadResultsKeyRef.current = "";
      return;
    }

    const resultsKey = [
      results
        .map(
          (entry) =>
            `${entry.fileName}:${entry.fileSize}:${entry.status}:${entry.errorMessage ?? ""}`,
        )
        .join("|"),
      results.some((entry) => entry.status === "processing")
        ? String(jobProgressValue)
        : "",
    ].join("|");
    if (resultsKey === lastAppliedUploadResultsKeyRef.current) {
      return;
    }
    lastAppliedUploadResultsKeyRef.current = resultsKey;
    queueMicrotask(() => {
      applyUploadResults(results);
    });
  }, [applyUploadResults, jobProgressValue, rvtoolsUpload?.results]);

  const allUploadResultsTerminal = Boolean(
    rvtoolsUpload?.results?.length &&
    rvtoolsUpload.results.every(
      (entry) => entry.status === "valid" || entry.status === "invalid",
    ),
  );

  return {
    assessmentName,
    setAssessmentName: (name: string) => {
      setAssessmentName(name);
      if (nameValidationError && name.trim()) {
        setNameValidationError("");
      }
      onClearError?.();
      if (mode === "create" && name.trim()) {
        allowRetryAfterJobFailure();
      }
    },
    consentChecked,
    setConsentChecked,
    stagedFiles: staging.stagedFiles,
    addFiles: staging.addFiles,
    removeFile: staging.removeFile,
    replaceFile: (id: string, file: File) => {
      const replacedInvalid = staging.stagedFiles.some(
        (entry) => entry.id === id && entry.status === "invalid",
      );
      staging.replaceFile(id, file);
      if (replacedInvalid) {
        onClearError?.();
      }
    },
    applyUploadResults,
    resetForm,
    filePickerError: staging.filePickerError,
    nameValidationError,
    validFileCount: staging.validFileCount,
    invalidFileCount: staging.invalidFileCount,
    submitableFileCount: staging.submitableFileCount,
    showReviewTable: staging.showReviewTable,
    canSubmit,
    primaryButtonLabel,
    validateForm,
    getStagedFilesForSubmit: staging.getFilesForSubmit,
    allUploadResultsTerminal,
  };
};
