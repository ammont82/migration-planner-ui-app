import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { ALL_VMS_GROUP_ID } from "../groupViewModel";
import { resolveSubsetVcenterApiId } from "../resolveSubsetVcenterApiId";

describe("resolveSubsetVcenterApiId", () => {
  const subsets: AssessmentSubsetInventory[] = [
    {
      id: "subset-1",
      name: "VC A",
      vcenterId: "vc-api-id",
      vmsCount: 1,
      inventory: { vcenterId: "vc-api-id", clusters: {} },
      createdAt: new Date(),
    },
  ];

  it("returns undefined for all vCenters selection", () => {
    expect(
      resolveSubsetVcenterApiId(subsets, ALL_VMS_GROUP_ID),
    ).toBeUndefined();
  });

  it("prefers subset vcenterId for v2 API path", () => {
    expect(resolveSubsetVcenterApiId(subsets, "subset-1")).toBe("vc-api-id");
  });
});
