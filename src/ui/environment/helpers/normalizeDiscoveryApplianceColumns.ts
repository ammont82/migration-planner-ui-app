import {
  COLUMN_MANAGEMENT_KEYS,
  DEFAULT_VISIBLE_COLUMNS,
  type ManageableColumnKey,
} from "../views/Columns";

const LEGACY_MANAGEABLE_COLUMN_KEYS: Record<string, ManageableColumnKey> = {
  LastSeen: "ImportedToConsole",
};

/**
 * Maps removed column keys from older builds and drops unknown entries so
 * "Last updated" does not linger in saved preferences.
 */
export const normalizeDiscoveryApplianceVisibleColumns = (
  stored: readonly string[],
): ManageableColumnKey[] => {
  const mapped = stored
    .map((key) => LEGACY_MANAGEABLE_COLUMN_KEYS[key] ?? key)
    .filter((key): key is ManageableColumnKey =>
      COLUMN_MANAGEMENT_KEYS.includes(key),
    );

  if (mapped.length === 0) {
    return [...DEFAULT_VISIBLE_COLUMNS];
  }

  return Array.from(new Set(mapped));
};
