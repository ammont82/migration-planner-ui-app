import type { Job } from "@openshift-migration-advisor/planner-sdk";
import { JobStatus } from "@openshift-migration-advisor/planner-sdk";

import type { RvtoolsUploadState } from "../../../data/stores/JobsStore";

export const getRvtoolsJobProgressValue = (status: JobStatus): number => {
  switch (status) {
    case JobStatus.Pending:
      return 20;
    case JobStatus.Validating:
      return 50;
    case JobStatus.Parsing:
      return 80;
    case JobStatus.Completed:
      return 100;
    default:
      return 0;
  }
};

export const getRvtoolsJobProgressLabel = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.Pending:
      return "Uploading file..";
    case JobStatus.Parsing:
      return "Parsing data..";
    case JobStatus.Validating:
      return "Validating vms..";
    case JobStatus.Completed:
      return "Complete!";
    case JobStatus.Failed:
      return "Failed";
    case JobStatus.Cancelled:
      return "Cancelled";
    default:
      return "";
  }
};

/**
 * Overall progress for sequential multi-file RVTools uploads (one job per file).
 */
export const getRvtoolsMultiFileUploadProgress = (
  upload: RvtoolsUploadState | undefined,
  currentJob: Job | null,
): { value: number; label: string } | null => {
  const results = upload?.results;
  if (!results?.length || results.length <= 1) {
    return null;
  }

  const total = results.length;
  const fileWeight = 100 / total;
  let value = 0;

  for (const entry of results) {
    if (entry.status === "valid" || entry.status === "invalid") {
      value += fileWeight;
    } else if (entry.status === "processing") {
      const jobProgress = currentJob
        ? getRvtoolsJobProgressValue(currentJob.status)
        : 0;
      value += (jobProgress / 100) * fileWeight;
    }
  }

  const processingIndex = results.findIndex(
    (entry) => entry.status === "processing",
  );
  const completedCount = results.filter(
    (entry) => entry.status === "valid" || entry.status === "invalid",
  ).length;

  let label = "Processing files..";
  if (processingIndex >= 0) {
    const stepLabel = currentJob
      ? getRvtoolsJobProgressLabel(currentJob.status)
      : "Processing";
    label = `File ${processingIndex + 1} of ${total}: ${stepLabel}`;
  } else if (completedCount === 0) {
    label = "Uploading files..";
  }

  return { value: Math.round(value), label };
};
