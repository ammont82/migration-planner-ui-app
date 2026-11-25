import type {
  Infra,
  InventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import {
  canExportAssessmentReport,
  hasClusterResourcesForExport,
} from "../reportExportEligibility";

const createInfra = (totalHosts: number): Infra => ({ totalHosts }) as Infra;

const createVMs = (total: number): VMs => ({ total }) as VMs;

describe("reportExportEligibility", () => {
  it("requires hosts and VMs for a single scoped view", () => {
    expect(hasClusterResourcesForExport(createInfra(2), createVMs(5))).toBe(
      true,
    );
    expect(hasClusterResourcesForExport(createInfra(0), createVMs(5))).toBe(
      false,
    );
  });

  it("counts RVTools hostPowerStates when hosts list is empty", () => {
    const rvtoolsInfra = {
      totalHosts: 0,
      hosts: [],
      hostPowerStates: { unknown: 20 },
    } as unknown as Infra;

    expect(hasClusterResourcesForExport(rvtoolsInfra, createVMs(1500))).toBe(
      true,
    );
    expect(
      canExportAssessmentReport({
        viewInfra: rvtoolsInfra,
        viewVms: createVMs(1500),
      }),
    ).toBe(true);
  });

  it("allows export when embedded snapshot clusters have host inventory", () => {
    expect(
      canExportAssessmentReport({
        viewInfra: createInfra(0),
        viewVms: createVMs(10),
        scopedClusters: {
          "cluster-api": {} as InventoryData,
        },
        embeddedClusterMaps: [
          {
            "domain-c7": {
              infra: createInfra(2),
              vms: createVMs(10),
            },
          },
        ],
      }),
    ).toBe(true);
  });
});
