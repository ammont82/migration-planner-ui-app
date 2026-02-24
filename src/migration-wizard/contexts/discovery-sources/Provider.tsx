import {
  type AssessmentApiInterface,
  type ImageApiInterface,
  JobApi,
  type SourceApiInterface,
} from "@openshift-migration-advisor/planner-sdk";
import {
  Assessment,
  Inventory,
  Source,
  UpdateInventoryFromJSON,
} from "@openshift-migration-advisor/planner-sdk";
import { Configuration } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@migration-planner-ui/ioc";
import React, {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAsyncFn, useInterval } from "react-use";

import { useAsyncFnResetError } from "../../../hooks/useAsyncFnResetError";
import { Symbols } from "../../../main/Symbols";
import { useRVToolsJob } from "../../../pages/assessment/hooks/useRVToolsJob";
import { DiscoverySources } from "./@types/DiscoverySources";
import { Context } from "./Context";

// Use a shared constant to avoid recreating empty array references on each render
const EMPTY_ARRAY: unknown[] = [];

type ApiErrorWithResponse = { response: Response };

const hasResponse = (error: unknown): error is ApiErrorWithResponse => {
  return typeof error === "object" && error !== null && "response" in error;
};

const coerceToError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return new Error((error as { message: string }).message);
  }
  return new Error(fallbackMessage);
};

const ensureValidUpdatedSource = (updatedSource: unknown): Source => {
  if (
    !updatedSource ||
    typeof updatedSource !== "object" ||
    !("id" in updatedSource)
  ) {
    if (typeof updatedSource === "string") {
      throw new Error(updatedSource);
    }
    throw new Error("Unexpected API response while updating inventory.");
  }
  return updatedSource as Source;
};

const ensureInventoryPayload = (value: unknown): Inventory => {
  if (!value || typeof value !== "object") {
    throw new Error("Inventory JSON must be an object.");
  }
  if (!("vcenterId" in value) || !("clusters" in value)) {
    throw new Error("Inventory JSON must include vcenterId and clusters.");
  }
  return value as Inventory;
};

const extractResponseErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText) as unknown;
      if (errorData && typeof errorData === "object") {
        const typedError = errorData as { message?: unknown; error?: unknown };
        if (typeof typedError.message === "string") {
          return typedError.message;
        }
        if (typeof typedError.error === "string") {
          return typedError.error;
        }
      }
      return errorText;
    } catch {
      return errorText || "Failed to parse API error response.";
    }
  } catch {
    return "Error response could not be read.";
  }
};

export const Provider: React.FC<PropsWithChildren> = (props) => {
  const { children } = props;
  const [sourceSelected, setSourceSelected] = useState<Source | null>(null);

  const [downloadSourceUrl, setDownloadSourceUrl] = useState("");
  const [sourceDownloadUrls, setSourceDownloadUrls] = useState<
    Record<string, string>
  >({});

  const [sourceCreatedId, setSourceCreatedId] = useState<string | null>(null);

  // Indicate if the user wants to create an assessment from agent
  // It is used by sourceTable to show Back button.
  const [assessmentFromAgentState, setAssessmentFromAgent] =
    useState<boolean>(false);

  // Callback ref for job success - set by consuming component (Assessment.tsx)
  const onJobSuccessRef = useRef<((assessmentId: string) => void) | null>(null);

  const sourceApi = useInjection<SourceApiInterface>(Symbols.SourceApi);
  const imageApi = useInjection<ImageApiInterface>(Symbols.ImageApi);
  const assessmentApi = useInjection<AssessmentApiInterface>(
    Symbols.AssessmentApi,
  );

  // Create jobApi instance (same pattern as assessmentService)
  const jobApi = React.useMemo(() => {
    const baseUrl = process.env.MIGRATION_PLANNER_API_BASE_URL;
    const fetchApi =
      (
        assessmentApi as unknown as {
          configuration?: { fetchApi?: typeof fetch };
        }
      ).configuration?.fetchApi || fetch;
    const config = new Configuration({ basePath: baseUrl, fetchApi });
    return new JobApi(config);
  }, [assessmentApi]);

  const [listSourcesState, listSources] = useAsyncFn(async (): Promise<
    Source[]
  > => {
    const sources = await sourceApi.listSources();
    // Always return a new array reference to trigger React updates
    return [...sources];
  }, [sourceApi]);

  function normalizeAssessmentsResponse(response: unknown): Assessment[] {
    if (Array.isArray(response)) {
      return response as Assessment[];
    }
    if (typeof response === "object" && response !== null) {
      const withItems = response as { items?: unknown };
      if (Array.isArray(withItems.items)) {
        return withItems.items as Assessment[];
      }
      const withAssessments = response as { assessments?: unknown };
      if (Array.isArray(withAssessments.assessments)) {
        return withAssessments.assessments as Assessment[];
      }
    }
    return [];
  }

  const [listAssessmentsState, listAssessments] = useAsyncFnResetError(
    async (): Promise<Assessment[]> => {
      const response = await assessmentApi.listAssessments({});
      return normalizeAssessmentsResponse(response);
    },
  );

  // Callback to delete assessment (used when cancelling a completed job)
  const handleDeleteAssessment = useCallback(
    async (assessmentId: string) => {
      await assessmentApi.deleteAssessment({ id: assessmentId });
      await listAssessments();
    },
    [assessmentApi, listAssessments],
  );

  // Callback for successful job completion - calls the ref callback if set
  const handleJobSuccess = useCallback(
    (assessmentId: string) => {
      void listAssessments();
      if (onJobSuccessRef.current) {
        onJobSuccessRef.current(assessmentId);
      }
    },
    [listAssessments],
  );

  // Setter for the success callback - used by consuming components
  const setOnJobSuccess = useCallback(
    (callback: (assessmentId: string) => void) => {
      onJobSuccessRef.current = callback;
    },
    [],
  );

  // RVTools Job State Hook - uses onSuccess callback pattern
  const {
    currentJob,
    isCreatingRVToolsJob,
    errorCreatingRVToolsJob,
    createRVToolsJob,
    cancelRVToolsJob,
  } = useRVToolsJob({
    jobApi,
    onSuccess: handleJobSuccess,
    onDeleteAssessment: handleDeleteAssessment,
  });

  const [createAssessmentState, createAssessment] = useAsyncFn(
    async (
      name: string,
      sourceType: string,
      jsonValue?: string,
      sourceId?: string,
      _rvToolFile?: File,
    ) => {
      const assessmentName = name || `Assessment-${new Date().toISOString()}`;

      // Create different request based on sourceType
      if (sourceType === "inventory" && jsonValue) {
        try {
          const parsedInventory = ensureInventoryPayload(JSON.parse(jsonValue));
          const assessment = await assessmentApi.createAssessment({
            assessmentForm: {
              name: assessmentName,
              sourceType: sourceType,
              inventory: parsedInventory,
            },
          });
          await listAssessments();
          return assessment;
        } catch (error: unknown) {
          if (hasResponse(error)) {
            const message = await extractResponseErrorMessage(error.response);
            throw new Error(message);
          }
          throw coerceToError(
            error,
            "Unexpected API response while creating assessment.",
          );
        }
      } else if (sourceType === "rvtools") {
        throw new Error(
          "RVTools assessments must be created using createRVToolsJob for async processing",
        );
      } else if (sourceType === "agent" && sourceId) {
        try {
          const assessment = await assessmentApi.createAssessment({
            assessmentForm: {
              sourceId: sourceId,
              name: assessmentName,
              sourceType: sourceType,
            },
          });
          await listAssessments();
          return assessment;
        } catch (error: unknown) {
          if (hasResponse(error)) {
            const message = await extractResponseErrorMessage(error.response);
            throw new Error(message);
          }
          throw coerceToError(
            error,
            "Unexpected API response while creating assessment.",
          );
        }
      } else {
        throw new Error(
          `Invalid parameters for assessment creation: ${sourceType}`,
        );
      }
    },
  );

  const [updateAssessmentState, updateAssessment] = useAsyncFn(
    async (assessmentId: string, name: string) => {
      const updatedAssessment = await assessmentApi.updateAssessment({
        id: assessmentId,
        assessmentUpdate: {
          name: name,
        },
      });
      await listAssessments();
      return updatedAssessment;
    },
  );

  const [deleteAssessmentState, deleteAssessment] = useAsyncFn(
    async (assessmentId: string) => {
      const deletedAssessment = await assessmentApi.deleteAssessment({
        id: assessmentId,
      });
      await listAssessments();
      return deletedAssessment;
    },
  );

  const [deleteSourceState, deleteSource] = useAsyncFn(async (id: string) => {
    const deletedSource = await sourceApi.deleteSource({ id });
    return deletedSource;
  });

  const [createSourceState, createSource] = useAsyncFnResetError(
    async (
      name: string,
      sshPublicKey: string,
      httpProxy: string,
      httpsProxy: string,
      noProxy: string,
      networkConfigType?: "dhcp" | "static",
      ipAddress?: string,
      subnetMask?: string,
      defaultGateway?: string,
      dns?: string,
    ) => {
      try {
        // Build the sourceCreate object conditionally
        const sourceCreate: {
          name: string;
          sshPublicKey?: string;
          proxy?: {
            httpUrl?: string;
            httpsUrl?: string;
            noProxy?: string;
          };
          network?: {
            ipv4?: {
              ipAddress: string;
              subnetMask: string;
              defaultGateway: string;
              dns: string;
            };
          };
        } = { name };

        // Only include sshPublicKey if it has a value
        if (sshPublicKey && sshPublicKey.trim()) {
          sourceCreate.sshPublicKey = sshPublicKey;
        }

        // Only include proxy if at least one proxy field has a value
        const proxyFields: {
          httpUrl?: string;
          httpsUrl?: string;
          noProxy?: string;
        } = {};
        if (httpProxy && httpProxy.trim()) {
          proxyFields.httpUrl = httpProxy;
        }
        if (httpsProxy && httpsProxy.trim()) {
          proxyFields.httpsUrl = httpsProxy;
        }
        if (noProxy && noProxy.trim()) {
          proxyFields.noProxy = noProxy;
        }

        // Only add proxy object if it has at least one field
        if (Object.keys(proxyFields).length > 0) {
          sourceCreate.proxy = proxyFields;
        }

        // Only include network configuration if static IP is selected and all required fields are provided
        if (
          networkConfigType === "static" &&
          ipAddress?.trim() &&
          subnetMask?.trim() &&
          defaultGateway?.trim() &&
          dns?.trim()
        ) {
          sourceCreate.network = {
            ipv4: {
              ipAddress: ipAddress.trim(),
              subnetMask: subnetMask.trim(),
              defaultGateway: defaultGateway.trim(),
              dns: dns.trim(),
            },
          };
        }

        return await sourceApi.createSource({ sourceCreate });
      } catch (error: unknown) {
        console.error("Error creating source:", error);

        if (hasResponse(error)) {
          const message = await extractResponseErrorMessage(error.response);
          throw new Error(message);
        }

        throw new Error("Unexpected error occurred while creating the source.");
      }
    },
  );

  const [downloadSourceState, createDownloadSource] = useAsyncFnResetError(
    async (
      sourceName: string,
      sourceSshKey: string,
      httpProxy: string,
      httpsProxy: string,
      noProxy: string,
      networkConfigType?: "dhcp" | "static",
      ipAddress?: string,
      subnetMask?: string,
      defaultGateway?: string,
      dns?: string,
    ): Promise<void> => {
      const newSource = await createSource(
        sourceName,
        sourceSshKey,
        httpProxy,
        httpsProxy,
        noProxy,
        networkConfigType,
        ipAddress,
        subnetMask,
        defaultGateway,
        dns,
      );

      // useAsyncFnResetError returns the error object as a value instead of throwing
      // Check if newSource is actually an Error object
      if (newSource instanceof Error) {
        throw newSource;
      }

      // Validate that we got a valid source before proceeding
      if (!newSource || !newSource.id) {
        throw new Error(
          "Failed to create source: invalid response from server",
        );
      }

      await imageApi.headImage({ id: newSource.id });
      const imageUrl = await imageApi.getSourceDownloadURL({
        id: newSource.id,
      });

      storeDownloadUrlForSource(newSource.id, imageUrl.url);
      setDownloadSourceUrl(imageUrl.url);
      setSourceCreatedId(newSource.id);
    },
  );

  const getDownloadUrlForSource = useCallback(
    (sourceId: string): string | undefined => {
      return sourceDownloadUrls[sourceId];
    },
    [sourceDownloadUrls],
  );

  const storeDownloadUrlForSource = useCallback(
    (sourceId: string, downloadUrl: string) => {
      setSourceDownloadUrls((prev) => ({
        ...prev,
        [sourceId]: downloadUrl,
      }));
    },
    [],
  );

  const [isPolling, setIsPolling] = useState(false);
  const [pollingDelay, setPollingDelay] = useState<number | null>(null);
  // UI-level error dismiss flags
  const [dismissDownloadError, setDismissDownloadError] = useState(false);
  const [dismissUpdateError, setDismissUpdateError] = useState(false);
  const [dismissCreateError, setDismissCreateError] = useState(false);
  const [dismissAssessmentsLoadError, setDismissAssessmentsLoadError] =
    useState(false);
  const startPolling = useCallback(
    (delay: number) => {
      if (!isPolling) {
        setPollingDelay(delay);
        setIsPolling(true);
      }
    },
    [isPolling],
  );
  const stopPolling = useCallback(() => {
    if (isPolling) {
      setPollingDelay(null);
      setIsPolling(false);
    }
  }, [isPolling]);

  useInterval(() => {
    if (!listAssessmentsState.loading) {
      void listAssessments();
    }
    if (!listSourcesState.loading) {
      void listSources();
    }
  }, pollingDelay);

  const selectSource = useCallback((source: Source | null) => {
    setSourceSelected(source);
  }, []);

  const selectSourceById = useCallback(
    (sourceId: string) => {
      if (!listSourcesState.loading) {
        const source = listSourcesState.value?.find(
          (source) => source.id === sourceId,
        );
        setSourceSelected(source || null);
      } else {
        void listSources().then((_sources) => {
          const source = _sources.find((source) => source.id === sourceId);
          setSourceSelected(source || null);
        });
      }
    },
    [listSources, listSourcesState],
  );

  const getSourceById = useCallback(
    (sourceId: string) => {
      const source = listSourcesState.value?.find(
        (source) => source.id === sourceId,
      );
      return source;
    },
    [listSourcesState.value],
  );

  const [updateInventoryState, updateInventory] = useAsyncFn(
    async (sourceId: string, jsonValue: string) => {
      try {
        const payload = JSON.parse(jsonValue) as unknown;
        if (!payload || typeof payload !== "object") {
          throw new Error("Inventory JSON must be an object.");
        }
        const updatedSource = await sourceApi.updateInventory({
          id: sourceId,
          updateInventory: UpdateInventoryFromJSON(payload),
        });
        // Some backends may return a string on error without proper HTTP status
        return ensureValidUpdatedSource(updatedSource);
      } catch (error: unknown) {
        console.log("updateInventoryState catch", error);
        if (hasResponse(error)) {
          const message = await extractResponseErrorMessage(error.response);
          console.log("updateInventoryState message", message);
          throw new Error(message);
        }
        throw coerceToError(
          error,
          "Unexpected API response while updating inventory.",
        );
      }
    },
  );

  const setDownloadUrl = useCallback((url: string) => {
    setDownloadSourceUrl(url);
  }, []);

  const deleteSourceCreated = useCallback(() => {
    setSourceCreatedId(null);
  }, []);

  const [updateSourceState, updateSource] = useAsyncFnResetError(
    async (
      sourceId: string,
      sshPublicKey: string,
      httpProxy: string,
      httpsProxy: string,
      noProxy: string,
      networkConfigType?: "dhcp" | "static",
      ipAddress?: string,
      subnetMask?: string,
      defaultGateway?: string,
      dns?: string,
    ): Promise<void> => {
      try {
        // Build the sourceUpdate object conditionally
        const sourceUpdate: {
          sshPublicKey?: string;
          proxy?: {
            httpUrl?: string;
            httpsUrl?: string;
            noProxy?: string;
          };
          network?: {
            ipv4?: {
              ipAddress: string;
              subnetMask: string;
              defaultGateway: string;
              dns: string;
            };
          };
        } = {};

        // Only include sshPublicKey if it has a value
        if (sshPublicKey && sshPublicKey.trim()) {
          sourceUpdate.sshPublicKey = sshPublicKey;
        }

        // Only include proxy if at least one proxy field has a value
        const proxyFields: {
          httpUrl?: string;
          httpsUrl?: string;
          noProxy?: string;
        } = {};
        if (httpProxy && httpProxy.trim()) {
          proxyFields.httpUrl = httpProxy;
        }
        if (httpsProxy && httpsProxy.trim()) {
          proxyFields.httpsUrl = httpsProxy;
        }
        if (noProxy && noProxy.trim()) {
          proxyFields.noProxy = noProxy;
        }

        // Only add proxy object if it has at least one field
        if (Object.keys(proxyFields).length > 0) {
          sourceUpdate.proxy = proxyFields;
        }

        // Only include network configuration if static IP is selected and all required fields are provided
        if (
          networkConfigType === "static" &&
          ipAddress?.trim() &&
          subnetMask?.trim() &&
          defaultGateway?.trim() &&
          dns?.trim()
        ) {
          sourceUpdate.network = {
            ipv4: {
              ipAddress: ipAddress.trim(),
              subnetMask: subnetMask.trim(),
              defaultGateway: defaultGateway.trim(),
              dns: dns.trim(),
            },
          };
        }

        const updatedSource = await sourceApi.updateSource({
          id: sourceId,
          sourceUpdate,
        });

        await imageApi.headImage({ id: updatedSource.id });
        const imageUrl = await imageApi.getSourceDownloadURL({
          id: updatedSource.id,
        });

        setDownloadSourceUrl(imageUrl.url);
      } catch (error: unknown) {
        console.error("Error updating source:", error);

        if (hasResponse(error)) {
          const message = await extractResponseErrorMessage(error.response);
          throw new Error(message);
        }

        throw new Error("Unexpected error occurred while updating the source.");
      }
    },
  );

  // Reset dismiss flags on new attempts (effects placed after states are declared)
  useEffect(() => {
    if (downloadSourceState.loading) setDismissDownloadError(false);
  }, [downloadSourceState.loading]);
  useEffect(() => {
    if (updateSourceState.loading) setDismissUpdateError(false);
  }, [updateSourceState.loading]);
  useEffect(() => {
    if (createSourceState.loading) setDismissCreateError(false);
  }, [createSourceState.loading]);
  useEffect(() => {
    if (listAssessmentsState.loading) setDismissAssessmentsLoadError(false);
  }, [listAssessmentsState.loading]);

  const ctx: DiscoverySources.Context = {
    sources: listSourcesState.value || (EMPTY_ARRAY as Source[]),
    isLoadingSources: listSourcesState.loading,
    errorLoadingSources: listSourcesState.error,
    isDeletingSource: deleteSourceState.loading,
    errorDeletingSource: deleteSourceState.loading
      ? undefined
      : deleteSourceState.error,
    isCreatingSource: createSourceState.loading,
    errorCreatingSource:
      createSourceState.loading || dismissCreateError
        ? undefined
        : (createSourceState.error as Error | undefined),
    isDownloadingSource:
      downloadSourceState.loading || updateSourceState.loading,
    errorDownloadingSource:
      downloadSourceState.loading ||
      updateSourceState.loading ||
      dismissDownloadError
        ? undefined
        : (downloadSourceState.error as Error | undefined),
    isPolling,
    listSources,
    deleteSource,
    createDownloadSource,
    startPolling,
    stopPolling,
    sourceSelected: sourceSelected,
    selectSource,
    selectSourceById,
    getSourceById,
    updateSource,
    isUpdatingSource: updateSourceState.loading,
    downloadSourceUrl,
    setDownloadUrl,
    sourceCreatedId,
    deleteSourceCreated,
    updateInventory,
    isUpdatingInventory: updateInventoryState.loading,
    errorUpdatingInventory: updateInventoryState.error,
    sourceDownloadUrls,
    getDownloadUrlForSource,
    storeDownloadUrlForSource,
    assessments: listAssessmentsState.value || (EMPTY_ARRAY as Assessment[]),
    isLoadingAssessments: listAssessmentsState.loading,
    // Clear errors while a new request is in-flight to avoid showing stale errors
    errorUpdatingSource:
      updateSourceState.loading || dismissUpdateError
        ? undefined
        : (updateSourceState.error as Error | undefined),
    errorLoadingAssessments:
      listAssessmentsState.loading || dismissAssessmentsLoadError
        ? undefined
        : (listAssessmentsState.error as Error | undefined),
    listAssessments,
    createAssessment,
    isCreatingAssessment: createAssessmentState.loading,
    errorCreatingAssessment: createAssessmentState.error,
    deleteAssessment: deleteAssessment,
    isDeletingAssessment: deleteAssessmentState.loading,
    errorDeletingAssessment: deleteAssessmentState.error,
    updateAssessment: updateAssessment,
    isUpdatingAssessment: updateAssessmentState.loading,
    errorUpdatingAssessment: updateAssessmentState.error,
    shareAssessment: () => Promise.reject(new Error("Not implemented")),
    isSharingAssessment: false,
    errorSharingAssessment: undefined,
    assessmentFromAgentState,
    setAssessmentFromAgent,
    clearErrors: (options) => {
      const { downloading, updating, creating, loadingAssessments } =
        options || {};
      if (!options || downloading) setDismissDownloadError(true);
      if (!options || updating) setDismissUpdateError(true);
      if (!options || creating) setDismissCreateError(true);
      if (!options || loadingAssessments) setDismissAssessmentsLoadError(true);
    },
    // RVTools Job State
    currentJob,
    isCreatingRVToolsJob,
    errorCreatingRVToolsJob,
    // RVTools Job Methods
    createRVToolsJob,
    cancelRVToolsJob,
    // Callback setter for job success
    setOnJobSuccess,
  };

  return <Context.Provider value={ctx}>{children}</Context.Provider>;
};

Provider.displayName = "DiscoverySourcesProvider";
