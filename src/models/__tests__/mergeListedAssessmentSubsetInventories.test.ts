import type { Assessment } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { createAssessmentModel } from "../AssessmentModel";
import { mergeListedAssessmentPreservingSubsetInventories } from "../mergeListedAssessmentSubsetInventories";

describe("mergeListedAssessmentPreservingSubsetInventories", () => {
  const createdAt = new Date("2026-06-01T10:00:00.000Z");
  const inventory = {
    vcenterId: "vc-1",
    clusters: { "cluster-a": { infra: {}, vms: { total: 1 } } },
  };
  const subsetInventories = [
    {
      id: "group-1",
      name: "Group 1",
      vcenterId: "vc-1",
      vmsCount: 1,
      createdAt,
      inventory,
    },
  ];

  const assessmentBase = {
    id: "a-1",
    name: "A",
    sourceType: "source" as const,
    createdAt,
  };

  it("returns incoming when list already includes subsetInventories", () => {
    const model = createAssessmentModel({
      ...assessmentBase,
      snapshots: [{ createdAt, inventory, subsetInventories: null }],
    } as unknown as Assessment);

    const merged = mergeListedAssessmentPreservingSubsetInventories(
      model,
      model,
    );
    expect(merged.snapshotsSorted[0].subsetInventories).toBeNull();
  });

  it("copies subsetInventories when list snapshot createdAt differs from GET", () => {
    const collectedAt = new Date("2026-05-20T13:51:00.000Z");
    const importedAt = new Date("2026-11-18T14:24:00.000Z");
    const subsetInventoriesWithCollection = [
      {
        id: "group-1",
        name: "VC1",
        vcenterId: "vc-1",
        vmsCount: 10,
        createdAt: importedAt,
        inventory: {
          ...inventory,
          collectionTime: collectedAt,
        },
      },
    ];
    const existing = createAssessmentModel({
      ...assessmentBase,
      snapshots: [
        {
          createdAt: importedAt,
          inventory,
          subsetInventories: subsetInventoriesWithCollection,
        },
      ],
    } as unknown as Assessment);
    const incoming = createAssessmentModel({
      ...assessmentBase,
      snapshots: [{ createdAt: importedAt, inventory }],
    } as unknown as Assessment);

    const merged = mergeListedAssessmentPreservingSubsetInventories(
      incoming,
      existing,
    );

    expect(merged.snapshotsSorted[0].subsetInventories).toEqual(
      subsetInventoriesWithCollection,
    );
  });

  it("copies subsetInventories from existing when list omits the field", () => {
    const existing = createAssessmentModel({
      ...assessmentBase,
      snapshots: [{ createdAt, inventory, subsetInventories }],
    } as unknown as Assessment);
    const incoming = createAssessmentModel({
      ...assessmentBase,
      name: "A listed",
      snapshots: [{ createdAt, inventory }],
    } as unknown as Assessment);

    const merged = mergeListedAssessmentPreservingSubsetInventories(
      incoming,
      existing,
    );

    expect(merged.snapshotsSorted[0].subsetInventories).toEqual(
      subsetInventories,
    );
    expect(merged.name).toBe("A listed");
  });

  it("merges subsetInventories when list uses assessment createdAt for snapshot", () => {
    const listCreatedAt = new Date("2026-11-18T14:24:00.000Z");
    const detailSnapshotAt = new Date("2026-11-18T14:25:10.000Z");
    const collectedAt = new Date("2026-05-20T13:51:00.000Z");
    const subsetInventoriesWithCollection = [
      {
        id: "group-1",
        name: "VC1",
        vcenterId: "vc-1",
        vmsCount: 10,
        createdAt: detailSnapshotAt,
        inventory: {
          ...inventory,
          collectionTime: collectedAt,
        },
      },
    ];
    const existing = createAssessmentModel({
      ...assessmentBase,
      createdAt: listCreatedAt,
      snapshots: [
        {
          createdAt: detailSnapshotAt,
          inventory,
          subsetInventories: subsetInventoriesWithCollection,
        },
      ],
    } as unknown as Assessment);
    const incoming = createAssessmentModel({
      ...assessmentBase,
      createdAt: listCreatedAt,
      name: "Listed name",
      snapshots: [{ createdAt: listCreatedAt, inventory }],
    } as unknown as Assessment);

    const merged = mergeListedAssessmentPreservingSubsetInventories(
      incoming,
      existing,
    );

    expect(merged.snapshotsSorted[0].subsetInventories).toEqual(
      subsetInventoriesWithCollection,
    );
    expect(merged.name).toBe("Listed name");
  });
});
