/**
 * Type definitions for report export functionality
 */

import type {
  Infra,
  InventoryData as ApiInventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";

// OS Information
export interface OSInfo {
  count: number;
  supported: boolean;
}

// Migration warning entry
export interface MigrationWarning {
  label: string;
  count: number;
}

// VM power states
export interface PowerStates {
  poweredOn?: number;
  poweredOff?: number;
  suspended?: number;
  [key: string]: number | undefined;
}

// Resource information
export interface ResourceInfo {
  total: number;
}

// Virtual machines data
export interface VMsData {
  total: number;
  powerStates: PowerStates;
  cpuCores: ResourceInfo;
  ramGB: ResourceInfo;
  diskGB: ResourceInfo;
  os?: Record<string, number>;
  osInfo?: Record<string, OSInfo>;
  migrationWarnings: MigrationWarning[];
}

// Datastore information
export interface Datastore {
  vendor: string;
  type: string;
  protocolType: string;
  totalCapacityGB: number;
  freeCapacityGB: number;
  hardwareAcceleratedMove: boolean;
}

// Network information
export interface Network {
  name: string;
  type: string;
}

// Infrastructure data
export interface InfraData {
  totalHosts: number;
  datastores: Datastore[];
  networks: Network[];
}

// Chart data structure for report generation
export interface ChartData {
  powerStateData: Array<[string, number]>;
  resourceData: Array<[string, number, number]>;
  osData: Array<[string, number]>;
  warningsData: Array<[string, number]>;
  storageLabels: string[];
  storageUsedData: number[];
  storageTotalData: number[];
}

// Inventory data structure
export interface InventoryData {
  infra: InfraData;
  vms: VMsData;
}

// Loading states for export operations
export type LoadingState =
  | "idle"
  | "generating-pdf"
  | "generating-html"
  | "error";

// Export error structure
export interface ExportError {
  message: string;
  type: "pdf" | "html" | "general";
}

// Options for export operations
export interface ExportOptions {
  documentTitle?: string;
}

// PDF export options
export interface PdfExportOptions extends ExportOptions {
  componentToRender: React.ReactNode;
}

// HTML export options
export interface HtmlExportOptions extends ExportOptions {
  inventory: InventoryData | SnapshotLike;
}

/**
 * Snapshot-like structure for both runtime rendering and export processing.
 *
 * This unified type supports both:
 * - API client models (`Infra`, `VMs` from `@openshift-migration-advisor/planner-sdk/models`)
 *   for live data rendering
 * - Internal simplified types (`InfraData`, `VMsData`) for export pipelines
 *   (PDF/HTML generation, chart data transformation)
 *
 * The `ChartDataTransformer.normalizeInventory()` handles both formats by
 * extracting data from various nested structures, enabling safe interoperability.
 *
 * @see ChartDataTransformer.normalizeInventory for the normalization logic
 */
export interface SnapshotLike {
  createdAt?: string | Date;
  vcenterId?: string;
  infra?: InfraData | Infra;
  vms?: VMsData | VMs;
  inventory?: {
    infra?: InfraData | Infra;
    vms?: VMsData | VMs;
    vcenter?: {
      id?: string;
      infra?: InfraData | Infra;
      vms?: VMsData | VMs;
    };
    clusters?: Record<string, unknown> | { [key: string]: ApiInventoryData };
  };
}
