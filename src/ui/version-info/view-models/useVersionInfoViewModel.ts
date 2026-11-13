import { useInjection } from "@openshift-migration-advisor/ioc";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAsync } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IVersionsStore } from "../../../data/stores/interfaces/IVersionsStore";
import type { VersionInfo } from "../../../models/VersionInfo";

const WINDOW_KEY = "__MIGRATION_PLANNER_VERSION__";

declare global {
  interface Window {
    [WINDOW_KEY]?: VersionInfo | null;
  }
}

export const useVersionInfoViewModel = () => {
  const versionsStore = useInjection<IVersionsStore>(Symbols.VersionsStore);
  const versionsInfo = useSyncExternalStore(
    versionsStore.subscribe.bind(versionsStore),
    versionsStore.getSnapshot.bind(versionsStore),
  );

  const result = useAsync(() => versionsStore.getApiVersionInfo(), []);
  useAsync(() => versionsStore.getUiVersionInfo(), []);

  const exposeGlobally = useCallback(
    (versionInfo: VersionInfo | null): void => {
      if (versionInfo) {
        window[WINDOW_KEY] = versionInfo;
      } else {
        delete window[WINDOW_KEY];
      }
    },
    [],
  );

  useEffect(() => {
    if (result.value) {
      exposeGlobally(result.value);
    }

    return () => {
      exposeGlobally(null);
    };
  }, [exposeGlobally, result.value]);

  return versionsInfo;
};
