import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { RvtoolsUploadState } from "../../../data/stores/JobsStore";
import { routes } from "../../../routing/Routes";
import { useEnvironmentPage } from "../../environment/view-models/EnvironmentPageContext";
import { useAssessmentPageViewModel } from "./useAssessmentPageViewModel";

export interface AssessmentEmptyPageViewModel {
  onSelectDiscoveryAppliance: () => void;
  isDiscoveryApplianceModalOpen: boolean;
  onCancelDiscoveryApplianceModal: () => void;
  onCloseDiscoveryApplianceModal: () => void;
  onSelectRvtools: () => void;
  isRvtoolsModalOpen: boolean;
  onCloseRvtoolsModal: () => void;
  onSubmitRvtoolsAssessment: (payload: { name: string; files: File[] }) => void;
  onStagedRvtoolsFileRemoved: (file: {
    fileName: string;
    fileSize: number;
  }) => void;
  onPartialRvtoolsUploadResolved: () => void;
  isCreatingJob: boolean;
  jobCreateError?: Error;
  isJobProcessing: boolean;
  jobProgressValue: number;
  jobError: Error | null;
  isNavigatingToReport: boolean;
  clearJobCreateError: () => void;
  clearRvtoolsUploadResults: () => void;
  rvtoolsUpload?: RvtoolsUploadState;
  rvtoolsPartialAssessmentId?: string;
}

export const useAssessmentEmptyPageViewModel =
  (): AssessmentEmptyPageViewModel => {
    const navigate = useNavigate();
    const environmentVm = useEnvironmentPage();
    const assessmentPageVm = useAssessmentPageViewModel();
    const {
      cancelRVToolsJob,
      completePartialRvtoolsUpload,
      createRVToolsJob,
      removeRvtoolsUploadResult,
    } = assessmentPageVm;
    const [isRvtoolsModalOpen, setIsRvtoolsModalOpen] = useState(false);
    const [isDiscoveryApplianceModalOpen, setIsDiscoveryApplianceModalOpen] =
      useState(false);

    const onCloseRvtoolsModal = useCallback((): void => {
      void cancelRVToolsJob();
      setIsRvtoolsModalOpen(false);
    }, [cancelRVToolsJob]);

    const onSubmitRvtoolsAssessment = useCallback(
      (payload: { name: string; files: File[] }): void => {
        if (payload.files.length > 0) {
          void createRVToolsJob(payload.name, payload.files);
        }
      },
      [createRVToolsJob],
    );

    const onStagedRvtoolsFileRemoved = useCallback(
      (file: { fileName: string; fileSize: number }): void => {
        removeRvtoolsUploadResult(file.fileName, file.fileSize);
      },
      [removeRvtoolsUploadResult],
    );

    const onPartialRvtoolsUploadResolved = useCallback((): void => {
      void completePartialRvtoolsUpload().then(() =>
        navigate(routes.assessments),
      );
    }, [completePartialRvtoolsUpload, navigate]);

    const onCancelDiscoveryApplianceModal = useCallback((): void => {
      setIsDiscoveryApplianceModalOpen(false);
      environmentVm.setDownloadUrl("");
      void environmentVm.listSources();
    }, [environmentVm]);

    const onCloseDiscoveryApplianceModal = useCallback((): void => {
      onCancelDiscoveryApplianceModal();
      void navigate(routes.environments);
    }, [onCancelDiscoveryApplianceModal, navigate]);

    return {
      onSelectDiscoveryAppliance: () => {
        setIsDiscoveryApplianceModalOpen(true);
      },
      isDiscoveryApplianceModalOpen,
      onCancelDiscoveryApplianceModal,
      onCloseDiscoveryApplianceModal,
      onSelectRvtools: () => {
        assessmentPageVm.clearJobCreateError();
        setIsRvtoolsModalOpen(true);
      },
      isRvtoolsModalOpen,
      onCloseRvtoolsModal,
      onSubmitRvtoolsAssessment,
      onStagedRvtoolsFileRemoved,
      onPartialRvtoolsUploadResolved,
      isCreatingJob: assessmentPageVm.isCreatingJob,
      jobCreateError: assessmentPageVm.jobCreateError,
      isJobProcessing: assessmentPageVm.isJobProcessing,
      jobProgressValue: assessmentPageVm.jobProgressValue,
      jobError: assessmentPageVm.jobError,
      isNavigatingToReport: assessmentPageVm.isNavigatingToReport,
      clearJobCreateError: assessmentPageVm.clearJobCreateError,
      clearRvtoolsUploadResults: assessmentPageVm.clearRvtoolsUploadResults,
      rvtoolsUpload: assessmentPageVm.rvtoolsUpload,
      rvtoolsPartialAssessmentId: assessmentPageVm.rvtoolsPartialAssessmentId,
    };
  };
