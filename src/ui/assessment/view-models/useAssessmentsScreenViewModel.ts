import { useInjection } from "@openshift-migration-advisor/ioc";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useOutletContext } from "react-router-dom";
import { useAsyncFn, useMount, useUnmount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { DEFAULT_POLLING_DELAY } from "../../../lib/mvvm/PollableStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type { HomeScreenOutletContext } from "../../home/view-models/useHomeScreenViewModel";
import { isUploadedFileSourceType } from "../helpers/assessmentSource";

export interface AssessmentsScreenViewModel {
  assessments: AssessmentModel[];
  isLoading: boolean;
  hasInitialLoad: boolean;
  rvtoolsOpenToken?: string;
}

export const useAssessmentsScreenViewModel = (): AssessmentsScreenViewModel => {
  const { rvtoolsOpenToken } = useOutletContext<HomeScreenOutletContext>();

  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const allAssessments = useSyncExternalStore(
    assessmentsStore.subscribe.bind(assessmentsStore),
    assessmentsStore.getSnapshot.bind(assessmentsStore),
  );

  /** RVTools tab lists file-upload assessments only; discovery appliance assessments live under Environments. */
  const assessments = useMemo(
    () =>
      (allAssessments ?? []).filter((assessment) =>
        isUploadedFileSourceType(String(assessment.sourceType)),
      ),
    [allAssessments],
  );

  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const [fetchState, fetchAssessments] = useAsyncFn(
    async () => {
      try {
        return await assessmentsStore.list();
      } finally {
        setHasInitialLoad(true);
      }
    },
    [assessmentsStore],
    { loading: true },
  );

  useMount(() => {
    void fetchAssessments();
    assessmentsStore.startPolling(DEFAULT_POLLING_DELAY);
  });

  useUnmount(() => {
    assessmentsStore.stopPolling();
  });

  return {
    assessments,
    isLoading: fetchState.loading,
    hasInitialLoad,
    rvtoolsOpenToken,
  };
};
