import {
  Infra,
  InventoryData,
  Snapshot,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
  Button,
  Content,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Tooltip,
} from "@patternfly/react-core";
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMount } from "react-use";

import { AppPage } from "../../components/AppPage";
import { useDiscoverySources } from "../../migration-wizard/contexts/discovery-sources/Context";
import { Provider as DiscoverySourcesProvider } from "../../migration-wizard/contexts/discovery-sources/Provider";
import { EnhancedDownloadButton } from "../../migration-wizard/steps/discovery/EnhancedDownloadButton";
import { ExportError, SnapshotLike } from "../../services/report-export/types";
import { parseLatestSnapshot } from "../assessment/utils/snapshotParser";
import { AgentStatusView } from "../environment/sources-table/AgentStatusView";
import {
  buildClusterViewModel,
  ClusterOption,
  ClusterViewModel,
} from "./assessment-report/clusterView";
import { Dashboard } from "./assessment-report/Dashboard";
import { ClusterSizingWizard } from "./cluster-sizer/ClusterSizingWizard";

type AssessmentLike = {
  id: string | number;
  sourceId?: string;
  name?: string;
  sourceType?: string;
  snapshots?: SnapshotLike[];
};

const Inner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const discoverySourcesContext = useDiscoverySources();
  const [exportError, setExportError] = useState<ExportError | null>(null);
  // Track user's explicit selection; null means "use default (first cluster)"
  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
  const [isSizingWizardOpen, setIsSizingWizardOpen] = useState(false);

  useMount(() => {
    const loadData = async () => {
      if (
        !discoverySourcesContext.assessments ||
        discoverySourcesContext.assessments.length === 0
      ) {
        await discoverySourcesContext.listAssessments();
      }
      if (
        !discoverySourcesContext.sources ||
        discoverySourcesContext.sources.length === 0
      ) {
        await discoverySourcesContext.listSources();
      }
    };

    void loadData();
  });

  const assessment = discoverySourcesContext.assessments.find(
    (a) => String((a as AssessmentLike).id) === String(id),
  ) as AssessmentLike | undefined;

  // Compute clusters early for default selection (before early returns)
  const assessmentClusters = assessment?.snapshots?.length
    ? assessment.snapshots[assessment.snapshots.length - 1].inventory?.clusters
    : undefined;

  // Compute effective selection: user's choice takes precedence, otherwise first cluster
  const selectedClusterId = useMemo(() => {
    if (userSelectedClusterId !== null) {
      return userSelectedClusterId;
    }
    const clusterKeys = assessmentClusters
      ? Object.keys(assessmentClusters)
      : [];
    return clusterKeys.length > 0 ? clusterKeys[0] : "all";
  }, [userSelectedClusterId, assessmentClusters]);

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

  const snapshots = assessment.snapshots || [];
  const last =
    snapshots.length > 0
      ? snapshots[snapshots.length - 1]
      : ({} as SnapshotLike);
  // At runtime, data from the API will always be the API model types (Infra, VMs).
  // The SnapshotLike union type allows flexibility for export processing,
  // but here we safely cast to the specific types expected by Dashboard.
  const infra = (last.infra ||
    last.inventory?.infra || // legacy
    last.inventory?.vcenter?.infra) as Infra | undefined;
  const vms = (last.vms ||
    last.inventory?.vms || // legacy
    last.inventory?.vcenter?.vms) as VMs | undefined;
  const clusters = last.inventory?.clusters as
    | { [key: string]: InventoryData }
    | undefined;

  const clusterView = buildClusterViewModel({
    infra,
    vms,
    clusters,
    selectedClusterId,
  });

  type ClusterScopedView = ClusterViewModel &
    Required<
      Pick<ClusterViewModel, "viewInfra" | "viewVms" | "cpuCores" | "ramGB">
    >;
  const isClusterScopedData = (
    view: ClusterViewModel,
  ): view is ClusterScopedView =>
    Boolean(view.viewInfra && view.viewVms && view.cpuCores && view.ramGB);
  const scopedClusterView = isClusterScopedData(clusterView)
    ? clusterView
    : undefined;

  const clusterSelectDisabled = clusterView.clusterOptions.length <= 1;

  // Check if the selected cluster has hosts and VMs.
  const hasClusterResources = (viewInfra?: Infra, viewVms?: VMs): boolean => {
    const totalHosts = viewInfra?.totalHosts ?? 0;
    const hostsCount = viewInfra?.hosts?.length ?? 0;
    const hasHosts = totalHosts > 0 || hostsCount > 0;
    const hasVms = (viewVms?.total ?? 0) > 0;
    return hasHosts && hasVms;
  };

  const canShowClusterRecommendations =
    selectedClusterId !== "all" &&
    hasClusterResources(clusterView.viewInfra, clusterView.viewVms);

  // Check if export should be disabled (no VMs or hosts)
  const canExportReport = hasClusterResources(
    clusterView.viewInfra,
    clusterView.viewVms,
  );

  const source = assessment.sourceId
    ? discoverySourcesContext.getSourceById(assessment.sourceId)
    : undefined;
  const agent = source?.agent;
  const clusterCount = clusters ? Object.keys(clusters).length : 0;

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ): void => {
    if (typeof value === "string") {
      setUserSelectedClusterId(value);
    }
    setIsClusterSelectOpen(false);
  };

  // Derive last updated text from latest snapshot
  const lastUpdatedText: string = ((): string => {
    try {
      const result = parseLatestSnapshot(assessment.snapshots as Snapshot[]);
      return result.lastUpdated || "-";
    } catch {
      return "-";
    }
  })();

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
        {
          key: 3,
          children: `${assessment.name || `Assessment ${id}`} - vCenter report`,
          isActive: true,
        },
      ]}
      title={`${assessment.name || `Assessment ${id}`} - vCenter report`}
      caption={
        <Stack>
          <StackItem>
            {assessment.sourceType === "rvtools" ? (
              "Source: RVTools file upload"
            ) : (
              <Split hasGutter>
                <SplitItem isFilled={false}>Discovery VM status:</SplitItem>
                <SplitItem isFilled={false}>
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
                </SplitItem>
              </Split>
            )}
          </StackItem>
          <StackItem>
            <p>
              Presenting the information we were able to fetch from the
              discovery process
            </p>
          </StackItem>

          <StackItem>
            {lastUpdatedText !== "-"
              ? `Last updated: ${lastUpdatedText}`
              : "[Last updated time stamp]"}
          </StackItem>
          <StackItem>
            {clusterCount > 0 ? (
              typeof vms?.total === "number" ? (
                <>
                  Detected <strong>{vms?.total} VMS</strong> in{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              ) : (
                <>
                  Detected{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              )
            ) : (
              "No clusters detected"
            )}
          </StackItem>
          <StackItem>
            <Select
              isScrollable
              isOpen={isClusterSelectOpen}
              selected={clusterView.selectionId}
              onSelect={handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!clusterSelectDisabled) setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={isClusterSelectOpen}
                  onClick={() => {
                    if (!clusterSelectDisabled) {
                      setIsClusterSelectOpen((prev) => !prev);
                    }
                  }}
                  isDisabled={clusterSelectDisabled}
                  style={{ minWidth: "422px" }}
                >
                  {clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {clusterView.clusterOptions.map((option: ClusterOption) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </StackItem>
        </Stack>
      }
      alerts={
        exportError ? (
          <Alert
            variant="danger"
            isInline
            title="An error occurred"
            actionClose={
              <AlertActionCloseButton onClose={() => setExportError(null)} />
            }
          >
            <p>{exportError?.message}</p>
          </Alert>
        ) : null
      }
      headerActions={
        scopedClusterView ? (
          <Split hasGutter>
            <SplitItem>
              {canExportReport ? (
                <EnhancedDownloadButton
                  onError={setExportError}
                  elementId="discovery-report"
                  componentToRender={
                    <Dashboard
                      infra={scopedClusterView.viewInfra}
                      vms={scopedClusterView.viewVms}
                      cpuCores={scopedClusterView.cpuCores}
                      ramGB={scopedClusterView.ramGB}
                      isExportMode={true}
                      exportAllViews={true}
                      clusters={scopedClusterView.viewClusters}
                      isAggregateView={scopedClusterView.isAggregateView}
                      clusterFound={scopedClusterView.clusterFound}
                    />
                  }
                  sourceData={
                    discoverySourcesContext.sourceSelected ?? undefined
                  }
                  snapshot={last}
                  documentTitle={`${assessment.name || `Assessment ${id}`} - vCenter report${
                    clusterView.isAggregateView
                      ? ""
                      : ` - ${clusterView.selectionLabel}`
                  }`}
                  isAggregateView={clusterView.isAggregateView}
                />
              ) : (
                <Tooltip
                  content={
                    <p>
                      Export is unavailable because this cluster has no VMs.
                    </p>
                  }
                >
                  <EnhancedDownloadButton
                    onError={setExportError}
                    elementId="discovery-report"
                    componentToRender={
                      <Dashboard
                        infra={scopedClusterView.viewInfra}
                        vms={scopedClusterView.viewVms}
                        cpuCores={scopedClusterView.cpuCores}
                        ramGB={scopedClusterView.ramGB}
                        isExportMode={true}
                        exportAllViews={true}
                        clusters={scopedClusterView.viewClusters}
                        isAggregateView={scopedClusterView.isAggregateView}
                        clusterFound={scopedClusterView.clusterFound}
                      />
                    }
                    sourceData={
                      discoverySourcesContext.sourceSelected ?? undefined
                    }
                    snapshot={last}
                    documentTitle={`${assessment.name || `Assessment ${id}`} - vCenter report${
                      clusterView.isAggregateView
                        ? ""
                        : ` - ${clusterView.selectionLabel}`
                    }`}
                    isDisabled
                  />
                </Tooltip>
              )}
            </SplitItem>

            {selectedClusterId !== "all" ? (
              <SplitItem>
                {canShowClusterRecommendations ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsSizingWizardOpen(true)}
                  >
                    View target cluster recommendations
                  </Button>
                ) : (
                  <Tooltip
                    content={
                      <p>
                        This cluster has no VMs. Cluster recommendations are not
                        available for empty clusters.
                      </p>
                    }
                  >
                    <Button
                      variant="primary"
                      onClick={() => setIsSizingWizardOpen(true)}
                      isAriaDisabled
                    >
                      View target cluster recommendations
                    </Button>
                  </Tooltip>
                )}
              </SplitItem>
            ) : null}
          </Split>
        ) : undefined
      }
    >
      {scopedClusterView ? (
        <Dashboard
          infra={scopedClusterView.viewInfra}
          vms={scopedClusterView.viewVms}
          cpuCores={scopedClusterView.cpuCores}
          ramGB={scopedClusterView.ramGB}
          clusters={scopedClusterView.viewClusters}
          isAggregateView={scopedClusterView.isAggregateView}
          clusterFound={scopedClusterView.clusterFound}
        />
      ) : (
        <Bullseye>
          <Content>
            <Content component="p">
              {clusterView.isAggregateView
                ? "This assessment does not have report data yet."
                : "No data is available for the selected cluster."}
            </Content>
          </Content>
        </Bullseye>
      )}

      <ClusterSizingWizard
        isOpen={isSizingWizardOpen}
        onClose={() => setIsSizingWizardOpen(false)}
        clusterName={clusterView.selectionLabel}
        clusterId={selectedClusterId}
        assessmentId={id || ""}
      />
    </AppPage>
  );
};

const Report: React.FC = () => (
  <DiscoverySourcesProvider>
    <Inner />
  </DiscoverySourcesProvider>
);

Report.displayName = "Report";

export default Report;
