import React, { useState } from "react";

import { DownloadEnvironmentModal } from "./DownloadEnvironmentModal";
import { EnvironmentModal } from "./EnvironmentModal";

export type DiscoveryApplianceDownload =
  | { downloadUrl: string; sourceName: string }
  | { sourceId: string; sourceName: string };

export type DiscoveryApplianceModalState =
  | { mode: "create" }
  | { mode: "edit"; sourceId: string }
  | { mode: "download"; download: DiscoveryApplianceDownload };

export type DiscoveryApplianceModalStage = "create" | "download";

export interface DiscoveryApplianceModalProps {
  isOpen: boolean;
  onClose: (stage: DiscoveryApplianceModalStage) => void;
  state: DiscoveryApplianceModalState;
  onCreationSuccess?: (downloadUrl: string, sourceName: string) => void;
  onStartDownload?: () => void;
  onAfterDownload?: () => Promise<void>;
}

export const DiscoveryApplianceModal: React.FC<
  DiscoveryApplianceModalProps
> = ({
  isOpen,
  onClose,
  state,
  onCreationSuccess,
  onStartDownload,
  onAfterDownload,
}) => {
  const initialDownload =
    state.mode === "download" ? state.download : undefined;
  const isDownloadState = state.mode === "download";
  const [createdDownload, setCreatedDownload] = useState<
    DiscoveryApplianceDownload | undefined
  >(undefined);
  const isDownloadStep = isDownloadState || Boolean(createdDownload);
  const currentDownload = initialDownload ?? createdDownload;
  const downloadUrl =
    currentDownload && "downloadUrl" in currentDownload
      ? currentDownload.downloadUrl
      : undefined;
  const downloadSourceId =
    currentDownload && "sourceId" in currentDownload
      ? currentDownload.sourceId
      : undefined;

  const handleCreationSuccess = (
    downloadUrl: string,
    sourceName: string,
  ): void => {
    setCreatedDownload({ downloadUrl, sourceName });
    onCreationSuccess?.(downloadUrl, sourceName);
  };

  const handleClose = (): void => {
    const closedStage: DiscoveryApplianceModalStage = isDownloadStep
      ? "download"
      : "create";
    setCreatedDownload(undefined);
    onClose(closedStage);
  };

  if (!isDownloadStep) {
    return state.mode === "edit" ? (
      <EnvironmentModal
        isOpen={isOpen}
        onClose={handleClose}
        sourceId={state.sourceId}
        onSuccess={handleCreationSuccess}
      />
    ) : (
      <EnvironmentModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleCreationSuccess}
      />
    );
  }

  return (
    <DownloadEnvironmentModal
      isOpen={isOpen}
      onClose={handleClose}
      downloadUrl={downloadUrl}
      sourceName={currentDownload?.sourceName ?? ""}
      sourceId={downloadSourceId}
      onStartDownload={onStartDownload}
      onAfterDownload={onAfterDownload}
    />
  );
};

DiscoveryApplianceModal.displayName = "DiscoveryApplianceModal";
