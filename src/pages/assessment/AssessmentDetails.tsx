import { Snapshot as SnapshotModel } from "@openshift-migration-advisor/planner-sdk";
import {
  Bullseye,
  Button,
  Content,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { MonitoringIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useMount } from "react-use";

import { AppPage } from "../../components/AppPage";
import { useDiscoverySources } from "../../migration-wizard/contexts/discovery-sources/Context";
import { AgentStatusView } from "../environment/sources-table/AgentStatusView";
import { parseLatestSnapshot } from "./utils/snapshotParser";

const AssessmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const discoverySourcesContext = useDiscoverySources();

  useMount(() => {
    if (
      !discoverySourcesContext.assessments ||
      discoverySourcesContext.assessments.length === 0
    ) {
      void discoverySourcesContext.listAssessments();
    }
    if (
      !discoverySourcesContext.sources ||
      discoverySourcesContext.sources.length === 0
    ) {
      void discoverySourcesContext.listSources();
    }
  });

  const assessment = useMemo(() => {
    return (discoverySourcesContext.assessments || []).find(
      (a) => String(a.id) === String(id),
    );
  }, [discoverySourcesContext.assessments, id]);

  // Compute derived values with hooks before any early return
  const snapshotsSorted = useMemo(() => {
    const snaps = Array.isArray(assessment?.snapshots)
      ? assessment?.snapshots
      : [];
    return [...snaps].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate; // latest first
    });
  }, [assessment?.snapshots]);

  const latest = useMemo(() => {
    return parseLatestSnapshot(
      (assessment?.snapshots as SnapshotModel[]) || [],
    );
  }, [assessment?.snapshots]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const source = useMemo(() => {
    if (!assessment?.sourceId) return undefined;
    try {
      return discoverySourcesContext.getSourceById(assessment.sourceId);
    } catch {
      return undefined;
    }
  }, [assessment?.sourceId, discoverySourcesContext]);

  const agent = useMemo(() => source?.agent, [source]);

  if (discoverySourcesContext.isLoadingAssessments && !assessment) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (!assessment) {
    return (
      <AppPage
        breadcrumbs={[
          {
            key: 1,
            children: "Migration assessment",
          },
          {
            key: 2,
            to: "/openshift/migration-assessment/assessments",
            children: "assessments",
          },
          { key: 3, children: "Assessment not found", isActive: true },
        ]}
        title="Assessment details"
      >
        <Stack hasGutter>
          <StackItem>
            <Content>
              <Content component="p">
                The requested assessment was not found.
              </Content>
            </Content>
          </StackItem>
          <StackItem>
            <Link to="/openshift/migration-assessment/assessments">
              <Button variant="primary">Back to assessments</Button>
            </Link>
          </StackItem>
        </Stack>
      </AppPage>
    );
  }

  const ownerFullName = ((): string => {
    const formatName = (name?: string): string | undefined =>
      name
        ?.split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
    const first = formatName(assessment.ownerFirstName);
    const last = formatName(assessment.ownerLastName);
    return first && last ? `${first} ${last}` : first || last || "-";
  })();

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          to: "/openshift/migration-assessment",
          children: "Migration assessment",
        },
        {
          key: 2,
          to: "/openshift/migration-assessment/assessments",
          children: "assessments",
        },
        {
          key: 3,
          children: assessment.name || `Assessment ${id}`,
          isActive: true,
        },
      ]}
      title={assessment.name || `Assessment ${id}`}
    >
      <div
        style={{ background: "white", padding: "16px", borderRadius: "4px" }}
      >
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "16px",
          }}
        >
          <Content>
            <Content component="h2">Details</Content>
          </Content>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
          }}
        >
          <div>
            <Content>
              <Content component="small">Discovery VM status</Content>
              <AgentStatusView
                status={agent ? agent.status : "not-connected"}
                statusInfo={
                  source?.onPremises && source?.inventory !== undefined
                    ? undefined
                    : agent
                      ? agent.statusInfo
                      : "Not connected"
                }
                credentialUrl={agent ? agent.credentialUrl : ""}
                uploadedManually={Boolean(
                  source?.onPremises && source?.inventory !== undefined,
                )}
                updatedAt={source?.updatedAt as unknown as string}
                disableInteractions
              />
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Last updated</Content>
              <Content component="p">{latest.lastUpdated}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Owner</Content>
              <Content component="p">{ownerFullName}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Hosts</Content>
              <Content component="p">{latest.hosts}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">VMs</Content>
              <Content component="p">{latest.vms}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Networks</Content>
              <Content component="p">{latest.networks}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Datastores</Content>
              <Content component="p">{latest.datastores}</Content>
            </Content>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "4px",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "16px",
          }}
        >
          <Content>
            <Content component="h2">Snapshots</Content>
          </Content>
        </div>
        <Table
          aria-label="Assessment snapshots"
          variant="compact"
          borders={false}
        >
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Hosts</Th>
              <Th>VMs</Th>
              <Th>Networks</Th>
              <Th>Datastores</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {snapshotsSorted.map((s, idx) => {
              const date = s.createdAt
                ? new Date(s.createdAt).toLocaleString()
                : "-";
              const hosts = s.inventory?.vcenter?.infra?.totalHosts ?? "-";
              const vms = s.inventory?.vcenter?.vms?.total ?? "-";
              const networks = Array.isArray(
                s.inventory?.vcenter?.infra?.networks,
              )
                ? s.inventory?.vcenter?.infra?.networks?.length
                : "-";
              const datastores = Array.isArray(
                s.inventory?.vcenter?.infra?.datastores,
              )
                ? s.inventory?.vcenter?.infra?.datastores?.length
                : "-";
              return (
                <Tr key={s.createdAt ? String(s.createdAt) : String(idx)}>
                  <Td>{date}</Td>
                  <Td>{hosts}</Td>
                  <Td>{vms}</Td>
                  <Td>{networks}</Td>
                  <Td>{datastores}</Td>
                  <Td>
                    <Link
                      to={`/openshift/migration-assessment/assessments/${assessment.id}/report`}
                    >
                      <Button
                        icon={
                          <Icon isInline>
                            <MonitoringIcon style={{ color: "#0066cc" }} />
                          </Icon>
                        }
                        variant="plain"
                        aria-label="Open report"
                      />
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
    </AppPage>
  );
};

AssessmentDetails.displayName = "AssessmentDetails";

export default AssessmentDetails;
