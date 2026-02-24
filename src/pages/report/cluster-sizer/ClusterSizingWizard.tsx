import { AssessmentApi } from "@openshift-migration-advisor/planner-sdk";
import { ResponseError } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@migration-planner-ui/ioc";
import {
  Modal,
  Wizard,
  WizardHeader,
  WizardStep,
  type WizardStepType,
} from "@patternfly/react-core";
import React, { useCallback, useState } from "react";

import { Symbols } from "../../../main/Symbols";
import { DEFAULT_FORM_VALUES, WORKER_NODE_PRESETS } from "./constants";
import { SizingInputForm } from "./SizingInputForm";
import { SizingInputFormWizardStepFooter } from "./SizingInputFormWizardStepFooter";
import { SizingResult } from "./SizingResult";
import { SizingResultWizardStepFooter } from "./SizingResultWizardStepFooter";
import type { ClusterRequirementsResponse, SizingFormValues } from "./types";
import { formValuesToRequest } from "./types";

interface ClusterSizingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  clusterId: string;
  /** Assessment ID for the API endpoint */
  assessmentId: string;
}

export const ClusterSizingWizard: React.FC<ClusterSizingWizardProps> = ({
  isOpen,
  onClose,
  clusterName,
  clusterId,
  assessmentId,
}) => {
  const assessmentApi = useInjection<AssessmentApi>(Symbols.AssessmentApi);

  const [formValues, setFormValues] =
    useState<SizingFormValues>(DEFAULT_FORM_VALUES);
  const [sizerOutput, setSizerOutput] =
    useState<ClusterRequirementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleClose = useCallback(() => {
    // Reset state when closing
    setFormValues(DEFAULT_FORM_VALUES);
    setSizerOutput(null);
    setError(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const handleCalculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get worker node CPU and memory based on preset or custom values
      const workerCpu =
        formValues.workerNodePreset !== "custom"
          ? WORKER_NODE_PRESETS[formValues.workerNodePreset].cpu
          : formValues.customCpu;
      const workerMemory =
        formValues.workerNodePreset !== "custom"
          ? WORKER_NODE_PRESETS[formValues.workerNodePreset].memoryGb
          : formValues.customMemoryGb;

      // Build the API request payload
      const clusterRequirementsRequest = formValuesToRequest(
        clusterId,
        formValues,
        workerCpu,
        workerMemory,
      );

      // POST /api/v1/assessments/{id}/cluster-requirements
      const result = await assessmentApi.calculateAssessmentClusterRequirements(
        {
          id: assessmentId,
          clusterRequirementsRequest,
        },
      );

      setSizerOutput(result);
    } catch (err) {
      if (err instanceof ResponseError) {
        const message = await err.response.text();
        setError(new Error(err.message, { cause: message }));
      } else {
        setError(
          err instanceof Error ? err : new Error("Failed to calculate sizing"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [assessmentApi, assessmentId, clusterId, formValues]);

  const handleStepChange = useCallback(
    async (
      _event: React.MouseEvent<HTMLButtonElement>,
      currentStep: WizardStepType,
      _prevStep: WizardStepType,
    ): Promise<void> => {
      // Trigger calculation when entering the review step
      if (currentStep.id === "review-step") {
        await handleCalculate();
      }
    },
    [handleCalculate],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      aria-label="Cluster sizing wizard modal"
      onEscapePress={handleClose}
      variant="medium"
    >
      <Wizard
        height={700}
        onClose={handleClose}
        onStepChange={handleStepChange}
        header={
          <WizardHeader
            onClose={handleClose}
            title="Target cluster recommendations"
          />
        }
      >
        <WizardStep
          name="Migration preferences"
          id="preferences-step"
          footer={
            <SizingInputFormWizardStepFooter
              onClose={handleClose}
              isLoading={isLoading}
            />
          }
        >
          <SizingInputForm values={formValues} onChange={setFormValues} />
        </WizardStep>

        <WizardStep
          name="Review cluster recommendations"
          id="review-step"
          footer={<SizingResultWizardStepFooter onClose={handleClose} />}
        >
          <SizingResult
            clusterName={clusterName}
            formValues={formValues}
            sizerOutput={sizerOutput}
            isLoading={isLoading}
            error={error}
          />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};

ClusterSizingWizard.displayName = "ClusterSizingWizard";

export default ClusterSizingWizard;
