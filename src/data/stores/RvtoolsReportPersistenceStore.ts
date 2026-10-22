import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";

import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type {
  IRvtoolsReportPersistenceStore,
  RvtoolsReportPersistenceSnapshot,
  RvtoolsUploadOutcomeContext,
  RvtoolsUploadOutcomeSummary,
} from "./interfaces/IRvtoolsReportPersistenceStore";
import type { RvtoolsFileUploadResult } from "./JobsStore";
import {
  getActiveRvtoolsPendingBatch,
  mergeRvtoolsPendingFailures,
} from "./rvtoolsLocalPersistence";

const summarizeRvtoolsUploadResults = (
  results: RvtoolsFileUploadResult[],
): Pick<
  RvtoolsUploadOutcomeSummary,
  "validFileNames" | "invalidResults" | "attemptedCount"
> => {
  const validFileNames = results
    .filter((entry) => entry.status === "valid")
    .map((entry) => entry.fileName);
  const invalidResults = results.filter((entry) => entry.status === "invalid");
  return {
    validFileNames,
    invalidResults,
    attemptedCount: results.length,
  };
};

export class RvtoolsReportPersistenceStore
  extends ExternalStoreBase<RvtoolsReportPersistenceSnapshot>
  implements IRvtoolsReportPersistenceStore
{
  private snapshot: RvtoolsReportPersistenceSnapshot = {
    assessmentId: undefined,
    pendingBatch: null,
  };

  /** Subset count from last report sync; used for append upload outcome counts. */
  private syncedSubsetCount = 0;

  override getSnapshot(): RvtoolsReportPersistenceSnapshot {
    return this.snapshot;
  }

  syncForReport(
    assessmentId: string | undefined,
    sourceType: string | undefined,
    subsetInventories: AssessmentSubsetInventory[],
  ): void {
    if (!assessmentId || sourceType !== "rvtools") {
      this.syncedSubsetCount = 0;
      if (
        this.snapshot.assessmentId !== undefined ||
        this.snapshot.pendingBatch !== null
      ) {
        this.snapshot = {
          assessmentId: undefined,
          pendingBatch: null,
        };
        this.notify();
      }
      return;
    }

    this.syncedSubsetCount = subsetInventories.length;

    const pendingBatch = getActiveRvtoolsPendingBatch(assessmentId);

    const nextSnapshot: RvtoolsReportPersistenceSnapshot = {
      assessmentId,
      pendingBatch,
    };
    if (JSON.stringify(this.snapshot) === JSON.stringify(nextSnapshot)) {
      return;
    }

    this.snapshot = nextSnapshot;
    this.notify();
  }

  applyUploadOutcome(
    assessmentId: string,
    results: RvtoolsFileUploadResult[],
    context: RvtoolsUploadOutcomeContext,
  ): RvtoolsUploadOutcomeSummary {
    const { validFileNames, invalidResults, attemptedCount } =
      summarizeRvtoolsUploadResults(results);

    const baselineIncludedCount =
      context === "updated" ? this.syncedSubsetCount : 0;
    const includedCount = baselineIncludedCount + validFileNames.length;

    if (invalidResults.length > 0) {
      mergeRvtoolsPendingFailures(assessmentId, invalidResults, {
        includedCount,
        attemptedCount,
        context,
      });
    }

    if (this.snapshot.assessmentId === assessmentId) {
      this.snapshot = {
        assessmentId,
        pendingBatch: getActiveRvtoolsPendingBatch(assessmentId),
      };
      this.notify();
    }

    return {
      validFileNames,
      invalidResults,
      attemptedCount,
      includedCount,
    };
  }
}
