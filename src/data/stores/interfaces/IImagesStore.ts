import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";

export interface IImagesStore extends ExternalStore<Record<string, string>> {
  headImage(sourceId: string, signal?: AbortSignal): Promise<void>;
  getDownloadUrl(sourceId: string, signal?: AbortSignal): Promise<string>;
  getDownloadUrlFromCache(sourceId: string): string | undefined;
  getAgentImageDownloadUrl(
    sourceId: string,
    signal?: AbortSignal,
  ): Promise<string>;
}
