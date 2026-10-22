import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";

import type { ReportInventorySource } from "./groupInventoryFilter";
import { ALL_VMS_GROUP_ID } from "./groupViewModel";

/** v2 path parameter `vid` for the selected subset (vCenter inventory). */
export const resolveSubsetVcenterApiId = (
  subsetInventories: AssessmentSubsetInventory[],
  selectedGroupId: string,
): string | undefined => {
  if (selectedGroupId === ALL_VMS_GROUP_ID) {
    return undefined;
  }

  const subset = subsetInventories.find(
    (entry) => entry.id === selectedGroupId,
  );
  if (!subset) {
    return undefined;
  }

  const inventory = subset.inventory as ReportInventorySource | undefined;
  const fromInventory =
    inventory?.vcenterId?.trim() || inventory?.vcenter?.id?.trim();

  const vcenterId = subset.vcenterId?.trim();
  if (vcenterId) {
    return vcenterId;
  }
  if (fromInventory) {
    return fromInventory;
  }

  return subset.id;
};
