import React from 'react';

import { ChartDonut, ChartLegend } from '@patternfly/react-charts';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';

interface VmMigrationStatusProps {
  data: {
    migratable: number;
    nonMigratable: number;
  };
  isExportMode?: boolean;
}

export const VMMigrationStatus: React.FC<VmMigrationStatusProps> = ({
  data,
  isExportMode = false,
}) => {
  const chartData = [
    { x: 'Migratable', y: data.migratable },
    { x: 'Non-Migratable', y: data.nonMigratable },
  ];

  return (
    <Card
      className={isExportMode ? 'dashboard-card-print' : 'dashboard-card'}
      style={{ height: '340px !important', overflow: 'hidden' }}
    >
      <CardTitle>
        <VirtualMachineIcon /> VM Migration Status
      </CardTitle>
      <CardBody>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ChartDonut
            ariaDesc="VM Migration Status"
            data={chartData}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            colorScale={['#28a745', '#dc3545']}
            constrainToVisibleArea
            animate={isExportMode ? false : undefined}
            title={`${data.migratable + data.nonMigratable}`}
            subTitle="VMs"
          />
          <div
            style={{
              marginLeft: '20%',
            }}
          >
            <ChartLegend
              data={[
                {
                  name: `Migratable: ${data.migratable} VMs`,
                  symbol: { fill: '#28a745' },
                },
                {
                  name: `Non-Migratable: ${data.nonMigratable} VMs`,
                  symbol: { fill: '#dc3545' },
                },
              ]}
              orientation="horizontal"
              style={{
                labels: { fontSize: 14 },
                parent: { marginTop: 8 },
              }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
