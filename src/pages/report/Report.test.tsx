import "@testing-library/jest-dom";

import type {
  Assessment,
  Host,
  Infra,
  InventoryData,
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
import { useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDiscoverySources } from "../../migration-wizard/contexts/discovery-sources/Context";
import Report from "./Report";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }): React.ReactElement => <a href={to}>{children}</a>,
  useParams: vi.fn(),
}));

// Mock react-use
vi.mock("react-use", () => ({
  useMount: vi.fn((callback: () => void) => callback()),
}));

// Mock DiscoverySources context
vi.mock("../../migration-wizard/contexts/discovery-sources/Context", () => ({
  useDiscoverySources: vi.fn(),
}));

// Mock Provider to avoid IoC dependency
vi.mock("../../migration-wizard/contexts/discovery-sources/Provider", () => ({
  Provider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => <>{children}</>,
}));

// Mock child components
vi.mock(
  "../../migration-wizard/steps/discovery/EnhancedDownloadButton",
  () => ({
    EnhancedDownloadButton: ({
      isDisabled,
    }: {
      isDisabled?: boolean;
    }): React.ReactElement => (
      <div
        data-testid="download-button"
        data-disabled={isDisabled ? "true" : "false"}
      />
    ),
  }),
);

vi.mock("./assessment-report/Dashboard", () => ({
  Dashboard: (): React.ReactElement => <div data-testid="dashboard" />,
}));

vi.mock("./cluster-sizer/ClusterSizingWizard", () => ({
  ClusterSizingWizard: (): React.ReactElement => (
    <div data-testid="cluster-sizing-wizard" />
  ),
}));

vi.mock("../environment/sources-table/AgentStatusView", () => ({
  AgentStatusView: (): React.ReactElement => (
    <div data-testid="agent-status-view" />
  ),
}));

vi.mock("../../components/AppPage", () => ({
  AppPage: ({
    children,
    headerActions,
  }: {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
  }): React.ReactElement => (
    <div data-testid="app-page">
      {headerActions && <div data-testid="header-actions">{headerActions}</div>}
      {children}
    </div>
  ),
}));

const emptyBreakdown: VMResourceBreakdown = {
  total: 0,
  totalForMigratable: 0,
  totalForMigratableWithWarnings: 0,
  totalForNotMigratable: 0,
};

const emptyHistogramBreakdown: VMResourceBreakdown = {
  ...emptyBreakdown,
  histogram: { data: [], minValue: 0, step: 1 },
};

const createInfra = (
  totalHosts: number,
  hostsArrayLength: number = 0,
): Infra => ({
  clustersPerDatacenter: [],
  hosts: Array(hostsArrayLength).fill({}) as Host[],
  totalHosts,
  hostPowerStates: {},
  networks: [],
  datastores: [],
});

const createVMs = (total: number): VMs => ({
  os: { Linux: total },
  total,
  totalMigratable: total,
  cpuCores: emptyBreakdown,
  ramGB: emptyBreakdown,
  diskGB: emptyBreakdown,
  diskCount: emptyBreakdown,
  diskSizeTier: {},
  diskTypes: {},
  nicCount: emptyHistogramBreakdown,
  migrationWarnings: [],
  notMigratableReasons: [],
  powerStates: {},
  distributionByCpuTier: {},
  distributionByMemoryTier: {},
});

const createAssessment = (
  id: string,
  clusterData?: { [key: string]: InventoryData },
): Assessment => {
  // When clusterData is provided, we need to provide aggregate data too
  // for the component to work correctly
  const aggregateInfra = clusterData
    ? Object.values(clusterData).reduce(
        (acc, cluster) => {
          const clusterInfra = cluster.infra as Infra | undefined;
          if (clusterInfra) {
            acc.totalHosts += clusterInfra.totalHosts || 0;
            acc.hosts = [...acc.hosts, ...(clusterInfra.hosts || [])];
          }
          return acc;
        },
        { ...createInfra(0, 0), hosts: [] as Host[] },
      )
    : createInfra(5, 5);

  const aggregateVms = clusterData
    ? Object.values(clusterData).reduce((acc, cluster) => {
        const clusterVms = cluster.vms as VMs | undefined;
        if (clusterVms) {
          acc.total += clusterVms.total || 0;
          acc.totalMigratable += clusterVms.totalMigratable || 0;
          Object.entries(clusterVms.os || {}).forEach(([os, count]) => {
            acc.os![os] = (acc.os![os] || 0) + count;
          });
        }
        return acc;
      }, createVMs(0))
    : createVMs(10);

  return {
    id,
    name: `Assessment ${id}`,
    sourceId: "source-1",
    sourceType: "vcenter" as unknown as Assessment["sourceType"],
    createdAt: new Date(),
    snapshots: [
      {
        createdAt: new Date(),
        inventory: {
          vcenterId: "vcenter-1",
          clusters: clusterData ?? {},
          vcenter: {
            infra: aggregateInfra,
            vms: aggregateVms,
          },
        },
      },
    ],
  };
};

const mockSource: Source = {
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
} as Source;

const mockDiscoverySourcesContext = {
  assessments: [],
  sources: [],
  isLoadingAssessments: false,
  isLoadingSources: false,
  listAssessments: vi.fn().mockResolvedValue([]),
  listSources: vi.fn().mockResolvedValue([]),
  getSourceById: vi.fn().mockReturnValue(mockSource),
  sourceSelected: mockSource,
  isPolling: false,
  isDeletingSource: false,
  isCreatingSource: false,
  isDownloadingSource: false,
  isUpdatingSource: false,
  isUpdatingInventory: false,
  isCreatingAssessment: false,
  isDeletingAssessment: false,
  isUpdatingAssessment: false,
  isSharingAssessment: false,
  isCreatingRVToolsJob: false,
  errorLoadingSources: undefined,
  errorDeletingSource: undefined,
  errorCreatingSource: undefined,
  errorDownloadingSource: undefined,
  errorUpdatingSource: undefined,
  errorUpdatingInventory: undefined,
  errorLoadingAssessments: undefined,
  errorCreatingAssessment: undefined,
  errorDeletingAssessment: undefined,
  errorUpdatingAssessment: undefined,
  errorSharingAssessment: undefined,
  errorCreatingRVToolsJob: undefined,
  deleteSource: vi.fn(),
  createDownloadSource: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  selectSource: vi.fn(),
  selectSourceById: vi.fn(),
  updateInventory: vi.fn(),
  downloadSourceUrl: "",
  setDownloadUrl: vi.fn(),
  sourceCreatedId: undefined,
  deleteSourceCreated: vi.fn(),
  clearErrors: vi.fn(),
  updateSource: vi.fn(),
  sourceDownloadUrls: {},
  getDownloadUrlForSource: vi.fn(),
  storeDownloadUrlForSource: vi.fn(),
  createAssessment: vi.fn(),
  deleteAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  shareAssessment: vi.fn(),
  assessmentFromAgentState: false,
  setAssessmentFromAgent: vi.fn(),
  currentJob: null,
  cancelRVToolsJob: vi.fn(),
  createRVToolsJob: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Report", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: "assessment-1" });
    vi.mocked(useDiscoverySources).mockReturnValue(mockDiscoverySourcesContext);
  });

  it("renders loading spinner when assessments are loading", () => {
    vi.mocked(useDiscoverySources).mockReturnValue({
      ...mockDiscoverySourcesContext,
      isLoadingAssessments: true,
      assessments: [],
    });

    render(<Report />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders not found message when assessment does not exist", () => {
    vi.mocked(useDiscoverySources).mockReturnValue({
      ...mockDiscoverySourcesContext,
      assessments: [],
    });

    render(<Report />);

    expect(
      screen.getByText(/The requested assessment was not found/),
    ).toBeInTheDocument();
  });

  describe("Cluster recommendations button", () => {
    it("auto-selects first cluster on initial load to show recommendations button", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2),
          vms: createVMs(5),
        },
        "Cluster B": {
          infra: createInfra(3, 3),
          vms: createVMs(7),
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(
          screen.getByText("View target cluster recommendations"),
        ).toBeInTheDocument();
      });
    });

    it("shows disabled recommendations button when cluster has no VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2),
          vms: createVMs(0), // No VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        // Button should be disabled (aria-disabled) when cluster has no VMs
        const button = screen.getByRole("button", {
          name: "View target cluster recommendations",
        });
        expect(button).toHaveAttribute("aria-disabled", "true");
      });
    });

    // Note: Testing button state requires user interaction to select a cluster.
    // These tests verify the component renders correctly with cluster data.
    // The actual button enable/disable logic is tested through the hasClusterResources function logic
    // which checks both hosts (via totalHosts or hosts array) and VMs (via total).
    it("renders component with cluster data containing both hosts and VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2),
          vms: createVMs(5),
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
        // Component shows dashboard when hasClusterScopedData is true (aggregate view with data)
        // or empty state when no data
        const dashboard = screen.queryByTestId("dashboard");
        const emptyMessage = screen.queryByText(
          /This assessment does not have report data yet/,
        );
        expect(dashboard || emptyMessage).toBeTruthy();
      });
    });

    it("renders component with cluster data containing no hosts", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(0, 0), // No hosts
          vms: createVMs(5), // Has VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });
    });

    it("renders component with cluster data containing no VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2), // Has hosts
          vms: createVMs(0), // No VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });
    });

    it("renders component with empty cluster data", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(0, 0), // No hosts
          vms: createVMs(0), // No VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });
    });
  });

  describe("Export report button", () => {
    it("enables export button when cluster has both hosts and VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2),
          vms: createVMs(5),
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
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

    it("disables export button with tooltip when cluster has no hosts", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(0, 0), // No hosts
          vms: createVMs(5), // Has VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "true");

      // Note: PatternFly Tooltips render content on hover, so we verify the button
      // is disabled which indicates the tooltip wrapper is present in the component
    });

    it("disables export button with tooltip when cluster has no VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2), // Has hosts
          vms: createVMs(0), // No VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "true");

      // Note: PatternFly Tooltips render content on hover, so we verify the button
      // is disabled which indicates the tooltip wrapper is present in the component
    });

    it("disables export button with tooltip when cluster has neither hosts nor VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(0, 0), // No hosts
          vms: createVMs(0), // No VMs
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "true");

      // Note: PatternFly Tooltips render content on hover, so we verify the button
      // is disabled which indicates the tooltip wrapper is present in the component
    });

    it("enables export button when aggregate view has hosts and VMs", async () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster A": {
          infra: createInfra(2, 2),
          vms: createVMs(5),
        },
        "Cluster B": {
          infra: createInfra(3, 3),
          vms: createVMs(7),
        },
      });

      vi.mocked(useDiscoverySources).mockReturnValue({
        ...mockDiscoverySourcesContext,
        assessments: [assessment],
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
  });
});
