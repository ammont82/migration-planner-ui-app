import { css } from "@emotion/css";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import { RhUiExternalLinkIcon } from "@patternfly/react-icons";
import React from "react";

import type { RvtoolsUploadState } from "../../../../data/stores/JobsStore";
import { isNameError } from "../../../../lib/common/ErrorParser";
import {
  RVTOOLS_APPEND_ALL_FAILED_MODAL_MESSAGE,
  RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE,
} from "../../helpers/rvtoolsUploadOutcome";
import { RVTOOLS_DATA_SHARING_URL, RvtoolsFilesField } from "../../rvtools";
import {
  type CreateRvtoolsAssessmentModalMode,
  useCreateRvtoolsAssessmentViewModel,
} from "../../view-models/useCreateRvtoolsAssessmentViewModel";

export interface CreateRvtoolsAssessmentModalProps {
  mode: CreateRvtoolsAssessmentModalMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; files: File[] }) => void;
  onClearError?: () => void;
  onClearRvtoolsUpload?: () => void;
  onStagedFileRemoved?: (file: { fileName: string; fileSize: number }) => void;
  isLoading?: boolean;
  error?: Error | null;
  /** `true` while the job is actively processing (non-terminal status). */
  isJobProcessing?: boolean;
  jobProgressValue?: number;
  jobError?: Error | null;
  rvtoolsUpload?: RvtoolsUploadState;
  resumePartialAssessmentId?: string;
  onPartialAssessmentResolved?: () => void;
  isNavigatingToReport?: boolean;
  defaultAssessmentName?: string;
  maxFiles?: number;
}

const isAbortError = (error: Error | null): boolean => {
  if (!error) return false;
  const message = error.message || "";
  return (
    (typeof (error as { name?: unknown }).name === "string" &&
      (error as { name: string }).name === "AbortError") ||
    (error instanceof DOMException &&
      typeof error.message === "string" &&
      /aborted/i.test(error.message)) ||
    /aborted/i.test(message)
  );
};

export const CreateRvtoolsAssessmentModal: React.FC<
  CreateRvtoolsAssessmentModalProps
> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  onClearError,
  onClearRvtoolsUpload,
  onStagedFileRemoved,
  isLoading = false,
  error = null,
  isJobProcessing = false,
  jobProgressValue = 0,
  jobError = null,
  rvtoolsUpload,
  resumePartialAssessmentId,
  onPartialAssessmentResolved,
  isNavigatingToReport = false,
  defaultAssessmentName = "",
  maxFiles,
}) => {
  const isFormDisabled = isLoading || isJobProcessing || isNavigatingToReport;

  const vm = useCreateRvtoolsAssessmentViewModel({
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
    defaultAssessmentName,
    isLoading,
    isJobProcessing,
    isNavigatingToReport,
    jobProgressValue,
  });

  const effectiveError = jobError || error;
  const hasNameError = isNameError(effectiveError);
  const hasGeneralApiError =
    !!effectiveError &&
    !isNameError(effectiveError) &&
    !isAbortError(effectiveError);

  const nameErrorToDisplay =
    vm.nameValidationError || (hasNameError ? effectiveError?.message : "");

  const handleClose = (): void => {
    vm.resetForm();
    onClearError?.();
    onClose();
  };

  const handleSubmit = (): void => {
    if (!vm.validateForm() || !vm.canSubmit) {
      return;
    }

    onSubmit({
      name: vm.assessmentName.trim(),
      files: vm.getStagedFilesForSubmit(),
    });
  };

  const showReviewApiError =
    hasGeneralApiError && !vm.showReviewTable && !vm.canSubmit;

  const isButtonDisabled =
    !vm.canSubmit ||
    isLoading ||
    !!nameErrorToDisplay ||
    !!vm.filePickerError ||
    showReviewApiError ||
    isJobProcessing ||
    isNavigatingToReport;

  const title =
    mode === "append" ? "Add RVTools files" : "Create assessment from RVTools";

  const showNoAssessmentCreatedAlert =
    mode === "create" &&
    vm.showReviewTable &&
    vm.invalidFileCount > 0 &&
    vm.validFileCount === 0 &&
    !resumePartialAssessmentId &&
    vm.allUploadResultsTerminal;

  const showNoFilesAddedAlert =
    mode === "append" &&
    vm.showReviewTable &&
    vm.invalidFileCount > 0 &&
    vm.validFileCount === 0 &&
    vm.allUploadResultsTerminal;

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title={title} />
      <ModalBody>
        <Stack hasGutter>
          {showNoFilesAddedAlert ? (
            <StackItem>
              <Alert
                variant="danger"
                isInline
                title={RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE}
              >
                {RVTOOLS_APPEND_ALL_FAILED_MODAL_MESSAGE}
              </Alert>
            </StackItem>
          ) : null}
          {showNoAssessmentCreatedAlert ? (
            <StackItem>
              <Alert variant="danger" isInline title="No assessment created">
                None of the files could be processed. Replace the files to
                continue, or cancel to start a new upload.
              </Alert>
            </StackItem>
          ) : null}
          <StackItem>
            <Form>
              {mode === "create" && (
                <FormGroup
                  label="Assessment name"
                  isRequired
                  fieldId="rvtools-assessment-name"
                >
                  <TextInput
                    isRequired
                    type="text"
                    id="rvtools-assessment-name"
                    name="rvtools-assessment-name"
                    value={vm.assessmentName}
                    onChange={(_event, value) => vm.setAssessmentName(value)}
                    validated={nameErrorToDisplay ? "error" : "default"}
                    placeholder="Enter assessment name"
                    isDisabled={isFormDisabled}
                  />
                  {nameErrorToDisplay && (
                    <HelperText>
                      <HelperTextItem variant="error">
                        {nameErrorToDisplay}
                      </HelperTextItem>
                    </HelperText>
                  )}
                </FormGroup>
              )}

              <RvtoolsFilesField
                mode={mode}
                isDisabled={isFormDisabled}
                stagedFiles={vm.stagedFiles}
                filePickerError={vm.filePickerError}
                showReviewTable={vm.showReviewTable}
                onAddFiles={vm.addFiles}
                onRemoveFile={vm.removeFile}
                onReplaceFile={vm.replaceFile}
                fieldId="rvtools-files"
                maxFiles={maxFiles}
              />

              {mode === "create" ? (
                <Checkbox
                  id="rvtools-data-share-consent"
                  label={
                    <>
                      I agree to share aggregated data about my environment with
                      Red Hat.{" "}
                      <a
                        href={RVTOOLS_DATA_SHARING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn more <RhUiExternalLinkIcon />
                      </a>
                    </>
                  }
                  isChecked={vm.consentChecked}
                  onChange={(_event, checked) => {
                    vm.setConsentChecked(Boolean(checked));
                  }}
                  isRequired
                  isDisabled={isFormDisabled}
                />
              ) : null}
            </Form>
          </StackItem>
          {showReviewApiError ? (
            <StackItem>
              <Alert
                variant="danger"
                title="Failed to create assessment"
                className={css({ whiteSpace: "pre-line" })}
                isInline
              >
                {effectiveError?.message ||
                  "An error occurred while creating the assessment"}
              </Alert>
            </StackItem>
          ) : null}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          key="create"
          variant="primary"
          onClick={handleSubmit}
          isDisabled={isButtonDisabled}
          isLoading={isLoading || isJobProcessing || isNavigatingToReport}
        >
          {vm.primaryButtonLabel}
        </Button>
        <Button
          key="cancel"
          variant="link"
          onClick={handleClose}
          isDisabled={isNavigatingToReport}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

CreateRvtoolsAssessmentModal.displayName = "CreateRvtoolsAssessmentModal";

export default CreateRvtoolsAssessmentModal;
