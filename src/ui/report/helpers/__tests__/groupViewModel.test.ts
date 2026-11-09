import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import {
  ALL_VMS_GROUP_ID,
  buildGroupViewModel,
  computeClusterSelectDisabled,
  getSubsetInventoryLabel,
} from "../groupViewModel";

const createSubset = (
  overrides: Partial<AssessmentSubsetInventory> = {},
): AssessmentSubsetInventory => ({
  id: "group-1",
  name: "Group 1",
  vcenterId: "vcenter-1",
  vmsCount: 350,
  createdAt: new Date(),
  inventory: {
    vcenterId: "vcenter-1",
    clusters: {},
  },
  ...overrides,
});

describe("buildGroupViewModel", () => {
  it("hides the group filter when no subset inventories exist", () => {
    const model = buildGroupViewModel({ subsetInventories: [] });

    expect(model.showGroupFilter).toBe(false);
    expect(model.groupSelectDisabled).toBe(true);
    expect(model.selectionLabel).toBe("All VMs");
  });

  it("returns All VMs plus subset options sorted by API order", () => {
    const model = buildGroupViewModel({
      subsetInventories: [
        createSubset({ id: "group-1", name: "Group 1", vmsCount: 350 }),
        createSubset({ id: "group-2", name: "Group 2", vmsCount: 180 }),
      ],
    });

    expect(model.showGroupFilter).toBe(true);
    expect(model.groupOptions).toEqual([
      { id: "all", label: "All VMs" },
      { id: "group-1", label: "Group (350 VMs)" },
      { id: "group-2", label: "Group (180 VMs)" },
    ]);
  });

  it("falls back to All VMs when the selected group is invalid", () => {
    const model = buildGroupViewModel({
      subsetInventories: [createSubset()],
      selectedGroupId: "missing-group",
    });

    expect(model.selectionId).toBe("all");
    expect(model.selectionLabel).toBe("All VMs");
  });

  it("uses vCenter labels when labelMode is vcenter", () => {
    const model = buildGroupViewModel({
      labelMode: "vcenter",
      subsetInventories: [
        createSubset({ id: "group-1", name: "Group 1", vmsCount: 350 }),
      ],
    });

    expect(model.groupOptions[0].label).toBe("All vCenters");
    expect(model.groupOptions[1].label).toBe("Group 1");
  });
});

describe("getSubsetInventoryLabel", () => {
  it("uses the subset name when present", () => {
    expect(
      getSubsetInventoryLabel({
        ...createSubset({ name: "VC East" }),
      }),
    ).toBe("VC East");
  });

  it("falls back to vCenter version when name is empty", () => {
    expect(
      getSubsetInventoryLabel({
        ...createSubset({ name: "" }),
        inventory: {
          vcenterId: "502d878c-af91-4a6f-93e9-61c4a1986172",
          vcenterVersion: "8.0.3.0",
          clusters: {},
        },
      }),
    ).toBe("vCenter 8.0.3.0");
  });

  it("falls back to vcenterId when name and version are missing", () => {
    expect(
      getSubsetInventoryLabel({
        ...createSubset({ name: "  " }),
        vcenterId: "502d878c-af91-4a6f-93e9-61c4a1986172",
        inventory: {
          vcenterId: "502d878c-af91-4a6f-93e9-61c4a1986172",
          clusters: {},
        },
      }),
    ).toBe("502d878c-af91-4a6f-93e9-61c4a1986172");
  });
});

describe("computeClusterSelectDisabled", () => {
  it("disables when there is at most one cluster option", () => {
    expect(computeClusterSelectDisabled(1, false, ALL_VMS_GROUP_ID)).toBe(true);
    expect(computeClusterSelectDisabled(0, false, ALL_VMS_GROUP_ID)).toBe(true);
  });

  it("disables when all vCenters are selected", () => {
    expect(computeClusterSelectDisabled(3, true, ALL_VMS_GROUP_ID)).toBe(true);
    expect(computeClusterSelectDisabled(3, true, "group-1")).toBe(false);
  });

  it("allows cluster selection when the vCenter filter is hidden", () => {
    expect(computeClusterSelectDisabled(3, false, ALL_VMS_GROUP_ID)).toBe(
      false,
    );
  });

  it("uses distinct select values when a subset id collides with All VMs", () => {
    const model = buildGroupViewModel({
      subsetInventories: [
        createSubset({
          id: "all",
          name: "Empty Group",
          vmsCount: 12,
        }),
        createSubset({ id: "group-2", name: "Group 2", vmsCount: 5 }),
      ],
    });

    expect(model.groupOptions).toHaveLength(3);
    expect(model.groupOptions.map((option) => option.id)).toEqual([
      "all",
      "subset:all",
      "group-2",
    ]);
    expect(model.groupOptions[1].label).toBe("Group (12 VMs)");
  });
});
