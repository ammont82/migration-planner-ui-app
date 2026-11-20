import { describe, expect, it } from "vitest";

import { createSourceModel } from "../SourceModel";
import {
  getSourceDataCollectedMs,
  getSourceImportedMs,
} from "../sourceTimestamps";

const collected = new Date("2026-06-18T08:20:00.000Z");
const imported = new Date("2026-06-20T10:00:00.000Z");

describe("sourceTimestamps", () => {
  it("reads collection time from source inventory", () => {
    const source = createSourceModel({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Production vCenter",
      createdAt: imported,
      updatedAt: imported,
      onPremises: false,
      inventory: {
        vcenterId: "vc-1",
        clusters: {},
        collectionTime: collected,
      },
    });

    expect(getSourceDataCollectedMs(source)).toBe(collected.getTime());
    expect(getSourceImportedMs(source)).toBe(imported.getTime());
  });

  it("returns undefined when inventory is missing", () => {
    const source = createSourceModel({
      id: "11111111-1111-4111-8111-111111111111",
      name: "New appliance",
      createdAt: imported,
      updatedAt: imported,
      onPremises: false,
    });

    expect(getSourceDataCollectedMs(source)).toBeUndefined();
  });
});
