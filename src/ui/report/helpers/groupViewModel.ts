import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";

export const ALL_VMS_GROUP_ID = "all";

const SUBSET_GROUP_OPTION_PREFIX = "subset:";

const EMPTY_SUBSET_ID_TOKEN = "__empty__";

/**
 * PatternFly Select option values must be unique. The "All VMs" sentinel uses
 * id "all", which can collide with a real VM group id from discovery (e.g.
 * "Empty Group"), hiding that option in the dropdown.
 */
export const toGroupOptionId = (subsetId: string): string => {
  if (subsetId === ALL_VMS_GROUP_ID || subsetId === "") {
    return `${SUBSET_GROUP_OPTION_PREFIX}${
      subsetId === "" ? EMPTY_SUBSET_ID_TOKEN : subsetId
    }`;
  }
  return subsetId;
};

export const fromGroupOptionId = (optionId: string): string => {
  if (!optionId.startsWith(SUBSET_GROUP_OPTION_PREFIX)) {
    return optionId;
  }
  const rest = optionId.slice(SUBSET_GROUP_OPTION_PREFIX.length);
  return rest === EMPTY_SUBSET_ID_TOKEN ? "" : rest;
};

export type GroupLabelMode = "discovery" | "vcenter" | "viewing-group";

export type GroupOption = { id: string; label: string };

export type GroupViewModel = {
  groupOptions: GroupOption[];
  selectionId: string;
  selectionLabel: string;
  showGroupFilter: boolean;
  groupSelectDisabled: boolean;
};

/** RVTools subsets often ship with an empty `name`; use version or vCenter id for the filter label. */
export const getSubsetInventoryLabel = (
  subset: AssessmentSubsetInventory,
): string => {
  const name = subset.name?.trim();
  if (name) {
    return name;
  }

  const inventory = subset.inventory as
    { vcenterVersion?: string; vcenter_version?: string } | undefined;
  const version =
    inventory?.vcenterVersion?.trim() || inventory?.vcenter_version?.trim();
  if (version) {
    return `vCenter ${version}`;
  }

  const vcenterId = subset.vcenterId?.trim();
  if (vcenterId) {
    return vcenterId;
  }

  return subset.id;
};

export const buildGroupViewModel = ({
  subsetInventories,
  selectedGroupId = ALL_VMS_GROUP_ID,
  labelMode = "discovery",
}: {
  subsetInventories?: AssessmentSubsetInventory[];
  selectedGroupId?: string;
  labelMode?: GroupLabelMode;
}): GroupViewModel => {
  const subsets = subsetInventories ?? [];
  const showGroupFilter = subsets.length > 0;

  const allOptionLabel =
    labelMode === "vcenter"
      ? "All vCenters"
      : labelMode === "viewing-group"
        ? "All groups"
        : "All VMs";

  const groupOptions: GroupOption[] = [
    { id: ALL_VMS_GROUP_ID, label: allOptionLabel },
    ...subsets.map((subset) => ({
      id: toGroupOptionId(subset.id),
      label:
        labelMode === "vcenter"
          ? getSubsetInventoryLabel(subset)
          : labelMode === "viewing-group"
            ? subset.name?.trim() || `Group (${subset.vmsCount ?? 0} VMs)`
            : `Group (${subset.vmsCount ?? 0} VMs)`,
    })),
  ];

  const isValidSelection =
    selectedGroupId === ALL_VMS_GROUP_ID ||
    subsets.some((subset) => subset.id === selectedGroupId);
  const effectiveSelection = isValidSelection
    ? selectedGroupId
    : ALL_VMS_GROUP_ID;

  const selectedOption =
    groupOptions.find(
      (option) => fromGroupOptionId(option.id) === effectiveSelection,
    ) ?? groupOptions[0];

  return {
    groupOptions,
    selectionId: selectedOption.id,
    selectionLabel: selectedOption.label,
    showGroupFilter,
    groupSelectDisabled: !showGroupFilter,
  };
};

/** Cluster filter is only meaningful after a specific vCenter is selected. */
export const computeClusterSelectDisabled = (
  clusterOptionCount: number,
  showVcenterFilter: boolean,
  selectedVcenterScopeId: string,
): boolean => {
  if (clusterOptionCount <= 1) {
    return true;
  }
  if (showVcenterFilter && selectedVcenterScopeId === ALL_VMS_GROUP_ID) {
    return true;
  }
  return false;
};
