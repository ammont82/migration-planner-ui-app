import type {
  AssessmentVCenterV2,
  Infra,
  InventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import {
  buildClustersMapForOptions,
  clusterIdsFromVcenterV2,
  vcenterV2ToReportSource,
} from "../assessmentV2Inventory";

describe("assessmentV2Inventory", () => {
  const vcenter: AssessmentVCenterV2 = {
    data: {
      id: "vc-1",
      vcenterVersion: "8.0.3.0",
      data: {
        infra: { totalHosts: 2 } as Infra,
        vms: { total: 10 } as VMs,
      },
    },
    clusters: [{ id: "cluster-a" }, { id: "cluster-b" }],
  };

  it("maps vCenter v2 payload to report inventory source", () => {
    const source = vcenterV2ToReportSource(vcenter, {
      "cluster-a": { vms: { total: 4 } as VMs } as InventoryData,
    });

    expect(source.vcenterId).toBe("vc-1");
    expect(source.vcenterVersion).toBe("8.0.3.0");
    expect(source.vms?.total).toBe(10);
    expect(source.clusters?.["cluster-a"]?.vms?.total).toBe(4);
  });

  it("extracts cluster ids from vCenter v2 response", () => {
    expect(clusterIdsFromVcenterV2(vcenter)).toEqual([
      "cluster-a",
      "cluster-b",
    ]);
  });

  it("builds cluster map with placeholders for unloaded clusters", () => {
    const map = buildClustersMapForOptions(["cluster-a", "cluster-b"], {
      "cluster-a": { vms: { total: 1 } as VMs } as InventoryData,
    });

    expect(map["cluster-a"]?.vms?.total).toBe(1);
    expect(map["cluster-b"]).toEqual({});
  });
});
