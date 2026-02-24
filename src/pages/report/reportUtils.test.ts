import type { Host, Infra, VMs } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

// Extract the logic from Report.tsx for testing
const hasClusterResources = (viewInfra?: Infra, viewVms?: VMs): boolean => {
  const hasHosts =
    (viewInfra?.totalHosts ?? 0) > 0 || (viewInfra?.hosts?.length ?? 0) > 0;
  const hasVms = (viewVms?.total ?? 0) > 0;
  return hasHosts && hasVms;
};

describe("hasClusterResources", () => {
  it("returns true when cluster has both hosts and VMs", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [{ model: "ESXi-1" }] as Host[],
      totalHosts: 2,
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: { Linux: 5 },
      total: 5,
      totalMigratable: 5,
      cpuCores: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 100,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 500,
        totalForMigratable: 500,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(true);
  });

  it("returns false when cluster has no hosts", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [],
      totalHosts: 0,
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: { Linux: 5 },
      total: 5,
      totalMigratable: 5,
      cpuCores: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 100,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 500,
        totalForMigratable: 500,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(false);
  });

  it("returns false when cluster has no VMs", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [{ model: "ESXi-1" }] as Host[],
      totalHosts: 2,
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: {},
      total: 0,
      totalMigratable: 0,
      cpuCores: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(false);
  });

  it("returns false when cluster has neither hosts nor VMs", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [],
      totalHosts: 0,
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: {},
      total: 0,
      totalMigratable: 0,
      cpuCores: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 0,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(false);
  });

  it("returns true when cluster has hosts via hosts array even if totalHosts is 0", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [{ model: "ESXi-1" }] as Host[],
      totalHosts: 0, // totalHosts is 0 but hosts array has items
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: { Linux: 5 },
      total: 5,
      totalMigratable: 5,
      cpuCores: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 100,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 500,
        totalForMigratable: 500,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(true);
  });

  it("returns true when cluster has hosts via totalHosts even if hosts array is empty", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [], // hosts array is empty
      totalHosts: 2, // but totalHosts > 0
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    const vms: VMs = {
      os: { Linux: 5 },
      total: 5,
      totalMigratable: 5,
      cpuCores: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 100,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 500,
        totalForMigratable: 500,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(infra, vms)).toBe(true);
  });

  it("returns false when infra is undefined", () => {
    const vms: VMs = {
      os: { Linux: 5 },
      total: 5,
      totalMigratable: 5,
      cpuCores: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      ramGB: {
        total: 100,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskGB: {
        total: 500,
        totalForMigratable: 500,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      diskSizeTier: {},
      diskTypes: {},
      nicCount: {
        total: 10,
        totalForMigratable: 10,
        totalForMigratableWithWarnings: 0,
        totalForNotMigratable: 0,
      },
      migrationWarnings: [],
      notMigratableReasons: [],
      powerStates: {},
      distributionByCpuTier: {},
      distributionByMemoryTier: {},
    };

    expect(hasClusterResources(undefined, vms)).toBe(false);
  });

  it("returns false when vms is undefined", () => {
    const infra: Infra = {
      clustersPerDatacenter: [],
      hosts: [{ model: "ESXi-1" }] as Host[],
      totalHosts: 2,
      hostPowerStates: {},
      networks: [],
      datastores: [],
    };

    expect(hasClusterResources(infra, undefined)).toBe(false);
  });

  it("returns false when both infra and vms are undefined", () => {
    expect(hasClusterResources(undefined, undefined)).toBe(false);
  });
});
