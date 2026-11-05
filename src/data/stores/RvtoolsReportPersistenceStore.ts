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
  appendRvtoolsPendingUploadBatch,
  getActiveRvtoolsPendingBatches,
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
    pendingBatches: [],
  };

  override getSnapshot(): RvtoolsReportPersistenceSnapshot {
    return this.snapshot;
  }

  syncForReport(
    assessmentId: string | undefined,
    sourceType: string | undefined,
    _subsetInventories: AssessmentSubsetInventory[],
  ): void {
    if (!assessmentId || sourceType !== "rvtools") {
      if (
        this.snapshot.assessmentId !== undefined ||
        this.snapshot.pendingBatches.length > 0
      ) {
        this.snapshot = {
          assessmentId: undefined,
          pendingBatches: [],
        };
        this.notify();
      }
      return;
    }

    const pendingBatches = getActiveRvtoolsPendingBatches(assessmentId);

    const nextSnapshot: RvtoolsReportPersistenceSnapshot = {
      assessmentId,
      pendingBatches,
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

    const includedCount = validFileNames.length;
    const isPartialFailure = includedCount > 0 && invalidResults.length > 0;

    if (isPartialFailure) {
      appendRvtoolsPendingUploadBatch(assessmentId, {
        includedCount,
        attemptedCount,
        failures: invalidResults,
        context,
      });
    }

    if (this.snapshot.assessmentId === assessmentId) {
      this.snapshot = {
        assessmentId,
        pendingBatches: getActiveRvtoolsPendingBatches(assessmentId),
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
