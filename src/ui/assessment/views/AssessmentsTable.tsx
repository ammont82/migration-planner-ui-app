import { EmptySearchResults } from "@openshift-migration-advisor/shared-components";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Icon,
  MenuToggle,
  type MenuToggleElement,
  Tooltip,
  Truncate,
} from "@patternfly/react-core";
import {
  RhUiConnectedIcon,
  RhUiDocumentIcon,
  RhUiEllipsisVerticalIcon,
  RhUiWarningFillIcon,
} from "@patternfly/react-icons";
import {
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { formatRelativeTime } from "../../../lib/common/Time";
import { themeTooltipFlyoutProps } from "../../../lib/patternfly/flyoutAppendTo";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import { routes } from "../../../routing/Routes";
import {
  type AssessmentSourceFilterKey,
  getAssessmentSourceLabel,
  isUploadedFileSourceType,
  sourceMatchesAssessmentSourceFilter,
} from "../helpers/assessmentSource";

const openAssistedInstaller = (): void => {
  const currentHost = window.location.hostname;
  if (currentHost === "console.stage.redhat.com") {
    window.open(
      "https://console.dev.redhat.com/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  } else {
    window.open(
      "/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  }
};

type AssessmentsTableProps = {
  assessments: AssessmentModel[];
  search?: string;
  filterBy?: string;
  filterValue?: string;
  selectedSources?: AssessmentSourceFilterKey[];
  selectedOwners?: string[];
  sortBy?: { columnKey: SortableColumn; direction: "asc" | "desc" } | undefined;
  onSort?: (
    event: unknown,
    columnKey: SortableColumn,
    direction: "asc" | "desc",
  ) => void;
  onDelete?: (assessmentId: string) => void;
  onUpdate?: (assessmentId: string) => void;
  visibleColumns?: ColumnKey[];
  onShareAssessment: (assessmentId: string) => void;
  onUnshareAssessment: (assessmentId: string) => void;
};

export const Columns = {
  Name: "Name",
  Source: "Source",
  LastUpdated: "Last updated",
  Owner: "Owner",
  Hosts: "Hosts",
  VMs: "VMs",
  Networks: "Networks",
  Datastores: "Datastores",
  SharingStatus: "Sharing status",
  Actions: "",
} as const;

export type ColumnKey = keyof typeof Columns;
export const DEFAULT_VISIBLE_COLUMNS = Object.keys(Columns) as ColumnKey[];
export const MANDATORY_COLUMNS: ColumnKey[] = ["Name", "Actions"];

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
  Source: {
    title: Columns.Source,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  LastUpdated: {
    title: Columns.LastUpdated,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Owner: {
    title: Columns.Owner,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Hosts: {
    title: Columns.Hosts,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  VMs: {
    title: Columns.VMs,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Networks: {
    title: Columns.Networks,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Datastores: {
    title: Columns.Datastores,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  SharingStatus: {
    title: Columns.SharingStatus,
    isShownByDefault: true,
    isUntoggleable: false,
  },
  Actions: {
    title: Columns.Actions,
    isShownByDefault: true,
    isUntoggleable: true,
  },
};

export type SortableColumn = Exclude<ColumnKey, "SharingStatus" | "Actions">;
export const SORTABLE_COLUMNS: SortableColumn[] = [
  "Name",
  "Source",
  "LastUpdated",
  "Owner",
  "Hosts",
  "VMs",
  "Networks",
  "Datastores",
];

export const AssessmentsTable: React.FC<AssessmentsTableProps> = ({
  assessments,
  search: _search = "",
  filterBy = "Filter",
  filterValue = "",
  selectedSources = [],
  selectedOwners = [],
  sortBy,
  onSort,
  onDelete,
  visibleColumns = Object.keys(Columns) as ColumnKey[],
  onShareAssessment,
  onUnshareAssessment,
}) => {
  const navigate = useNavigate();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  const toggleDropdown = (assessmentId: string): void => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [assessmentId]: !prev[assessmentId],
    }));
  };

  const isColumnVisible = (columnKey: ColumnKey): boolean => {
    return visibleColumns.includes(columnKey);
  };

  const handleDelete = (assessmentId: string): void => {
    onDelete?.(assessmentId);
  };

  const rows = useMemo(() => {
    const safeAssessments = Array.isArray(assessments) ? assessments : [];
    const items = safeAssessments.map((assessment) => {
      const name = assessment.name;
      const id = String(assessment.id ?? "");
      const sourceType = assessment.sourceType || "Unknown";
      const source = getAssessmentSourceLabel(sourceType);
      const snapshots = assessment.snapshots ?? [];
      const permissions = Array.isArray(assessment.permissions)
        ? assessment.permissions
        : [];
      const isShared = assessment.sharing?.isShared || false;
      const sharedBy = assessment.sharing?.sharedBy || null;

      // Use pre-computed model properties
      const snapshotData = assessment.latestSnapshot;
      const ownerFullName = assessment.ownerFullName;
      const hasData = assessment.hasUsefulData;

      // Compute latest snapshot timestamp (ms) for reliable sort/filter
      const lastUpdatedMs: number =
        Array.isArray(snapshots) && snapshots.length
          ? Math.max(
              ...snapshots.map((s) =>
                s?.createdAt
                  ? new Date(s.createdAt as unknown as string).getTime()
                  : 0,
              ),
            )
          : 0;

      return {
        key: id || name,
        id,
        name,
        source,
        sourceType,
        lastUpdatedMs,
        owner: ownerFullName,
        hosts: snapshotData.hosts,
        vms: snapshotData.vms,
        networks: snapshotData.networks,
        datastores: snapshotData.datastores,
        snapshots,
        hasData,
        permissions,
        isShared,
        sharedBy,
      };
    });

    let filtered = items;

    // Apply name-only search
    if (_search && _search.trim() !== "") {
      const query = _search.toLowerCase();
      filtered = filtered.filter((i) =>
        (i.name || "").toLowerCase().includes(query),
      );
    }

    // Apply dropdown filter (Source or Owner)
    if (filterBy !== "Filter" && filterValue.trim() !== "") {
      switch (filterBy) {
        case "Source":
          filtered = filtered.filter((i) =>
            i.source.toLowerCase().includes(filterValue.toLowerCase()),
          );
          break;
        case "Owner":
          filtered = filtered.filter((i) =>
            (i.owner || "").toLowerCase().includes(filterValue.toLowerCase()),
          );
          break;
        case "Last updated": {
          const query = filterValue.trim().toLowerCase();
          // eslint-disable-next-line react-hooks/purity
          const nowMs = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000;
          const matchByRule = (itemMs: number): boolean => {
            if (!itemMs) {
              return false;
            }
            const diffDays = Math.floor((nowMs - itemMs) / oneDayMs);

            // Common quick filters
            if (query === "today") return diffDays === 0;
            if (query === "yesterday") return diffDays === 1;
            if (
              query === "last 7 days" ||
              query === "past 7 days" ||
              query === "week"
            )
              return diffDays >= 0 && diffDays < 7;
            if (
              query === "last 30 days" ||
              query === "past 30 days" ||
              query === "month" ||
              query === "last month"
            )
              return diffDays >= 0 && diffDays < 30;

            // Numeric relative: e.g., "3 days", "10d"
            const rel = query.match(/(\d+)\s*(d|day|days)\b/);
            if (rel) {
              const days = Number(rel[1]);
              if (!Number.isNaN(days)) {
                return diffDays >= 0 && diffDays < days;
              }
            }

            // Date input: try to parse and match same calendar date
            const parsed = new Date(filterValue);
            if (!Number.isNaN(parsed.getTime())) {
              const targetY = parsed.getFullYear();
              const targetM = parsed.getMonth();
              const targetD = parsed.getDate();
              const d = new Date(itemMs);
              return (
                d.getFullYear() === targetY &&
                d.getMonth() === targetM &&
                d.getDate() === targetD
              );
            }

            // Fallback: substring on rendered label (e.g., "today", "1 day ago")
            return formatRelativeTime(itemMs).toLowerCase().includes(query);
          };

          filtered = filtered.filter((i) => matchByRule(i.lastUpdatedMs));
          break;
        }
      }
    }

    if (selectedSources.length > 0) {
      filtered = filtered.filter((i) =>
        selectedSources.some((key) =>
          sourceMatchesAssessmentSourceFilter(i.sourceType, key),
        ),
      );
    }

    // Apply owners multi-select filter
    if (selectedOwners && selectedOwners.length > 0) {
      filtered = filtered.filter((i) =>
        i.owner ? selectedOwners.includes(i.owner) : false,
      );
    }

    if (!sortBy) return filtered;

    const copy = [...filtered];
    switch (sortBy.columnKey) {
      case "Name":
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        );
        break;
      case "Source":
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? a.source.localeCompare(b.source)
            : b.source.localeCompare(a.source),
        );
        break;
      case "LastUpdated":
        copy.sort((a, b) => {
          const aMs = typeof a.lastUpdatedMs === "number" ? a.lastUpdatedMs : 0;
          const bMs = typeof b.lastUpdatedMs === "number" ? b.lastUpdatedMs : 0;
          return sortBy.direction === "asc" ? aMs - bMs : bMs - aMs;
        });
        break;
      case "Owner":
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? (a.owner || "").localeCompare(b.owner || "")
            : (b.owner || "").localeCompare(a.owner || ""),
        );
        break;
      case "Hosts":
        copy.sort((a, b) => {
          const aHosts = typeof a.hosts === "number" ? a.hosts : 0;
          const bHosts = typeof b.hosts === "number" ? b.hosts : 0;
          return sortBy.direction === "asc" ? aHosts - bHosts : bHosts - aHosts;
        });
        break;
      case "VMs":
        copy.sort((a, b) => {
          const aVms = typeof a.vms === "number" ? a.vms : 0;
          const bVms = typeof b.vms === "number" ? b.vms : 0;
          return sortBy.direction === "asc" ? aVms - bVms : bVms - aVms;
        });
        break;
      case "Networks":
        copy.sort((a, b) => {
          const aNetworks = typeof a.networks === "number" ? a.networks : 0;
          const bNetworks = typeof b.networks === "number" ? b.networks : 0;
          return sortBy.direction === "asc"
            ? aNetworks - bNetworks
            : bNetworks - aNetworks;
        });
        break;
      case "Datastores":
        copy.sort((a, b) => {
          const aDatastores =
            typeof a.datastores === "number" ? a.datastores : 0;
          const bDatastores =
            typeof b.datastores === "number" ? b.datastores : 0;
          return sortBy.direction === "asc"
            ? aDatastores - bDatastores
            : bDatastores - aDatastores;
        });
        break;
    }
    return copy;
  }, [
    assessments,
    _search,
    filterBy,
    filterValue,
    selectedSources,
    selectedOwners,
    sortBy,
  ]);

  const showNoResultFound = assessments.length > 0 && rows.length === 0;

  const getSortParams = (columnKey: SortableColumn) => {
    if (!onSort || !sortBy) return undefined;
    const columnIndex = SORTABLE_COLUMNS.indexOf(columnKey);
    const activeSortColumnIndex = SORTABLE_COLUMNS.indexOf(sortBy.columnKey);
    return {
      sortBy: {
        index: activeSortColumnIndex,
        direction: sortBy.direction,
      },
      onSort: (event: unknown, _index: number, direction: "asc" | "desc") => {
        onSort(event, columnKey, direction);
      },
      columnIndex,
    };
  };

  return (
    <Table
      aria-label="Assessments table"
      variant="compact"
      borders={false}
      isStickyHeader
      gridBreakPoint="grid-md"
    >
      <Thead>
        <Tr>
          {isColumnVisible("Name") && (
            <Th sort={getSortParams("Name")} modifier="nowrap">
              {Columns.Name}
            </Th>
          )}
          {isColumnVisible("Source") && (
            <Th sort={getSortParams("Source")} modifier="nowrap">
              {Columns.Source}
            </Th>
          )}
          {isColumnVisible("LastUpdated") && (
            <Th sort={getSortParams("LastUpdated")} modifier="nowrap">
              {Columns.LastUpdated}
            </Th>
          )}
          {isColumnVisible("Owner") && (
            <Th sort={getSortParams("Owner")} modifier="nowrap">
              {Columns.Owner}
            </Th>
          )}
          {isColumnVisible("Hosts") && (
            <Th sort={getSortParams("Hosts")} modifier="nowrap">
              {Columns.Hosts}
            </Th>
          )}
          {isColumnVisible("VMs") && (
            <Th sort={getSortParams("VMs")} modifier="nowrap">
              {Columns.VMs}
            </Th>
          )}
          {isColumnVisible("Networks") && (
            <Th sort={getSortParams("Networks")} modifier="nowrap">
              {Columns.Networks}
            </Th>
          )}
          {isColumnVisible("Datastores") && (
            <Th sort={getSortParams("Datastores")} modifier="nowrap">
              {Columns.Datastores}
            </Th>
          )}
          {isColumnVisible("SharingStatus") && (
            <Th modifier="nowrap">{Columns.SharingStatus}</Th>
          )}
          {isColumnVisible("Actions") && (
            <Th modifier="fitContent" screenReaderText="Actions">
              {Columns.Actions}
            </Th>
          )}
        </Tr>
      </Thead>
      <Tbody>
        {showNoResultFound && (
          <Tr>
            <Td colSpan={visibleColumns.length}>
              <EmptySearchResults title="No matching assessment found" />
            </Td>
          </Tr>
        )}
        {rows.map((row) => (
          <Tr key={row.key}>
            {isColumnVisible("Name") && (
              <Td dataLabel={Columns.Name}>
                {row.hasData ? (
                  <TableText wrapModifier="breakWord">
                    <Link to={routes.assessmentReport(row.id)}>{row.name}</Link>
                  </TableText>
                ) : (
                  <span>
                    <Tooltip
                      {...themeTooltipFlyoutProps}
                      content={
                        row.sourceType.toLowerCase().includes("rvtools")
                          ? "No inventory data found. The uploaded file may be corrupted. Please verify and re-upload."
                          : "No inventory data yet. Data collection may be in progress or the source connection failed."
                      }
                    >
                      <Icon status="warning">
                        <RhUiWarningFillIcon />
                      </Icon>
                    </Tooltip>{" "}
                    <Tooltip {...themeTooltipFlyoutProps} content={row.name}>
                      <span>{row.name}</span>
                    </Tooltip>
                  </span>
                )}
              </Td>
            )}
            {isColumnVisible("Source") && (
              <Td dataLabel={Columns.Source}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isUploadedFileSourceType(row.sourceType) ? (
                    <RhUiDocumentIcon />
                  ) : (
                    <RhUiConnectedIcon />
                  )}
                  <Truncate content={row.source} />
                </div>
              </Td>
            )}
            {isColumnVisible("LastUpdated") && (
              <Td dataLabel={Columns.LastUpdated}>
                {row.lastUpdatedMs ? (
                  <Tooltip
                    {...themeTooltipFlyoutProps}
                    content={new Date(row.lastUpdatedMs).toLocaleString()}
                  >
                    <span>{formatRelativeTime(row.lastUpdatedMs)}</span>
                  </Tooltip>
                ) : (
                  "-"
                )}
              </Td>
            )}
            {isColumnVisible("Owner") && (
              <Td dataLabel={Columns.Owner}>
                <Truncate content={row.owner} />
              </Td>
            )}
            {isColumnVisible("Hosts") && (
              <Td dataLabel={Columns.Hosts}>{row.hosts}</Td>
            )}
            {isColumnVisible("VMs") && (
              <Td dataLabel={Columns.VMs}>{row.vms}</Td>
            )}
            {isColumnVisible("Networks") && (
              <Td dataLabel={Columns.Networks}>{row.networks}</Td>
            )}
            {isColumnVisible("Datastores") && (
              <Td dataLabel={Columns.Datastores}>{row.datastores}</Td>
            )}
            {isColumnVisible("SharingStatus") && (
              <Td dataLabel={Columns.SharingStatus}>
                {row.isShared
                  ? row.sharedBy
                    ? row.sharedBy.name
                      ? `Shared by ${row.sharedBy.name}`
                      : "Shared by customer"
                    : "Shared with partner"
                  : "Not shared"}
              </Td>
            )}
            {isColumnVisible("Actions") && (
              <Td dataLabel={Columns.Actions} modifier="fitContent">
                <Dropdown
                  isOpen={openDropdowns[row.id] || false}
                  popperProps={{
                    appendTo: () => document.body,
                    position: "end",
                  }}
                  onOpenChange={(isOpen) =>
                    setOpenDropdowns((prev) => ({
                      ...prev,
                      [row.id]: isOpen,
                    }))
                  }
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Actions"
                      variant="plain"
                      onClick={() => toggleDropdown(row.id)}
                      icon={<RhUiEllipsisVerticalIcon />}
                      style={{ padding: 0, width: "fit-content" }}
                    ></MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      onClick={() => {
                        void navigate(routes.assessmentReport(row.id));
                      }}
                      isDisabled={
                        !row.hasData || !row.permissions.includes("read")
                      }
                    >
                      View assessment report
                    </DropdownItem>
                    {row.isShared ? (
                      <DropdownItem
                        onClick={() => {
                          toggleDropdown(row.id);
                          return onUnshareAssessment(row.id);
                        }}
                        isDisabled={!row.permissions.includes("share")}
                      >
                        Unshare assessment
                      </DropdownItem>
                    ) : (
                      <DropdownItem
                        onClick={() => {
                          toggleDropdown(row.id);
                          return onShareAssessment(row.id);
                        }}
                        isDisabled={!row.permissions.includes("share")}
                      >
                        Share assessment
                      </DropdownItem>
                    )}
                    <DropdownItem
                      onClick={openAssistedInstaller}
                      isDisabled={!row.hasData}
                    >
                      Create a target cluster
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        toggleDropdown(row.id);
                        return handleDelete(row.id);
                      }}
                      isDisabled={
                        !onDelete || !row.permissions.includes("delete")
                      }
                    >
                      Delete assessment
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </Td>
            )}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

AssessmentsTable.displayName = "AssessmentsTable";
