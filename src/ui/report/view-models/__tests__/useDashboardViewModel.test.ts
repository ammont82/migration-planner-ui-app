import type {
  Host,
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDashboardViewModel } from "../useDashboardViewModel";

const emptyBreakdown: VMResourceBreakdown = {
  total: 0,
  totalForMigratable: 0,
  totalForMigratableWithWarnings: 0,
  totalForNotMigratable: 0,
};

const baseInfra: Infra = {
  clustersPerDatacenter: [1],
  hosts: [] as Host[],
  networks: [],
  datastores: [],
  totalHosts: 2,
  totalDatacenters: 1,
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
  nicCount: emptyBreakdown,
  migrationWarnings: [],
  notMigratableReasons: [],
  powerStates: {},
};

const clusterInventory: InventoryData = {
  infra: {
    ...baseInfra,
    totalHosts: 2,
    hosts: [{ vendor: "VMware", model: "ESXi", vmotionSupported: true }],
    datastores: [
      {
        type: "VMFS",
        totalCapacityGB: 0,
        freeCapacityGB: 0,
        vendor: "VMware",
        diskId: "disk-1",
        hardwareAcceleratedMove: false,
        protocolType: "scsi",
        model: "VMFS",
      },
    ],
  },
  vms: { ...baseVms, total: 5, diskTypes: {} },
  clusterFeatures: { drsEnabled: true, haEnabled: false },
};

describe("useDashboardViewModel", () => {
  it("builds summary and rows, and skips cluster details in aggregate view", () => {
    const { result } = renderHook(() =>
      useDashboardViewModel({
        infra: baseInfra,
        vcenterVersion: "7.0.3.0",
        vcenterId: "vc-1",
        clusters: { "cluster-a": clusterInventory },
        isAggregateView: true,
      }),
    );

    expect(result.current.infrastructureSummary.vmwareVersion).toBe(
      "vSphere 7.0.3",
    );
    expect(result.current.infrastructureSummary.esxiHosts).toBe(2);
    expect(result.current.clusterDetailRows).toHaveLength(1);
    expect(result.current.clusterDetailRows[0]?.id).toBe("cluster-a");
    expect(result.current.selectedClusterDetails).toBeUndefined();
  });

  it("overrides vCenter count for multi-RVTools aggregate view", () => {
    const { result } = renderHook(() =>
      useDashboardViewModel({
        infra: baseInfra,
        clusters: { "cluster-a": clusterInventory },
        isAggregateView: true,
        infrastructureVcenterCount: 2,
      }),
    );

    expect(result.current.infrastructureSummary.vCenters).toBe(2);
  });

  it("builds details for the selected cluster when not in aggregate view", () => {
    const { result } = renderHook(() =>
      useDashboardViewModel({
        infra: clusterInventory.infra,
        clusters: { "cluster-a": clusterInventory },
        isAggregateView: false,
      }),
    );

    expect(result.current.selectedClusterDetails).toMatchObject({
      hosts: 2,
      vms: 5,
      drs: "enabled",
      ha: "disabled",
    });
  });

  it("returns no selected cluster details when clusters are missing or empty", () => {
    const { result: missing } = renderHook(() =>
      useDashboardViewModel({
        infra: baseInfra,
        isAggregateView: false,
      }),
    );
    const { result: empty } = renderHook(() =>
      useDashboardViewModel({
        infra: baseInfra,
        clusters: {},
        isAggregateView: false,
      }),
    );

    expect(missing.current.selectedClusterDetails).toBeUndefined();
    expect(empty.current.clusterDetailRows).toEqual([]);
    expect(empty.current.selectedClusterDetails).toBeUndefined();
  });
});
