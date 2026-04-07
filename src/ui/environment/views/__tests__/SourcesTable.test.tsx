import "@testing-library/jest-dom";

import type {
  Agent,
  Inventory,
  Source,
} from "@openshift-migration-advisor/planner-sdk";
import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSourceModel,
  type SourceModel,
} from "../../../../models/SourceModel";
import type { EnvironmentPageViewModel } from "../../view-models/useEnvironmentPageViewModel";
import { SourcesTable } from "../SourcesTable";

// ---------------------------------------------------------------------------
// Mock the environment page context
// ---------------------------------------------------------------------------

let mockVm: EnvironmentPageViewModel;

vi.mock("../../view-models/EnvironmentPageContext", () => ({
  useEnvironmentPage: () => mockVm,
}));

vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }): React.ReactElement => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../core/components/VCenterSetupInstructions", () => ({
  VCenterSetupInstructions: (): React.ReactElement => (
    <div data-testid="vcenter-setup-instructions" />
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date();

const makeAgent = (
  overrides: Partial<Agent> & Pick<Agent, "status">,
): Agent => ({
  id: `agent-${overrides.status}`,
  statusInfo: "",
  credentialUrl: "",
  createdAt: now,
  updatedAt: now,
  version: "1.4.0",
  ...overrides,
});

const SAMPLE_INVENTORY: Inventory = {
  vcenterId: "vcenter-stub-1",
  clusters: {},
  vcenter: {
    vms: {
      total: 142,
      totalMigratable: 118,
      cpuCores: {
        total: 576,
        totalForMigratable: 480,
        totalForMigratableWithWarnings: 24,
        totalForNotMigratable: 72,
      },
      ramGB: {
        total: 2048,
        totalForMigratable: 1720,
        totalForMigratableWithWarnings: 96,
        totalForNotMigratable: 232,
      },
      diskGB: {
        total: 51200,
        totalForMigratable: 44800,
        totalForMigratableWithWarnings: 2400,
        totalForNotMigratable: 4000,
      },
      diskCount: {
        total: 284,
        totalForMigratable: 236,
        totalForMigratableWithWarnings: 12,
        totalForNotMigratable: 36,
      },
      powerStates: { poweredOn: 130, poweredOff: 10, suspended: 2 },
      notMigratableReasons: [],
      migrationWarnings: [],
    },
    infra: {
      totalHosts: 8,
      hostPowerStates: {},
      networks: [{ name: "VM Network" }, { name: "Management" }] as never[],
      datastores: [
        { name: "datastore1" },
        { name: "datastore2" },
        { name: "datastore3" },
      ] as never[],
    },
  },
};

const makeSource = (
  overrides: Partial<Source> & Pick<Source, "id" | "name">,
): SourceModel =>
  createSourceModel({
    createdAt: now,
    updatedAt: now,
    onPremises: false,
    ...overrides,
  } as Source);

const ALL_STATUS_SOURCES: SourceModel[] = [
  // 1. Not connected — no agent → "OVA downloading"
  makeSource({
    id: "src-ova-downloading",
    name: "Lab vCenter (OVA downloading)",
  }),

  // 2. Uploaded manually — no agent, onPremises with inventory
  makeSource({
    id: "src-uploaded-manually",
    name: "On-prem vCenter (uploaded)",
    onPremises: true,
    inventory: SAMPLE_INVENTORY,
  }),

  // 3. Waiting for credentials
  makeSource({
    id: "src-waiting-creds",
    name: "Staging vCenter (waiting creds)",
    agent: makeAgent({
      status: "waiting-for-credentials",
      credentialUrl: "https://192.168.1.50:3333",
    }),
  }),

  // 4. Gathering initial inventory
  makeSource({
    id: "src-gathering",
    name: "QA vCenter (gathering inventory)",
    agent: makeAgent({ status: "gathering-initial-inventory" }),
  }),

  // 5. Error
  makeSource({
    id: "src-error",
    name: "Dev vCenter (error)",
    agent: makeAgent({
      status: "error",
      statusInfo:
        "Connection refused: unable to reach vCenter at 10.0.0.5:443",
    }),
  }),

  // 6. Ready — agent version up to date
  makeSource({
    id: "src-up-to-date",
    name: "Production vCenter (up to date)",
    agent: makeAgent({ status: "up-to-date" }),
    inventory: SAMPLE_INVENTORY,
  }),

  // 7. Ready — agent version outdated
  makeSource({
    id: "src-outdated",
    name: "Legacy vCenter (outdated agent)",
    agent: makeAgent({ status: "up-to-date", version: "1.2.0" }),
    inventory: SAMPLE_INVENTORY,
    agentVersion: "1.2.0",
    agentVersionWarning:
      "Agent version 1.2.0 is outdated. Please redeploy the OVA to upgrade to 1.4.0.",
  }),
];

// ---------------------------------------------------------------------------
// VM stub
// ---------------------------------------------------------------------------

function makeBaseVm(
  overrides: Partial<EnvironmentPageViewModel> = {},
): EnvironmentPageViewModel {
  return {
    sources: ALL_STATUS_SOURCES,
    assessments: [],

    sourceSelected: null,
    selectSource: vi.fn(),
    selectSourceById: vi.fn(),
    getSourceById: vi.fn(),

    listSources: vi.fn().mockResolvedValue([]),
    isLoadingSources: false,
    hasInitialLoad: true,

    deleteSource: vi.fn().mockResolvedValue({}),
    isDeletingSource: false,

    createDownloadSource: vi.fn().mockResolvedValue(undefined),
    isDownloadingSource: false,
    downloadSourceUrl: "",
    setDownloadUrl: vi.fn(),
    sourceCreatedId: null,
    deleteSourceCreated: vi.fn(),

    updateSource: vi.fn().mockResolvedValue(undefined),
    isUpdatingSource: false,

    uploadInventoryFromFile: vi.fn(),
    isUpdatingInventory: false,
    inventoryUploadResult: null,
    clearInventoryUploadResult: vi.fn(),

    getDownloadUrlForSource: vi.fn(),

    listAssessments: vi.fn().mockResolvedValue([]),
    isLoadingAssessments: false,

    assessmentFromAgentState: false,
    setAssessmentFromAgent: vi.fn(),
    clearErrors: vi.fn(),

    deleteAndRefresh: vi.fn().mockResolvedValue([]),
    isDeletingAndRefreshing: false,
    refreshOnFocus: vi.fn().mockResolvedValue(undefined),

    startPolling: vi.fn(),
    stopPolling: vi.fn(),
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

describe("SourcesTable — all status states", () => {
  beforeEach(() => {
    mockVm = makeBaseVm();
  });

  it("renders a row for every source", () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    const table = screen.getByRole("grid", { name: "Sources table" });
    const rows = within(table).getAllByRole("row");
    // header row + 7 data rows
    expect(rows).toHaveLength(1 + ALL_STATUS_SOURCES.length);
  });

  // --- Discovery VM Status column -----------------------------------------

  it('shows "Not connected" for a source with no agent', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it('shows "Uploaded manually" for an on-premises source with inventory', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Uploaded manually")).toBeInTheDocument();
  });

  it('shows "Waiting for credentials" status', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Waiting for credentials")).toBeInTheDocument();
  });

  it('shows "Gathering inventory" status', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Gathering inventory")).toBeInTheDocument();
  });

  it('shows "Error" status', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it('shows "Ready" for up-to-date sources', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    const readyLabels = screen.getAllByText("Ready");
    // Two sources with up-to-date status (current + outdated agent)
    expect(readyLabels).toHaveLength(2);
  });

  // --- Agent version column -----------------------------------------------

  it('shows "Downloading OVA" when agent is not connected and not uploaded manually', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Downloading OVA")).toBeInTheDocument();
  });

  it('shows "-" for the agent version of an uploaded-manually source', () => {
    mockVm = makeBaseVm({
      sources: [
        makeSource({
          id: "src-uploaded-only",
          name: "Uploaded only",
          onPremises: true,
          inventory: SAMPLE_INVENTORY,
        }),
      ],
    });

    render(<SourcesTable onAddEnvironment={vi.fn()} />);

    const table = screen.getByRole("grid", { name: "Sources table" });
    const dataRow = within(table).getAllByRole("row")[1];
    const cells = within(dataRow).getAllByRole("cell");
    // Agent version is the 3rd column (index 2)
    expect(cells[2]).toHaveTextContent("-");
  });

  it('shows "Up to date" in the agent version column for sources with a current agent', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    // waiting-for-credentials, gathering-initial-inventory, error, and
    // up-to-date (without warning) all show "Up to date" in the version column
    const upToDateLabels = screen.getAllByText("Up to date");
    expect(upToDateLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Outdated" in the agent version column when agentVersionWarning is set', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(screen.getByText("Outdated")).toBeInTheDocument();
  });

  // --- Inventory data columns ---------------------------------------------

  it("shows inventory counts for a source with inventory", () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);

    const table = screen.getByRole("grid", { name: "Sources table" });
    const rows = within(table).getAllByRole("row");

    // Sources are sorted by id. Find the row for "Production vCenter"
    const readyRow = rows.find((row) =>
      within(row)
        .queryByText("Production vCenter (up to date)")
    );
    expect(readyRow).toBeDefined();

    expect(within(readyRow!).getByText("8")).toBeInTheDocument(); // hosts
    expect(within(readyRow!).getByText("142")).toBeInTheDocument(); // VMs
    expect(within(readyRow!).getByText("2")).toBeInTheDocument(); // networks
    expect(within(readyRow!).getByText("3")).toBeInTheDocument(); // datastores
  });

  it('shows "-" for inventory columns when no inventory is available', () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);

    const table = screen.getByRole("grid", { name: "Sources table" });
    const rows = within(table).getAllByRole("row");

    // Find the row for "Lab vCenter (OVA downloading)" — no inventory
    const ovaRow = rows.find((row) =>
      within(row)
        .queryByText("Lab vCenter (OVA downloading)")
    );
    expect(ovaRow).toBeDefined();

    const cells = within(ovaRow!).getAllByRole("cell");
    // Hosts (index 3), VMs (4), Networks (5), Datastores (6) should all be "-"
    expect(cells[3]).toHaveTextContent("-");
    expect(cells[4]).toHaveTextContent("-");
    expect(cells[5]).toHaveTextContent("-");
    expect(cells[6]).toHaveTextContent("-");
  });

  // --- Empty state --------------------------------------------------------

  it("renders empty state when there are no sources", () => {
    mockVm = makeBaseVm({ sources: [] });
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    expect(
      screen.queryByRole("grid", { name: "Sources table" }),
    ).not.toBeInTheDocument();
  });

  // --- Source names -------------------------------------------------------

  it("renders the name of each source in the table", () => {
    render(<SourcesTable onAddEnvironment={vi.fn()} />);
    for (const source of ALL_STATUS_SOURCES) {
      expect(screen.getByText(source.name)).toBeInTheDocument();
    }
  });
});
