import React from 'react';

import {
  Infra,
  VMResourceBreakdown,
  VMs,
} from '@migration-planner-ui/api-client/models';
import {
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  PageSection,
  } from '@patternfly/react-core';

import { Datastores } from './Datastores';
import { ErrorTable } from './ErrorTable';
import { InfrastructureOverview } from './InfastructureOverview';
import { NetworkTopology } from './NetworkTopology';
import { OSDistribution } from './OSDistribution';
import { StorageOverview } from './StorageOverview';
import { VMMigrationStatus } from './VMMigrationStatus';
import { WarningsTable } from './WarningsTable';

import './Dashboard.css';

interface Props {
  infra: Infra;
  cpuCores: VMResourceBreakdown;
  ramGB: VMResourceBreakdown;
  vms: VMs;
  isExportMode?: boolean;
}

export const Dashboard: React.FC<Props> = ({
  infra,
  cpuCores,
  ramGB,
  vms,
  isExportMode,
}) => {
  // Transform osInfo to include both count and supported fields, fallback to os with supported=true if osInfo is undefined
  const osData = vms.osInfo
    ? Object.entries(vms.osInfo).reduce(
        (acc, [osName, osInfo]) => {
          acc[osName] = {
            count: osInfo.count,
            supported: osInfo.supported,
          };
          return acc;
        },
        {} as { [osName: string]: { count: number; supported: boolean } },
      )
    : Object.entries(vms.os).reduce(
        (acc, [osName, count]) => {
          acc[osName] = {
            count: count,
            supported: true, // Default to supported when using fallback data
          };
          return acc;
        },
        {} as { [osName: string]: { count: number; supported: boolean } },
      );

  return (
    <PageSection hasBodyWrapper={false} >
      <Grid hasGutter>
        <GridItem span={12} id="infrastructure-overview">
          <InfrastructureOverview
            infra={infra}
            cpuCores={cpuCores}
            ramGB={ramGB}
          />
        </GridItem>
        <GridItem span={12}>
          <Gallery hasGutter minWidths={{ default: '40%' }}>
            <GalleryItem>
              <VMMigrationStatus
                data={{
                  migratable: vms.totalMigratable,
                  nonMigratable: vms.total - vms.totalMigratable,
                }}
                isExportMode={isExportMode}
              />
            </GalleryItem>
            <GalleryItem>
              <OSDistribution osData={osData} isExportMode={isExportMode} />
            </GalleryItem>
          </Gallery>
        </GridItem>
        <GridItem span={12}>
          <Gallery hasGutter minWidths={{ default: '40%' }}>
            <GalleryItem>
              <StorageOverview
                data={vms.diskGB.histogram.data}
                minValue={vms.diskGB.histogram.minValue}
                step={vms.diskGB.histogram.step}
                isExportMode={isExportMode}
              />
            </GalleryItem>
            <GalleryItem>
              <NetworkTopology
                networks={infra.networks}
                isExportMode={isExportMode}
              />
            </GalleryItem>
          </Gallery>
        </GridItem>
        <GridItem span={12}>
          <Gallery hasGutter minWidths={{ default: '80%' }}>
            <GalleryItem>
              <Datastores
                datastores={infra.datastores}
                isExportMode={isExportMode}
              />
            </GalleryItem>
          </Gallery>
        </GridItem>
        <GridItem span={12}>
          <Gallery hasGutter minWidths={{ default: '300px', md: '45%' }}>
            <GalleryItem>
              <WarningsTable
                warnings={vms.migrationWarnings}
                isExportMode={isExportMode}
              />
            </GalleryItem>
            <GalleryItem>
              <ErrorTable
                errors={vms.notMigratableReasons}
                isExportMode={isExportMode}
              />
            </GalleryItem>
          </Gallery>
        </GridItem>
      </Grid>
    </PageSection>
  );
};
