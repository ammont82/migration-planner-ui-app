import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VersionStatus } from "../VersionStatus";

describe("VersionStatus", () => {
  it("shows connected update-available guidance without a download button", async () => {
    const user = userEvent.setup();

    render(
      <VersionStatus
        displayStatus="up-to-date"
        isUploadedManually={false}
        isConnected
        agentVersionWarning="A newer version is available."
        applianceUpdateSupported
      />,
    );

    const updateLabel = screen.getByRole("button", {
      name: "Update available",
    });
    expect(updateLabel).toBeInTheDocument();
    await user.click(updateLabel);
    expect(screen.getByText(/Software Updates page/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download image" }),
    ).not.toBeInTheDocument();
  });

  it("shows disconnected update-available with Download image", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();

    render(
      <VersionStatus
        displayStatus="not-connected"
        isUploadedManually={false}
        isConnected={false}
        agentVersionWarning="You previously downloaded version 1.2.0."
        applianceUpdateSupported
        onDownloadAgentImage={onDownload}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update available" }));
    await user.click(screen.getByRole("button", { name: "Download image" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("shows outdated with Generate new OVA file", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(
      <VersionStatus
        displayStatus="up-to-date"
        isUploadedManually={false}
        isConnected
        agentVersionWarning="does not support in-place updates. Deploy a new OVA"
        applianceUpdateSupported={false}
        onGenerateNewOva={onGenerate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Outdated" }));
    expect(
      screen.getByRole("heading", { name: "Appliance is outdated" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Generate new OVA file" }),
    );
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows clickable "Image downloaded" when disconnected with agentVersion only', () => {
    render(
      <VersionStatus
        displayStatus="not-connected"
        isUploadedManually={false}
        isConnected={false}
        agentVersion="1.4.0"
        applianceUpdateSupported={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Image downloaded" }),
    ).toBeInTheDocument();
  });

  it("does not show a popover trigger for plain Up to date", () => {
    render(
      <VersionStatus
        displayStatus="up-to-date"
        isUploadedManually={false}
        isConnected
      />,
    );

    expect(screen.getByText("Up to date")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Up to date" }),
    ).not.toBeInTheDocument();
  });
});
