import type {
  AssessmentSubsetInventory,
  Inventory,
} from "@openshift-migration-advisor/planner-sdk";
import { useCallback, useMemo, useState } from "react";

import {
  type ReportInventorySource,
  resolveActiveInventory,
  resolveEffectiveGroupId,
} from "../helpers/groupInventoryFilter";
import {
  buildGroupViewModel,
  fromGroupOptionId,
  type GroupViewModel,
} from "../helpers/groupViewModel";

export interface GroupInventoryFilterState {
  selectedGroupId: string;
  groupView: GroupViewModel;
  activeInventory: ReportInventorySource | undefined;
  isGroupSelectOpen: boolean;
  setIsGroupSelectOpen: (open: boolean) => void;
  selectGroup: (groupId: string) => void;
  handleGroupSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;
}

export const useGroupInventoryFilter = ({
  subsetInventories,
  fullInventory,
  onGroupChange,
}: {
  subsetInventories: AssessmentSubsetInventory[];
  fullInventory: Inventory | ReportInventorySource | undefined;
  onGroupChange?: () => void;
}): GroupInventoryFilterState => {
  const [userSelectedGroupId, setUserSelectedGroupId] = useState<string | null>(
    null,
  );
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);

  const selectedGroupId = useMemo(
    () => resolveEffectiveGroupId(userSelectedGroupId, subsetInventories),
    [userSelectedGroupId, subsetInventories],
  );

  const groupView = useMemo(
    () =>
      buildGroupViewModel({
        subsetInventories,
        selectedGroupId,
        labelMode: "viewing-group",
      }),
    [subsetInventories, selectedGroupId],
  );

  const activeInventory = useMemo(
    () =>
      resolveActiveInventory(selectedGroupId, subsetInventories, fullInventory),
    [selectedGroupId, subsetInventories, fullInventory],
  );

  const selectGroup = useCallback(
    (groupId: string) => {
      setUserSelectedGroupId(groupId);
      onGroupChange?.();
      setIsGroupSelectOpen(false);
    },
    [onGroupChange],
  );

  const handleGroupSelect = useCallback(
    (
      _event: React.MouseEvent<Element, MouseEvent> | undefined,
      value: string | number | undefined,
    ) => {
      if (value == null) {
        return;
      }
      selectGroup(fromGroupOptionId(String(value)));
    },
    [selectGroup],
  );

  return {
    selectedGroupId,
    groupView,
    activeInventory,
    isGroupSelectOpen,
    setIsGroupSelectOpen,
    selectGroup,
    handleGroupSelect,
  };
};
