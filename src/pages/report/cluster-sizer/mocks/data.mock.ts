/**
 * Mock data for cluster sizing wizard development/testing
 * TODO: Remove this file when the backend API is ready
 *
 * @see ECOPROJECT-3631 for API specification
 */

import { WORKER_NODE_PRESETS } from "../constants";
import type { ClusterRequirementsResponse, SizingFormValues } from "../types";

/**
 * Mock inventory data representing a typical VMware cluster
 */
export const MOCK_INVENTORY = {
  totalVMs: 61,
  totalCPU: 281,
  totalMemory: 1117,
} as const;

/**
 * Default delay (in ms) to simulate API response time
 */
export const MOCK_API_DELAY = 1000;

/**
 * Generate mock cluster requirements response for development/testing
 * Matches the API response structure from ECOPROJECT-3631
 *
 * @param values - Form values from the sizing wizard
 * @returns Mock response matching ClusterRequirementsResponse
 */
export const generateMockClusterRequirements = (
  values: SizingFormValues,
): ClusterRequirementsResponse => {
  // Get worker node specs based on preset or custom values
  const workerCpu =
    values.workerNodePreset !== "custom"
      ? WORKER_NODE_PRESETS[values.workerNodePreset].cpu
      : values.customCpu;
  const workerMemory =
    values.workerNodePreset !== "custom"
      ? WORKER_NODE_PRESETS[values.workerNodePreset].memoryGb
      : values.customMemoryGb;

  // Use mock inventory data
  const {
    totalVMs,
    totalCPU: inventoryCPU,
    totalMemory: inventoryMemory,
  } = MOCK_INVENTORY;

  // Calculate worker nodes needed based on CPU requirements and CPU overcommit ratio
  const workerNodes = Math.max(
    3,
    Math.ceil(inventoryCPU / (workerCpu * values.cpuOvercommitRatio)),
  );
  const controlPlaneNodes = values.haReplicas;
  const totalNodes = workerNodes + controlPlaneNodes;

  // Calculate total cluster resources (control plane nodes have fixed 8 CPU / 32 GB)
  const totalCPU = workerNodes * workerCpu + controlPlaneNodes * 8;
  const totalMemory = workerNodes * workerMemory + controlPlaneNodes * 32;

  // Calculate resource consumption percentages
  const cpuUsage = (inventoryCPU / totalCPU) * 100;
  const memoryUsage = (inventoryMemory / totalMemory) * 100;

  return {
    clusterSizing: {
      controlPlaneNodes,
      failoverNodes: 0,
      totalCPU,
      totalMemory,
      totalNodes,
      workerNodes,
    },
    inventoryTotals: {
      totalCPU: inventoryCPU,
      totalMemory: inventoryMemory,
      totalVMs,
    },
    resourceConsumption: {
      cpu: cpuUsage,
      memory: memoryUsage,
      limits: {
        cpu: inventoryCPU * values.cpuOvercommitRatio,
        memory: inventoryMemory * values.memoryOvercommitRatio,
      },
      overCommitRatio: {
        cpu: inventoryCPU / totalCPU,
        memory: inventoryMemory / totalMemory,
      },
    },
  };
};

/**
 * Simulate an API call with mock data
 *
 * @param values - Form values from the sizing wizard
 * @param delay - Simulated API delay in milliseconds
 * @returns Promise resolving to mock ClusterRequirementsResponse
 */
export const fetchMockClusterRequirements = async (
  values: SizingFormValues,
  delay: number = MOCK_API_DELAY,
): Promise<ClusterRequirementsResponse> => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return generateMockClusterRequirements(values);
};
