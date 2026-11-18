import { yupResolver } from "@hookform/resolvers/yup";
import { useInjection } from "@openshift-migration-advisor/ioc";
import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { routes } from "../../../routing/Routes";
import {
  createEmptyManualEnvironmentForm,
  formFromEnhancementData,
  toEnhancementDataRequest,
} from "../manual-environment/mapEnhancementData";
import { manualEnvironmentReportPath } from "../manual-environment/paths";
import type { ManualEnvironmentFormValues } from "../manual-environment/types";
import { manualEnvironmentValidationSchema } from "../manual-environment/validation";

export interface ManualEnvironmentWizardViewModel {
  isLoading: boolean;
  loadError: Error | null;
  assessmentName: string;
  reportPath: string;
  formMethods: UseFormReturn<ManualEnvironmentFormValues>;
  isSaving: boolean;
  saveError: Error | null;
  save: () => Promise<void>;
  cancel: () => void;
  reload: () => void;
}

export const useManualEnvironmentWizardViewModel =
  (): ManualEnvironmentWizardViewModel => {
    const { id: assessmentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const store = useInjection<IAssessmentsStore>(Symbols.AssessmentsStore);
    const [assessmentName, setAssessmentName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<Error | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const formMethods = useForm<ManualEnvironmentFormValues>({
      resolver: yupResolver(manualEnvironmentValidationSchema),
      mode: "onTouched",
      defaultValues: createEmptyManualEnvironmentForm(),
    });
    const { reset, handleSubmit } = formMethods;

    const reportPath = assessmentId
      ? manualEnvironmentReportPath(assessmentId)
      : routes.assessments;

    const reload = useCallback(() => {
      setReloadToken((token) => token + 1);
    }, []);

    useEffect(() => {
      let cancelled = false;

      const load = async (): Promise<void> => {
        if (!assessmentId) {
          setLoadError(new Error("Assessment not found"));
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setLoadError(null);
        setSaveError(null);
        try {
          const [assessment, enhancement] = await Promise.all([
            store.get(assessmentId),
            store.getEnhancementData(assessmentId),
          ]);
          if (cancelled) return;
          setAssessmentName(assessment.name || `Assessment ${assessmentId}`);
          reset(formFromEnhancementData(enhancement));
        } catch (err) {
          if (cancelled) return;
          setLoadError(
            err instanceof Error
              ? err
              : new Error("Failed to load manual environment details"),
          );
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, [assessmentId, reloadToken, reset, store]);

    const cancel = useCallback(() => {
      void navigate(reportPath);
    }, [navigate, reportPath]);

    const submitForm = useCallback(
      async (data: ManualEnvironmentFormValues): Promise<void> => {
        if (!assessmentId) return;
        setIsSaving(true);
        setSaveError(null);
        try {
          await store.saveEnhancementData(
            assessmentId,
            toEnhancementDataRequest(data),
          );
          void navigate(reportPath);
        } catch (err) {
          setSaveError(
            err instanceof Error
              ? err
              : new Error("Failed to save manual environment details"),
          );
        } finally {
          setIsSaving(false);
        }
      },
      [assessmentId, navigate, reportPath, store],
    );

    const onInvalid = useCallback(() => {
      setSaveError(
        new Error("Please fix the highlighted fields before saving."),
      );
    }, []);

    const save = useCallback(async () => {
      if (isSaving) return;
      await handleSubmit(submitForm, onInvalid)();
    }, [handleSubmit, isSaving, onInvalid, submitForm]);

    return {
      isLoading,
      loadError,
      assessmentName,
      reportPath,
      formMethods,
      isSaving,
      saveError,
      save,
      cancel,
      reload,
    };
  };
