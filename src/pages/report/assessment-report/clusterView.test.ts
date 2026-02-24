import type {
  Host,
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { buildClusterViewModel } from "./clusterView";

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

const baseInfra: Infra = {
  clustersPerDatacenter: [],
  hosts: [] as Host[],
  totalHosts: 0,
  hostPowerStates: {},
  networks: [],
  datastores: [],
};
const baseVms: VMs = {
  os: { Linux: 1 },
  total: 2,
  totalMigratable: 1,
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
};

describe("buildClusterViewModel", () => {
  it("returns aggregate view when no cluster is selected", () => {
    const model = buildClusterViewModel({
      infra: baseInfra,
      vms: baseVms,
      clusters: {
        "Cluster A": { infra: baseInfra, vms: baseVms },
      },
    });

    expect(model.isAggregateView).toBe(true);
    expect(model.selectionId).toBe("all");
    expect(model.selectionLabel).toBe("All clusters");
    expect(model.viewInfra).toBe(baseInfra);
    expect(model.viewVms).toBe(baseVms);
    expect(
      model.clusterOptions.find((opt) => opt.id === "Cluster A"),
    ).toBeTruthy();
  });

  it("returns scoped view when a valid cluster is selected", () => {
    const clusters: Record<string, InventoryData> = {
      "Cluster B": {
        infra: {
          hosts: [] as Host[],
          clustersPerDatacenter: [],
          totalHosts: 2,
          hostPowerStates: {},
          networks: [],
          datastores: [],
        },
        vms: {
          total: 10,
          totalMigratable: 10,
          os: { Linux: 10 },
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
        },
      },
    };

    const model = buildClusterViewModel({
      infra: baseInfra,
      vms: baseVms,
      clusters,
      selectedClusterId: "Cluster B",
    });

    expect(model.isAggregateView).toBe(false);
    expect(model.selectionLabel).toBe("Cluster B");
    expect(model.viewInfra).toEqual(clusters["Cluster B"].infra);
    expect(model.viewVms).toEqual(clusters["Cluster B"].vms);
    expect(model.viewClusters).toEqual({ "Cluster B": clusters["Cluster B"] });
    expect(model.clusterFound).toBe(true);
  });

  it("marks cluster as missing when entry is undefined", () => {
    const clusters = {
      "Cluster C": undefined,
    } as unknown as Record<string, InventoryData>;
    const model = buildClusterViewModel({
      infra: baseInfra,
      vms: baseVms,
      clusters,
      selectedClusterId: "Cluster C",
    });

    expect(model.isAggregateView).toBe(false);
    expect(model.clusterFound).toBe(false);
    expect(model.viewInfra).toBeUndefined();
    expect(model.viewVms).toBeUndefined();
  });

  it("returns cluster options with 'All clusters' first followed by cluster keys", () => {
    const clusters = {
      "Cluster A": { infra: baseInfra, vms: baseVms },
      "Cluster B": { infra: baseInfra, vms: baseVms },
    };

    const model = buildClusterViewModel({
      infra: baseInfra,
      vms: baseVms,
      clusters,
      selectedClusterId: "all",
    });

    expect(model.clusterOptions[0].id).toBe("all");
    expect(model.clusterOptions[0].label).toBe("All clusters");
    expect(model.clusterOptions[1].id).toBe("Cluster A");
    expect(model.clusterOptions[2].id).toBe("Cluster B");
  });
});
