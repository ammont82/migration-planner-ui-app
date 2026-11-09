import type { InventoryData } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import {
  ALL_CLUSTERS_ID,
  getClusterOptions,
  resolveSelectedClusterId,
  toApiClusterId,
} from "../clusterViewModel";

const clusterMap: Record<string, InventoryData> = {
  "cluster-a": { vms: { total: 0 }, infra: { totalHosts: 0 } } as InventoryData,
};

describe("toApiClusterId", () => {
  it("maps All vSphere clusters to an empty clusterId for the vCenter aggregate", () => {
    expect(toApiClusterId(ALL_CLUSTERS_ID)).toBe("");
  });

  it("passes through a real cluster id", () => {
    expect(toApiClusterId("domain-c8")).toBe("domain-c8");
  });
});

describe("resolveSelectedClusterId", () => {
  it("defaults to All vSphere clusters when nothing is selected", () => {
    expect(resolveSelectedClusterId(null, clusterMap)).toBe(ALL_CLUSTERS_ID);
  });

  it("keeps an explicit cluster selection when it exists in the map", () => {
    expect(resolveSelectedClusterId("cluster-a", clusterMap)).toBe("cluster-a");
  });

  it("falls back to All vSphere clusters when the selection is stale", () => {
    expect(resolveSelectedClusterId("missing", clusterMap)).toBe(
      ALL_CLUSTERS_ID,
    );
  });
});

describe("getClusterOptions", () => {
  it("puts All vSphere clusters first", () => {
    expect(getClusterOptions()[0]).toEqual({
      id: ALL_CLUSTERS_ID,
      label: "All vSphere clusters",
    });
  });
});
