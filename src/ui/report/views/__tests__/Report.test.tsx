import "@testing-library/jest-dom";

import type {
  Host,
  Infra,
  Source,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSourceModel } from "../../../../models/SourceModel";
import type { ReportPageViewModel } from "../../view-models/useReportPageViewModel";
import Report from "../Report";

// ---------------------------------------------------------------------------
// Mock the view model hook
// ---------------------------------------------------------------------------

let mockVm: ReportPageViewModel;

vi.mock("../../view-models/useReportPageViewModel", () => ({
  useReportPageViewModel: () => mockVm,
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }): React.ReactElement => <a href={to}>{children}</a>,
  useParams: vi.fn(() => ({ id: "assessment-1" })),
  useNavigate: () => vi.fn(),
}));

vi.mock(
  "../../../assessment/views/create-rvtools/CreateRvtoolsAssessmentModal",
  () => ({
    default: (): null => null,
  }),
);

// Mock child components
vi.mock("../ExportReportButton", () => ({
  ExportReportButton: ({
    isDisabled,
  }: {
    isDisabled?: boolean;
  }): React.ReactElement => (
    <div
      data-testid="download-button"
      data-disabled={isDisabled ? "true" : "false"}
    />
  ),
}));

vi.mock("../../../environment/views/AgentStatusView", () => ({
  AgentStatusView: (): React.ReactElement => (
    <div data-testid="agent-status-view" />
  ),
}));

vi.mock("../assessment-report/Dashboard", () => ({
  Dashboard: (): React.ReactElement => <div data-testid="dashboard" />,
}));

vi.mock("../cluster-sizer/ClusterSizingWizard", () => ({
  ClusterSizingWizard: (): React.ReactElement => (
    <div data-testid="cluster-sizing-wizard" />
  ),
}));

vi.mock("../migration-recommendations/MigrationRecommendations", () => ({
  MigrationRecommendations: (): React.ReactElement => (
    <div data-testid="migration-recommendations" />
  ),
}));

vi.mock("../manual-environment/ManualEnvironmentDetailsPanel", () => ({
  ManualEnvironmentDetailsPanel: (): React.ReactElement => (
    <div data-testid="manual-environment-details" />
  ),
}));

vi.mock("../../../assessment/views/CreateAssessmentModal", () => ({
  __esModule: true,
  default: (): React.ReactElement => (
    <div data-testid="create-assessment-modal" />
  ),
}));

vi.mock("../../../core/components/AppPage", () => ({
  AppPage: ({
    children,
    headerActions,
    alerts,
  }: {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    alerts?: React.ReactNode;
  }): React.ReactElement => (
    <div data-testid="app-page">
      {alerts && <div data-testid="alerts">{alerts}</div>}
      {headerActions && <div data-testid="header-actions">{headerActions}</div>}
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyBreakdown: VMResourceBreakdown = {
  total: 0,
  totalForMigratable: 0,
  totalForMigratableWithWarnings: 0,
  totalForNotMigratable: 0,
};

const createInfra = (totalHosts: number, hostsCount = 0): Infra => ({
  clustersPerDatacenter: [],
  hosts: Array(hostsCount).fill({}) as Host[],
  totalHosts,
  hostPowerStates: {},
  networks: [],
  datastores: [],
});

const createVMs = (total: number): VMs => ({
  os: { Linux: total },
  total,
  totalMigratable: total,
  cpuCores: { ...emptyBreakdown, total },
  ramGB: { ...emptyBreakdown, total: total * 4 },
  diskGB: emptyBreakdown,
  diskCount: emptyBreakdown,
  diskSizeTier: {},
  diskTypes: {},
  nicCount: emptyBreakdown,
  migrationWarnings: [],
  notMigratableReasons: [],
  powerStates: {},
  distributionByCpuTier: {},
  distributionByMemoryTier: {},
});

const mockSource = createSourceModel({
  id: "source-1",
  name: "Test Source",
  createdAt: new Date(),
  updatedAt: new Date(),
  onPremises: false,
  agent: {
    id: "agent-1",
    status: "connected" as unknown as NonNullable<Source["agent"]>["status"],
    statusInfo: "",
    credentialUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "",
  },
});

import {
  ALL_VMS_GROUP_ID,
  buildGroupViewModel,
} from "../../helpers/groupViewModel";
import {
  ALL_CLUSTERS_ID,
  buildClusterViewModel,
} from "../assessment-report/ClusterView";

function makeBaseVm(
  overrides: Partial<ReportPageViewModel> = {},
): ReportPageViewModel {
  const infra = createInfra(5, 5);
  const vms = createVMs(10);
  const clusters = {};
  const clusterView = buildClusterViewModel({
    infra,
    vms,
    clusters,
    selectedClusterId: ALL_CLUSTERS_ID,
  });
  const groupView = buildGroupViewModel({ subsetInventories: [] });

  return {
    assessmentId: "assessment-1",
    assessment: undefined,
    source: mockSource,
    isInitialLoading: false,
    clusterView,
    selectedClusterId: ALL_CLUSTERS_ID,
    selectCluster: vi.fn(),
    isClusterSelectOpen: false,
    setClusterSelectOpen: vi.fn(),
    clusterSelectDisabled: true,
    groupView,
    selectedGroupId: ALL_VMS_GROUP_ID,
    selectGroup: vi.fn(),
    isGroupSelectOpen: false,
    setGroupSelectOpen: vi.fn(),
    infra,
    vms,
    clusters,
    latestSnapshot: {},
    lastUpdatedText: "-",
    clusterCount: 0,
    reportSummaryVms: vms,
    vcenterId: undefined,
    vcenterVersion: undefined,
    scopedClusterView: undefined,
    canExportReport: false,
    canShowClusterRecommendations: false,
    canUseRecommendationTools: false,
    isPartner: false,
    missingMetrics: [],
    hasMissingMetrics: false,
    vcenterInventoryLoadError: undefined,
    clusterInventoryLoadError: undefined,
    rvtoolsModalMode: "create",
    isRvtoolsModalOpen: false,
    openRvtoolsModal: vi.fn(),
    openAppendRvtoolsModal: vi.fn(),
    closeRvtoolsModal: vi.fn(),
    createRVToolsJob: vi.fn(),
    appendRvtoolsFiles: vi.fn(),
    cancelRVToolsJob: vi.fn(),
    rvtoolsAppendSuccessMessage: null,
    dismissRvtoolsAppendSuccess: vi.fn(),
    removeRvtoolsUploadResult: vi.fn(),
    canAppendRvtoolsFiles: false,
    rvtoolsPendingUploadBatches: [],
    isRvtoolsUploadWarningDismissed: () => false,
    dismissRvtoolsUploadWarning: vi.fn(),
    openAppendRvtoolsFromErrorReview: vi.fn(),
    rvtoolsRemainingFileSlots: 10,
    rvtoolsAppendNotice: null,
    dismissRvtoolsAppendNotice: vi.fn(),
    isCreatingJob: false,
    jobCreateError: undefined,
    isJobProcessing: false,
    jobProgressValue: 0,
    jobProgressLabel: "",
    jobError: null,
    isNavigatingToReport: false,
    exportDocumentTitle: "Assessment 1 - vCenter report",
    pdfExtraPages: [],
    activeReportTab: "report",
    setActiveReportTab: vi.fn(),
    selectedRecommendationTool: null,
    openRecommendationTool: vi.fn(),
    closeRecommendationTool: vi.fn(),
    savedSizingDataMap: {},
    onSizingCalculated: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Report", () => {
  beforeEach(() => {
    mockVm = makeBaseVm();
  });

  it("renders loading spinner during initial loading", () => {
    mockVm = makeBaseVm({ isInitialLoading: true, assessment: undefined });
    render(<Report />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders not found message when assessment does not exist", () => {
    mockVm = makeBaseVm({ assessment: undefined });
    render(<Report />);
    expect(
      screen.getByText(/The requested assessment was not found/),
    ).toBeInTheDocument();
  });

  describe("Report tabs", () => {
    it("renders Migration report and Migration recommendations tabs", async () => {
      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
      });

      render(<Report />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Migration report" }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("tab", { name: "Manual environment details" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Migration recommendations" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
        "Migration report",
        "Manual environment details",
        "Migration recommendations",
      ]);
      expect(
        screen.queryByText("View Recommendation based on vCenter cluster"),
      ).not.toBeInTheDocument();
    });

    it("shows the dashboard on the Migration report tab", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: ALL_CLUSTERS_ID,
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        clusterView,
        selectedClusterId: ALL_CLUSTERS_ID,
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canExportReport: true,
        activeReportTab: "report",
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getAllByTestId("dashboard").length).toBeGreaterThan(0);
      });
      expect(screen.getByTestId("migration-recommendations")).not.toBeVisible();
    });

    it("shows recommendation tools on the Migration recommendations tab", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: ALL_CLUSTERS_ID,
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        clusterView,
        selectedClusterId: ALL_CLUSTERS_ID,
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canUseRecommendationTools: true,
        activeReportTab: "recommendations",
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("migration-recommendations")).toBeVisible();
      });
    });

    it("shows manual environment details when that tab is selected", async () => {
      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        activeReportTab: "manual-details",
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("manual-environment-details")).toBeVisible();
      });
      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    });
  });

  describe("Missing metrics warning", () => {
    it("renders warning alert with metric names and create button when hasMissingMetrics is true", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        hasMissingMetrics: true,
        missingMetrics: ["CPU", "Memory", "Hosts"],
      });

      render(<Report />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Limited recommendation: required metrics are missing.",
          ),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("CPU")).toBeInTheDocument();
      expect(screen.getByText("Memory")).toBeInTheDocument();
      expect(screen.getByText("Hosts")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create a new assessment" }),
      ).toBeInTheDocument();
    });

    it("does not render warning alert when hasMissingMetrics is false", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        hasMissingMetrics: false,
        missingMetrics: [],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      expect(
        screen.queryByText(
          "Limited recommendation: required metrics are missing.",
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe("Export report button", () => {
    it("shows an enabled export button on the all-clusters view when export is allowed", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: ALL_CLUSTERS_ID,
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: ALL_CLUSTERS_ID,
        clusters: clusterData,
        canExportReport: true,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const downloadButton = within(
        screen.getByTestId("header-actions"),
      ).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "false");
    });

    it("enables export button when cluster has both hosts and VMs", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canExportReport: true,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "false");
    });

    it("disables export button when cluster has no hosts", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(0, 0), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canExportReport: false,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "true");
    });
  });

  describe("RVTools file append", () => {
    it("shows a success alert after files are appended to the assessment", async () => {
      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "rvtools",
        },
        canAppendRvtoolsFiles: true,
        rvtoolsAppendSuccessMessage:
          "RVTools files were added. Report metrics have been updated.",
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          "RVTools files were added. Report metrics have been updated.",
        ),
      ).toBeInTheDocument();
    });
  });
});
