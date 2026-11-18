import type {
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import {
  ClustersOverview,
  CpuAndMemoryOverview,
  ErrorTable,
  HostPowerStates,
  HostsOverview,
  InfrastructureSummary,
  NetworkOverview,
  OSDistribution,
  type OSDistributionEntry,
  StorageOverview,
  VCenterClusterDetails,
  VMMigrationStatus,
  VmPowerStates,
  WarningsTable,
} from "@openshift-migration-advisor/shared-components";
import { Gallery, GalleryItem, Grid, GridItem } from "@patternfly/react-core";
import React from "react";

import { useDashboardViewModel } from "../../view-models/useDashboardViewModel";

interface Props {
  infra: Infra;
  cpuCores: VMResourceBreakdown;
  ramGB: VMResourceBreakdown;
  vms: VMs;
  clusters?: { [key: string]: InventoryData };
  isAggregateView?: boolean;
  clusterFound?: boolean;
  vcenterVersion?: string;
  vcenterId?: string;
  infrastructureVcenterCount?: number;
}

export const Dashboard: React.FC<Props> = ({
  infra,
  cpuCores,
  ramGB,
  vms,
  clusters,
  isAggregateView = true,
  clusterFound = true,
  vcenterVersion,
  vcenterId,
  infrastructureVcenterCount,
}) => {
  const { infrastructureSummary, clusterDetailRows, selectedClusterDetails } =
    useDashboardViewModel({
      infra,
      vcenterVersion,
      vcenterId,
      clusters,
      isAggregateView,
      infrastructureVcenterCount,
    });

  // Transform osInfo to include both count and supported fields, fallback to os with supported=true if osInfo is undefined
  const osData = vms.osInfo
    ? Object.entries(vms.osInfo).reduce(
        (acc, [osName, osInfo]) => {
          acc[osName] = {
            count: osInfo.count,
            supported: osInfo.supported,
            supportTier: osInfo.supportTier,
            upgradeRecommendation: osInfo.upgradeRecommendation ?? "",
          };
          return acc;
        },
        {} as Record<string, OSDistributionEntry>,
      )
    : Object.entries(vms.os ?? {}).reduce(
        (acc, [osName, count]) => {
          acc[osName] = {
            count: count,
            supported: true, // Default to supported when using fallback data
            upgradeRecommendation: "",
          };
          return acc;
        },
        {} as Record<string, OSDistributionEntry>,
      );

  // If a cluster was selected but not found, show a lightweight empty view.
  if (!clusterFound && !isAggregateView) {
    return (
      <Grid hasGutter>
        <GridItem>
          <div style={{ padding: "24px" }}>
            No data is available for the selected cluster.
          </div>
        </GridItem>
      </Grid>
    );
  }

  return (
    <Grid hasGutter>
      <GridItem>
        <InfrastructureSummary summary={infrastructureSummary} />
      </GridItem>
      <GridItem>
        <VCenterClusterDetails
          isAggregateView={isAggregateView}
          rows={clusterDetailRows}
          details={selectedClusterDetails}
        />
      </GridItem>
      <GridItem>
        <Gallery hasGutter minWidths={{ default: "40%" }}>
          <GalleryItem>
            <HostPowerStates hostPowerStates={infra.hostPowerStates} />
          </GalleryItem>
          <GalleryItem>
            <VmPowerStates powerStates={vms.powerStates} />
          </GalleryItem>
        </Gallery>
      </GridItem>
      <GridItem>
        <Gallery hasGutter minWidths={{ default: "40%" }}>
          <GalleryItem>
            <VMMigrationStatus
              data={{
                migratable: vms.totalMigratable,
                nonMigratable: vms.total - vms.totalMigratable,
              }}
              issuesBreakdown={vms.issuesBreakdown}
            />
          </GalleryItem>
          <GalleryItem>
            <OSDistribution osData={osData} />
          </GalleryItem>
        </Gallery>
      </GridItem>
      <GridItem>
        <Gallery hasGutter minWidths={{ default: "40%" }}>
          <GalleryItem>
            <CpuAndMemoryOverview
              cpuTierDistribution={vms.distributionByCpuTier}
              memoryTierDistribution={vms.distributionByMemoryTier}
              memoryTotalGB={ramGB?.total}
              cpuTotalCores={cpuCores?.total}
            />
          </GalleryItem>
          <GalleryItem>
            <StorageOverview
              diskSizeTier={vms.diskSizeTier ?? {}}
              diskTypes={vms.diskTypes ?? {}}
              totalVMs={vms.total}
              totalWithSharedDisks={vms.totalWithSharedDisks}
            />
          </GalleryItem>
        </Gallery>
      </GridItem>

      {isAggregateView ? (
        <GridItem>
          <Gallery hasGutter minWidths={{ default: "300px", md: "45%" }}>
            <GalleryItem>
              <ClustersOverview
                clustersPerDatacenter={infra.clustersPerDatacenter ?? []}
                clusters={clusters}
              />
            </GalleryItem>
            <GalleryItem>
              <HostsOverview hosts={infra.hosts} />
            </GalleryItem>
          </Gallery>
        </GridItem>
      ) : (
        <GridItem>
          <Gallery hasGutter minWidths={{ default: "300px", md: "45%" }}>
            <GalleryItem>
              <HostsOverview hosts={infra.hosts} />
            </GalleryItem>
            <GalleryItem>
              <NetworkOverview
                infra={infra}
                nicCount={vms.nicCount}
                distributionByNicCount={vms.distributionByNicCount}
              />
            </GalleryItem>
          </Gallery>
        </GridItem>
      )}
      {isAggregateView && (
        <GridItem>
          <Gallery hasGutter minWidths={{ default: "300px", md: "45%" }}>
            <GalleryItem>
              <NetworkOverview
                infra={infra}
                nicCount={vms.nicCount}
                distributionByNicCount={vms.distributionByNicCount}
              />
            </GalleryItem>
          </Gallery>
        </GridItem>
      )}
      <GridItem>
        <Gallery hasGutter minWidths={{ default: "300px", md: "45%" }}>
          <GalleryItem>
            <WarningsTable warnings={vms.migrationWarnings ?? []} />
          </GalleryItem>
          <GalleryItem>
            <ErrorTable errors={vms.notMigratableReasons ?? []} />
          </GalleryItem>
        </Gallery>
      </GridItem>
    </Grid>
  );
};

Dashboard.displayName = "Dashboard";

export default Dashboard;
