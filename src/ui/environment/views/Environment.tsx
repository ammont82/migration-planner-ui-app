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
  DownloadEnvironmentModal,
  EnvironmentModal,
} from "./environment-modals";
import { SourcesTable } from "./SourcesTable";

type EnvironmentContentProps = {
  vm: EnvironmentPageViewModel;
};

const EnvironmentContent: React.FC<EnvironmentContentProps> = ({ vm }) => {
  const [shouldShowCreateModal, setShouldShowCreateModal] = useState(false);
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] =
    useState(false);
  const [shouldShowEditModal, setShouldShowEditModal] = useState(false);
  const [shouldShowDownloadModal, setShouldShowDownloadModal] = useState(false);
  const [editSourceId, setEditSourceId] = useState<string | null>(null);
  const [downloadSourceId, setDownloadSourceId] = useState<string | null>(null);
  const [downloadUrlForModal, setDownloadUrlForModal] = useState<string>("");
  const [sourceNameForModal, setSourceNameForModal] = useState<string>("");
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
          setEditSourceId(sourceId);
          vm.selectSourceById?.(sourceId);
          setShouldShowEditModal(true);
        }}
        onAddEnvironment={() => {
          setShouldShowCreateModal(true);
        }}
        onDownloadOva={(sourceId) => {
          setDownloadSourceId(sourceId);
          setShouldShowDownloadModal(true);
        }}
        onCreateAssessment={() => {
          setIsCreateAssessmentModalOpen(true);
        }}
      />

      <CreateDiscoveryAssessmentModal
        isOpen={isCreateAssessmentModalOpen}
        onClose={() => {
          setIsCreateAssessmentModalOpen(false);
        }}
        sources={vm.sources}
        onInventoryUploaded={() => {
          void vm.listSources();
        }}
      />

      {shouldShowCreateModal && (
        <EnvironmentModal
          isOpen={shouldShowCreateModal}
          onClose={() => {
            setShouldShowCreateModal(false);
            void vm.listSources();
          }}
          onSuccess={(url, name) => {
            setShouldShowCreateModal(false);
            setDownloadUrlForModal(url);
            setSourceNameForModal(name);
            setShouldShowDownloadModal(true);
          }}
        />
      )}

      {shouldShowEditModal && editSourceId && (
        <EnvironmentModal
          isOpen={shouldShowEditModal}
          onClose={() => {
            setEditSourceId(null);
            setShouldShowEditModal(false);
          }}
          sourceId={editSourceId}
          onSuccess={(url, name) => {
            setShouldShowEditModal(false);
            setDownloadUrlForModal(url);
            setSourceNameForModal(name);
            setShouldShowDownloadModal(true);
          }}
        />
      )}

      {shouldShowDownloadModal && (
        <DownloadEnvironmentModal
          isOpen={shouldShowDownloadModal}
          onClose={() => {
            setDownloadSourceId(null);
            setShouldShowDownloadModal(false);
            setDownloadUrlForModal("");
            setSourceNameForModal("");
            vm.setDownloadUrl?.("");
          }}
          downloadUrl={downloadUrlForModal || undefined}
          sourceName={
            sourceNameForModal ||
            (downloadSourceId
              ? vm.getSourceById?.(downloadSourceId)?.name || ""
              : "")
          }
          sourceId={downloadSourceId || undefined}
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
