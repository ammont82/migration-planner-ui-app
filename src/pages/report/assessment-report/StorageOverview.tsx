import React, { useMemo } from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
} from '@patternfly/react-core';

import MigrationChart from '../../../components/MigrationChart';

interface DiskHistogramProps {
  data: number[];
  minValue: number;
  step: number;
  isExportMode?: boolean;
}

export const StorageOverview: React.FC<DiskHistogramProps> = ({
  data,
  minValue,
  step,
  isExportMode = false,
}) => {
  const tableHeight = isExportMode ? '100%' : '180px';
  const chartData = useMemo(() => {
    return data
      .map((count, index) => {
        const rangeStart = minValue + step * index;
        const rangeEnd = rangeStart + step;
        return {
          name: `${rangeStart}–${rangeEnd} GB`,
          count: count,
          legendCategory:
            rangeStart < 500
              ? 'Small'
              : rangeStart <= 1000
                ? 'Medium'
                : 'Large',
          rangeStart,
        };
      })
      .filter((entry) => entry.count > 0)
      .sort((a, b) => a.rangeStart - b.rangeStart)
      .map(({ rangeStart, ...rest }) => rest);
  }, [data, minValue, step]);

  return (
    <Card className={isExportMode ? 'dashboard-card-print' : 'dashboard-card'}>
      <CardTitle>
        <i className="fas fa-database" /> Disks
      </CardTitle>
      <CardBody>
        <Content component={ContentVariants.small}>Disk Size Distribution</Content>
        <MigrationChart data={chartData} maxHeight={tableHeight} />
      </CardBody>
    </Card>
  );
};
