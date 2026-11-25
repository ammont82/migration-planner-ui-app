import type { SourceModel } from "./SourceModel";

const timestampToMs = (value: unknown): number | undefined => {
  if (value == null || value === "") {
    return undefined;
  }
  const ms = new Date(value as string | number | Date).getTime();
  return Number.isNaN(ms) ? undefined : ms;
};

/** When vCenter inventory was collected for this discovery appliance. */
export const getSourceDataCollectedMs = (
  source: SourceModel,
): number | undefined => timestampToMs(source.inventory?.collectionTime);

/** When the discovery appliance was first added to Migration Advisor. */
export const getSourceImportedMs = (source: SourceModel): number | undefined =>
  timestampToMs(source.createdAt);
