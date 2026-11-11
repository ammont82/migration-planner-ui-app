import type { Job } from "@openshift-migration-advisor/planner-sdk";
import { JobStatus } from "@openshift-migration-advisor/planner-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncFn } from "react-use";

import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { IJobsStore } from "../../../data/stores/interfaces/IJobsStore";
import type { IRvtoolsReportPersistenceStore } from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";
import {
  JOB_POLLING_INTERVAL,
  TERMINAL_JOB_STATUSES,
} from "../../../data/stores/JobsStore";
import { routes } from "../../../routing/Routes";
import { buildAppendRvtoolsToastMessage } from "../../assessment/helpers/rvtoolsUploadOutcome";
import {
  getRvtoolsJobProgressLabel,
  getRvtoolsJobProgressValue,
  getRvtoolsMultiFileUploadProgress,
} from "../../assessment/rvtools/jobProgress";

type JobsStoreSnapshot = ReturnType<IJobsStore["getSnapshot"]>;

export type UseReportRvtoolsUploadJobArgs = {
  assessmentId: string | undefined;
  canAppendRvtoolsFiles: boolean;
  jobsStore: IJobsStore;
  assessmentsStore: IAssessmentsStore;
  persistenceStore: IRvtoolsReportPersistenceStore;
  jobState: JobsStoreSnapshot;
};

export const useReportRvtoolsUploadJob = ({
  assessmentId,
  canAppendRvtoolsFiles,
  jobsStore,
  assessmentsStore,
  persistenceStore,
  jobState,
}: UseReportRvtoolsUploadJobArgs) => {
  const navigate = useNavigate();

  const [isRvtoolsModalOpen, setIsRvtoolsModalOpen] = useState(false);
  const [rvtoolsModalMode, setRvtoolsModalMode] = useState<"create" | "append">(
    "create",
  );
  const [rvtoolsAppendSuccessMessage, setRvtoolsAppendSuccessMessage] =
    useState<string | null>(null);
  const [rvtoolsAppendNotice, setRvtoolsAppendNotice] = useState<{
    variant: "success" | "warning";
    message: string;
  } | null>(null);
  const [activeRvtoolsJobIntent, setActiveRvtoolsJobIntent] = useState<
    "create" | "append" | null
  >(null);
  const activeRvtoolsJobIntentRef = useRef<"create" | "append" | null>(null);

  const setRvtoolsJobIntent = useCallback(
    (intent: "create" | "append" | null): void => {
      activeRvtoolsJobIntentRef.current = intent;
      setActiveRvtoolsJobIntent(intent);
    },
    [],
  );

  const openRvtoolsModal = useCallback((): void => {
    setRvtoolsModalMode("create");
    setIsRvtoolsModalOpen(true);
  }, []);

  const openAppendRvtoolsModal = useCallback((): void => {
    setRvtoolsModalMode("append");
    setIsRvtoolsModalOpen(true);
  }, []);

  const closeRvtoolsModal = useCallback((): void => {
    void jobsStore.cancelRVToolsJob();
    setIsRvtoolsModalOpen(false);
    jobsStore.reset();
  }, [jobsStore]);

  const dismissRvtoolsAppendSuccess = useCallback((): void => {
    setRvtoolsAppendSuccessMessage(null);
  }, []);

  const dismissRvtoolsAppendNotice = useCallback((): void => {
    setRvtoolsAppendNotice(null);
  }, []);

  const removeRvtoolsUploadResult = useCallback(
    (fileName: string, fileSize: number): void => {
      jobsStore.removeRvtoolsUploadResult(fileName, fileSize);
    },
    [jobsStore],
  );

  const recordRvtoolsUploadOutcome = useCallback(
    (targetAssessmentId: string, context: "created" | "updated") => {
      const upload = jobsStore.getSnapshot().rvtoolsUpload;
      if (!upload?.results.length) {
        return null;
      }
      return persistenceStore.applyUploadOutcome(
        targetAssessmentId,
        upload.results,
        context,
      );
    },
    [jobsStore, persistenceStore],
  );

  const openAppendRvtoolsFromErrorReview = useCallback((): void => {
    openAppendRvtoolsModal();
  }, [openAppendRvtoolsModal]);

  const prevJobRef = useRef<Job | null>(null);
  const isNavigatingRef = useRef(false);

  const [, refreshAfterAppend] = useAsyncFn(async () => {
    if (!assessmentId) {
      return;
    }
    let allUploadFailed = false;
    try {
      const uploadResults =
        jobsStore.getSnapshot().rvtoolsUpload?.results ?? [];

      const summary =
        uploadResults.length > 0
          ? persistenceStore.applyUploadOutcome(
              assessmentId,
              uploadResults,
              "updated",
            )
          : null;

      const validCount = summary?.validFileNames.length ?? 0;
      const invalidCount = summary?.invalidResults.length ?? 0;
      allUploadFailed = validCount === 0 && invalidCount > 0;
      const partialFailure = validCount > 0 && invalidCount > 0;

      await assessmentsStore.get(assessmentId);
      if (!allUploadFailed) {
        setIsRvtoolsModalOpen(false);
      }
      setRvtoolsAppendSuccessMessage(null);
      setRvtoolsAppendNotice(null);

      if (summary && !allUploadFailed && !partialFailure) {
        const toast = buildAppendRvtoolsToastMessage(summary);
        if (toast?.variant === "success") {
          setRvtoolsAppendSuccessMessage(toast.message);
        }
      }
    } finally {
      isNavigatingRef.current = false;
      setRvtoolsJobIntent(null);
      if (!allUploadFailed) {
        jobsStore.reset();
      }
    }
  }, [
    assessmentId,
    assessmentsStore,
    jobsStore,
    persistenceStore,
    setRvtoolsJobIntent,
  ]);

  const beginReportRvtoolsUploadCompletion = useCallback((): void => {
    if (isNavigatingRef.current) {
      return;
    }
    if (activeRvtoolsJobIntentRef.current !== "append") {
      return;
    }
    isNavigatingRef.current = true;
    jobsStore.stopPolling();
    void refreshAfterAppend();
  }, [jobsStore, refreshAfterAppend]);

  const createRVToolsJob = useCallback(
    async (name: string, files: File[]): Promise<void> => {
      setRvtoolsJobIntent("create");
      const job = await jobsStore.createRVToolsJob(name, files);
      if (job) {
        jobsStore.startPolling(JOB_POLLING_INTERVAL);
      }
    },
    [jobsStore, setRvtoolsJobIntent],
  );

  const uploadRvtoolsToAssessment = useCallback(
    async (files: File[]): Promise<void> => {
      if (!assessmentId) {
        return;
      }
      setRvtoolsJobIntent("append");
      const job = await jobsStore.appendRvtoolsToAssessment(
        assessmentId,
        files,
      );
      const { currentJob } = jobsStore.getSnapshot();
      if (job && !TERMINAL_JOB_STATUSES.includes(job.status)) {
        jobsStore.startPolling(JOB_POLLING_INTERVAL);
        return;
      }
      if (currentJob && TERMINAL_JOB_STATUSES.includes(currentJob.status)) {
        beginReportRvtoolsUploadCompletion();
      }
    },
    [
      assessmentId,
      beginReportRvtoolsUploadCompletion,
      jobsStore,
      setRvtoolsJobIntent,
    ],
  );

  const appendRvtoolsFiles = useCallback(
    async (files: File[]): Promise<void> => {
      await uploadRvtoolsToAssessment(files);
    },
    [uploadRvtoolsToAssessment],
  );

  const cancelRVToolsJob = useCallback(async (): Promise<void> => {
    jobsStore.stopPolling();
    const latestJob = await jobsStore.cancelRVToolsJob();
    if (latestJob?.status === JobStatus.Completed && latestJob.assessmentId) {
      try {
        await assessmentsStore.remove(latestJob.assessmentId);
      } catch (err) {
        console.error("Failed to delete assessment after job cancel:", err);
      }
    }
  }, [assessmentsStore, jobsStore]);

  const [rvtoolsNavigationState, navigateToReport] = useAsyncFn(
    async (targetAssessmentId: string) => {
      try {
        recordRvtoolsUploadOutcome(targetAssessmentId, "created");
        await assessmentsStore.get(targetAssessmentId);
        setIsRvtoolsModalOpen(false);
        void navigate(routes.assessmentReport(targetAssessmentId));
      } finally {
        isNavigatingRef.current = false;
        setRvtoolsJobIntent(null);
        jobsStore.reset();
      }
    },
    [
      assessmentsStore,
      jobsStore,
      navigate,
      recordRvtoolsUploadOutcome,
      setRvtoolsJobIntent,
    ],
  );

  useEffect(() => {
    const { currentJob } = jobState;
    const prevJob = prevJobRef.current;
    prevJobRef.current = currentJob;

    const prevTerminal =
      prevJob != null && TERMINAL_JOB_STATUSES.includes(prevJob.status);
    const nowTerminal =
      currentJob != null && TERMINAL_JOB_STATUSES.includes(currentJob.status);
    const intent = activeRvtoolsJobIntentRef.current;

    if (
      nowTerminal &&
      !prevTerminal &&
      !isNavigatingRef.current &&
      intent === "append"
    ) {
      isNavigatingRef.current = true;
      jobsStore.stopPolling();
      void refreshAfterAppend();
      return;
    }

    if (
      currentJob?.status === JobStatus.Completed &&
      currentJob.assessmentId &&
      prevJob?.status !== JobStatus.Completed &&
      !isNavigatingRef.current &&
      intent === "create"
    ) {
      isNavigatingRef.current = true;
      jobsStore.stopPolling();
      void navigateToReport(currentJob.assessmentId);
    }
  }, [
    jobState,
    jobsStore,
    navigateToReport,
    refreshAfterAppend,
    setRvtoolsJobIntent,
  ]);

  const { currentJob } = jobState;

  const isJobProcessing = Boolean(
    currentJob && !TERMINAL_JOB_STATUSES.includes(currentJob.status),
  );

  const multiFileProgress = getRvtoolsMultiFileUploadProgress(
    jobState.rvtoolsUpload,
    currentJob,
  );

  const jobProgressValue = multiFileProgress
    ? multiFileProgress.value
    : currentJob
      ? getRvtoolsJobProgressValue(currentJob.status)
      : 0;

  const jobProgressLabel = multiFileProgress
    ? multiFileProgress.label
    : currentJob
      ? getRvtoolsJobProgressLabel(currentJob.status)
      : "";

  const jobError = useMemo(() => {
    return currentJob?.status === JobStatus.Failed
      ? new Error(currentJob.error || "Processing failed")
      : null;
  }, [currentJob]);

  return {
    rvtoolsModalMode,
    isRvtoolsModalOpen,
    openRvtoolsModal,
    openAppendRvtoolsModal,
    closeRvtoolsModal,
    createRVToolsJob,
    appendRvtoolsFiles,
    cancelRVToolsJob,
    setRvtoolsJobIntent,
    isJobProcessing,
    jobProgressValue,
    jobProgressLabel,
    jobError,
    activeRvtoolsJobIntent,
    isNavigatingToReport:
      activeRvtoolsJobIntent === "create" &&
      (rvtoolsNavigationState.loading ||
        Boolean(
          currentJob?.status === JobStatus.Completed &&
          currentJob?.assessmentId,
        )),
    rvtoolsAppendSuccessMessage,
    dismissRvtoolsAppendSuccess,
    rvtoolsAppendNotice,
    dismissRvtoolsAppendNotice,
    removeRvtoolsUploadResult,
    canAppendRvtoolsFiles,
    openAppendRvtoolsFromErrorReview,
  };
};
