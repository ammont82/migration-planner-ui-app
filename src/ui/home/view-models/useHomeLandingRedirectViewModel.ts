import { useInjection } from "@openshift-migration-advisor/ioc";
import { useAsyncFn, useMount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import { routes } from "../../../routing/Routes";
import { isUploadedFileSourceType } from "../../assessment/helpers/assessmentSource";

export interface HomeLandingRedirectViewModel {
  destination: string | null;
  isLoading: boolean;
  error?: Error;
  retry: () => void;
}

const getCreatedAtTime = (assessment: AssessmentModel): number => {
  if (!assessment.createdAt) return Number.NEGATIVE_INFINITY;

  const timestamp = new Date(assessment.createdAt).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const getLandingDestination = (assessments: AssessmentModel[]): string => {
  if (assessments.length === 0) return routes.assessmentEmpty;

  // Keep the first assessment when timestamps are equal or unavailable, so the
  // result remains deterministic for a given API response.
  const latestAssessment = assessments.reduce((latest, assessment) =>
    getCreatedAtTime(assessment) > getCreatedAtTime(latest)
      ? assessment
      : latest,
  );

  return isUploadedFileSourceType(String(latestAssessment.sourceType ?? ""))
    ? routes.assessments
    : routes.environments;
};

export const useHomeLandingRedirectViewModel =
  (): HomeLandingRedirectViewModel => {
    const assessmentsStore = useInjection<IAssessmentsStore>(
      Symbols.AssessmentsStore,
    );

    const [fetchState, fetchAssessments] = useAsyncFn(
      async () => {
        const assessments = await assessmentsStore.list();
        return getLandingDestination(assessments);
      },
      [assessmentsStore],
      { loading: true },
    );

    useMount(() => {
      void fetchAssessments();
    });

    return {
      destination:
        fetchState.loading || fetchState.error
          ? null
          : (fetchState.value ?? null),
      isLoading: fetchState.loading,
      error: fetchState.error,
      retry: () => {
        void fetchAssessments();
      },
    };
  };
