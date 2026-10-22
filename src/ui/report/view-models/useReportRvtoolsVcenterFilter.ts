import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { useCallback, useMemo, useState } from "react";

import {
  buildGroupViewModel,
  type GroupViewModel,
} from "../helpers/groupViewModel";
import {
  resolveRvtoolsEffectiveVcenterSubsetId,
  resolveRvtoolsScopedVcenterApiId,
  rvtoolsSubsetInventoriesFromSnapshot,
} from "../helpers/rvtoolsReportInventoryScope";

export const useReportRvtoolsVcenterFilter = ({
  assessmentId,
  assessmentSourceType,
  subsetInventoriesFromSnapshot,
  resetClusterSelection,
  setIsGroupSelectOpen,
}: {
  assessmentId: string | undefined;
  assessmentSourceType: string | undefined;
  subsetInventoriesFromSnapshot: AssessmentSubsetInventory[] | undefined;
  resetClusterSelection: () => void;
  setIsGroupSelectOpen: (open: boolean) => void;
}): {
  rvtoolsSubsetInventories: AssessmentSubsetInventory[];
  rvtoolsEffectiveVcenterSubsetId: string;
  scopedVcenterApiId: string | undefined;
  rvtoolsVcenterFilterView: GroupViewModel;
  userSelectedRvtoolsVcenterSubsetId: string | null;
  selectRvtoolsVcenterSubset: (groupId: string) => void;
} => {
  const rvtoolsSubsetInventories = useMemo(
    (): AssessmentSubsetInventory[] =>
      rvtoolsSubsetInventoriesFromSnapshot(
        assessmentSourceType,
        subsetInventoriesFromSnapshot,
      ),
    [assessmentSourceType, subsetInventoriesFromSnapshot],
  );

  const [
    userSelectedRvtoolsVcenterSubsetId,
    setUserSelectedRvtoolsVcenterSubsetId,
  ] = useState<string | null>(null);
  const [boundAssessmentId, setBoundAssessmentId] = useState(assessmentId);

  if (boundAssessmentId !== assessmentId) {
    setBoundAssessmentId(assessmentId);
    setUserSelectedRvtoolsVcenterSubsetId(null);
  }

  const rvtoolsEffectiveVcenterSubsetId = useMemo(
    () =>
      resolveRvtoolsEffectiveVcenterSubsetId(
        rvtoolsSubsetInventories,
        userSelectedRvtoolsVcenterSubsetId,
      ),
    [rvtoolsSubsetInventories, userSelectedRvtoolsVcenterSubsetId],
  );

  const scopedVcenterApiId = useMemo(
    () =>
      resolveRvtoolsScopedVcenterApiId(
        rvtoolsSubsetInventories,
        rvtoolsEffectiveVcenterSubsetId,
      ),
    [rvtoolsEffectiveVcenterSubsetId, rvtoolsSubsetInventories],
  );

  const rvtoolsVcenterFilterView = useMemo(
    () =>
      buildGroupViewModel({
        subsetInventories: rvtoolsSubsetInventories,
        selectedGroupId: rvtoolsEffectiveVcenterSubsetId,
        labelMode: "vcenter",
      }),
    [rvtoolsEffectiveVcenterSubsetId, rvtoolsSubsetInventories],
  );

  const selectRvtoolsVcenterSubset = useCallback(
    (groupId: string) => {
      setUserSelectedRvtoolsVcenterSubsetId(groupId);
      resetClusterSelection();
      setIsGroupSelectOpen(false);
    },
    [resetClusterSelection, setIsGroupSelectOpen],
  );

  return {
    rvtoolsSubsetInventories,
    rvtoolsEffectiveVcenterSubsetId,
    scopedVcenterApiId,
    rvtoolsVcenterFilterView,
    userSelectedRvtoolsVcenterSubsetId,
    selectRvtoolsVcenterSubset,
  };
};
