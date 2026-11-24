import React, { useState } from "react";

import { DownloadEnvironmentModal } from "./DownloadEnvironmentModal";
import { EnvironmentModal } from "./EnvironmentModal";

export type DiscoveryApplianceDownload =
  | { downloadUrl: string; sourceName: string }
  | { sourceId: string; sourceName: string };

export type DiscoveryApplianceModalInitialState =
  | { mode: "create" }
  | { mode: "edit"; sourceId: string }
  | { mode: "download"; download: DiscoveryApplianceDownload };

export interface DiscoveryApplianceModalProps {
  initialState: DiscoveryApplianceModalInitialState;
  onCreationSuccess?: (downloadUrl: string, sourceName: string) => void;
  onCancel: () => void;
  onStartDownload?: () => void;
  onAfterDownload?: () => Promise<void>;
  onClose: () => void;
}

export const DiscoveryApplianceModal: React.FC<
  DiscoveryApplianceModalProps
> = ({
  initialState,
  onCreationSuccess,
  onCancel,
  onStartDownload,
  onAfterDownload,
  onClose,
}) => {
  const [state, setState] = useState(initialState);
  const currentDownload =
    state.mode === "download" ? state.download : undefined;
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
    setState({
      mode: "download",
      download: { downloadUrl, sourceName },
    });
    onCreationSuccess?.(downloadUrl, sourceName);
  };

  if (state.mode !== "download") {
    return state.mode === "edit" ? (
      <EnvironmentModal
        isOpen
        onClose={onCancel}
        sourceId={state.sourceId}
        onSuccess={handleCreationSuccess}
      />
    ) : (
      <EnvironmentModal
        isOpen
        onClose={onCancel}
        onSuccess={handleCreationSuccess}
      />
    );
  }

  return (
    <DownloadEnvironmentModal
      isOpen
      onClose={onClose}
      downloadUrl={downloadUrl}
      sourceName={currentDownload?.sourceName ?? ""}
      sourceId={downloadSourceId}
      onStartDownload={onStartDownload}
      onAfterDownload={onAfterDownload}
    />
  );
};

DiscoveryApplianceModal.displayName = "DiscoveryApplianceModal";
