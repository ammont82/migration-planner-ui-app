import type {
  AssessmentVCenterV2,
  CalculateAssessmentClusterRequirementsRequest,
  CalculateMigrationComplexityRequest,
  CalculateMigrationEstimationByComplexityRequest,
  CalculateMigrationEstimationRequest,
  ClusterRequirementsResponse,
  ClusterRequirementsStoredInput,
  EnhancementData,
  GetAssessmentClusterRequirementsStoredInputRequest,
  InitOverrideFunction,
  InventoryData,
  MigrationComplexityResponse,
  MigrationEstimationByComplexityResponse,
  MigrationEstimationResponse,
} from "@openshift-migration-advisor/planner-sdk";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type {
  CalculateCostEstimationRequest,
  CostEstimationResponse,
} from "../../../models/CostEstimationModel";
type AssessmentCreateForm = {
  name: string;
  sourceType?: string;
  sourceId?: string;
};

type AssessmentUpdateForm = {
  name?: string;
};

export interface IAssessmentsStore extends ExternalStore<AssessmentModel[]> {
  list(
    sourceId?: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel[]>;
  get(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  getVcenter(
    id: string,
    vid: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentVCenterV2>;
  getVcenterCluster(
    id: string,
    vid: string,
    cid: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<InventoryData>;
  getById(id: string): AssessmentModel | undefined;
  getEnhancementData(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<EnhancementData | null>;
  saveEnhancementData(
    id: string,
    enhancementData: EnhancementData,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<EnhancementData>;
  create(
    assessmentForm: AssessmentCreateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  update(
    id: string,
    assessmentUpdate: AssessmentUpdateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  remove(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  share(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  unshare(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  calculateAssessmentClusterRequirements(
    requestParameters: CalculateAssessmentClusterRequirementsRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<ClusterRequirementsResponse>;
  getAssessmentClusterRequirementsStoredInput(
    requestParameters: GetAssessmentClusterRequirementsStoredInputRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<ClusterRequirementsStoredInput>;
  calculateMigrationEstimation(
    requestParameters: CalculateMigrationEstimationRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationEstimationResponse>;
  calculateComplexityEstimation(
    requestParameters: CalculateMigrationComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationComplexityResponse>;
  calculateCostEstimation(
    requestParameters: CalculateCostEstimationRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<CostEstimationResponse>;
  calculateEstimationByComplexity(
    requestParameters: CalculateMigrationEstimationByComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationEstimationByComplexityResponse>;
  startPolling(intervalMs?: number): void;
  stopPolling(): void;
}
