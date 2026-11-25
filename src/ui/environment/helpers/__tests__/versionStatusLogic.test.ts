import { describe, expect, it } from "vitest";

import {
  AGENT_LABEL_IMAGE_DOWNLOADED,
  AGENT_LABEL_OUTDATED,
  AGENT_LABEL_UP_TO_DATE,
  AGENT_LABEL_UPDATE_AVAILABLE,
  getAgentVersionCellStatus,
  getAgentVersionDisplayLabel,
  shouldOfferAgentImageDownload,
} from "../versionStatusLogic";

describe("versionStatusLogic", () => {
  it('returns "image-downloaded" when disconnected with agentVersion and no warning', () => {
    expect(
      getAgentVersionCellStatus({
        displayStatus: "not-connected",
        isUploadedManually: false,
        isConnected: false,
        agentVersion: "1.2.0",
      }),
    ).toBe("image-downloaded");
    expect(
      getAgentVersionDisplayLabel({
        displayStatus: "not-connected",
        isUploadedManually: false,
        isConnected: false,
        agentVersion: "1.2.0",
      }),
    ).toBe(AGENT_LABEL_IMAGE_DOWNLOADED);
  });

  it('returns "update-available" when in-place update is supported', () => {
    expect(
      getAgentVersionCellStatus({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
        agentVersionWarning: "Version mismatch",
        applianceUpdateSupported: true,
      }),
    ).toBe("update-available");
    expect(
      getAgentVersionDisplayLabel({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
        agentVersionWarning: "Version mismatch",
        applianceUpdateSupported: true,
      }),
    ).toBe(AGENT_LABEL_UPDATE_AVAILABLE);
  });

  it('returns "outdated" when in-place update is not supported', () => {
    expect(
      getAgentVersionCellStatus({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
        agentVersionWarning:
          "Agent version 0.8.0 does not support in-place updates to 1.4.0. Deploy a new OVA to update this source.",
        applianceUpdateSupported: false,
      }),
    ).toBe("outdated");
    expect(
      getAgentVersionDisplayLabel({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
        agentVersionWarning:
          "Agent version 0.8.0 does not support in-place updates to 1.4.0. Deploy a new OVA to update this source.",
        applianceUpdateSupported: false,
      }),
    ).toBe(AGENT_LABEL_OUTDATED);
  });

  it("infers outdated from warning copy when applianceUpdateSupported is missing", () => {
    expect(
      getAgentVersionCellStatus({
        displayStatus: "not-connected",
        isUploadedManually: false,
        isConnected: false,
        agentVersionWarning:
          "does not support in-place updates. Deploy a new OVA",
      }),
    ).toBe("outdated");
  });

  it("offers agent image download only for disconnected update-available", () => {
    expect(
      shouldOfferAgentImageDownload({
        displayStatus: "not-connected",
        isUploadedManually: false,
        isConnected: false,
        agentVersionWarning: "Update available",
        applianceUpdateSupported: true,
      }),
    ).toBe(true);

    expect(
      shouldOfferAgentImageDownload({
        displayStatus: "not-connected",
        isUploadedManually: false,
        isConnected: false,
        agentVersion: "1.4.0",
      }),
    ).toBe(false);

    expect(
      shouldOfferAgentImageDownload({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
        agentVersionWarning: "Update available",
        applianceUpdateSupported: true,
      }),
    ).toBe(false);
  });

  it('returns "up-to-date" for connected sources without warning', () => {
    expect(
      getAgentVersionDisplayLabel({
        displayStatus: "up-to-date",
        isUploadedManually: false,
        isConnected: true,
      }),
    ).toBe(AGENT_LABEL_UP_TO_DATE);
  });
});
