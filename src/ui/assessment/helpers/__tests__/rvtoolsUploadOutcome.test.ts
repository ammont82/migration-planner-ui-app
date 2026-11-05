import { afterEach, describe, expect, it } from "vitest";

import {
  clearRvtoolsPersistenceForTests,
  getRvtoolsPendingUploadBatches,
} from "../../../../data/stores/rvtoolsLocalPersistence";
import { RvtoolsReportPersistenceStore } from "../../../../data/stores/RvtoolsReportPersistenceStore";
import { buildAppendRvtoolsToastMessage } from "../rvtoolsUploadOutcome";

const assessmentId = "test-assessment-id";

describe("rvtoolsUploadOutcome", () => {
  afterEach(() => {
    clearRvtoolsPersistenceForTests();
  });

  it("records pending failures via the persistence store for partial batches", () => {
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
    expect(getRvtoolsPendingUploadBatches(assessmentId)).toHaveLength(1);
    expect(
      getRvtoolsPendingUploadBatches(assessmentId)[0]?.failures,
    ).toHaveLength(1);
  });

  it("does not record an assessment alert when every file in the batch fails", () => {
    const persistenceStore = new RvtoolsReportPersistenceStore();
    persistenceStore.applyUploadOutcome(
      assessmentId,
      [
        {
          fileName: "bad.xlsx",
          fileSize: 1,
          status: "invalid",
          errorMessage: "bad file",
        },
      ],
      "updated",
    );

    expect(getRvtoolsPendingUploadBatches(assessmentId)).toHaveLength(0);
  });

  it("creates a separate alert for each partial-failure upload attempt", () => {
    const persistenceStore = new RvtoolsReportPersistenceStore();
    persistenceStore.applyUploadOutcome(
      assessmentId,
      [
        { fileName: "a.xlsx", fileSize: 1, status: "valid" },
        {
          fileName: "b.xlsx",
          fileSize: 2,
          status: "invalid",
          errorMessage: "bad",
        },
      ],
      "updated",
    );
    persistenceStore.applyUploadOutcome(
      assessmentId,
      [
        { fileName: "c.xlsx", fileSize: 3, status: "valid" },
        {
          fileName: "d.xlsx",
          fileSize: 4,
          status: "invalid",
          errorMessage: "bad",
        },
      ],
      "updated",
    );

    const batches = getRvtoolsPendingUploadBatches(assessmentId);
    expect(batches).toHaveLength(2);
    expect(batches[0]?.includedCount).toBe(1);
    expect(batches[0]?.attemptedCount).toBe(2);
    expect(batches[1]?.includedCount).toBe(1);
    expect(batches[1]?.attemptedCount).toBe(2);
  });

  it("builds a toast only for fully successful append batches", () => {
    const allFailed = buildAppendRvtoolsToastMessage({
      validFileNames: [],
      invalidResults: [
        { fileName: "bad.xlsx", fileSize: 1, status: "invalid" },
      ],
      attemptedCount: 1,
      includedCount: 0,
    });
    expect(allFailed).toBeNull();

    const partial = buildAppendRvtoolsToastMessage({
      validFileNames: ["good.xlsx"],
      invalidResults: [
        { fileName: "bad.xlsx", fileSize: 1, status: "invalid" },
      ],
      attemptedCount: 2,
      includedCount: 1,
    });
    expect(partial).toBeNull();

    const fullSuccess = buildAppendRvtoolsToastMessage({
      validFileNames: ["good.xlsx"],
      invalidResults: [],
      attemptedCount: 1,
      includedCount: 1,
    });
    expect(fullSuccess?.variant).toBe("success");
  });
});
