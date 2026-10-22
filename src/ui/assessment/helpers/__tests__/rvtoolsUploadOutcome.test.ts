import { afterEach, describe, expect, it } from "vitest";

import {
  clearRvtoolsPersistenceForTests,
  getRvtoolsPendingUploadBatch,
} from "../../../../data/stores/rvtoolsLocalPersistence";
import { RvtoolsReportPersistenceStore } from "../../../../data/stores/RvtoolsReportPersistenceStore";
import { buildAppendRvtoolsToastMessage } from "../rvtoolsUploadOutcome";

const assessmentId = "test-assessment-id";

describe("rvtoolsUploadOutcome", () => {
  afterEach(() => {
    clearRvtoolsPersistenceForTests();
  });

  it("records pending failures via the persistence store", () => {
    const persistenceStore = new RvtoolsReportPersistenceStore();
    const summary = persistenceStore.applyUploadOutcome(
      assessmentId,
      [
        { fileName: "a.xlsx", fileSize: 1, status: "valid" },
        {
          fileName: "b.xlsx",
          fileSize: 2,
          status: "invalid",
          errorMessage: "bad file",
        },
      ],
      "created",
    );

    expect(summary.includedCount).toBe(1);
    expect(getRvtoolsPendingUploadBatch(assessmentId)?.failures).toHaveLength(
      1,
    );
  });

  it("builds an all-failed append toast", () => {
    const message = buildAppendRvtoolsToastMessage({
      validFileNames: [],
      invalidResults: [
        { fileName: "bad.xlsx", fileSize: 1, status: "invalid" },
      ],
      attemptedCount: 1,
      includedCount: 2,
    });
    expect(message?.variant).toBe("warning");
    expect(message?.message).toContain("No files added");
  });
});
