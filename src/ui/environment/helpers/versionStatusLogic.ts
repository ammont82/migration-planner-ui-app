import type { Agent } from "@openshift-migration-advisor/planner-sdk";

export const AGENT_VERSION_NOT_AVAILABLE = "N/A";
export const AGENT_LABEL_DOWNLOAD_PENDING = "Download pending";
export const AGENT_LABEL_IMAGE_DOWNLOADED = "Image downloaded";
export const AGENT_LABEL_UPDATE_AVAILABLE = "Update available";
export const AGENT_LABEL_OUTDATED = "Outdated";
export const AGENT_LABEL_UP_TO_DATE = "Up to date";

/** @deprecated Use {@link AGENT_LABEL_IMAGE_DOWNLOADED}. */
export const AGENT_LABEL_OVA_DOWNLOADED = AGENT_LABEL_IMAGE_DOWNLOADED;

export type AgentVersionCellStatus =
  | "download-pending"
  | "image-downloaded"
  | "update-available"
  | "outdated"
  | "up-to-date"
  | "not-available";

export type AgentVersionStatusInput = {
  displayStatus: Agent["status"];
  isUploadedManually: boolean;
  isConnected: boolean;
  agentVersion?: string | null;
  agentVersionWarning?: string | null;
  applianceUpdateSupported?: boolean | null;
};

const requiresNewApplianceFromWarning = (warning: string): boolean =>
  warning.includes("does not support in-place") ||
  warning.includes("Deploy a new OVA");

/** Resolves in-place update support from API or warning copy when the field is absent. */
export const resolveInPlaceUpdateSupported = (
  applianceUpdateSupported: boolean | null | undefined,
  agentVersionWarning: string | null | undefined,
): boolean | null => {
  if (applianceUpdateSupported != null) {
    return applianceUpdateSupported;
  }
  if (!agentVersionWarning) {
    return null;
  }
  if (requiresNewApplianceFromWarning(agentVersionWarning)) {
    return false;
  }
  return true;
};

export const getAgentVersionCellStatus = (
  input: AgentVersionStatusInput,
): AgentVersionCellStatus => {
  const { displayStatus, isUploadedManually, isConnected, agentVersion } =
    input;

  if (displayStatus === "not-connected" && isUploadedManually) {
    return "not-available";
  }

  const inPlaceSupported = resolveInPlaceUpdateSupported(
    input.applianceUpdateSupported,
    input.agentVersionWarning,
  );

  if (input.agentVersionWarning) {
    return inPlaceSupported === false ? "outdated" : "update-available";
  }

  if (displayStatus === "not-connected" && !isUploadedManually) {
    return agentVersion ? "image-downloaded" : "download-pending";
  }

  if (isConnected || displayStatus !== "not-connected") {
    return "up-to-date";
  }

  return "up-to-date";
};

/** User-visible agent version label (matches {@link VersionStatus}). */
export const getAgentVersionDisplayLabel = (
  input: AgentVersionStatusInput,
): string => {
  switch (getAgentVersionCellStatus(input)) {
    case "download-pending":
      return AGENT_LABEL_DOWNLOAD_PENDING;
    case "image-downloaded":
      return AGENT_LABEL_IMAGE_DOWNLOADED;
    case "update-available":
      return AGENT_LABEL_UPDATE_AVAILABLE;
    case "outdated":
      return AGENT_LABEL_OUTDATED;
    case "not-available":
      return AGENT_VERSION_NOT_AVAILABLE;
    case "up-to-date":
      return AGENT_LABEL_UP_TO_DATE;
  }
};

export const isDisconnectedDiscoveryAppliance = (
  input: Pick<AgentVersionStatusInput, "displayStatus" | "isUploadedManually">,
): boolean =>
  input.displayStatus === "not-connected" && !input.isUploadedManually;

export const shouldOfferAgentImageDownload = (
  input: AgentVersionStatusInput,
): boolean =>
  isDisconnectedDiscoveryAppliance(input) &&
  getAgentVersionCellStatus(input) === "update-available";
