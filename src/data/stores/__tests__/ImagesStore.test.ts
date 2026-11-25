import {
  GetSourceDownloadURLImageEnum,
  type ImageApiInterface,
} from "@openshift-migration-advisor/planner-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImagesStore } from "../ImagesStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockApi = (): ImageApiInterface =>
  ({
    headImage: vi.fn(),
    getSourceDownloadURL: vi.fn(),
  }) as unknown as ImageApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ImagesStore", () => {
  let api: ImageApiInterface;
  let store: ImagesStore;

  beforeEach(() => {
    api = createMockApi();
    store = new ImagesStore(api);
  });

  it("initial snapshot is empty object", () => {
    expect(store.getSnapshot()).toEqual({});
  });

  it("headImage() delegates to API", async () => {
    vi.mocked(api.headImage).mockResolvedValue(undefined);

    await store.headImage("s-1");

    expect(api.headImage).toHaveBeenCalledWith(
      { id: "s-1" },
      { signal: undefined },
    );
  });

  it("getDownloadUrl() stores URL and returns it", async () => {
    const url = "https://example.com/ova?token=abc";
    vi.mocked(api.getSourceDownloadURL).mockResolvedValue({ url });

    const result = await store.getDownloadUrl("s-1");

    expect(api.getSourceDownloadURL).toHaveBeenCalledWith(
      { id: "s-1" },
      { signal: undefined },
    );
    expect(result).toBe(url);
    expect(store.getSnapshot()).toEqual({ "s-1": url });
  });

  it("getDownloadUrl() caches URL per sourceId", async () => {
    vi.mocked(api.getSourceDownloadURL)
      .mockResolvedValueOnce({ url: "https://a.com" })
      .mockResolvedValueOnce({ url: "https://b.com" });

    await store.getDownloadUrl("s-1");
    await store.getDownloadUrl("s-2");

    expect(store.getSnapshot()).toEqual({
      "s-1": "https://a.com",
      "s-2": "https://b.com",
    });
  });

  it("getDownloadUrlFromCache() returns undefined for unknown sourceId", () => {
    expect(store.getDownloadUrlFromCache("s-unknown")).toBeUndefined();
  });

  it("getDownloadUrlFromCache() returns cached URL after getDownloadUrl", async () => {
    vi.mocked(api.getSourceDownloadURL).mockResolvedValue({
      url: "https://cached.com",
    });

    await store.getDownloadUrl("s-1");

    expect(store.getDownloadUrlFromCache("s-1")).toBe("https://cached.com");
    expect(store.getDownloadUrlFromCache("s-2")).toBeUndefined();
  });

  it("subscriber notification on getDownloadUrl()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.getSourceDownloadURL).mockResolvedValue({
      url: "https://test.com",
    });
    await store.getDownloadUrl("s-1");

    expect(listener).toHaveBeenCalled();
  });

  it("getAgentImageDownloadUrl() requests appliance image via getSourceDownloadURL", async () => {
    const url = "https://example.com/agent-update.tar?token=abc";
    vi.mocked(api.getSourceDownloadURL).mockResolvedValue({ url });

    const result = await store.getAgentImageDownloadUrl("s-1");

    expect(api.getSourceDownloadURL).toHaveBeenCalledWith(
      { id: "s-1", image: GetSourceDownloadURLImageEnum.Appliance },
      { signal: undefined },
    );
    expect(result).toBe(url);
  });
});
