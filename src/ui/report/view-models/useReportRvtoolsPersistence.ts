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
  rvtoolsPendingUploadBatches: RvtoolsPendingUploadBatch[];
  isRvtoolsUploadWarningDismissed: (batchId: string) => boolean;
  dismissRvtoolsUploadWarning: (batchId: string) => void;
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
  const [dismissedBatchIds, setDismissedBatchIds] = useState<Set<string>>(
    () => new Set(),
  );

  if (boundWarningAssessmentId !== assessmentId) {
    setBoundWarningAssessmentId(assessmentId);
    setDismissedBatchIds(new Set());
  }

  const isRvtoolsUploadWarningDismissed = useCallback(
    (batchId: string): boolean => dismissedBatchIds.has(batchId),
    [dismissedBatchIds],
  );

  const dismissRvtoolsUploadWarning = useCallback((batchId: string): void => {
    setDismissedBatchIds((previous) => {
      const next = new Set(previous);
      next.add(batchId);
      return next;
    });
  }, []);

  return {
    persistenceStore,
    rvtoolsPendingUploadBatches: snapshot.pendingBatches,
    isRvtoolsUploadWarningDismissed,
    dismissRvtoolsUploadWarning,
  };
};
