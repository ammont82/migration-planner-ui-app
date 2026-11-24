import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  Content,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";

import { LoadingSpinner } from "../../core/components/LoadingSpinner";
import { safeExternalUrl } from "../../core/utils/urlValidation";
import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";
import type { EnvironmentPageViewModel } from "../view-models/useEnvironmentPageViewModel";
import {
  CreateDiscoveryAssessmentModal,
  DiscoveryApplianceModal,
  type DiscoveryApplianceModalInitialState,
} from "./environment-modals";
import { SourcesTable } from "./SourcesTable";

type EnvironmentContentProps = {
  vm: EnvironmentPageViewModel;
};

const EnvironmentContent: React.FC<EnvironmentContentProps> = ({ vm }) => {
  const [
    discoveryApplianceModalInitialState,
    setDiscoveryApplianceModalInitialState,
  ] = useState<DiscoveryApplianceModalInitialState | null>(null);
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] =
    useState(false);
  const [
    createAssessmentPreselectedSourceId,
    setCreateAssessmentPreselectedSourceId,
  ] = useState<string | undefined>(undefined);
  const [firstSource, ..._otherSources] = vm.sources ?? [];
  const sourceSelected =
    (vm.sourceSelected &&
      vm.sources?.find((source) => source.id === vm.sourceSelected?.id)) ||
    firstSource;
  const [isOvaDownloading, setIsOvaDownloading] = useState(false);
  const uploadResult = vm.inventoryUploadResult;
  const uploadMessage = uploadResult?.message ?? null;
  const isUploadError = uploadResult?.isError ?? false;

  useEffect(() => {
    if (uploadMessage && !isUploadError) {
      // Only auto-dismiss success messages, keep error messages persistent
      const timeout = setTimeout(() => {
        vm.clearInventoryUploadResult();
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [uploadMessage, isUploadError, vm]);

  useEffect(() => {
    if (isOvaDownloading) {
      const timeout = setTimeout(() => {
        setIsOvaDownloading(false);
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [isOvaDownloading]);

  return (
    <Stack hasGutter>
      {uploadMessage && (
        <StackItem>
          <Alert
            isInline
            variant={isUploadError ? "danger" : "success"}
            title={isUploadError ? "Upload error" : "Upload success"}
            actionClose={
              isUploadError ? (
                <AlertActionCloseButton
                  onClose={() => vm.clearInventoryUploadResult()}
                />
              ) : undefined
            }
          >
            {uploadMessage}
          </Alert>
        </StackItem>
      )}

      {isOvaDownloading && (
        <StackItem>
          <Alert isInline variant="info" title="Download OVA image">
            The OVA image is downloading
          </Alert>
        </StackItem>
      )}

      {vm.errorDownloadingSource && (
        <StackItem>
          <Alert
            isInline
            variant="danger"
            title="Download Environment error"
            actionClose={
              <AlertActionCloseButton
                onClose={() => {
                  vm.clearErrors({ downloading: true });
                }}
              />
            }
          >
            {vm.errorDownloadingSource.message}
          </Alert>
        </StackItem>
      )}

      {sourceSelected?.agent &&
        sourceSelected?.agent.status === "waiting-for-credentials" && (
          <StackItem>
            <Alert
              isInline
              variant="custom"
              title="Discovery VM"
              actionLinks={
                safeExternalUrl(sourceSelected?.agent.credentialUrl) ? (
                  <AlertActionLink
                    component="a"
                    href={safeExternalUrl(sourceSelected.agent.credentialUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sourceSelected.agent.credentialUrl}
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
          </StackItem>
        )}

      <SourcesTable
        onEditEnvironment={(sourceId) => {
          vm.selectSourceById?.(sourceId);
          setDiscoveryApplianceModalInitialState({ mode: "edit", sourceId });
        }}
        onAddEnvironment={() => {
          setDiscoveryApplianceModalInitialState({ mode: "create" });
        }}
        onDownloadOva={(sourceId) => {
          setDiscoveryApplianceModalInitialState({
            mode: "download",
            download: {
              sourceId,
              sourceName: vm.getSourceById?.(sourceId)?.name || "",
            },
          });
        }}
        onCreateAssessment={(sourceId) => {
          setCreateAssessmentPreselectedSourceId(sourceId);
          setIsCreateAssessmentModalOpen(true);
        }}
      />

      <CreateDiscoveryAssessmentModal
        isOpen={isCreateAssessmentModalOpen}
        onClose={() => {
          setIsCreateAssessmentModalOpen(false);
          setCreateAssessmentPreselectedSourceId(undefined);
        }}
        sources={vm.sources}
        preselectedSourceId={createAssessmentPreselectedSourceId}
        onInventoryUploaded={() => {
          void vm.listSources();
        }}
      />

      {discoveryApplianceModalInitialState && (
        <DiscoveryApplianceModal
          initialState={discoveryApplianceModalInitialState}
          onCancel={() => {
            vm.setDownloadUrl("");
            setDiscoveryApplianceModalInitialState(null);
          }}
          onClose={() => {
            vm.setDownloadUrl("");
            setDiscoveryApplianceModalInitialState(null);
          }}
          onCreationSuccess={() => {
            void vm.listSources();
          }}
          onStartDownload={() => setIsOvaDownloading(true)}
          onAfterDownload={async () => {
            await vm.listSources();
          }}
        />
      )}
    </Stack>
  );
};

export const EnvironmentPage: React.FC = () => {
  const vm = useEnvironmentPage();

  // Show spinner only during initial load
  if (vm.isLoadingSources && !vm.hasInitialLoad) {
    return <LoadingSpinner />;
  }

  // Always show environment component
  return <EnvironmentContent vm={vm} />;
};

EnvironmentPage.displayName = "EnvironmentPage";

export default EnvironmentPage;
