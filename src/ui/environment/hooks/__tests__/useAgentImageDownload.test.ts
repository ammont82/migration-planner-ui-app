import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgentImageDownload } from "../useAgentImageDownload";

const mockFetchAgentImageDownloadUrl = vi.fn();

vi.mock("../../view-models/EnvironmentPageContext", () => ({
  useEnvironmentPage: () => ({
    fetchAgentImageDownloadUrl: mockFetchAgentImageDownloadUrl,
  }),
}));

describe("useAgentImageDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("downloads via presigned URL on success", async () => {
    mockFetchAgentImageDownloadUrl.mockResolvedValue(
      "https://example.com/update.tar?sig=1",
    );

    const { result } = renderHook(() => useAgentImageDownload());

    await result.current.downloadAgentImage("src-1", "Lab vCenter");

    expect(mockFetchAgentImageDownloadUrl).toHaveBeenCalledWith("src-1");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(result.current.downloadError).toBeNull();
    expect(result.current.isDownloading).toBe(false);
  });

  it("surfaces an error when URL fetch fails", async () => {
    mockFetchAgentImageDownloadUrl.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAgentImageDownload());

    await result.current.downloadAgentImage("src-1", "Lab vCenter");

    await waitFor(() => {
      expect(result.current.downloadError).toBeTruthy();
    });
    expect(result.current.isDownloading).toBe(false);
  });
});
