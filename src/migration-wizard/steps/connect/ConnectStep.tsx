import { Source } from "@openshift-migration-advisor/planner-sdk";
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  Button,
  Content,
  Icon,
  List,
  ListItem,
  OrderType,
  Panel,
  PanelHeader,
  PanelMain,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { ClusterIcon, PlusCircleIcon } from "@patternfly/react-icons";
import { chart_color_blue_300 as blueColor } from "@patternfly/react-tokens/dist/js/chart_color_blue_300";
import React, { useCallback, useEffect, useState } from "react";

import { useDiscoverySources } from "../../contexts/discovery-sources/Context";
import { UploadInventoryAction } from "./sources-table/actions/UploadInventoryAction";
import { DiscoverySourceSetupModal } from "./sources-table/empty-state/DiscoverySourceSetupModal";
import { SourcesTable } from "./sources-table/SourcesTable";
import { TroubleshootingModal } from "./TroubleshootingModal";

export const ConnectStep: React.FC = () => {
  const discoverySourcesContext = useDiscoverySources();

  const [
    shouldShowDiscoverySourceSetupModal,
    setShouldShowDiscoverySetupModal,
  ] = useState(false);

  const toggleDiscoverySourceSetupModal = useCallback((): void => {
    setShouldShowDiscoverySetupModal((lastState) => !lastState);
  }, []);
  const hasSources =
    discoverySourcesContext.sources &&
    discoverySourcesContext.sources.length > 0;
  const [firstSource, ..._otherSources] = discoverySourcesContext.sources ?? [];
  const [sourceSelected, setSourceSelected] = React.useState<Source>();
  const [isOvaDownloading, setIsOvaDownloading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploadError, setIsUploadError] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

  useEffect(() => {
    if (discoverySourcesContext.sourceSelected) {
      const foundSource = discoverySourcesContext.sources.find(
        (source) => source.id === discoverySourcesContext.sourceSelected?.id,
      );
      if (foundSource) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSourceSelected(foundSource);
      } else {
        if (firstSource) {
          setSourceSelected(firstSource);
        } else {
          setSourceSelected(undefined);
        }
      }
    }
  }, [
    discoverySourcesContext.sourceSelected,
    discoverySourcesContext.sources,
    firstSource,
  ]);

  useEffect(() => {
    if (uploadMessage && !isUploadError) {
      // Only auto-dismiss success messages, keep error messages persistent
      const timeout = setTimeout(() => {
        setUploadMessage(null);
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [uploadMessage, isUploadError]);

  useEffect(() => {
    if (isOvaDownloading) {
      const timeout = setTimeout(() => {
        setIsOvaDownloading(false);
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [isOvaDownloading]);

  return (
    <>
      <Stack hasGutter>
        {/* Critical error alerts at the top for visibility */}
        {uploadMessage && isUploadError && (
          <StackItem>
            <Alert
              isInline
              variant="danger"
              title={uploadMessage}
              actionClose={
                <AlertActionCloseButton
                  onClose={() => setUploadMessage(null)}
                />
              }
            />
          </StackItem>
        )}

        {discoverySourcesContext.errorDownloadingSource && (
          <StackItem>
            <Alert
              isInline
              variant="danger"
              title="Download Environment error"
              actionClose={
                <AlertActionCloseButton
                  onClose={() => {
                    discoverySourcesContext.clearErrors({ downloading: true });
                  }}
                />
              }
            >
              {discoverySourcesContext.errorDownloadingSource.message}
            </Alert>
          </StackItem>
        )}

        <StackItem>
          <Content component="h2">Connect your VMware environment</Content>
        </StackItem>
        <StackItem>
          <Content style={{ paddingBlock: "1rem" }} component="h4">
            Follow these steps to connect your environment and start the
            discovery process
          </Content>
          <List
            component="ol"
            type={OrderType.number}
            style={{ marginInlineStart: 0 }}
          >
            <ListItem>
              To add a new environment download and import a discovery OVA file
              to your VMware environment.
            </ListItem>
            <ListItem>
              A link will appear below once the VM is running. Use this link to
              enter credentials and connect your environment.
              <Button
                variant="link"
                isInline
                onClick={() => setIsTroubleshootingOpen(true)}
              >
                (VM not showing up?)
              </Button>{" "}
            </ListItem>
            <ListItem>
              When the connection is established, you will be able to proceed
              and see the discovery report.
            </ListItem>
          </List>
        </StackItem>
        <StackItem>
          <Panel variant="bordered">
            <PanelMain>
              <PanelHeader style={{ paddingBlockEnd: 0 }}>
                <Content component="h3">
                  <Icon isInline style={{ marginRight: "1rem" }}>
                    <ClusterIcon />
                  </Icon>
                  Environment
                </Content>
              </PanelHeader>
              <SourcesTable
                onUploadResult={(message, isError) => {
                  setUploadMessage(message ?? null);
                  setIsUploadError(isError ?? false);
                }}
                onUploadSuccess={() => {
                  void discoverySourcesContext.listSources();
                }}
              />
            </PanelMain>
          </Panel>
        </StackItem>

        {hasSources && (
          <StackItem>
            <Button
              variant="secondary"
              onClick={toggleDiscoverySourceSetupModal}
              style={{ marginTop: "1rem" }}
              icon={<PlusCircleIcon color={blueColor.value} />}
            >
              Add environment
            </Button>
          </StackItem>
        )}

        {isOvaDownloading && (
          <StackItem>
            <Alert isInline variant="info" title="Download OVA image">
              The OVA image is downloading
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
                  <AlertActionLink
                    component="a"
                    href={sourceSelected?.agent.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sourceSelected?.agent.credentialUrl}
                  </AlertActionLink>
                }
              >
                <Content>
                  Click the link below to connect the Discovery Source to your
                  VMware environment.
                </Content>
              </Alert>
            </StackItem>
          )}

        {hasSources &&
          !sourceSelected?.agent &&
          sourceSelected?.name !== "Example" && (
            <StackItem>
              <Alert
                isInline
                variant="custom"
                title="Environment not connected"
              >
                <Content>
                  The selected environment is not connected, if you have a
                  discovery file click the link below to upload it.
                </Content>
                <UploadInventoryAction
                  discoverySourcesContext={discoverySourcesContext}
                  sourceId={sourceSelected?.id ?? ""}
                  asLink
                  onUploadResult={(message, isError) => {
                    setUploadMessage(message ?? null);
                    setIsUploadError(isError ?? false);
                  }}
                />
              </Alert>
            </StackItem>
          )}

        {uploadMessage && !isUploadError && (
          <StackItem>
            <Alert isInline variant="success" title={uploadMessage} />
          </StackItem>
        )}
      </Stack>
      {shouldShowDiscoverySourceSetupModal && (
        <DiscoverySourceSetupModal
          isOpen={shouldShowDiscoverySourceSetupModal}
          onClose={toggleDiscoverySourceSetupModal}
          isDisabled={discoverySourcesContext.isDownloadingSource}
          onStartDownload={() => setIsOvaDownloading(true)}
          onAfterDownload={async () => {
            await discoverySourcesContext.listSources();
          }}
        />
      )}
      <TroubleshootingModal
        isOpen={isTroubleshootingOpen}
        onClose={() => setIsTroubleshootingOpen(false)}
      />
    </>
  );
};

ConnectStep.displayName = "ConnectStep";
