import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Assessment as AssessmentModel } from '@migration-planner-ui/api-client/models';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
} from '@patternfly/react-core';
import {
  ConnectedIcon,
  EllipsisVIcon,
  FileIcon,
  MonitoringIcon,
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { openAssistedInstaller } from './utils/functions';
import { parseLatestSnapshot } from './utils/snapshotParser';

type Props = {
  assessments: AssessmentModel[];
  isLoading?: boolean;
  search?: string;
  filterBy?: string;
  filterValue?: string;
  selectedSourceTypes?: string[];
  selectedOwners?: string[];
  sortBy?: { index: number; direction: 'asc' | 'desc' } | undefined;
  onSort?: (event: unknown, index: number, direction: 'asc' | 'desc') => void;
  onDelete?: (assessmentId: string) => void;
  onUpdate?: (assessmentId: string) => void;
};

const enum Columns {
  Name = 'Name',
  SourceType = 'Source type',
  LastUpdated = 'Last updated',
  Owner = 'Owner',
  Hosts = 'Hosts',
  VMs = 'VMs',
  Networks = 'Networks',
  Datastores = 'Datastores',
  Actions = '',
}

export const AssessmentsTable: React.FC<Props> = ({
  assessments,
  isLoading,
  search: _search = '',
  filterBy = 'Filter',
  filterValue = '',
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
      const assessmentModel = assessment as AssessmentModel;

      const name = assessmentModel?.name;
      const id = String(assessmentModel?.id ?? '');
      const sourceType = assessmentModel?.sourceType || 'Unknown';
      const snapshots = assessmentModel?.snapshots;

      // Parse snapshot data using utility function
      const snapshotData = parseLatestSnapshot(snapshots);

      // Format owner name from first and last name with proper capitalization
      const formatName = (name?: string): string | undefined =>
        name
          ?.split(' ')
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ');

      const ownerFirstName = formatName(assessmentModel?.ownerFirstName);
      const ownerLastName = formatName(assessmentModel?.ownerLastName);
      const ownerFullName =
        ownerFirstName && ownerLastName
          ? `${ownerFirstName} ${ownerLastName}`
          : ownerFirstName || ownerLastName;

      return {
        key: id || name,
        id,
        name,
        sourceType,
        lastUpdated: snapshotData.lastUpdated,
        owner: ownerFullName,
        hosts: snapshotData.hosts,
        vms: snapshotData.vms,
        networks: snapshotData.networks,
        datastores: snapshotData.datastores,
        snapshots: snapshots || [],
      };
    });

    let filtered = items;

    // Apply name-only search
    if (_search && _search.trim() !== '') {
      const query = _search.toLowerCase();
      filtered = filtered.filter((i) =>
        (i.name || '').toLowerCase().includes(query),
      );
    }

    // Apply dropdown filter (Source type or Owner)
    if (filterBy !== 'Filter' && filterValue.trim() !== '') {
      switch (filterBy) {
        case 'Source type':
          filtered = filtered.filter((i) =>
            i.sourceType.toLowerCase().includes(filterValue.toLowerCase()),
          );
          break;
        case 'Owner':
          filtered = filtered.filter((i) =>
            (i.owner || '').toLowerCase().includes(filterValue.toLowerCase()),
          );
          break;
      }
    }

    // Apply source type filter (legacy - keeping for backward compatibility)
    if (selectedSourceTypes && selectedSourceTypes.length > 0) {
      filtered = filtered.filter((i) =>
        selectedSourceTypes.includes(
          i.sourceType.toLowerCase() === 'rvtools' ? 'rvtools' : 'discovery',
        ),
      );
    }

    // Apply owners multi-select filter
    if (selectedOwners && selectedOwners.length > 0) {
      filtered = filtered.filter((i) => selectedOwners.includes(i.owner));
    }

    if (!sortBy) return filtered;

    const copy = [...filtered];
    switch (sortBy.index) {
      case 0: // Name column
        copy.sort((a, b) =>
          sortBy.direction === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        );
        break;
      case 1: // Source type column
        copy.sort((a, b) =>
          sortBy.direction === 'asc'
            ? a.sourceType.localeCompare(b.sourceType)
            : b.sourceType.localeCompare(a.sourceType),
        );
        break;
      case 2: // Last updated column
        copy.sort((a, b) =>
          sortBy.direction === 'asc'
            ? a.lastUpdated.localeCompare(b.lastUpdated)
            : b.lastUpdated.localeCompare(a.lastUpdated),
        );
        break;
      case 3: // Owner column
        copy.sort((a, b) =>
          sortBy.direction === 'asc'
            ? (a.owner || '').localeCompare(b.owner || '')
            : (b.owner || '').localeCompare(a.owner || ''),
        );
        break;
      case 4: // Hosts column
        copy.sort((a, b) => {
          const aHosts = typeof a.hosts === 'number' ? a.hosts : 0;
          const bHosts = typeof b.hosts === 'number' ? b.hosts : 0;
          return sortBy.direction === 'asc' ? aHosts - bHosts : bHosts - aHosts;
        });
        break;
      case 5: // VMs column
        copy.sort((a, b) => {
          const aVms = typeof a.vms === 'number' ? a.vms : 0;
          const bVms = typeof b.vms === 'number' ? b.vms : 0;
          return sortBy.direction === 'asc' ? aVms - bVms : bVms - aVms;
        });
        break;
      case 6: // Networks column
        copy.sort((a, b) => {
          const aNetworks = typeof a.networks === 'number' ? a.networks : 0;
          const bNetworks = typeof b.networks === 'number' ? b.networks : 0;
          return sortBy.direction === 'asc'
            ? aNetworks - bNetworks
            : bNetworks - aNetworks;
        });
        break;
      case 7: // Datastores column
        copy.sort((a, b) => {
          const aDatastores =
            typeof a.datastores === 'number' ? a.datastores : 0;
          const bDatastores =
            typeof b.datastores === 'number' ? b.datastores : 0;
          return sortBy.direction === 'asc'
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

  const nameSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 0,
      }
    : undefined;

  const sourceTypeSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 1,
      }
    : undefined;

  const lastUpdatedSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 2,
      }
    : undefined;

  const ownerSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 3,
      }
    : undefined;

  const hostsSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 4,
      }
    : undefined;

  const vmsSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 5,
      }
    : undefined;

  const networksSortParams = onSort
    ? {
        sortBy,
        onSort,
        columnIndex: 6,
      }
    : undefined;

  const datastoresSortParams = onSort
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
    <div style={{ width: '100%', maxHeight: '450px', overflow: 'auto' }}>
      <Table
        aria-label="Assessments table"
        variant="compact"
        borders={false}
        style={{ tableLayout: 'auto', width: '100%', fontSize: '16px' }}
      >
        <Thead>
          <Tr>
            <Th sort={nameSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.Name}
            </Th>
            <Th sort={sourceTypeSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.SourceType}
            </Th>
            <Th sort={lastUpdatedSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.LastUpdated}
            </Th>
            <Th sort={ownerSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.Owner}
            </Th>
            <Th sort={hostsSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.Hosts}
            </Th>
            <Th sort={vmsSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.VMs}
            </Th>
            <Th sort={networksSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.Networks}
            </Th>
            <Th sort={datastoresSortParams} style={{ whiteSpace: 'nowrap' }}>
              {Columns.Datastores}
            </Th>
            <Th style={{ whiteSpace: 'nowrap' }} screenReaderText="Actions">
              {Columns.Actions}
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.key}>
              <Td dataLabel={Columns.Name}>
                <Button
                  variant="link"
                  style={{ padding: 0 }}
                  onClick={() =>
                    navigate(
                      `/openshift/migration-assessment/assessments/${row.id}`,
                    )
                  }
                >
                  {row.name}
                </Button>
              </Td>
              <Td dataLabel={Columns.SourceType}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {row.sourceType.toLowerCase() === 'rvtools' ? (
                    <FileIcon />
                  ) : (
                    <ConnectedIcon />
                  )}
                  {row.sourceType.toLowerCase() === 'rvtools'
                    ? 'RVTools (XLS/X)'
                    : 'Discovery OVA'}
                </div>
              </Td>
              <Td dataLabel={Columns.LastUpdated}>{row.lastUpdated}</Td>
              <Td dataLabel={Columns.Owner}>{row.owner}</Td>
              <Td dataLabel={Columns.Hosts}>{row.hosts}</Td>
              <Td dataLabel={Columns.VMs}>{row.vms}</Td>
              <Td dataLabel={Columns.Networks}>{row.networks}</Td>
              <Td dataLabel={Columns.Datastores}>{row.datastores}</Td>
              <Td dataLabel={Columns.Actions}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Button
                    variant="plain"
                    aria-label="Open assessment"
                    icon={<MonitoringIcon />}
                    style={{ color: '#0066cc' }}
                    onClick={() =>
                      navigate(
                        `/openshift/migration-assessment/assessments/${row.id}/report`,
                      )
                    }
                  />
                  <Dropdown
                    isOpen={openDropdowns[row.id] || false}
                    popperProps={{ appendTo: () => document.body }}
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
                      >
                        Show assessment report
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => alert('Edit functionality coming soon!')}
                        isDisabled={true}
                      >
                        Edit assessment
                      </DropdownItem>
                      <DropdownItem onClick={openAssistedInstaller}>
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

AssessmentsTable.displayName = 'AssessmentsTable';

export default AssessmentsTable;
