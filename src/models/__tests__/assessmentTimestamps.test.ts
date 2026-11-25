import type { Assessment } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { createAssessmentModel } from "../AssessmentModel";
import {
  getAssessmentDataCollectedMs,
  getAssessmentImportedMs,
} from "../assessmentTimestamps";

const collected = new Date("2026-06-18T08:20:00.000Z");
const imported = new Date("2026-06-20T10:00:00.000Z");

const baseAssessment = (overrides: Partial<Assessment> = {}): Assessment => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test assessment",
  sourceType: "rvtools",
  createdAt: imported,
  snapshots: [
    {
      createdAt: new Date("2026-06-21T12:00:00.000Z"),
      inventory: {
        vcenterId: "vc-1",
        clusters: {},
        collectionTime: collected,
      },
    },
  ],
  ...overrides,
});

describe("assessmentTimestamps", () => {
  it("reads collection time from the latest snapshot inventory", () => {
    const model = createAssessmentModel(baseAssessment());
    expect(getAssessmentDataCollectedMs(model)).toBe(collected.getTime());
  });

  it("falls back to subset inventory collection time", () => {
    const model = createAssessmentModel(
      baseAssessment({
        snapshots: [
          {
            createdAt: imported,
            inventory: {
              vcenterId: "vc-1",
              clusters: {},
            },
            subsetInventories: [
              {
                id: "22222222-2222-4222-8222-222222222222",
                name: "subset",
                vcenterId: "vc-1",
                vmsCount: 1,
                createdAt: imported,
                inventory: {
                  vcenterId: "vc-1",
                  clusters: {},
                  collectionTime: collected,
                },
              },
            ],
          },
        ],
      }),
    );
    expect(getAssessmentDataCollectedMs(model)).toBe(collected.getTime());
  });

  it("returns imported time from assessment createdAt", () => {
    const model = createAssessmentModel(baseAssessment());
    expect(getAssessmentImportedMs(model)).toBe(imported.getTime());
  });

  it("returns undefined when collection metadata is missing", () => {
    const model = createAssessmentModel(
      baseAssessment({
        snapshots: [
          {
            createdAt: imported,
            inventory: { vcenterId: "vc-1", clusters: {} },
          },
        ],
      }),
    );
    expect(getAssessmentDataCollectedMs(model)).toBeUndefined();
  });
});
