import { useInjection } from "@openshift-migration-advisor/ioc";
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { isNameError } from "../../../lib/common/ErrorParser";
import type { SourceModel } from "../../../models/SourceModel";
import { routes } from "../../../routing/Routes";
import { useEnvironmentPage } from "../../environment/view-models/EnvironmentPageContext";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CreateFromOvaViewModel {
  // Sources (from EnvironmentPageViewModel)
  sources: SourceModel[];
  sourceCreatedId: string | null;
  createdSource: SourceModel | undefined;
  isDownloadingSource: boolean;
  errorUpdatingInventory?: Error;

  // Form state
  name: string;
  setName: (name: string) => void;
  useExisting: boolean;
  setUseExisting: (val: boolean) => void;
  selectedEnvironmentId: string;
  setSelectedEnvironmentId: (id: string) => void;

  // Modal state
  isSetupModalOpen: boolean;
  setIsSetupModalOpen: (val: boolean) => void;
  isStepsModalOpen: boolean;
  setIsStepsModalOpen: (val: boolean) => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (val: boolean) => void;
  downloadModalUrl: string;
  setDownloadModalUrl: (url: string) => void;
  downloadModalSourceName: string;
  setDownloadModalSourceName: (name: string) => void;

  // Submission
  isCreatingAssessment: boolean;
  isCreatingSource: boolean;
  apiError: Error | null;
  setApiError: (err: Error | null) => void;
  uploadMessage: string | null;
  isUploadError: boolean;

  // Computed
  availableEnvironments: SourceModel[];
  selectedEnv: SourceModel | undefined;
  isSelectedNotReady: boolean;
  isSubmitDisabled: boolean;
  hasNameError: boolean;
  hasGeneralApiError: boolean;

  // Actions
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  handleSetupModalClose: () => void;
  handleSetupModalAfterDownload: () => Promise<void>;

  // Pass-through for child components
  envVm: ReturnType<typeof useEnvironmentPage>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCreateFromOvaViewModel = (): CreateFromOvaViewModel => {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { preselectedSourceId?: string };
    pathname: string;
    search: string;
    hash?: string;
  };

  // Stores
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const envVm = useEnvironmentPage();

  const preselectedSourceId = envVm.assessmentFromAgentState
    ? envVm.sourceSelected?.id
    : location.state?.preselectedSourceId;

  const [name, setName] = useState("");
  const [useExisting, setUseExisting] = useState(Boolean(preselectedSourceId));
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(
    preselectedSourceId || "",
  );

  // Modal state
  const [isSetupModalOpen, setIsSetupModalOpen] = React.useState(false);
  const [isStepsModalOpen, setIsStepsModalOpen] = React.useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [downloadModalUrl, setDownloadModalUrl] = React.useState("");
  const [downloadModalSourceName, setDownloadModalSourceName] =
    React.useState("");

  // Error dismiss flag (cleared on next submission, set when user edits name)
  const [dismissSubmitError, setDismissSubmitError] = React.useState(false);

  // Derive upload feedback from the environment view model
  const uploadMessage = envVm.inventoryUploadResult?.message ?? null;
  const isUploadError = envVm.inventoryUploadResult?.isError ?? false;
  const { clearInventoryUploadResult } = envVm;

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const createdSource = envVm.sourceCreatedId
    ? envVm.getSourceById(envVm.sourceCreatedId)
    : undefined;

  const availableEnvironments = useMemo(
    () =>
      envVm.sources
        .filter((source) => source.name !== "Example")
        .slice()
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [envVm.sources],
  );

  const selectedEnv = useMemo(
    () => envVm.sources.find((s) => s.id === selectedEnvironmentId),
    [envVm.sources, selectedEnvironmentId],
  );

  const isSelectedNotReady = Boolean(
    useExisting && selectedEnv && !selectedEnv.isReady,
  );

  const isSubmitDisabled =
    !name || (useExisting ? !selectedEnvironmentId : !envVm.sourceCreatedId);

  // ---------------------------------------------------------------------------
  // Effects — draft persistence
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    clearInventoryUploadResult();
  }, [selectedEnvironmentId, clearInventoryUploadResult]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const [submitState, doSubmit] = useAsyncFn(async () => {
    setDismissSubmitError(false);
    const sourceIdToUse = useExisting
      ? selectedEnvironmentId
      : (envVm.sourceCreatedId ?? "");
    if (!sourceIdToUse) return;

    const assessment = await assessmentsStore.create({
      name,
      sourceType: "agent",
      sourceId: sourceIdToUse,
    });

    if (!assessment?.id) {
      throw new Error("Unexpected response while creating assessment.");
    }

    // create() already updates the store; avoid blocking navigation on list().
    // List refresh can fail for some shared appliance sources while create succeeds.
    void assessmentsStore.list().catch(() => undefined);
    void navigate(routes.assessmentReport(assessment.id));
    setName("");
    setUseExisting(false);
    setSelectedEnvironmentId("");
  }, [
    assessmentsStore,
    envVm.sourceCreatedId,
    name,
    navigate,
    selectedEnvironmentId,
    useExisting,
    setName,
    setUseExisting,
    setSelectedEnvironmentId,
  ]);

  const handleCancel = useCallback(() => {
    setName("");
    setUseExisting(false);
    setSelectedEnvironmentId("");
    void navigate(-1);
  }, [navigate, setName, setUseExisting, setSelectedEnvironmentId]);

  const [refreshAfterCloseState, doRefreshAfterClose] = useAsyncFn(async () => {
    const newId = envVm.sourceCreatedId;
    await envVm.listSources();
    if (newId) {
      setUseExisting(true);
      setSelectedEnvironmentId(newId);
    }
  }, [envVm]);

  const handleSetupModalClose = useCallback(() => {
    setIsSetupModalOpen(false);
    void doRefreshAfterClose();
  }, [doRefreshAfterClose]);

  const [, doRefreshAfterDownload] = useAsyncFn(async () => {
    const newId = envVm.sourceCreatedId;
    await envVm.listSources();
    if (newId) {
      setUseExisting(true);
      setSelectedEnvironmentId(newId);
    }
  }, [envVm]);

  // ---- Derived error state -------------------------------------------------

  const apiError =
    submitState.loading || dismissSubmitError
      ? null
      : (submitState.error ?? null);

  const hasNameError = isNameError(apiError);
  const hasGeneralApiError = !!apiError && !isNameError(apiError);

  return {
    sources: envVm.sources,
    sourceCreatedId: envVm.sourceCreatedId,
    createdSource,
    isDownloadingSource: envVm.isDownloadingSource,
    errorUpdatingInventory: envVm.errorUpdatingInventory,

    name,
    setName,
    useExisting,
    setUseExisting,
    selectedEnvironmentId,
    setSelectedEnvironmentId,

    isSetupModalOpen,
    setIsSetupModalOpen,
    isStepsModalOpen,
    setIsStepsModalOpen,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    downloadModalUrl,
    setDownloadModalUrl,
    downloadModalSourceName,
    setDownloadModalSourceName,

    isCreatingAssessment: submitState.loading,
    isCreatingSource: refreshAfterCloseState.loading,
    apiError,
    setApiError: (_err: Error | null) => setDismissSubmitError(true),
    uploadMessage,
    isUploadError,

    availableEnvironments,
    selectedEnv,
    isSelectedNotReady,
    isSubmitDisabled,
    hasNameError,
    hasGeneralApiError,

    handleSubmit: doSubmit,
    handleCancel,
    handleSetupModalClose,
    handleSetupModalAfterDownload: doRefreshAfterDownload,

    envVm,
  };
};
