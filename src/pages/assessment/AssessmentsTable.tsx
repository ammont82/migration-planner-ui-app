import { Assessment as AssessmentModel } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
  Tooltip,
} from "@patternfly/react-core";
import {
  ConnectedIcon,
  EllipsisVIcon,
  ExclamationTriangleIcon,
  FileIcon,
  MonitoringIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { openAssistedInstaller } from "./utils/functions";
import { hasUsefulData, parseLatestSnapshot } from "./utils/snapshotParser";

type Props = {
  assessments: AssessmentModel[];
  isLoading?: boolean;
  search?: string;
  filterBy?: string;
  filterValue?: string;
  selectedSourceTypes?: string[];
  selectedOwners?: string[];
  sortBy?: { index: number; direction: "asc" | "desc" } | undefined;
  onSort?: (event: unknown, index: number, direction: "asc" | "desc") => void;
  onDelete?: (assessmentId: string) => void;
  onUpdate?: (assessmentId: string) => void;
};

const enum Columns {
  Name = "Name",
  SourceType = "Source type",
  LastUpdated = "Last updated",
  Owner = "Owner",
  Hosts = "Hosts",
  VMs = "VMs",
  Networks = "Networks",
  Datastores = "Datastores",
  Actions = "",
}

export const AssessmentsTable: React.FC<Props> = ({
  assessments,
  isLoading,
  search: _search = "",
  filterBy = "Filter",
  filterValue = "",
  selectedSourceTypes = [],
  selectedOwners = [],
  sortBy,
  onSort,
  onDelete,
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

  const handleDelete = (assessmentId: string): void => {
    onDelete?.(assessmentId);
  };

  const rows = useMemo(() => {
    const safeAssessments = Array.isArray(assessments) ? assessments : [];
    const items = safeAssessments.map((assessment) => {
      const assessmentModel = assessment;

      const name = assessmentModel?.name;
      const id = String(assessmentModel?.id ?? "");
      const sourceType = assessmentModel?.sourceType || "Unknown";
      const snapshots = assessmentModel?.snapshots ?? undefined;

      // Parse snapshot data using utility function
      const snapshotData = parseLatestSnapshot(snapshots);

      // Format owner name from first and last name with proper capitalization
      const formatName = (name?: string): string | undefined =>
        name
          ?.split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");

      const ownerFirstName = formatName(assessmentModel?.ownerFirstName);
      const ownerLastName = formatName(assessmentModel?.ownerLastName);
      const ownerFullName =
        ownerFirstName && ownerLastName
          ? `${ownerFirstName} ${ownerLastName}`
          : ownerFirstName || ownerLastName;

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

      // Check if the assessment has useful inventory data
      const hasData = hasUsefulData(snapshots);

      return {
        key: id || name,
        id,
        name,
        sourceType,
        lastUpdated: snapshotData.lastUpdated,
        lastUpdatedMs,
        owner: ownerFullName ?? "",
        hosts: snapshotData.hosts,
        vms: snapshotData.vms,
        networks: snapshotData.networks,
        datastores: snapshotData.datastores,
        snapshots: snapshots ?? [],
        hasData,
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

    // Apply dropdown filter (Source type or Owner)
    if (filterBy !== "Filter" && filterValue.trim() !== "") {
      switch (filterBy) {
        case "Source type":
          filtered = filtered.filter((i) =>
            i.sourceType.toLowerCase().includes(filterValue.toLowerCase()),
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
          const matchByRule = (itemMs: number, itemLabel: string): boolean => {
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

            // Fallback: substring on rendered label (e.g., "Today", "1 day ago")
            return itemLabel.toLowerCase().includes(query);
          };

          filtered = filtered.filter((i) =>
            matchByRule(i.lastUpdatedMs, i.lastUpdated),
          );
          break;
        }
      }
    }

    // Apply source type filter (legacy - keeping for backward compatibility)
    if (selectedSourceTypes && selectedSourceTypes.length > 0) {
      filtered = filtered.filter((i) =>
        selectedSourceTypes.includes(
          i.sourceType.toLowerCase() === "rvtools" ? "rvtools" : "discovery",
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
    switch (sortBy.index) {
      case 0: // Name column
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        );
        break;
      case 1: // Source type column
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? a.sourceType.localeCompare(b.sourceType)
            : b.sourceType.localeCompare(a.sourceType),
        );
        break;
      case 2: // Last updated column
        copy.sort((a, b) => {
          const aMs = typeof a.lastUpdatedMs === "number" ? a.lastUpdatedMs : 0;
          const bMs = typeof b.lastUpdatedMs === "number" ? b.lastUpdatedMs : 0;
          return sortBy.direction === "asc" ? aMs - bMs : bMs - aMs;
        });
        break;
      case 3: // Owner column
        copy.sort((a, b) =>
          sortBy.direction === "asc"
            ? (a.owner || "").localeCompare(b.owner || "")
            : (b.owner || "").localeCompare(a.owner || ""),
        );
        break;
      case 4: // Hosts column
        copy.sort((a, b) => {
          const aHosts = typeof a.hosts === "number" ? a.hosts : 0;
          const bHosts = typeof b.hosts === "number" ? b.hosts : 0;
          return sortBy.direction === "asc" ? aHosts - bHosts : bHosts - aHosts;
        });
        break;
      case 5: // VMs column
        copy.sort((a, b) => {
          const aVms = typeof a.vms === "number" ? a.vms : 0;
          const bVms = typeof b.vms === "number" ? b.vms : 0;
          return sortBy.direction === "asc" ? aVms - bVms : bVms - aVms;
        });
        break;
      case 6: // Networks column
        copy.sort((a, b) => {
          const aNetworks = typeof a.networks === "number" ? a.networks : 0;
          const bNetworks = typeof b.networks === "number" ? b.networks : 0;
          return sortBy.direction === "asc"
            ? aNetworks - bNetworks
            : bNetworks - aNetworks;
        });
        break;
      case 7: // Datastores column
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
    selectedSourceTypes,
    selectedOwners,
    sortBy,
  ]);

  const nameSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 0,
        }
      : undefined;

  const sourceTypeSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 1,
        }
      : undefined;

  const lastUpdatedSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 2,
        }
      : undefined;

  const ownerSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 3,
        }
      : undefined;

  const hostsSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 4,
        }
      : undefined;

  const vmsSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 5,
        }
      : undefined;

  const networksSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 6,
        }
      : undefined;

  const datastoresSortParams =
    onSort && sortBy
      ? {
          sortBy,
          onSort,
          columnIndex: 7,
        }
      : undefined;

  if (isLoading && (!assessments || assessments.length === 0)) {
    return (
      <Table aria-label="Loading assessments" variant="compact" borders={false}>
        <Tbody>
          <Tr>
            <Td colSpan={9}>
              <Spinner size="xl" />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        maxHeight: "450px",
        overflowY: "auto",
        overflowX: "visible",
      }}
    >
      <Table
        aria-label="Assessments table"
        variant="compact"
        borders={false}
        style={{ tableLayout: "auto", width: "100%", fontSize: "16px" }}
      >
        <Thead>
          <Tr>
            <Th sort={nameSortParams} modifier="wrap">
              {Columns.Name}
            </Th>
            <Th sort={sourceTypeSortParams} modifier="wrap">
              {Columns.SourceType}
            </Th>
            <Th sort={lastUpdatedSortParams} modifier="wrap">
              {Columns.LastUpdated}
            </Th>
            <Th sort={ownerSortParams} modifier="wrap">
              {Columns.Owner}
            </Th>
            <Th sort={hostsSortParams} modifier="wrap">
              {Columns.Hosts}
            </Th>
            <Th sort={vmsSortParams} modifier="wrap">
              {Columns.VMs}
            </Th>
            <Th sort={networksSortParams} modifier="wrap">
              {Columns.Networks}
            </Th>
            <Th sort={datastoresSortParams} modifier="wrap">
              {Columns.Datastores}
            </Th>
            <Th
              modifier="fitContent"
              screenReaderText="Actions"
              style={{ whiteSpace: "nowrap" }}
            >
              {Columns.Actions}
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.key}>
              <Td dataLabel={Columns.Name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Button
                    variant={row.hasData ? "link" : "plain"}
                    style={{ padding: 0 }}
                    isDisabled={!row.hasData}
                    onClick={
                      row.hasData
                        ? (): void =>
                            navigate(
                              `/openshift/migration-assessment/assessments/${row.id}`,
                            )
                        : undefined
                    }
                  >
                    {row.name}
                  </Button>
                  {!row.hasData && (
                    <Tooltip
                      content={
                        row.sourceType.toLowerCase().includes("rvtools")
                          ? "No inventory data found. The uploaded file may be corrupted. Please verify and re-upload."
                          : "No inventory data yet. Data collection may be in progress or the source connection failed."
                      }
                    >
                      <ExclamationTriangleIcon
                        style={{ color: "#f0ab00", cursor: "help" }}
                      />
                    </Tooltip>
                  )}
                </div>
              </Td>
              <Td dataLabel={Columns.SourceType}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {row.sourceType.toLowerCase() === "rvtools" ? (
                    <FileIcon />
                  ) : (
                    <ConnectedIcon />
                  )}
                  {row.sourceType.toLowerCase() === "rvtools"
                    ? "RVTools (XLS/X)"
                    : "Discovery OVA"}
                </div>
              </Td>
              <Td dataLabel={Columns.LastUpdated}>{row.lastUpdated}</Td>
              <Td dataLabel={Columns.Owner}>{row.owner}</Td>
              <Td dataLabel={Columns.Hosts}>{row.hosts}</Td>
              <Td dataLabel={Columns.VMs}>{row.vms}</Td>
              <Td dataLabel={Columns.Networks}>{row.networks}</Td>
              <Td dataLabel={Columns.Datastores}>{row.datastores}</Td>
              <Td
                dataLabel={Columns.Actions}
                style={{
                  verticalAlign: "middle",
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%",
                  }}
                >
                  <Tooltip
                    content={
                      row.hasData
                        ? "Show assessment report"
                        : row.sourceType.toLowerCase().includes("rvtools")
                          ? "No inventory data found. The uploaded file may be corrupted. Please verify and re-upload."
                          : "No inventory data yet. Data collection may be in progress or the source connection failed."
                    }
                  >
                    <Button
                      variant="plain"
                      aria-label="Open assessment"
                      icon={
                        <MonitoringIcon
                          style={{ color: row.hasData ? "#0066cc" : "#6a6e73" }}
                        />
                      }
                      style={{ padding: 0 }}
                      isAriaDisabled={!row.hasData}
                      onClick={() =>
                        navigate(
                          `/openshift/migration-assessment/assessments/${row.id}/report`,
                        )
                      }
                    />
                  </Tooltip>
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
                        icon={<EllipsisVIcon />}
                        style={{ padding: 0 }}
                      ></MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        onClick={() =>
                          navigate(
                            `/openshift/migration-assessment/assessments/${row.id}/report`,
                          )
                        }
                        isDisabled={!row.hasData}
                      >
                        Show assessment report
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => alert("Edit functionality coming soon!")}
                        isDisabled={true}
                      >
                        Edit assessment
                      </DropdownItem>
                      <DropdownItem
                        onClick={openAssistedInstaller}
                        isDisabled={!row.hasData}
                      >
                        Create a target cluster
                      </DropdownItem>
                      <DropdownItem onClick={() => handleDelete(row.id)}>
                        Delete assessment
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};

AssessmentsTable.displayName = "AssessmentsTable";

export default AssessmentsTable;
