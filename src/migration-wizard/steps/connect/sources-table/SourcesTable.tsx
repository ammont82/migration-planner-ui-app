import { Source } from "@openshift-migration-advisor/planner-sdk";
import { Button, Radio, Spinner } from "@patternfly/react-core";
import { ArrowLeftIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMount, useUnmount } from "react-use";

import { useDiscoverySources } from "../../../contexts/discovery-sources/Context";
import { DownloadOvaAction } from "./actions/DownloadOvaAction";
import { RemoveSourceAction } from "./actions/RemoveSourceAction";
import { UploadInventoryAction } from "./actions/UploadInventoryAction";
import { AgentStatusView } from "./AgentStatusView";
import { Columns } from "./Columns";
import { DEFAULT_POLLING_DELAY, VALUE_NOT_AVAILABLE } from "./Constants";
import { EmptyState } from "./empty-state/EmptyState";

export const SourcesTable: React.FC<{
  onUploadResult?: (message?: string, isError?: boolean) => void;
  onUploadSuccess?: () => void;
}> = ({ onUploadResult, onUploadSuccess }) => {
  const discoverySourcesContext = useDiscoverySources();
  const prevSourcesRef = useRef<typeof discoverySourcesContext.sources>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memorize ordered agents without mutating context sources
  const memoizedSources = useMemo(() => {
    const areSourcesEquals = (
      prevSources: typeof discoverySourcesContext.sources,
      newSources: typeof discoverySourcesContext.sources,
    ): boolean => {
      if (
        !prevSources ||
        !newSources ||
        prevSources.length !== newSources.length
      )
        return false;
      return prevSources.every(
        (agent, index) => agent.id === newSources[index].id,
      );
    };

    const sourcesToUse: Source[] = discoverySourcesContext.sources
      ? [...discoverySourcesContext.sources].sort((a: Source, b: Source) =>
          a.id.localeCompare(b.id),
        )
      : [];

    if (!areSourcesEquals(prevSourcesRef.current, sourcesToUse)) {
      prevSourcesRef.current = sourcesToUse;
    }

    return prevSourcesRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverySourcesContext.sources]);

  const [firstSource, ..._otherSources] = memoizedSources ?? [];
  const hasSources = memoizedSources && memoizedSources.length > 0;

  useMount(() => {
    discoverySourcesContext.startPolling(DEFAULT_POLLING_DELAY);
    if (!discoverySourcesContext.isPolling) {
      void discoverySourcesContext.listSources();
    }
  });

  useUnmount(() => {
    discoverySourcesContext.stopPolling();
  });

  useEffect(
    () => {
      if (!discoverySourcesContext.sourceSelected && firstSource) {
        discoverySourcesContext.selectSource(firstSource);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstSource, discoverySourcesContext.selectSource],
  );

  useEffect(() => {
    // Use timeout to verify memoizedSources variable
    timeoutRef.current = setTimeout(() => {
      if (memoizedSources && memoizedSources.length === 0) {
        setIsLoading(false);
      }
    }, 3000); // Timeout in milisecons (3 seconds here)

    return () => {
      // Clean the timeout in case unmount the component
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [memoizedSources]);

  // Show spinner until all data is loaded
  if (isLoading && !hasSources) {
    return (
      <Table aria-label="Loading table" variant="compact" borders={false}>
        <Tbody>
          <Tr>
            <Td colSpan={7}>
              <Spinner size="xl" />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  } else {
    return (
      <div>
        {discoverySourcesContext.assessmentFromAgentState && (
          <div style={{ marginBottom: "16px" }}>
            <Button variant="link" icon={<ArrowLeftIcon />} onClick={() => {}}>
              Back to Assessments
            </Button>
          </div>
        )}
        <div
          style={{ maxHeight: "300px", overflowY: "auto", overflowX: "auto" }}
        >
          <Table aria-label="Sources table" variant="compact" borders={false}>
            {memoizedSources && memoizedSources.length > 0 && (
              <Thead>
                <Tr>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Name}</Th>
                  <Th style={{ whiteSpace: "normal" }}>
                    {Columns.CredentialsUrl}
                  </Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Status}</Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Hosts}</Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.VMs}</Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                  >
                    {Columns.Networks}
                  </Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                  >
                    {Columns.Datastores}
                  </Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                  >
                    {Columns.Actions}
                  </Th>
                </Tr>
              </Thead>
            )}
            <Tbody>
              {memoizedSources && memoizedSources.length > 0 ? (
                memoizedSources.map((source) => {
                  // Get the agent related to this source
                  const agent = source.agent;
                  return (
                    <Tr key={source.id}>
                      <Td
                        dataLabel={Columns.Name}
                        style={{ verticalAlign: "top" }}
                      >
                        <Radio
                          id={source.id}
                          name="source-selection"
                          label={source.name}
                          isChecked={
                            discoverySourcesContext.sourceSelected
                              ? discoverySourcesContext.sourceSelected.id ===
                                source.id
                              : false
                          }
                          onChange={() =>
                            discoverySourcesContext.selectSource(source)
                          }
                        />
                      </Td>
                      <Td
                        dataLabel={Columns.CredentialsUrl}
                        style={{ verticalAlign: "top" }}
                      >
                        {agent !== undefined && !source.onPremises ? (
                          <Link to={agent.credentialUrl} target="_blank">
                            {agent.credentialUrl}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td
                        dataLabel={Columns.Status}
                        style={{ verticalAlign: "top" }}
                      >
                        <AgentStatusView
                          status={agent ? agent.status : "not-connected"}
                          statusInfo={
                            agent ? agent.statusInfo : "Not connected"
                          }
                          credentialUrl={agent ? agent.credentialUrl : ""}
                          uploadedManually={
                            source?.onPremises &&
                            source?.inventory !== undefined
                          }
                        />
                      </Td>
                      <Td
                        dataLabel={Columns.Hosts}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.totalHosts ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.VMs}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.vms.total ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.Networks}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.networks?.length ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.Datastores}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.datastores?.length ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.Actions}
                        style={{ verticalAlign: "top" }}
                      >
                        <div className="pf-v6-u-display-flex pf-v6-u-justify-content-flex-end pf-v6-u-align-items-center pf-v6-u-gap-sm">
                          {source.name !== "Example" && (
                            <RemoveSourceAction
                              sourceId={source.id}
                              sourceName={source.name}
                              isDisabled={
                                discoverySourcesContext.isDeletingSource
                              }
                              onConfirm={(event) => {
                                event.stopPropagation();
                                void (async () => {
                                  await discoverySourcesContext.deleteSource(
                                    source.id,
                                  );
                                  event.dismissConfirmationModal();
                                  await discoverySourcesContext.listSources();
                                  if (firstSource) {
                                    discoverySourcesContext.selectSource(
                                      firstSource,
                                    );
                                  }
                                })();
                              }}
                            />
                          )}
                          {(!source?.agent || source?.onPremises) &&
                            source?.name !== "Example" && (
                              <UploadInventoryAction
                                sourceId={source.id}
                                discoverySourcesContext={
                                  discoverySourcesContext
                                }
                                onUploadResult={(message, isError) => {
                                  onUploadResult?.(message, isError);
                                }}
                                onUploadSuccess={onUploadSuccess}
                              />
                            )}
                          {source.name !== "Example" && (
                            <DownloadOvaAction
                              sourceId={source.id}
                              sourceName={source.name}
                            />
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={12}>
                    <EmptyState />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      </div>
    );
  }
};
