import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateRvtoolsAssessmentViewModel } from "../useCreateRvtoolsAssessmentViewModel";

const makeFile = (name: string): File =>
  new File(["content"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

describe("useCreateRvtoolsAssessmentViewModel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows submit when files are staged and consent is checked", () => {
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
      }),
    );

    act(() => {
      result.current.setAssessmentName("My assessment");
      result.current.setConsentChecked(true);
      result.current.addFiles([makeFile("good.xlsx")]);
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.canSubmit).toBe(true);
    expect(result.current.primaryButtonLabel).toBe("Create assessment");
    expect(result.current.getStagedFilesForSubmit()).toHaveLength(1);
  });

  it("clears job error when the last invalid staged file is removed", () => {
    const onClearError = vi.fn();
    const bad = makeFile("bad.xlsx");
    const good = makeFile("good.xlsx");
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
        onClearError,
      }),
    );

    act(() => {
      result.current.setAssessmentName("My assessment");
      result.current.setConsentChecked(true);
      result.current.addFiles([bad, good]);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.applyUploadResults([
        {
          fileName: bad.name,
          fileSize: bad.size,
          status: "invalid",
          errorMessage: "not a valid zip file",
        },
        {
          fileName: good.name,
          fileSize: good.size,
          status: "valid",
        },
      ]);
    });

    const badId = result.current.stagedFiles.find(
      (entry) => entry.file.name === "bad.xlsx",
    )?.id;
    expect(badId).toBeDefined();

    onClearError.mockClear();

    act(() => {
      result.current.removeFile(badId!);
    });

    expect(onClearError).toHaveBeenCalledOnce();
    expect(result.current.invalidFileCount).toBe(0);
    expect(result.current.showReviewTable).toBe(false);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getStagedFilesForSubmit()).toHaveLength(1);
    expect(result.current.stagedFiles[0]?.status).toBe("staged");
  });

  it("restores the upload view when the last recovery row is removed", () => {
    const bad = makeFile("bad.xlsx");
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
      }),
    );

    act(() => {
      result.current.setAssessmentName("My assessment");
      result.current.setConsentChecked(true);
      result.current.addFiles([bad]);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      result.current.applyUploadResults([
        {
          fileName: bad.name,
          fileSize: bad.size,
          status: "invalid",
          errorMessage: "not valid",
        },
      ]);
    });

    const badId = result.current.stagedFiles[0]?.id;
    expect(badId).toBeDefined();
    if (badId) {
      act(() => {
        result.current.removeFile(badId);
      });
    }

    expect(result.current.showReviewTable).toBe(false);
    expect(result.current.stagedFiles).toHaveLength(0);
  });

  it("resolves partial assessment when the last invalid file is removed", () => {
    const onPartialAssessmentResolved = vi.fn();
    const bad = makeFile("bad.xlsx");
    const good = makeFile("good.xlsx");
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
        resumePartialAssessmentId: "assessment-partial",
        onPartialAssessmentResolved,
      }),
    );

    act(() => {
      result.current.setAssessmentName("My assessment");
      result.current.setConsentChecked(true);
      result.current.addFiles([good, bad]);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      result.current.applyUploadResults([
        {
          fileName: good.name,
          fileSize: good.size,
          status: "valid",
        },
        {
          fileName: bad.name,
          fileSize: bad.size,
          status: "invalid",
          errorMessage: "not a valid zip file",
        },
      ]);
    });

    const badId = result.current.stagedFiles.find(
      (entry) => entry.file.name === "bad.xlsx",
    )?.id;

    act(() => {
      result.current.removeFile(badId!);
    });

    expect(onPartialAssessmentResolved).toHaveBeenCalledOnce();
    expect(result.current.stagedFiles).toHaveLength(0);
  });

  it("allows retry after all files fail when the assessment name is edited", () => {
    const onClearRvtoolsUpload = vi.fn();
    const bad = makeFile("bad.xlsx");
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
        onClearRvtoolsUpload,
      }),
    );

    act(() => {
      result.current.setAssessmentName("1234");
      result.current.setConsentChecked(true);
      result.current.addFiles([bad]);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      result.current.applyUploadResults([
        {
          fileName: bad.name,
          fileSize: bad.size,
          status: "invalid",
          errorMessage:
            "failed to create assessment: assessment with name '1234' already exists",
        },
      ]);
    });

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.showReviewTable).toBe(true);

    act(() => {
      result.current.setAssessmentName("1235");
    });

    expect(onClearRvtoolsUpload).toHaveBeenCalledOnce();
    expect(result.current.showReviewTable).toBe(false);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.getStagedFilesForSubmit()).toHaveLength(1);
  });

  it("does not resolve partial assessment when replacing the last invalid file", () => {
    const onPartialAssessmentResolved = vi.fn();
    const bad = makeFile("bad.xlsx");
    const good = makeFile("good.xlsx");
    const replacement = makeFile("fixed.xlsx");
    const { result } = renderHook(() =>
      useCreateRvtoolsAssessmentViewModel({
        mode: "create",
        isOpen: true,
        isFormDisabled: false,
        resumePartialAssessmentId: "assessment-partial",
        onPartialAssessmentResolved,
      }),
    );

    act(() => {
      result.current.setConsentChecked(true);
      result.current.addFiles([good, bad]);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      result.current.applyUploadResults([
        {
          fileName: good.name,
          fileSize: good.size,
          status: "valid",
        },
        {
          fileName: bad.name,
          fileSize: bad.size,
          status: "invalid",
        },
      ]);
    });

    const badId = result.current.stagedFiles.find(
      (entry) => entry.file.name === "bad.xlsx",
    )?.id;

    act(() => {
      result.current.replaceFile(badId!, replacement);
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onPartialAssessmentResolved).not.toHaveBeenCalled();
    expect(result.current.getStagedFilesForSubmit()).toHaveLength(1);
    expect(result.current.getStagedFilesForSubmit()[0].name).toBe("fixed.xlsx");
  });
});
