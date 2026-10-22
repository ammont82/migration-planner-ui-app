import { JobStatus } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import type { RvtoolsUploadState } from "../../../../data/stores/JobsStore";
import { getRvtoolsMultiFileUploadProgress } from "../jobProgress";

describe("getRvtoolsMultiFileUploadProgress", () => {
  it("returns null for a single-file upload session", () => {
    const upload: RvtoolsUploadState = {
      results: [
        {
          fileName: "a.xlsx",
          fileSize: 1,
          status: "processing",
        },
      ],
    };
    expect(
      getRvtoolsMultiFileUploadProgress(upload, {
        id: 1,
        status: JobStatus.Validating,
      }),
    ).toBeNull();
  });

  it("weights completed files and the active job into overall progress", () => {
    const upload: RvtoolsUploadState = {
      results: [
        { fileName: "a.xlsx", fileSize: 1, status: "valid" },
        { fileName: "b.xlsx", fileSize: 2, status: "processing" },
        { fileName: "c.xlsx", fileSize: 3, status: "pending" },
      ],
    };

    const progress = getRvtoolsMultiFileUploadProgress(upload, {
      id: 2,
      status: JobStatus.Validating,
    });

    expect(progress).toEqual({
      value: 50,
      label: "File 2 of 3: Validating vms..",
    });
  });
});
