export const Columns = {
  Name: "Name",
  Assessments: "Assessments",
  CredentialsUrl: "Credentials URL",
  Status: "Appliance status",
  VersionStatus: "Agent version",
  Hosts: "Hosts",
  VMs: "VMs",
  Networks: "Networks",
  Datastores: "Datastores",
  Actions: "Actions",
  DataCollectedOn: "Data collected on",
  ImportedToConsole: "Imported to console",
} as const;

export type ColumnKey = keyof typeof Columns;

/** Table / manage-columns keys (not shown in the manage-columns modal). */
export type ManageableColumnKey = Exclude<
  ColumnKey,
  "CredentialsUrl" | "Assessments"
>;

export type SortableColumnKey = Exclude<
  ColumnKey,
  "Actions" | "CredentialsUrl" | "Assessments"
>;

export const SORTABLE_COLUMNS: SortableColumnKey[] = [
  "Name",
  "Status",
  "VersionStatus",
  "Hosts",
  "VMs",
  "Networks",
  "Datastores",
  "DataCollectedOn",
  "ImportedToConsole",
];

/** Columns shown on first visit (matches the default Discovery Appliances table). */
export const DEFAULT_VISIBLE_COLUMNS: ManageableColumnKey[] = [
  "Name",
  "Status",
  "VersionStatus",
  "VMs",
  "DataCollectedOn",
  "ImportedToConsole",
  "Actions",
];

export const MANDATORY_COLUMNS: ManageableColumnKey[] = ["Name", "Actions"];

export const COLUMN_MANAGEMENT_METADATA: Record<
  ColumnKey,
  {
    title: string;
    isShownByDefault: boolean;
    isUntoggleable: boolean;
  }
> = {
  Name: {
    title: Columns.Name,
    isShownByDefault: true,
    isUntoggleable: true,
  },
  Assessments: {
    title: Columns.Assessments,
    isShownByDefault: true,
    isUntoggleable: true,
  },
  CredentialsUrl: {
    title: Columns.CredentialsUrl,
    isShownByDefault: false,
    isUntoggleable: false,
  },
  Status: {
    title: Columns.Status,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  VersionStatus: {
    title: Columns.VersionStatus,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Hosts: {
    title: Columns.Hosts,
    isShownByDefault: false,
    isUntoggleable: false,
  },
  VMs: {
    title: Columns.VMs,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Networks: {
    title: Columns.Networks,
    isShownByDefault: false,
    isUntoggleable: false,
  },
  Datastores: {
    title: Columns.Datastores,
    isShownByDefault: false,
    isUntoggleable: false,
  },
  Actions: {
    title: Columns.Actions,
    isShownByDefault: true,
    isUntoggleable: true,
  },
  DataCollectedOn: {
    title: Columns.DataCollectedOn,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  ImportedToConsole: {
    title: Columns.ImportedToConsole,
    isShownByDefault: true,
    isUntoggleable: false,
  },
};

/** Keys available in the manage-columns modal (table columns only). */
export const COLUMN_MANAGEMENT_KEYS = (
  Object.keys(Columns) as ColumnKey[]
).filter(
  (key): key is ManageableColumnKey =>
    key !== "CredentialsUrl" && key !== "Assessments",
);

export type Columns = (typeof Columns)[keyof typeof Columns];
