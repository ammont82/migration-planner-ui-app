import {
  Assessment,
  Job,
  Source,
} from "@openshift-migration-advisor/planner-sdk";

declare namespace DiscoverySources {
  type Context = {
    sources: Source[];
    isLoadingSources: boolean;
    errorLoadingSources?: Error;
    isDeletingSource: boolean;
    errorDeletingSource?: Error;
    isDownloadingSource: boolean;
    errorDownloadingSource?: Error;
    isCreatingSource: boolean;
    errorCreatingSource?: Error;
    isPolling: boolean;
    sourceSelected: Source | null;
    listSources: () => Promise<Source[]>;
    deleteSource: (id: string) => Promise<Source>;
    createDownloadSource: (
      envName: string,
      sourceSshKey: string,
      httpProxy: string,
      httpsProxy: string,
      noProxy: string,
      networkConfigType?: "dhcp" | "static",
      ipAddress?: string,
      subnetMask?: string,
      defaultGateway?: string,
      dns?: string,
    ) => Promise<void>;
    startPolling: (delay: number) => void;
    stopPolling: () => void;
    selectSource: (source: Source) => void;
    selectSourceById: (sourceId: string) => void;
    getSourceById: (sourceId: string) => Source | undefined;
    updateInventory: (sourceId: string, jsonValue: string) => Promise<Source>;
    isUpdatingInventory: boolean;
    errorUpdatingInventory?: Error;
    downloadSourceUrl?: string;
    setDownloadUrl?: (url: string) => void;
    sourceCreatedId?: string | null;
    deleteSourceCreated: () => void;
    clearErrors: (options?: {
      downloading?: boolean;
      updating?: boolean;
      creating?: boolean;
      loadingAssessments?: boolean;
    }) => void;
    updateSource: (
      sourceId: string,
      sourceSshKey: string,
      httpProxy: string,
      httpsProxy: string,
      noProxy: string,
      networkConfigType?: "dhcp" | "static",
      ipAddress?: string,
      subnetMask?: string,
      defaultGateway?: string,
      dns?: string,
    ) => Promise<void>;
    isUpdatingSource: boolean;
    errorUpdatingSource?: Error;
    sourceDownloadUrls: Record<string, string>;
    getDownloadUrlForSource: (sourceId: string) => string | undefined;
    storeDownloadUrlForSource: (sourceId: string, downloadUrl: string) => void;
    assessments: Assessment[];
    isLoadingAssessments: boolean;
    errorLoadingAssessments?: Error;
    listAssessments: () => Promise<Assessment[]>;
    createAssessment: (
      name: string,
      sourceType: string,
      jsonValue?: string,
      sourceId?: string,
      rvToolFile?: File,
    ) => Promise<Assessment>;
    isCreatingAssessment: boolean;
    errorCreatingAssessment?: Error;
    deleteAssessment: (assessmentId: string) => Promise<Assessment>;
    isDeletingAssessment: boolean;
    errorDeletingAssessment?: Error;
    updateAssessment: (
      assessmentId: string,
      name: string,
    ) => Promise<Assessment>;
    isUpdatingAssessment: boolean;
    errorUpdatingAssessment?: Error;
    shareAssessment: (
      assessmentId: string,
      shareData: { userId?: string; orgId?: string },
    ) => Promise<void>;
    isSharingAssessment: boolean;
    errorSharingAssessment?: Error;
    // Assessment from agent state
    assessmentFromAgentState: boolean;
    setAssessmentFromAgent: (value: boolean) => void;
    // RVTools Job State
    currentJob: Job | null;
    isCreatingRVToolsJob: boolean;
    errorCreatingRVToolsJob?: Error;
    // RVTools Job Methods
    createRVToolsJob: (name: string, file: File) => Promise<Job | undefined>;
    cancelRVToolsJob: () => Promise<void>;
    // Callback setter for job success (navigation)
    setOnJobSuccess?: (callback: (assessmentId: string) => void) => void;
  };
}
