import { useInjection } from "@openshift-migration-advisor/ioc";
import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";
import { useCallback, useState, useSyncExternalStore } from "react";

import { Symbols } from "../../../config/Dependencies";
import type { IRvtoolsReportPersistenceStore } from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";
import type { RvtoolsReportPersistenceSnapshot } from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";
import type { RvtoolsPendingUploadBatch } from "../../../data/stores/rvtoolsLocalPersistence";

export const useReportRvtoolsPersistence = ({
  assessmentId,
  sourceType,
  subsetInventories,
}: {
  assessmentId: string | undefined;
  sourceType: string | undefined;
  subsetInventories: AssessmentSubsetInventory[];
}): {
  persistenceStore: IRvtoolsReportPersistenceStore;
  rvtoolsPendingUploadBatch: RvtoolsPendingUploadBatch | null;
  isRvtoolsUploadWarningDismissed: boolean;
  dismissRvtoolsUploadWarning: () => void;
} => {
  const persistenceStore = useInjection<IRvtoolsReportPersistenceStore>(
    Symbols.RvtoolsReportPersistenceStore,
  );

  persistenceStore.syncForReport(assessmentId, sourceType, subsetInventories);

  const subscribe = (listener: () => void): (() => void) =>
    persistenceStore.subscribe(listener);
  const getSnapshot = (): RvtoolsReportPersistenceSnapshot =>
    persistenceStore.getSnapshot();

  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  const [boundWarningAssessmentId, setBoundWarningAssessmentId] =
    useState(assessmentId);
  const [isRvtoolsUploadWarningDismissed, setIsRvtoolsUploadWarningDismissed] =
    useState(false);

  if (boundWarningAssessmentId !== assessmentId) {
    setBoundWarningAssessmentId(assessmentId);
    setIsRvtoolsUploadWarningDismissed(false);
  }

  const dismissRvtoolsUploadWarning = useCallback((): void => {
    setIsRvtoolsUploadWarningDismissed(true);
  }, []);

  return {
    persistenceStore,
    rvtoolsPendingUploadBatch: snapshot.pendingBatch,
    isRvtoolsUploadWarningDismissed,
    dismissRvtoolsUploadWarning,
  };
};
