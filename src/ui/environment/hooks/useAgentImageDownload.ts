import { useCallback, useState } from "react";

import { parseApiError } from "../../../lib/common/ErrorParser";
import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";

const triggerBrowserDownload = (url: string, filename: string): void => {
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  anchor.remove();
};

export const useAgentImageDownload = (): {
  downloadAgentImage: (sourceId: string, sourceName: string) => Promise<void>;
  isDownloading: boolean;
  downloadError: string | null;
  clearDownloadError: () => void;
} => {
  const vm = useEnvironmentPage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const clearDownloadError = useCallback(() => {
    setDownloadError(null);
  }, []);

  const downloadAgentImage = useCallback(
    async (sourceId: string, sourceName: string) => {
      setIsDownloading(true);
      setDownloadError(null);
      try {
        const url = await vm.fetchAgentImageDownloadUrl(sourceId);
        const safeName = sourceName.trim() || "appliance";
        triggerBrowserDownload(url, `${safeName}-update.tar`);
      } catch (error) {
        const parsed = await parseApiError(
          error,
          "Failed to download the appliance update image.",
        );
        setDownloadError(parsed.message);
      } finally {
        setIsDownloading(false);
      }
    },
    [vm],
  );

  return {
    downloadAgentImage,
    isDownloading,
    downloadError,
    clearDownloadError,
  };
};
