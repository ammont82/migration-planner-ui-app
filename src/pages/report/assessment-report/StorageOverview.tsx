import React, { useMemo, useState } from 'react';

import { DiskSizeTierSummary } from '@migration-planner-ui/api-client/models';
import {
  Card,
  CardBody,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';

import MigrationDonutChart from '../../../components/MigrationDonutChart';

interface StorageOverviewProps {
  DiskSizeTierSummary: { [key: string]: DiskSizeTierSummary };
  isExportMode?: boolean;
}

type ViewMode = 'totalSize' | 'vmCount';

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  totalSize: 'Total disk size by tier',
  vmCount: 'VM count by disk size tier',
};

const TIER_CONFIG: Record<
  string,
  { order: number; label: string; legendCategory: string }
> = {
  Easy: { order: 0, label: '0-10 TB', legendCategory: 'Easy' },
  Medium: { order: 1, label: '10-20 TB', legendCategory: 'Medium' },
  Hard: { order: 2, label: '20-50 TB', legendCategory: 'Hard' },
  White: { order: 3, label: '> 50 TB', legendCategory: 'White glove' },
};

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  DiskSizeTierSummary,
  isExportMode = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('vmCount');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const totals = useMemo(() => {
    if (!DiskSizeTierSummary) return { totalSize: 0, totalVMs: 0 };

    return Object.values(DiskSizeTierSummary).reduce(
      (acc, tier) => ({
        totalSize: acc.totalSize + tier.totalSizeTB,
        totalVMs: acc.totalVMs + tier.vmCount,
      }),
      { totalSize: 0, totalVMs: 0 },
    );
  }, [DiskSizeTierSummary]);

  const chartData = useMemo(() => {
    if (!DiskSizeTierSummary) return [];

    const getTierPrefix = (key: string): string | null => {
      for (const prefix of Object.keys(TIER_CONFIG)) {
        if (key.startsWith(prefix)) return prefix;
      }
      return null;
    };

    return Object.entries(DiskSizeTierSummary)
      .sort(([keyA], [keyB]) => {
        const prefixA = getTierPrefix(keyA);
        const prefixB = getTierPrefix(keyB);
        const orderA = prefixA ? TIER_CONFIG[prefixA].order : 999;
        const orderB = prefixB ? TIER_CONFIG[prefixB].order : 999;
        return orderA - orderB;
      })
      .map(([key, tier]) => {
        const prefix = getTierPrefix(key);
        const config = prefix
          ? TIER_CONFIG[prefix]
          : { label: key, legendCategory: 'Unknown' };

        const count =
          viewMode === 'totalSize' ? tier.totalSizeTB : tier.vmCount;
        const countDisplay =
          viewMode === 'totalSize' ? `${count} TB` : `${count} VMs`;

        return {
          name: config.label,
          count,
          countDisplay,
          legendCategory: config.legendCategory,
        };
      });
  }, [DiskSizeTierSummary, viewMode]);

  // Build chart data for a specific view mode (used by export mode)
  const buildChartDataFor = (
    mode: ViewMode,
  ): Array<{ name: string; count: number; countDisplay: string; legendCategory: string }> => {
    if (!DiskSizeTierSummary) return [];

    const getTierPrefix = (key: string): string | null => {
      for (const prefix of Object.keys(TIER_CONFIG)) {
        if (key.startsWith(prefix)) return prefix;
      }
      return null;
    };

    return Object.entries(DiskSizeTierSummary)
      .sort(([keyA], [keyB]) => {
        const prefixA = getTierPrefix(keyA);
        const prefixB = getTierPrefix(keyB);
        const orderA = prefixA ? TIER_CONFIG[prefixA].order : 999;
        const orderB = prefixB ? TIER_CONFIG[prefixB].order : 999;
        return orderA - orderB;
      })
      .map(([key, tier]) => {
        const prefix = getTierPrefix(key);
        const config = prefix
          ? TIER_CONFIG[prefix]
          : { label: key, legendCategory: 'Unknown' };

        const count = mode === 'totalSize' ? tier.totalSizeTB : tier.vmCount;
        const countDisplay = mode === 'totalSize' ? `${count} TB` : `${count} VMs`;

        return {
          name: config.label,
          count,
          countDisplay,
          legendCategory: config.legendCategory,
        };
      });
  };

  const onDropdownToggle = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ): void => {
    if (value === 'totalSize' || value === 'vmCount') {
      setViewMode(value);
    }
    setIsDropdownOpen(false);
  };

  return (
    <Card
      className={isExportMode ? 'dashboard-card-print' : 'dashboard-card'}
      style={{ overflow: 'hidden' }}
    >
      <CardTitle>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
          style={{ width: '100%' }}
        >
          <FlexItem>
            <i className="fas fa-database" /> Disks
          </FlexItem>
          {!isExportMode && (
            <FlexItem>
              <Dropdown
                isOpen={isDropdownOpen}
                onSelect={onSelect}
                onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onDropdownToggle}
                    isExpanded={isDropdownOpen}
                    style={{ minWidth: '250px' }}
                  >
                    {VIEW_MODE_LABELS[viewMode]}
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem key="vmCount" value="vmCount">
                    VM count by disk size tier
                  </DropdownItem>
                  <DropdownItem key="totalSize" value="totalSize">
                    Total disk size by tier
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>
          )}
        </Flex>
      </CardTitle>
      <CardBody>
        {isExportMode ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                  color: '#6a6e73',
                }}
              >
                {VIEW_MODE_LABELS.vmCount}
              </div>
              <MigrationDonutChart
                data={buildChartDataFor('vmCount')}
                height={195}
                title={`${totals.totalVMs}`}
                subTitle="VMs"
                subTitleColor="#9a9da0"
                itemsPerRow={Math.ceil(buildChartDataFor('vmCount').length / 2)}
                isExportMode={isExportMode}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                  color: '#6a6e73',
                }}
              >
                {VIEW_MODE_LABELS.totalSize}
              </div>
              <MigrationDonutChart
                data={buildChartDataFor('totalSize')}
                height={195}
                title={`${totals.totalSize.toFixed(2)} TB`}
                subTitle={`${totals.totalVMs} VMs`}
                subTitleColor="#9a9da0"
                itemsPerRow={Math.ceil(buildChartDataFor('totalSize').length / 2)}
                isExportMode={isExportMode}
              />
            </div>
          </>
        ) : (
          <MigrationDonutChart
            data={chartData}
            height={195}
            title={
              viewMode === 'totalSize'
                ? `${totals.totalSize.toFixed(2)} TB`
                : `${totals.totalVMs}`
            }
            subTitle={viewMode === 'totalSize' ? `${totals.totalVMs} VMs` : `VMs`}
            subTitleColor="#9a9da0"
            itemsPerRow={Math.ceil(chartData.length / 2)}
            isExportMode={isExportMode}
          />
        )}
      </CardBody>
    </Card>
  );
};
