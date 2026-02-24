import { InfoApi } from "@openshift-migration-advisor/planner-sdk";
import { Configuration } from "@openshift-migration-advisor/planner-sdk";

// API info interface based on the migration-planner API response
interface ApiInfo {
  versionName: string;
  gitCommit: string;
}

// Cache for API info to avoid multiple requests
let apiInfoCache: ApiInfo | null = null;

/**
 * Version information for the Migration Planner UI
 */
export interface VersionInfo {
  ui: {
    name: string;
    versionName: string;
    gitCommit: string;
  };
  api: {
    name: string;
    versionName: string;
    gitCommit: string;
  };
}

/**
 * The function returns the build-time generated UI version.
 * It can be overriden via the MIGRATION_PLANNER_UI_VERSION environment variable.
 */

export const getMigrationPlannerUiVersion = () => {
  return process.env.MIGRATION_PLANNER_UI_VERSION || "unknown";
};

/**
 * Get git commit from build-time environment variable
 */

export const getGitCommit = () => {
  return process.env.MIGRATION_PLANNER_UI_GIT_COMMIT || "unknown";
};

/**
 * Fetch API info from the migration-planner API info endpoint
 */
const fetchApiInfo = async (customFetch?: typeof fetch): Promise<ApiInfo> => {
  if (apiInfoCache) {
    return apiInfoCache;
  }

  try {
    const config = new Configuration({
      basePath: process.env.MIGRATION_PLANNER_API_BASE_URL,
      fetchApi: customFetch,
    });

    const infoApi = new InfoApi(config);
    const info = await infoApi.getInfo();

    apiInfoCache = {
      versionName: info.versionName || "unknown",
      gitCommit: info.gitCommit || "unknown",
    };

    return apiInfoCache;
  } catch (error) {
    console.warn("Could not fetch API info:", error);
    return {
      versionName: "unknown",
      gitCommit: "unknown",
    };
  }
};

/**
 * Get migration-planner API version name
 */

export const getMigrationPlannerApiVersion = () => {
  return apiInfoCache?.versionName || "unknown";
};

/**
 * Get migration-planner API git commit
 */

export const getMigrationPlannerApiGitCommit = () => {
  return apiInfoCache?.gitCommit || "unknown";
};

/**
 * Get comprehensive version information
 */
export const getVersionInfo = (): VersionInfo => {
  return {
    ui: {
      name: "migration-planner-ui-app",
      versionName: getMigrationPlannerUiVersion(),
      gitCommit: getGitCommit(),
    },
    api: {
      name: "migration-planner",
      versionName: getMigrationPlannerApiVersion(),
      gitCommit: getMigrationPlannerApiGitCommit(),
    },
  };
};

/**
 * Add version information to a hidden div in the DOM
 */
export const addVersionInfoToDOM = (): void => {
  const versionInfo = getVersionInfo();

  // Check if the div already exists to avoid duplicates
  let versionDiv = document.getElementById("migration-planner-version-info");

  if (!versionDiv) {
    // Create hidden div with version info
    versionDiv = document.createElement("div");
    versionDiv.id = "migration-planner-version-info";
    versionDiv.hidden = true;

    // Append to body
    document.body.appendChild(versionDiv);
  }

  // Update version attributes (in case API info was fetched after initial render)
  versionDiv.setAttribute("data-ui-name", versionInfo.ui.name);
  versionDiv.setAttribute("data-ui-version", versionInfo.ui.versionName);
  versionDiv.setAttribute("data-ui-git-commit", versionInfo.ui.gitCommit);
  versionDiv.setAttribute("data-api-name", versionInfo.api.name);
  versionDiv.setAttribute("data-api-version", versionInfo.api.versionName);
  versionDiv.setAttribute("data-api-git-commit", versionInfo.api.gitCommit);
};

/**
 * Initialize API info by fetching from the migration-planner API
 */
export const initializeApiInfo = async (
  customFetch?: typeof fetch,
): Promise<void> => {
  await fetchApiInfo(customFetch);
};

/**
 * Expose version information to window object and DOM for developer access
 */
export const exposeVersionInfo = async (
  customFetch?: typeof fetch,
): Promise<void> => {
  // Fetch API info first
  await fetchApiInfo(customFetch);

  const versionInfo = getVersionInfo();

  // make version info available on window object
  (window as unknown as Record<string, unknown>).__MIGRATION_PLANNER_VERSION__ =
    versionInfo;

  // Add version info to hidden div in DOM
  addVersionInfoToDOM();
};
