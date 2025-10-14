import React from 'react';
import Humanize from 'humanize-plus';

import type {
  Datastore,
  Network,
  MigrationIssue,
  Source,
} from '@migration-planner-ui/api-client/models';
import {
  Badge,
  Content,
  Flex,
  FlexItem,
  Icon,
  Progress,
  Stack,
  StackItem,
  TreeViewDataItem,
} from '@patternfly/react-core';
import {
  CogsIcon,
  DatabaseIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  HddIcon,
  InfrastructureIcon,
  MicrochipIcon,
  NetworkIcon,
  VirtualMachineIcon,
} from '@patternfly/react-icons';
import { global_danger_color_100 as globalDangerColor100 } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_warning_color_100 as globalWarningColor100 } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

import { Dashboard } from '../../../pages/report/assessment-report/Dashboard';
import { ReportPieChart } from '../../../pages/report/ReportPieChart';
import { ReportTable } from '../../../pages/report/ReportTable';
import { useDiscoverySources } from '../../contexts/discovery-sources/Context';

import EnhancedDownloadButton from './EnhancedDownloadButton';

export const DiscoveryStep: React.FC = () => {
  const discoverSourcesContext = useDiscoverySources();
  const { inventory } = discoverSourcesContext.sourceSelected as Source;
  const { infra, vms } = inventory!;
  const { datastores, networks } = infra;
  const { cpuCores, ramGB, diskCount, diskGB, os } = vms;

  // Create assessment when DiscoveryStep is accessed (only if source is not "Example")
  React.useEffect(() => {
    const sourceId = discoverSourcesContext.sourceSelected?.id;
    const sourceName = discoverSourcesContext.sourceSelected?.name;
    const sourceType = discoverSourcesContext.sourceSelected?.agent
      ? 'agent'
      : 'inventory';
    const assessmentName = `Assessment for ${sourceName || 'source'}`.replace(
      /\s+/g,
      '_',
    );
    if (
      sourceId &&
      sourceName !== 'Example' &&
      discoverSourcesContext.createAssessment
    ) {
      discoverSourcesContext.createAssessment(
        sourceId,
        sourceType,
        assessmentName,
      );
    }
  }, [
    discoverSourcesContext.sourceSelected?.id,
    discoverSourcesContext.sourceSelected?.name,
    discoverSourcesContext.createAssessment,
  ]);

  const operatingSystems = Object.entries(os).map(([name, count]) => ({
    name,
    count: count as number,
  }));

  const infrastructureViewData: TreeViewDataItem = {
    title: 'Infrastructure',
    icon: <InfrastructureIcon />,
    name: (
      <>
        We found {infra.totalClusters}{' '}
        {Humanize.pluralize(infra.totalClusters, 'cluster')} with{' '}
        {infra.totalHosts} {Humanize.pluralize(infra.totalHosts, 'host')}. The
        hosts have a total of {cpuCores.total} CPU cores and{' '}
        {Humanize.fileSize(ramGB.total * 1024 ** 3, 0)} of memory.
      </>
    ),
    id: 'infra',
  };

  const computeStatsViewData: TreeViewDataItem = {
    title: 'Compute per VM',
    icon: <MicrochipIcon />,
    id: 'compute',
    name: '',
    children: [
      {
        title: 'Details',
        id: 'compute-details',
        name: (
          <Flex
            fullWidth={{ default: 'fullWidth' }}
            spaceItems={{ default: 'spaceItems4xl' }}
          >
            <FlexItem>
              <ReportPieChart
                histogram={cpuCores.histogram}
                title="CPU Cores"
                legendLabel="CPU Cores"
              />
            </FlexItem>
            <FlexItem>
              <ReportPieChart
                histogram={ramGB.histogram}
                title="Memory"
                legendLabel="GB"
              />
            </FlexItem>
          </Flex>
        ),
      },
    ],
  };

  const diskStatsViewData: TreeViewDataItem = {
    title: 'Disk size per VM',
    icon: <HddIcon />,
    name: (
      <>
        The size of the virtual machine disk (VMDK) impacts the migration
        process duration due to the time required to copy the file to the
        OpenShift cluster and the time needed for disk format conversion.
      </>
    ),
    id: 'disk-size',
    children: [
      {
        title: 'Details',
        id: 'infra-details',
        name: (
          <Flex
            fullWidth={{ default: 'fullWidth' }}
            spaceItems={{ default: 'spaceItems4xl' }}
          >
            <FlexItem>
              <ReportPieChart
                histogram={diskGB.histogram}
                title="Disk capacity"
                legendLabel="GB"
              />
            </FlexItem>
            <FlexItem>
              <ReportPieChart
                histogram={diskCount.histogram}
                title="Number of disks"
                legendLabel="Disks"
              />
            </FlexItem>
          </Flex>
        ),
      },
    ],
  };

  const virtualMachinesViewData: TreeViewDataItem = {
    title: 'Virtual machines',
    icon: <VirtualMachineIcon />,
    name: (
      <>
        This environment consists of {vms.totalMigratableWithWarnings} virtual
        machines,{' '}
        {vms.total === (vms.totalMigratableWithWarnings ?? 0)
          ? 'All'
          : vms.totalMigratableWithWarnings}{' '}
        of them are potentially migratable to a new OpenShift cluster.
      </>
    ),
    id: 'vms',
    children: [
      {
        name: (
          <Content>
              Warnings{' '}
              <Badge isRead>
                {vms.migrationWarnings
                  .map(({ count }) => count)
                  .reduce((sum, n) => sum + n, 0)}
              </Badge>
            </Content>
        ),
        icon: (
          <Icon style={{ color: globalWarningColor100.value }}>
            <ExclamationTriangleIcon />
          </Icon>
        ),
        id: 'migration-warnings',
        children: [
          {
            name: (
              <ReportTable<MigrationIssue>
                data={vms.migrationWarnings}
                columns={['Total', 'Description']}
                fields={['count', 'assessment']}
              />
            ),
            id: 'migration-warnings-details',
          },
        ],
      },
      vms.notMigratableReasons.length > 0
        ? {
            name: (
              <Content>
                  Not migratable reasons{' '}
                  <Badge isRead>
                    {vms.migrationWarnings
                      .map(({ count }) => count)
                      .reduce((sum, n) => sum + n, 0)}
                  </Badge>
                </Content>
            ),
            icon: (
              <Icon style={{ color: globalDangerColor100.value }}>
                <ExclamationCircleIcon />
              </Icon>
            ),
            id: 'not-migratable',
            children: [
              {
                name: (
                  <ReportTable<MigrationIssue>
                    data={vms.notMigratableReasons}
                    columns={['Total', 'Description']}
                    fields={['count', 'assessment']}
                  />
                ),
                id: 'not-migratable-details',
              },
            ],
          }
        : null,
      computeStatsViewData,
      diskStatsViewData,
    ].filter(Boolean) as TreeViewDataItem[],
  };

  const distributedSwitchNetworks = networks.filter(
    (n) => n.type === 'distributed',
  );
  const standardNetworks = networks.filter((n) => n.type === 'standard');

  const uniqueDistributedSwitches = new Set(
    distributedSwitchNetworks.map((n) => n.dvswitch).filter(Boolean), // Remove empty values
  ).size;

  const networksViewData: TreeViewDataItem = {
    title: 'Networks',
    icon: <NetworkIcon />,
    name: (
      <>
        We found {networks.length} networks: {distributedSwitchNetworks.length}{' '}
        connected to {uniqueDistributedSwitches} distributed switches, and{' '}
        {standardNetworks.length} standard network
        {standardNetworks.length !== 1 ? 's' : ''}.
      </>
    ),
    id: 'networks',
    children: [
      {
        title: 'Details',
        name: (
          <ReportTable<Network>
            data={networks}
            columns={['Name', 'Type', 'VlanId']}
            fields={['name', 'type', 'vlanId']}
          />
        ),
        id: 'networks-details',
      },
    ],
  };

  const storageViewData: TreeViewDataItem = {
    title: 'Storage',
    icon: <DatabaseIcon />,
    name: (
      <>
        The environment consists of {datastores.length} datastores with a total
        capacity of{' '}
        {Humanize.fileSize(
          datastores
            .map((ds) => ds.totalCapacityGB)
            .reduce((sum, next) => sum + next, 0) *
            1024 ** 3,
        )}
        .
      </>
    ),
    id: 'storage',
    children: [
      {
        title: 'Datastores',
        name: (
          <ReportTable<
            Datastore & {
              usage: JSX.Element;
            }
          >
            data={datastores.map((ds) => ({
              ...ds,
              usage: (
                <div style={{ minWidth: '10rem', flexGrow: 1 }}>
                  <Progress
                    value={(ds.freeCapacityGB / ds.totalCapacityGB) * 100}
                    size="sm"
                    aria-label="Disk usage"
                  />
                </div>
              ),
            }))}
            columns={[
              'Type',
              'Vendor',
              'Storage offload support',
              'Protocol type',
              'Model',
              'Total capacity',
              'Usage %',
            ]}
            fields={[
              'type',
              'vendor',
              'hardwareAcceleratedMove',
              'protocolType',
              'model',
              'totalCapacityGB',
              'usage',
            ]}
            style={{ width: '55rem' }}
          />
        ),
        id: 'datastores',
      },
    ],
  };

  const operatingSystemsViewData: TreeViewDataItem = {
    title: 'Operating systems',
    icon: <CogsIcon />,
    name: (
      <>These are the operating systems running on your virtual machines.</>
    ),
    id: 'os',
    children: [
      {
        title: 'Details',
        name: (
          <ReportTable<{ name: string; count: number }>
            data={operatingSystems}
            columns={['Count', 'Name']}
            fields={['count', 'name']}
            style={{ width: '25rem' }}
          />
        ),
        id: 'os-details',
      },
    ],
  };

  const _treeViewData: Array<TreeViewDataItem> = [
    infrastructureViewData,
    virtualMachinesViewData,
    networksViewData,
    storageViewData,
    operatingSystemsViewData,
  ];

  return (
    <Stack hasGutter id="discovery-report">
      <StackItem>
        <Content>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
          >
            <FlexItem>
              <Content component="h2">Discovery report</Content>
            </FlexItem>
            <FlexItem spacer={{ default: 'spacerMd' }}>
              <EnhancedDownloadButton
                elementId="discovery-report"
                componentToRender={
                  <Dashboard
                    infra={infra}
                    cpuCores={cpuCores}
                    ramGB={ramGB}
                    vms={vms}
                    isExportMode={true}
                  />
                }
                sourceData={discoverSourcesContext.sourceSelected as Source}
              />
            </FlexItem>
          </Flex>
          <Content component="p">
            Review the information collected during the discovery process
          </Content>
        </Content>
      </StackItem>
      <StackItem>
        <Dashboard infra={infra} cpuCores={cpuCores} ramGB={ramGB} vms={vms} />
      </StackItem>
    </Stack>
  );
};

DiscoveryStep.displayName = 'DiscoveryStep';
