import type { AssessmentSubsetInventory } from "@openshift-migration-advisor/planner-sdk";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { RvtoolsFileUploadResult } from "../JobsStore";
import type { RvtoolsPendingUploadBatch } from "../rvtoolsLocalPersistence";

export type RvtoolsReportPersistenceSnapshot = {
  assessmentId: string | undefined;
  pendingBatches: RvtoolsPendingUploadBatch[];
};

export type RvtoolsUploadOutcomeContext = "created" | "updated";

export type RvtoolsUploadOutcomeSummary = {
  validFileNames: string[];
  invalidResults: RvtoolsFileUploadResult[];
  attemptedCount: number;
  includedCount: number;
};

export interface IRvtoolsReportPersistenceStore extends ExternalStore<RvtoolsReportPersistenceSnapshot> {
  syncForReport(
    assessmentId: string | undefined,
    sourceType: string | undefined,
    subsetInventories: AssessmentSubsetInventory[],
  ): void;
  applyUploadOutcome(
    assessmentId: string,
    results: RvtoolsFileUploadResult[],
    context: RvtoolsUploadOutcomeContext,
  ): RvtoolsUploadOutcomeSummary;
}
