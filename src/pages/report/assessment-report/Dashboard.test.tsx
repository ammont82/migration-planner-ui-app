import "@testing-library/jest-dom";

import type {
  Host,
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "./Dashboard";

// Mock heavy child components to keep tests lightweight
vi.mock("./ClustersOverview", () => ({
  ClustersOverview: (): JSX.Element => <div data-testid="clusters-overview" />,
}));
vi.mock("./CpuAndMemoryOverview", () => ({
  CpuAndMemoryOverview: (): JSX.Element => <div data-testid="cpu-memory" />,
}));
vi.mock("./StorageOverview", () => ({
  StorageOverview: (): JSX.Element => <div data-testid="storage" />,
}));
vi.mock("./NetworkOverview", () => ({
  NetworkOverview: (): JSX.Element => <div data-testid="network" />,
}));
vi.mock("./HostsOverview", () => ({
  HostsOverview: (): JSX.Element => <div data-testid="hosts" />,
}));
vi.mock("./VMMigrationStatus", () => ({
  VMMigrationStatus: (): JSX.Element => <div data-testid="vm-status" />,
}));
vi.mock("./OSDistribution", () => ({
  OSDistribution: (): JSX.Element => <div data-testid="os-distribution" />,
}));
vi.mock("./WarningsTable", () => ({
  WarningsTable: (): JSX.Element => <div data-testid="warnings" />,
}));
vi.mock("./ErrorTable", () => ({
  ErrorTable: (): JSX.Element => <div data-testid="errors" />,
}));

const emptyBreakdown: VMResourceBreakdown = {
  total: 0,
  totalForMigratable: 0,
  totalForMigratableWithWarnings: 0,
  totalForNotMigratable: 0,
};

const histogramBreakdown: VMResourceBreakdown = {
  ...emptyBreakdown,
  histogram: { data: [], minValue: 0, step: 1 },
};

const baseInfra: Infra = {
  clustersPerDatacenter: [],
  hosts: [] as Host[],
  networks: [],
  datastores: [],
  totalHosts: 0,
  hostPowerStates: {},
};

const baseVms: VMs = {
  os: { Linux: 1 },
  total: 2,
  totalMigratable: 1,
  distributionByCpuTier: {},
  distributionByMemoryTier: {},
  ramGB: emptyBreakdown,
  cpuCores: emptyBreakdown,
  diskGB: emptyBreakdown,
  diskCount: emptyBreakdown,
  diskSizeTier: {},
  diskTypes: {},
  nicCount: histogramBreakdown,
  migrationWarnings: [],
  notMigratableReasons: [],
  powerStates: {},
};

afterEach(() => cleanup());

describe("Dashboard", () => {
  it("shows aggregate tiles including clusters overview", () => {
    render(
      <Dashboard
        infra={baseInfra}
        vms={baseVms}
        cpuCores={baseVms.cpuCores}
        ramGB={baseVms.ramGB}
        clusters={
          {
            A: {
              infra: baseInfra,
              vms: { ...baseVms, total: 5 },
            },
          } satisfies Record<string, InventoryData>
        }
      />,
    );

    expect(screen.getByTestId("vm-status")).toBeInTheDocument();
    expect(screen.getByTestId("os-distribution")).toBeInTheDocument();
    expect(screen.getByTestId("cpu-memory")).toBeInTheDocument();
    expect(screen.getByTestId("storage")).toBeInTheDocument();
    expect(screen.getByTestId("clusters-overview")).toBeInTheDocument();
    expect(screen.getByTestId("hosts")).toBeInTheDocument();
    expect(screen.getByTestId("network")).toBeInTheDocument();
  });

  it("hides aggregate clusters overview when viewing a single cluster", () => {
    render(
      <Dashboard
        infra={baseInfra}
        vms={baseVms}
        cpuCores={baseVms.cpuCores}
        ramGB={baseVms.ramGB}
        clusters={
          {
            A: {
              infra: baseInfra,
              vms: { ...baseVms, total: 5 },
            },
          } satisfies Record<string, InventoryData>
        }
        isAggregateView={false}
      />,
    );

    expect(screen.queryByTestId("clusters-overview")).toBeNull();
    expect(screen.getByTestId("cpu-memory")).toBeInTheDocument();
    expect(screen.getByTestId("storage")).toBeInTheDocument();
  });

  it("shows empty message when cluster data is missing", () => {
    render(
      <Dashboard
        infra={baseInfra}
        vms={baseVms}
        cpuCores={baseVms.cpuCores}
        ramGB={baseVms.ramGB}
        clusters={{} as Record<string, InventoryData>}
        isAggregateView={false}
        clusterFound={false}
      />,
    );

    expect(
      screen.getByText(/No data is available for the selected cluster/),
    ).toBeInTheDocument();
  });
});
