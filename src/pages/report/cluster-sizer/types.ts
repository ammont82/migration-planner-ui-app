/**
 * Cluster Sizer Types
 *
 * UI-specific types for the cluster sizing wizard.
 * API types are re-exported from @openshift-migration-advisor/planner-sdk.
 *
 * @see ECOPROJECT-3631
 * @see ECOPROJECT-3967 - CPU and memory overcommit specified individually
 */

import {
  type ClusterRequirementsRequest,
  ClusterRequirementsRequestCpuOverCommitRatioEnum,
  ClusterRequirementsRequestMemoryOverCommitRatioEnum,
} from "@openshift-migration-advisor/planner-sdk";

// Re-export API types from api-client
export type {
  ClusterRequirementsRequest,
  ClusterRequirementsResponse,
  ClusterSizing,
  InventoryTotals,
  SizingOverCommitRatio,
  SizingResourceConsumption,
  SizingResourceLimits,
} from "@openshift-migration-advisor/planner-sdk";

/**
 * Worker node size preset options
 */
export type WorkerNodePreset = "small" | "medium" | "large" | "custom";

/**
 * Over-commit ratio options for CPU (numeric value)
 */
export type OvercommitRatio = 1 | 2 | 4 | 6;

/**
 * Over-commit ratio options for memory (1:6 not supported by API)
 */
export type MemoryOvercommitRatio = 1 | 2 | 4;

/**
 * High availability replica count
 */
export type HAReplicaCount = 1 | 2 | 3;

/**
 * User input for cluster sizing configuration (form state)
 */
export interface SizingFormValues {
  /** Selected worker node size preset */
  workerNodePreset: WorkerNodePreset;
  /** Custom CPU cores per worker (when preset is 'custom') */
  customCpu: number;
  /** Custom memory in GB per worker (when preset is 'custom') */
  customMemoryGb: number;
  /** High availability replica count */
  haReplicas: HAReplicaCount;
  /** CPU over-commit ratio for resource sharing */
  cpuOvercommitRatio: OvercommitRatio;
  /** Memory over-commit ratio for resource sharing */
  memoryOvercommitRatio: MemoryOvercommitRatio;
  /** Whether to schedule VMs on control plane nodes */
  scheduleOnControlPlane: boolean;
}

/**
 * Wizard step identifiers
 */
export type WizardStep = "input" | "result";

/**
 * Mapping from numeric CPU over-commit ratio to API enum value
 */
const CPU_OVERCOMMIT_RATIO_MAP: Record<
  OvercommitRatio,
  ClusterRequirementsRequest["cpuOverCommitRatio"]
> = {
  1: ClusterRequirementsRequestCpuOverCommitRatioEnum.CpuOneToOne,
  2: ClusterRequirementsRequestCpuOverCommitRatioEnum.CpuOneToTwo,
  4: ClusterRequirementsRequestCpuOverCommitRatioEnum.CpuOneToFour,
  6: ClusterRequirementsRequestCpuOverCommitRatioEnum.CpuOneToSix,
};

/**
 * Mapping from numeric memory over-commit ratio to API enum value
 */
const MEMORY_OVERCOMMIT_RATIO_MAP: Record<
  MemoryOvercommitRatio,
  ClusterRequirementsRequest["memoryOverCommitRatio"]
> = {
  1: ClusterRequirementsRequestMemoryOverCommitRatioEnum.MemoryOneToOne,
  2: ClusterRequirementsRequestMemoryOverCommitRatioEnum.MemoryOneToTwo,
  4: ClusterRequirementsRequestMemoryOverCommitRatioEnum.MemoryOneToFour,
};

/**
 * Convert numeric CPU over-commit ratio to API enum format
 */
export const cpuOvercommitRatioToApiEnum = (
  ratio: OvercommitRatio,
): ClusterRequirementsRequest["cpuOverCommitRatio"] => {
  return CPU_OVERCOMMIT_RATIO_MAP[ratio];
};

/**
 * Convert numeric memory over-commit ratio to API enum format
 */
export const memoryOvercommitRatioToApiEnum = (
  ratio: MemoryOvercommitRatio,
): ClusterRequirementsRequest["memoryOverCommitRatio"] => {
  return MEMORY_OVERCOMMIT_RATIO_MAP[ratio];
};

/**
 * Helper function to convert form values to API request payload
 */
export const formValuesToRequest = (
  clusterId: string,
  values: SizingFormValues,
  workerCpu: number,
  workerMemory: number,
): ClusterRequirementsRequest => ({
  clusterId,
  cpuOverCommitRatio: cpuOvercommitRatioToApiEnum(values.cpuOvercommitRatio),
  memoryOverCommitRatio: memoryOvercommitRatioToApiEnum(
    values.memoryOvercommitRatio,
  ),
  workerNodeCPU: workerCpu,
  workerNodeMemory: workerMemory,
  controlPlaneSchedulable: values.scheduleOnControlPlane,
});
