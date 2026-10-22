import type { Job } from "@openshift-migration-advisor/planner-sdk";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { JobsStoreState } from "../JobsStore";

export interface IJobsStore extends ExternalStore<JobsStoreState> {
  /**
   * v2 create: POST first file, then PUT each additional file to aggregate vCenters.
   */
  createRVToolsJob(name: string, files: File[]): Promise<Job | undefined>;
  /**
   * v2 append: PUT one file per job, sequentially.
   */
  appendRvtoolsToAssessment(
    assessmentId: string,
    files: File[],
  ): Promise<Job | undefined>;
  cancelRVToolsJob(): Promise<Job | null>;
  clearCreateError(): void;
  clearRvtoolsUploadResults(): void;
  removeRvtoolsUploadResult(fileName: string, fileSize: number): void;
  reset(): void;
  startPolling(intervalMs: number): void;
  stopPolling(): void;
}
