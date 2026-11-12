import { useInjection } from "@openshift-migration-advisor/ioc";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { ISourcesStore } from "../../../data/stores/interfaces/ISourcesStore";
import { isNameError, parseApiError } from "../../../lib/common/ErrorParser";
import type { SourceModel } from "../../../models/SourceModel";
import { routes } from "../../../routing/Routes";
import { buildDiscoveryAssessmentDefaultName } from "../helpers/discoveryAssessmentDefaultName";

export type DiscoveryAssessmentDataSource = "connected" | "upload";

const INVENTORY_MAX_BYTES = 52_428_800; // 50 MiB
const ALLOWED_EXTENSIONS = new Set(["json", "zip"]);

export interface UseCreateDiscoveryAssessmentViewModelArgs {
  isOpen: boolean;
  sources: SourceModel[];
  onClose: () => void;
  onInventoryUploaded?: () => void | Promise<void>;
}

export interface CreateDiscoveryAssessmentViewModel {
  dataSource: DiscoveryAssessmentDataSource;
  setDataSource: (value: DiscoveryAssessmentDataSource) => void;
  hasConnectedAppliances: boolean;
  assessmentName: string;
  setAssessmentName: (name: string) => void;
  selectedSourceId: string;
  setSelectedSourceId: (id: string) => void;
  applianceOptions: SourceModel[];
  inventoryFilename: string;
  selectedFile: File | null;
  handleFileChange: (file: File) => void;
  clearSelectedFile: () => void;
  nameValidationError: string;
  sourceValidationError: string;
  fileValidationError: string;
  primaryButtonLabel: string;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  apiError: Error | null;
  hasNameError: boolean;
  hasGeneralApiError: boolean;
  clearApiError: () => void;
  resetForm: () => void;
  handleSubmit: () => Promise<void>;
  associateApplianceHelperText: string;
  isConnectedSourceNotReady: boolean;
}

const isExampleSource = (source: SourceModel): boolean =>
  source.name === "Example";

const getDefaultDataSource = (
  sources: SourceModel[],
): DiscoveryAssessmentDataSource => {
  const hasConnected = sources.some(
    (source) => !isExampleSource(source) && source.isConnected,
  );
  return hasConnected ? "connected" : "upload";
};

const validateInventoryFile = (file: File): string | null => {
  const extension = file.name.toLowerCase().split(".").pop();
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return "Unsupported file format. Please select a json or zip file.";
  }
  if (file.size > INVENTORY_MAX_BYTES) {
    return "The file is too big. Select a file up to 50 MiB.";
  }
  return null;
};

export const useCreateDiscoveryAssessmentViewModel = ({
  isOpen,
  sources,
  onClose,
  onInventoryUploaded,
}: UseCreateDiscoveryAssessmentViewModelArgs): CreateDiscoveryAssessmentViewModel => {
  const navigate = useNavigate();
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const sourcesStore = useInjection<ISourcesStore>(Symbols.SourcesStore);

  const associableSources = useMemo(
    () =>
      sources
        .filter((source) => !isExampleSource(source))
        .slice()
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [sources],
  );

  const connectedSources = useMemo(
    () => associableSources.filter((source) => source.isConnected),
    [associableSources],
  );

  const hasConnectedAppliances = connectedSources.length > 0;

  const [dataSource, setDataSourceRaw] =
    useState<DiscoveryAssessmentDataSource>("upload");
  const [assessmentName, setAssessmentName] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inventoryFilename, setInventoryFilename] = useState("");
  const [nameValidationError, setNameValidationError] = useState("");
  const [sourceValidationError, setSourceValidationError] = useState("");
  const [fileValidationError, setFileValidationError] = useState("");
  const [dismissApiError, setDismissApiError] = useState(false);
  const [formInitializedForOpen, setFormInitializedForOpen] = useState(false);

  const selectedSource = useMemo(
    () => associableSources.find((source) => source.id === selectedSourceId),
    [associableSources, selectedSourceId],
  );

  const applianceOptions =
    dataSource === "connected" ? connectedSources : associableSources;

  const resetForm = useCallback((): void => {
    const defaultSource = getDefaultDataSource(sources);
    setDataSourceRaw(defaultSource);
    setAssessmentName(buildDiscoveryAssessmentDefaultName());
    setSelectedSourceId("");
    setSelectedFile(null);
    setInventoryFilename("");
    setNameValidationError("");
    setSourceValidationError("");
    setFileValidationError("");
    setDismissApiError(true);
  }, [sources]);

  if (isOpen && !formInitializedForOpen) {
    setFormInitializedForOpen(true);
    resetForm();
  }
  if (!isOpen && formInitializedForOpen) {
    setFormInitializedForOpen(false);
  }

  const setDataSource = useCallback(
    (value: DiscoveryAssessmentDataSource): void => {
      setDataSourceRaw(value);
      setSelectedSourceId("");
      setSelectedFile(null);
      setInventoryFilename("");
      setSourceValidationError("");
      setFileValidationError("");
      setDismissApiError(false);
    },
    [],
  );

  const handleFileChange = useCallback((file: File): void => {
    const validationMessage = validateInventoryFile(file);
    if (validationMessage) {
      setFileValidationError(validationMessage);
      setSelectedFile(null);
      setInventoryFilename("");
      return;
    }
    setFileValidationError("");
    setSelectedFile(file);
    setInventoryFilename(file.name);
    setDismissApiError(false);
  }, []);

  const clearSelectedFile = useCallback((): void => {
    setSelectedFile(null);
    setInventoryFilename("");
    setFileValidationError("");
  }, []);

  const clearApiError = useCallback((): void => {
    setDismissApiError(true);
  }, []);

  const isConnectedSourceNotReady =
    dataSource === "connected" &&
    Boolean(selectedSource && !selectedSource.isReady);

  const isSubmitDisabled =
    !assessmentName.trim() ||
    !selectedSourceId ||
    (dataSource === "upload" && !selectedFile) ||
    isConnectedSourceNotReady ||
    Boolean(fileValidationError);

  const primaryButtonLabel =
    dataSource === "upload" ? "Upload and analyze" : "Create assessment";

  const associateApplianceHelperText =
    dataSource === "connected"
      ? "Only connected discovery appliances can be selected to create an assessment."
      : "Select the discovery appliance the file is related to.";

  const [submitState, doSubmit] = useAsyncFn(async () => {
    setDismissApiError(false);

    let isValid = true;
    if (!assessmentName.trim()) {
      setNameValidationError("Assessment name is required");
      isValid = false;
    } else {
      setNameValidationError("");
    }

    if (!selectedSourceId) {
      setSourceValidationError("Discovery appliance selection is required");
      isValid = false;
    } else {
      setSourceValidationError("");
    }

    if (dataSource === "upload") {
      if (!selectedFile) {
        setFileValidationError("File upload is required");
        isValid = false;
      } else {
        const validationMessage = validateInventoryFile(selectedFile);
        if (validationMessage) {
          setFileValidationError(validationMessage);
          isValid = false;
        } else if (!fileValidationError) {
          setFileValidationError("");
        }
      }
    }

    if (!isValid || !selectedSourceId) {
      return;
    }

    const trimmedName = assessmentName.trim();

    if (dataSource === "upload" && selectedFile) {
      try {
        await sourcesStore.uploadInventoryFile(selectedSourceId, selectedFile);
        await onInventoryUploaded?.();
      } catch (error) {
        const parsed = await parseApiError(
          error,
          "Failed to upload the inventory file",
        );
        throw parsed;
      }
    } else if (
      dataSource === "connected" &&
      selectedSource &&
      !selectedSource.isReady
    ) {
      throw new Error(
        "Selected discovery appliance does not have inventory ready yet.",
      );
    }

    const assessment = await assessmentsStore.create({
      name: trimmedName,
      sourceType: "agent",
      sourceId: selectedSourceId,
    });

    if (!assessment?.id) {
      throw new Error("Unexpected response while creating assessment.");
    }

    try {
      await assessmentsStore.list();
    } catch {
      // Assessment was created; refresh failure should not block navigation.
    }

    onClose();
    resetForm();
    void navigate(routes.assessmentReport(assessment.id));
  }, [
    assessmentName,
    assessmentsStore,
    dataSource,
    fileValidationError,
    navigate,
    onClose,
    onInventoryUploaded,
    resetForm,
    selectedFile,
    selectedSource,
    selectedSourceId,
    sourcesStore,
  ]);

  const apiError =
    submitState.loading || dismissApiError ? null : (submitState.error ?? null);
  const hasNameError = isNameError(apiError);
  const hasGeneralApiError = Boolean(apiError) && !hasNameError;

  return {
    dataSource,
    setDataSource,
    hasConnectedAppliances,
    assessmentName,
    setAssessmentName: (name: string) => {
      setAssessmentName(name);
      if (nameValidationError && name.trim()) {
        setNameValidationError("");
      }
      setDismissApiError(false);
    },
    selectedSourceId,
    setSelectedSourceId: (id: string) => {
      setSelectedSourceId(id);
      if (sourceValidationError && id) {
        setSourceValidationError("");
      }
      setDismissApiError(false);
    },
    applianceOptions,
    inventoryFilename,
    selectedFile,
    handleFileChange,
    clearSelectedFile,
    nameValidationError,
    sourceValidationError,
    fileValidationError,
    primaryButtonLabel,
    isSubmitDisabled,
    isSubmitting: submitState.loading,
    apiError,
    hasNameError,
    hasGeneralApiError,
    clearApiError,
    resetForm,
    handleSubmit: doSubmit,
    associateApplianceHelperText,
    isConnectedSourceNotReady,
  };
};
