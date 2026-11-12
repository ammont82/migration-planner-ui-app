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
}: {
  assessmentId: string | undefined;
  assessmentSourceType: string | undefined;
  subsetInventoriesFromSnapshot: AssessmentSubsetInventory[] | undefined;
  resetClusterSelection: () => void;
}): {
  rvtoolsSubsetInventories: AssessmentSubsetInventory[];
  rvtoolsEffectiveVcenterSubsetId: string;
  scopedVcenterApiId: string | undefined;
  rvtoolsVcenterFilterView: GroupViewModel;
  userSelectedRvtoolsVcenterSubsetId: string | null;
  selectRvtoolsVcenterSubset: (groupId: string) => void;
  isVcenterSelectOpen: boolean;
  setVcenterSelectOpen: (open: boolean) => void;
} => {
  const [isVcenterSelectOpen, setVcenterSelectOpen] = useState(false);
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
      setVcenterSelectOpen(false);
    },
    [resetClusterSelection],
  );

  return {
    rvtoolsSubsetInventories,
    rvtoolsEffectiveVcenterSubsetId,
    scopedVcenterApiId,
    rvtoolsVcenterFilterView,
    userSelectedRvtoolsVcenterSubsetId,
    selectRvtoolsVcenterSubset,
    isVcenterSelectOpen,
    setVcenterSelectOpen,
  };
};
