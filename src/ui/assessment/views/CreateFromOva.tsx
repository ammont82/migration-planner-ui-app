import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  Spinner,
  TextInput,
} from "@patternfly/react-core";
import { RhUiQuestionMarkCircleIcon } from "@patternfly/react-icons";
import React, { useEffect } from "react";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import { safeExternalUrl } from "../../core/utils/urlValidation";
import { EnvironmentPageProvider } from "../../environment/view-models/EnvironmentPageContext";
import {
  DownloadEnvironmentModal,
  EnvironmentModal,
} from "../../environment/views/environment-modals";
import { SourcesTable } from "../../environment/views/SourcesTable";
import { HOME_TAB_LABELS } from "../../home/constants";
import { useCreateFromOvaViewModel } from "../view-models/useCreateFromOvaViewModel";
import { MigrationAssessmentStepsModal } from "./MigrationAssessmentStepsModal";

// ---------------------------------------------------------------------------
// Inner component that consumes EnvironmentPageProvider context
// ---------------------------------------------------------------------------

const CreateFromOvaContent: React.FC = () => {
  const vm = useCreateFromOvaViewModel();

  useEffect(() => {
    if (vm.uploadMessage && !vm.isUploadError) {
      const timeout = setTimeout(() => {
        vm.envVm.clearInventoryUploadResult();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [vm.uploadMessage, vm.isUploadError, vm.envVm]);

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          to: routes.root,
          children: "Migration advisor",
        },
        {
          key: 2,
          to: routes.root,
          children: HOME_TAB_LABELS.assessments,
        },
        { key: 3, isActive: true, children: "create new assessment" },
      ]}
      title="Create new assessment"
    >
      <div style={{ maxWidth: "900px" }}>
        <Form isWidthLimited>
          <FormGroup
            label="Assessment Name"
            isRequired
            fieldId="assessment-name"
          >
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  id="assessment-name"
                  aria-label="Assessment name"
                  placeholder="Assessment 1"
                  value={vm.name}
                  onChange={(_, v) => {
                    vm.setName(v);
                    if (vm.apiError) vm.setApiError(null);
                  }}
                  validated={vm.hasNameError ? "error" : "default"}
                />
              </InputGroupItem>
            </InputGroup>
            <HelperText>
              <HelperTextItem variant={vm.hasNameError ? "error" : "default"}>
                {vm.hasNameError
                  ? vm.apiError?.message
                  : "Name your assessment"}
              </HelperTextItem>
            </HelperText>
          </FormGroup>

          <div style={{ marginTop: "16px" }}>
            <Button
              variant="link"
              icon={<RhUiQuestionMarkCircleIcon />}
              onClick={() => vm.setIsStepsModalOpen(true)}
              style={{ paddingLeft: 0 }}
            >
              Migration advisor steps
            </Button>
          </div>

          <div className="pf-v6-u-mt-md">
            <Checkbox
              id="use-existing-env"
              label="Select existing environment"
              isChecked={vm.useExisting}
              onChange={(_, checked) => vm.setUseExisting(checked)}
            />
          </div>

          {vm.useExisting && (
            <FormGroup
              label="Existing environments"
              isRequired
              fieldId="existing-environments"
            >
              <FormSelect
                id="existing-environments"
                value={vm.selectedEnvironmentId}
                onChange={(_e, value) => vm.setSelectedEnvironmentId(value)}
              >
                <FormSelectOption
                  value=""
                  label="Select an existing environment"
                />
                {vm.availableEnvironments.map((env) => (
                  <FormSelectOption
                    key={env.id}
                    value={env.id}
                    label={env.name}
                  />
                ))}
              </FormSelect>
            </FormGroup>
          )}
          {vm.isCreatingSource && (
            <div className="pf-v6-u-mt-md">
              <Spinner />
            </div>
          )}
          {vm.useExisting &&
            vm.selectedEnvironmentId &&
            !vm.isCreatingSource && (
              <div className="pf-v6-u-mt-md">
                <SourcesTable
                  onlySourceId={vm.selectedEnvironmentId}
                  uploadOnly={true}
                />
              </div>
            )}
          {vm.uploadMessage && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant={vm.isUploadError ? "danger" : "success"}
                title={vm.isUploadError ? "Upload error" : "Upload success"}
                actionClose={
                  vm.isUploadError ? (
                    <AlertActionCloseButton
                      onClose={() => vm.envVm.clearInventoryUploadResult()}
                    />
                  ) : undefined
                }
              >
                {vm.uploadMessage}
              </Alert>
            </div>
          )}
          {vm.hasGeneralApiError && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant="danger"
                title="Failed to create assessment"
              >
                {vm.apiError?.message ||
                  "An error occurred while creating the assessment"}
              </Alert>
            </div>
          )}
          {!vm.isCreatingSource && (
            <div className="pf-v6-u-mt-sm">
              <Button
                variant="secondary"
                onClick={() => vm.setIsSetupModalOpen(true)}
                isDisabled={vm.useExisting}
              >
                Add environment
              </Button>
            </div>
          )}
          {vm.createdSource?.agent?.status === "waiting-for-credentials" && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant="custom"
                title="Discovery VM"
                actionLinks={
                  safeExternalUrl(vm.createdSource?.agent?.credentialUrl) ? (
                    <AlertActionLink
                      component="a"
                      href={safeExternalUrl(
                        vm.createdSource.agent.credentialUrl,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {vm.createdSource.agent.credentialUrl}
                    </AlertActionLink>
                  ) : undefined
                }
              >
                <Content>
                  <Content component="p">
                    Click the link below to connect the Discovery Source to your
                    VMware environment.
                  </Content>
                </Content>
              </Alert>
            </div>
          )}

          <ActionGroup className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              isDisabled={
                vm.isSubmitDisabled ||
                vm.isCreatingAssessment ||
                vm.isSelectedNotReady
              }
              isLoading={vm.isCreatingAssessment}
              onClick={() => {
                void vm.handleSubmit();
              }}
            >
              Create assessment report
            </Button>
            <Button variant="link" onClick={vm.handleCancel}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>

        <EnvironmentModal
          isOpen={vm.isSetupModalOpen}
          onClose={vm.handleSetupModalClose}
          onSuccess={(url, name) => {
            vm.setIsSetupModalOpen(false);
            void vm.handleSetupModalAfterDownload();
            vm.setDownloadModalUrl(url);
            vm.setDownloadModalSourceName(name);
            vm.setIsDownloadModalOpen(true);
          }}
        />

        <DownloadEnvironmentModal
          isOpen={vm.isDownloadModalOpen}
          onClose={() => {
            vm.setIsDownloadModalOpen(false);
            vm.envVm.setDownloadUrl?.("");
          }}
          downloadUrl={vm.downloadModalUrl}
          sourceName={vm.downloadModalSourceName}
        />

        <MigrationAssessmentStepsModal
          isOpen={vm.isStepsModalOpen}
          onClose={() => vm.setIsStepsModalOpen(false)}
        />
      </div>
    </AppPage>
  );
};

// ---------------------------------------------------------------------------
// Outer component wraps content in EnvironmentPageProvider so that
// SourcesTable and EnvironmentModals have access to the
// environment view model via useEnvironmentPage().
// ---------------------------------------------------------------------------

const CreateFromOva: React.FC = () => (
  <EnvironmentPageProvider>
    <CreateFromOvaContent />
  </EnvironmentPageProvider>
);

CreateFromOva.displayName = "CreateFromOva";

export default CreateFromOva;
