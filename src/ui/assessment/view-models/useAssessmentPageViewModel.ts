import { useInjection } from "@openshift-migration-advisor/ioc";
import type { Identity, Job } from "@openshift-migration-advisor/planner-sdk";
import { JobStatus } from "@openshift-migration-advisor/planner-sdk";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAccountStore } from "../../../data/stores/interfaces/IAccountStore";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { IJobsStore } from "../../../data/stores/interfaces/IJobsStore";
import type { IRvtoolsReportPersistenceStore } from "../../../data/stores/interfaces/IRvtoolsReportPersistenceStore";
import {
  JOB_POLLING_INTERVAL,
  type RvtoolsUploadState,
  TERMINAL_JOB_STATUSES,
} from "../../../data/stores/JobsStore";
import useLocalStorage from "../../../hooks/useLocalStorage";
import { routes } from "../../../routing/Routes";
import {
  getRvtoolsJobProgressLabel,
  getRvtoolsJobProgressValue,
  getRvtoolsMultiFileUploadProgress,
} from "../rvtools/jobProgress";
import type { ColumnKey, SortableColumn } from "../views/AssessmentsTable";
import {
  DEFAULT_VISIBLE_COLUMNS,
  MANDATORY_COLUMNS,
} from "../views/AssessmentsTable";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIBLE_COLUMNS_KEY = "migration-advisor:visible-columns";

// ---------------------------------------------------------------------------
// View-model interface
// ---------------------------------------------------------------------------

export interface AssessmentPageViewModel {
  /** Current user identity (null when not logged in). */
  identity: Identity | null;
  /** Current RVTools job (null when idle). */
  currentJob: Job | null;
  /** `true` while the create-job request is in flight. */
  isCreatingJob: boolean;
  /** Error from the last create-job attempt. */
  jobCreateError?: Error;

  /** `true` while the current job is actively processing (non-terminal). */
  isJobProcessing: boolean;
  /** Progress percentage (0-100) derived from the current job status. */
  jobProgressValue: number;
  /** Human-readable progress label for the current job status. */
  jobProgressLabel: string;
  /** Error derived from a failed job (null when job hasn't failed). */
  jobError: Error | null;
  /** Per-file outcomes from the active RVTools upload session (for review UI). */
  rvtoolsUpload?: RvtoolsUploadState;
  /** Set when a multi-file create failed after the assessment was created. */
  rvtoolsPartialAssessmentId?: string;

  /** `true` while loading assessments and navigating after job completion. */
  isNavigatingToReport: boolean;

  /** `true` while a delete-assessment request is in flight. */
  isDeletingAssessment: boolean;
  /** Error from the last delete-assessment attempt. */
  deleteError?: Error;

  /** `true` while an update-assessment request is in flight. */
  isUpdatingAssessment: boolean;
  /** Error from the last update-assessment attempt. */
  updateError?: Error;

  // -- Column visibility & sorting -------------------------------------------

  /** Whether the column management modal is open. */
  isColumnModalOpen: boolean;
  /** Toggle the column management modal. */
  setIsColumnModalOpen: (open: boolean) => void;
  /** Visible columns (includes mandatory columns). */
  visibleColumns: ColumnKey[];
  /** Set visible columns (bulk update). */
  setVisibleColumns: (columns: ColumnKey[]) => void;
  /** Current sort state. */
  sortBy: { columnKey: SortableColumn; direction: "asc" | "desc" } | undefined;
  /** Update the sort state. */
  setSortBy: (
    sort: { columnKey: SortableColumn; direction: "asc" | "desc" } | undefined,
  ) => void;

  // -- Actions ---------------------------------------------------------------

  /** Create a new RVTools assessment (starts an async job). */
  createRVToolsJob: (name: string, files: File[]) => Promise<void>;
  /** Clear the create-job error (e.g. when the user edits the form). */
  clearJobCreateError: () => void;
  /** Clear per-file upload results after the user retries a failed job in the modal. */
  clearRvtoolsUploadResults: () => void;
  /** Drop a staged file from the active RVTools upload result list. */
  removeRvtoolsUploadResult: (fileName: string, fileSize: number) => void;
  /**
   * Partial multi-file create succeeded on the server; clear job UI state and
   * refresh assessments (assessment is kept).
   */
  completePartialRvtoolsUpload: () => Promise<void>;
  /**
   * Cancel the current job.
   * If the job had already completed, the created assessment is cleaned up.
   */
  cancelRVToolsJob: () => Promise<void>;
  /** Update an existing assessment's name. */
  updateAssessment: (id: string, name: string) => Promise<void>;

  /** Delete an assessment by id. */
  deleteAssessment: (id: string) => Promise<void>;

  /** Share assessment with partner. */
  shareAssessment: (id: string) => Promise<void>;
  isSharingAssessment: boolean;
  shareError?: Error;

  /** Revoke an assessment share with the partner. */
  unshareAssessment: (id: string) => Promise<void>;
  isUnsharingAssessment: boolean;
  unshareError?: Error;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAssessmentPageViewModel = (): AssessmentPageViewModel => {
  const navigate = useNavigate();

  const accountStore = useInjection<IAccountStore>(Symbols.AccountStore);
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const jobsStore = useInjection<IJobsStore>(Symbols.JobsStore);
  const rvtoolsReportPersistenceStore =
    useInjection<IRvtoolsReportPersistenceStore>(
      Symbols.RvtoolsReportPersistenceStore,
    );

  const identity = useSyncExternalStore(
    accountStore.subscribe.bind(accountStore),
    accountStore.getSnapshot.bind(accountStore),
  );

  const jobState = useSyncExternalStore(
    jobsStore.subscribe.bind(jobsStore),
    jobsStore.getSnapshot.bind(jobsStore),
  );

  // ---- Column visibility and sorting --------------------------------------

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  const userSelectedColumnsVersion = 4;
  const [userSelectedColumns, setUserSelectedColumns] = useLocalStorage<
    ColumnKey[]
  >(VISIBLE_COLUMNS_KEY, DEFAULT_VISIBLE_COLUMNS, userSelectedColumnsVersion);

  const [internalSortBy, setInternalSortBy] = useState<
    { columnKey: SortableColumn; direction: "asc" | "desc" } | undefined
  >({
    columnKey: "Name",
    direction: "asc",
  });

  // Ensure mandatory columns are always included
  const visibleColumns = useMemo(
    () =>
      Array.from(
        new Set([
          ...userSelectedColumns.filter((key) =>
            DEFAULT_VISIBLE_COLUMNS.includes(key),
          ),
          ...MANDATORY_COLUMNS,
        ]),
      ),
    [userSelectedColumns],
  );

  // Reset sort to Name column if the currently sorted column becomes hidden
  const sortBy = useMemo(() => {
    if (internalSortBy) {
      const sortedColumn = internalSortBy.columnKey;
      const sortedColumnNotInVisibleColumns =
        !visibleColumns.includes(sortedColumn);
      if (sortedColumn && sortedColumnNotInVisibleColumns) {
        return { columnKey: "Name" as const, direction: "asc" as const };
      }
    }
    return internalSortBy;
  }, [internalSortBy, visibleColumns]);

  const setVisibleColumns = useCallback(
    (columns: ColumnKey[]) => {
      setUserSelectedColumns(columns);
    },
    [setUserSelectedColumns],
  );

  // ---- Detect job completion and navigate to report -----------------------

  const prevJobRef = useRef<Job | null>(null);
  const isNavigatingRef = useRef(false);

  const [navigationState, navigateToReport] = useAsyncFn(
    async (assessmentId: string) => {
      try {
        const upload = jobsStore.getSnapshot().rvtoolsUpload;
        if (upload?.results.length) {
          rvtoolsReportPersistenceStore.applyUploadOutcome(
            assessmentId,
            upload.results,
            "created",
          );
        }
        await assessmentsStore.get(assessmentId);
        void navigate(routes.assessmentReport(assessmentId));
      } finally {
        isNavigatingRef.current = false;
        jobsStore.reset();
      }
    },
    [assessmentsStore, navigate, jobsStore, rvtoolsReportPersistenceStore],
  );

  useEffect(() => {
    const { currentJob } = jobState;
    const prevJob = prevJobRef.current;
    prevJobRef.current = currentJob;

    if (
      currentJob?.status === JobStatus.Completed &&
      currentJob.assessmentId &&
      prevJob?.status !== JobStatus.Completed &&
      !isNavigatingRef.current
    ) {
      const assessmentId = currentJob.assessmentId;
      isNavigatingRef.current = true;
      jobsStore.stopPolling();

      void navigateToReport(assessmentId);
    }
  }, [jobState, jobsStore, navigateToReport]);

  // ---- Actions ------------------------------------------------------------

  const createRVToolsJob = useCallback(
    async (name: string, files: File[]): Promise<void> => {
      const partialAssessmentId =
        jobsStore.getSnapshot().rvtoolsPartialAssessmentId;
      const job = partialAssessmentId
        ? await jobsStore.appendRvtoolsToAssessment(partialAssessmentId, files)
        : await jobsStore.createRVToolsJob(name, files);
      if (job) {
        jobsStore.startPolling(JOB_POLLING_INTERVAL);
      }
    },
    [jobsStore],
  );

  const clearJobCreateError = useCallback((): void => {
    jobsStore.clearCreateError();
  }, [jobsStore]);

  const clearRvtoolsUploadResults = useCallback((): void => {
    jobsStore.clearRvtoolsUploadResults();
  }, [jobsStore]);

  const removeRvtoolsUploadResult = useCallback(
    (fileName: string, fileSize: number): void => {
      jobsStore.removeRvtoolsUploadResult(fileName, fileSize);
    },
    [jobsStore],
  );

  const completePartialRvtoolsUpload = useCallback(async (): Promise<void> => {
    jobsStore.reset();
    await assessmentsStore.list();
  }, [assessmentsStore, jobsStore]);

  const cancelRVToolsJob = useCallback(async (): Promise<void> => {
    jobsStore.stopPolling();
    const latestJob = await jobsStore.cancelRVToolsJob();

    // If the job had already completed before we could cancel, remove the
    // assessment that was created as a side-effect of the job.
    if (latestJob?.status === JobStatus.Completed && latestJob.assessmentId) {
      try {
        await assessmentsStore.remove(latestJob.assessmentId);
      } catch (err) {
        console.error("Failed to delete assessment after job cancel:", err);
      }
    }
  }, [jobsStore, assessmentsStore]);

  const [updateState, doUpdateAssessment] = useAsyncFn(
    async (id: string, name: string): Promise<void> => {
      await assessmentsStore.update(id, { name });
    },
    [assessmentsStore],
  );

  const [shareState, doShareAssessment] = useAsyncFn(
    async (id: string): Promise<void> => {
      await assessmentsStore.share(id);
    },
    [assessmentsStore],
  );

  const [unshareState, doUnshareAssessment] = useAsyncFn(
    async (id: string): Promise<void> => {
      await assessmentsStore.unshare(id);
    },
    [assessmentsStore],
  );

  const [deleteState, doDeleteAssessment] = useAsyncFn(
    async (id: string): Promise<void> => {
      await assessmentsStore.remove(id);
    },
    [assessmentsStore],
  );

  // ---- Derived job state ---------------------------------------------------

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

  // ---- Return -------------------------------------------------------------

  // Cover the one-render gap between the poll that marks the job Completed
  // (isJobProcessing becomes false) and the effect that starts navigation
  // (navigationState.loading becomes true).  Without this, form inputs
  // briefly re-enable.
  const isNavigatingToReport =
    navigationState.loading ||
    Boolean(
      currentJob?.status === JobStatus.Completed && currentJob?.assessmentId,
    );

  return {
    identity,
    currentJob,
    isCreatingJob: jobState.isCreating,
    jobCreateError: jobState.createError,
    isJobProcessing,
    jobProgressValue,
    jobProgressLabel,
    jobError,
    rvtoolsUpload: jobState.rvtoolsUpload,
    rvtoolsPartialAssessmentId: jobState.rvtoolsPartialAssessmentId,
    isNavigatingToReport,
    isDeletingAssessment: deleteState.loading,
    deleteError: deleteState.error,
    isUpdatingAssessment: updateState.loading,
    updateError: updateState.error,
    isColumnModalOpen,
    setIsColumnModalOpen,
    visibleColumns,
    setVisibleColumns,
    sortBy,
    setSortBy: setInternalSortBy,
    createRVToolsJob,
    clearJobCreateError,
    clearRvtoolsUploadResults,
    removeRvtoolsUploadResult,
    completePartialRvtoolsUpload,
    cancelRVToolsJob,
    updateAssessment: doUpdateAssessment,
    deleteAssessment: doDeleteAssessment,
    shareAssessment: doShareAssessment,
    isSharingAssessment: shareState.loading,
    shareError: shareState.error,
    unshareAssessment: doUnshareAssessment,
    isUnsharingAssessment: unshareState.loading,
    unshareError: unshareState.error,
  };
};
