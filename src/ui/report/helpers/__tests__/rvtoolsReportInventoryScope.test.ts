import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { ALL_VMS_GROUP_ID } from "../groupViewModel";
import {
  resolveRvtoolsEffectiveVcenterSubsetId,
  resolveRvtoolsScopedVcenterApiId,
  rvtoolsSubsetInventoriesFromSnapshot,
} from "../rvtoolsReportInventoryScope";

const subset = (id: string, vcenterId: string): AssessmentSubsetInventory => ({
  id,
  name: id,
  vcenterId,
  vmsCount: 1,
  createdAt: new Date(),
  inventory: { vcenterId, clusters: {} },
});

describe("rvtoolsReportInventoryScope", () => {
  it("returns snapshot subsets only for rvtools source type", () => {
    const rows = [subset("a", "vc-1")];
    expect(rvtoolsSubsetInventoriesFromSnapshot("rvtools", rows)).toEqual(rows);
    expect(rvtoolsSubsetInventoriesFromSnapshot("source", rows)).toEqual([]);
  });

  it("auto-selects the only vCenter subset", () => {
    const subsets = [subset("s1", "vc-api-1")];
    expect(resolveRvtoolsEffectiveVcenterSubsetId(subsets, null)).toBe("s1");
    expect(
      resolveRvtoolsScopedVcenterApiId(
        subsets,
        resolveRvtoolsEffectiveVcenterSubsetId(subsets, null),
      ),
    ).toBe("vc-api-1");
  });

  it("requires explicit selection when multiple vCenters exist", () => {
    const subsets = [subset("s1", "vc-1"), subset("s2", "vc-2")];
    expect(resolveRvtoolsEffectiveVcenterSubsetId(subsets, null)).toBe(
      ALL_VMS_GROUP_ID,
    );
    expect(
      resolveRvtoolsScopedVcenterApiId(
        subsets,
        resolveRvtoolsEffectiveVcenterSubsetId(subsets, null),
      ),
    ).toBeUndefined();

    expect(resolveRvtoolsEffectiveVcenterSubsetId(subsets, "s2")).toBe("s2");
    expect(resolveRvtoolsScopedVcenterApiId(subsets, "s2")).toBe("vc-2");
  });
});
