import "@testing-library/jest-dom";

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RvtoolsUploadState } from "../../../../../data/stores/JobsStore";
import {
  RVTOOLS_APPEND_ALL_FAILED_MODAL_MESSAGE,
  RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE,
} from "../../../helpers/rvtoolsUploadOutcome";
import CreateRvtoolsAssessmentModal from "../CreateRvtoolsAssessmentModal";

const makeFile = (name: string): File =>
  new File(["content"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

const renderAppendModal = (rvtoolsUpload?: RvtoolsUploadState) =>
  render(
    <CreateRvtoolsAssessmentModal
      mode="append"
      isOpen
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      rvtoolsUpload={rvtoolsUpload}
    />,
  );

const stageFiles = async (files: File[]): Promise<void> => {
  const user = userEvent.setup();
  const fileInput = document.querySelector('input[type="file"][multiple]');
  if (!(fileInput instanceof HTMLInputElement)) {
    throw new Error("RVTools file input not found");
  }
  await user.upload(fileInput, files);
  await waitFor(() => {
    expect(
      screen.getByText(`${files.length} of 10 files selected`),
    ).toBeInTheDocument();
  });
};

afterEach(() => {
  cleanup();
});

describe("CreateRvtoolsAssessmentModal", () => {
  it("shows the all-failed append alert in the modal when every uploaded file is invalid", async () => {
    const badFile = makeFile("invalid-third-file.xlsx");
    const { rerender } = renderAppendModal();

    await stageFiles([badFile]);

    rerender(
      <CreateRvtoolsAssessmentModal
        mode="append"
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        rvtoolsUpload={{
          results: [
            {
              fileName: badFile.name,
              fileSize: badFile.size,
              status: "invalid",
              errorMessage:
                "File could not be read. Export a new copy from RVTools.",
            },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(RVTOOLS_APPEND_ALL_FAILED_MODAL_MESSAGE),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).queryByText("No assessment created"),
    ).not.toBeInTheDocument();
  });

  it("does not show the all-failed append alert when some files in the batch succeeded", async () => {
    const goodFile = makeFile("good.xlsx");
    const badFile = makeFile("bad.xlsx");
    const { rerender } = renderAppendModal();

    await stageFiles([goodFile, badFile]);

    rerender(
      <CreateRvtoolsAssessmentModal
        mode="append"
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        rvtoolsUpload={{
          results: [
            {
              fileName: goodFile.name,
              fileSize: goodFile.size,
              status: "valid",
            },
            {
              fileName: badFile.name,
              fileSize: badFile.size,
              status: "invalid",
              errorMessage: "bad file",
            },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(RVTOOLS_APPEND_ALL_FAILED_MODAL_TITLE),
    ).not.toBeInTheDocument();
  });
});
