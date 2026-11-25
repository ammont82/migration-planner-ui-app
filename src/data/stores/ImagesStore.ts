import {
  GetSourceDownloadURLImageEnum,
  type ImageApiInterface,
} from "@openshift-migration-advisor/planner-sdk";

import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type { IImagesStore } from "./interfaces/IImagesStore";

export class ImagesStore
  extends ExternalStoreBase<Record<string, string>>
  implements IImagesStore
{
  private downloadUrls: Record<string, string> = {};
  private api: ImageApiInterface;

  constructor(api: ImageApiInterface) {
    super();
    this.api = api;
  }

  async headImage(sourceId: string, signal?: AbortSignal): Promise<void> {
    await this.api.headImage({ id: sourceId }, { signal });
  }

  async getDownloadUrl(
    sourceId: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const response = await this.api.getSourceDownloadURL(
      { id: sourceId },
      { signal },
    );
    this.downloadUrls = {
      ...this.downloadUrls,
      [sourceId]: response.url,
    };
    this.notify();
    return response.url;
  }

  async getAgentImageDownloadUrl(
    sourceId: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const response = await this.api.getSourceDownloadURL(
      { id: sourceId, image: GetSourceDownloadURLImageEnum.Appliance },
      { signal },
    );
    return response.url;
  }

  getDownloadUrlFromCache(sourceId: string): string | undefined {
    return this.downloadUrls[sourceId];
  }

  override getSnapshot(): Record<string, string> {
    return this.downloadUrls;
  }
}
