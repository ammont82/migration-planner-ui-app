import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { VersionInfo } from "../../../models/VersionInfo";

export interface IVersionsStore extends ExternalStore<VersionInfo> {
  getApiVersionInfo(signal?: AbortSignal): Promise<VersionInfo>;
  getUiVersionInfo(signal?: AbortSignal): Promise<VersionInfo>;
}
