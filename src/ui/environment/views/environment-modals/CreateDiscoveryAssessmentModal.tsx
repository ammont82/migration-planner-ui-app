import { css } from "@emotion/css";
import {
  Alert,
  Button,
  type DropEvent,
  FileUpload,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import React, { useEffect, useRef } from "react";

import type { SourceModel } from "../../../../models/SourceModel";
import { useCreateDiscoveryAssessmentViewModel } from "../../view-models/useCreateDiscoveryAssessmentViewModel";

export type CreateDiscoveryAssessmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceModel[];
  onInventoryUploaded?: () => void | Promise<void>;
};

const radioDescriptionStyle = css`
  margin-top: 4px;
  margin-left: 26px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--pf-t--global--text--color--subtle);
`;

const introStyle = css`
  margin-bottom: var(--pf-t--global--spacer--md);
`;

type CreateDiscoveryAssessmentModalContentProps = {
  sources: SourceModel[];
  onClose: () => void;
  onInventoryUploaded?: () => void | Promise<void>;
  onSubmittingChange: (isSubmitting: boolean) => void;
};

const CreateDiscoveryAssessmentModalContent: React.FC<
  CreateDiscoveryAssessmentModalContentProps
> = ({ sources, onClose, onInventoryUploaded, onSubmittingChange }) => {
  const vm = useCreateDiscoveryAssessmentViewModel({
    isOpen: true,
    sources,
    onClose,
    onInventoryUploaded,
  });

  useEffect(() => {
    onSubmittingChange(vm.isSubmitting);
  }, [onSubmittingChange, vm.isSubmitting]);

  const nameErrorToDisplay =
    vm.nameValidationError ||
    (vm.hasNameError && vm.apiError ? vm.apiError.message : "");

  const handleClose = (): void => {
    if (vm.isSubmitting) {
      return;
    }
    vm.resetForm();
    onClose();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (vm.isSubmitDisabled || vm.isSubmitting) {
      return;
    }
    void vm.handleSubmit();
  };

  const handleFileInputChange = (_event: DropEvent, file: File): void => {
    if (vm.isSubmitting) {
      return;
    }
    vm.handleFileChange(file);
    vm.clearApiError();
  };

  return (
    <>
      <ModalHeader
        title="Create assessment"
        labelId="create-discovery-assessment-modal-title"
      />
      <ModalBody>
        <p className={introStyle}>
          Choose how you want to collect inventory from a discovery appliance,
          then complete the details below.
        </p>
        <Form id="discovery-assessment-form" onSubmit={handleFormSubmit}>
          <FormGroup
            label="Data source"
            isRequired
            fieldId="discovery-assessment-data-source"
            role="group"
          >
            <Stack hasGutter>
              <StackItem>
                <Radio
                  id="discovery-assessment-data-source-connected"
                  name="discovery-assessment-data-source"
                  label="Connected discovery appliance"
                  isChecked={vm.dataSource === "connected"}
                  onChange={() => {
                    vm.setDataSource("connected");
                    vm.clearApiError();
                  }}
                  isDisabled={vm.isSubmitting}
                />
                <div
                  className={radioDescriptionStyle}
                  data-testid="connected-data-source-description"
                >
                  Pull live inventory from a discovery appliance that has shared
                  its data with Red Hat. Recommended for continuous analysis.
                </div>
              </StackItem>
              <StackItem>
                <Radio
                  id="discovery-assessment-data-source-upload"
                  name="discovery-assessment-data-source"
                  label="Upload file"
                  isChecked={vm.dataSource === "upload"}
                  onChange={() => {
                    vm.setDataSource("upload");
                    vm.clearApiError();
                  }}
                  isDisabled={vm.isSubmitting}
                />
                <div className={radioDescriptionStyle}>
                  Upload a point-in-time discovery appliance export snapshot
                  (.json or .zip).
                </div>
              </StackItem>
            </Stack>
          </FormGroup>

          <FormGroup
            label="Assessment name"
            isRequired
            fieldId="discovery-assessment-name"
          >
            <TextInput
              isRequired
              type="text"
              id="discovery-assessment-name"
              name="discovery-assessment-name"
              value={vm.assessmentName}
              onChange={(_event, value) => {
                vm.setAssessmentName(value);
                vm.clearApiError();
              }}
              validated={nameErrorToDisplay ? "error" : "default"}
              isDisabled={vm.isSubmitting}
            />
            {nameErrorToDisplay ? (
              <HelperText>
                <HelperTextItem variant="error">
                  {nameErrorToDisplay}
                </HelperTextItem>
              </HelperText>
            ) : null}
          </FormGroup>

          <FormGroup
            label="Associate discovery appliance"
            isRequired
            fieldId="discovery-assessment-appliance"
          >
            <FormSelect
              id="discovery-assessment-appliance"
              value={vm.selectedSourceId}
              onChange={(_event, value) => {
                vm.setSelectedSourceId(value);
                vm.clearApiError();
              }}
              validated={vm.sourceValidationError ? "error" : "default"}
              isDisabled={vm.isSubmitting}
            >
              <FormSelectOption value="" label="Select a discovery appliance" />
              {vm.applianceOptions.map((source) => (
                <FormSelectOption
                  key={source.id}
                  value={source.id}
                  label={source.name || source.id}
                />
              ))}
            </FormSelect>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {vm.associateApplianceHelperText}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
            {vm.sourceValidationError ? (
              <HelperText>
                <HelperTextItem variant="error">
                  {vm.sourceValidationError}
                </HelperTextItem>
              </HelperText>
            ) : null}
            {vm.isConnectedSourceNotReady && !vm.sourceValidationError ? (
              <HelperText>
                <HelperTextItem variant="warning">
                  This discovery appliance does not have inventory ready yet.
                </HelperTextItem>
              </HelperText>
            ) : null}
          </FormGroup>

          {vm.dataSource === "upload" ? (
            <FormGroup
              label="Inventory file"
              isRequired
              fieldId="discovery-assessment-inventory-file"
            >
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    Accepts .json or .zip files up to 50 MiB.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
              <FileUpload
                id="discovery-assessment-inventory-file"
                value={vm.selectedFile ?? undefined}
                filename={vm.inventoryFilename}
                filenamePlaceholder="Drag and drop a file or select one"
                onFileInputChange={handleFileInputChange}
                onClearClick={() => {
                  vm.clearSelectedFile();
                  vm.clearApiError();
                }}
                allowEditingUploadedText={false}
                browseButtonText="Upload"
                clearButtonText="Clear"
                validated={vm.fileValidationError ? "error" : "default"}
                accept=".json,.zip"
                hideDefaultPreview
                isDisabled={vm.isSubmitting}
              />
              {vm.fileValidationError ? (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {vm.fileValidationError}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              ) : null}
            </FormGroup>
          ) : null}
        </Form>

        {vm.hasGeneralApiError && vm.apiError ? (
          <Alert
            variant="danger"
            title="Failed to create assessment"
            className={css({
              whiteSpace: "pre-line",
              marginTop: "16px",
              marginBottom: "0",
            })}
            isInline
          >
            {vm.apiError.message ||
              "An error occurred while creating the assessment"}
          </Alert>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          type="submit"
          form="discovery-assessment-form"
          variant="primary"
          isDisabled={vm.isSubmitDisabled || vm.isSubmitting}
          isLoading={vm.isSubmitting}
        >
          {vm.primaryButtonLabel}
        </Button>
        <Button
          key="cancel"
          variant="link"
          onClick={handleClose}
          isDisabled={vm.isSubmitting}
        >
          Cancel
        </Button>
      </ModalFooter>
    </>
  );
};

CreateDiscoveryAssessmentModalContent.displayName =
  "CreateDiscoveryAssessmentModalContent";

export const CreateDiscoveryAssessmentModal: React.FC<
  CreateDiscoveryAssessmentModalProps
> = ({ isOpen, onClose, sources, onInventoryUploaded }) => {
  const isSubmittingRef = useRef(false);

  const handleModalClose = (): void => {
    if (isSubmittingRef.current) {
      return;
    }
    onClose();
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={handleModalClose}>
      {isOpen ? (
        <CreateDiscoveryAssessmentModalContent
          sources={sources}
          onClose={onClose}
          onInventoryUploaded={onInventoryUploaded}
          onSubmittingChange={(isSubmitting) => {
            isSubmittingRef.current = isSubmitting;
          }}
        />
      ) : null}
    </Modal>
  );
};

CreateDiscoveryAssessmentModal.displayName = "CreateDiscoveryAssessmentModal";
