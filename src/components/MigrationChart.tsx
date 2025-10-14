import React, { useMemo } from 'react';

import {
  Flex,
  FlexItem,
  Content,
  ContentVariants,
  Tooltip,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Tr } from '@patternfly/react-table';

interface OSData {
  name: string;
  count: number;
  legendCategory: string;
}

interface MigrationChartProps {
  data: OSData[];
  legend?: Record<string, string>;
  dataLength?: DLength;
  maxHeight?: string;
}

type DLength =
  | 10
  | 15
  | 20
  | 25
  | 30
  | 35
  | 40
  | 45
  | 50
  | 60
  | 70
  | 80
  | 90
  | 100;

const legendColors = ['#28a745', '#f0ad4e', '#d9534f', '#C9190B'];

const MigrationChart: React.FC<MigrationChartProps> = ({
  data,
  legend,
  dataLength = 40,
  maxHeight = '200px',
}: MigrationChartProps) => {
  const dynamicLegend = useMemo(() => {
    return data.reduce(
      (acc, current) => {
        const key = `${current.legendCategory}`;
        if (!acc.seen.has(key)) {
          acc.seen.add(key);
          acc.result.push({ [key]: legendColors[acc.seen.size - 1] });
        }
        return acc;
      },
      { seen: new Set(), result: [] },
    ).result;
  }, [data]);

  const chartLegend = legend ? legend : Object.assign({}, ...dynamicLegend);
  const getColor = (name: string): string => chartLegend[name];

  return (
    <Flex
      direction={{ default: 'column' }}
      spaceItems={{ default: 'spaceItemsLg' }}
    >
      {/* Legend */}
      <FlexItem>
        <Flex
          spaceItems={{ default: 'spaceItemsLg' }}
          justifyContent={{ default: 'justifyContentFlexEnd' }}
        >
          {Object.entries(chartLegend).map(([key, color]) => (
            <FlexItem key={key}>
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsSm' }}
              >
                <FlexItem>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: color as string,
                      borderRadius: '2px',
                    }}
                  />
                </FlexItem>
                <FlexItem>
                  <Content component={ContentVariants.small}>{key}</Content>
                </FlexItem>
              </Flex>
            </FlexItem>
          ))}
        </Flex>
      </FlexItem>
      {/* Chart Area */}
      <FlexItem>
        <Flex
          direction={{ default: 'column' }}
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          <div style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            <Table variant="compact" borders={false}>
              <Tbody>
                {data.map((item, index) => (
                  <Tr key={index}>
                    <Td width={dataLength} style={{ paddingLeft: '0px' }}>
                      <Tooltip content={<div>{item.name}</div>} exitDelay={0}>
                        <Content
                          component={ContentVariants.p}
                          style={{
                            fontSize: 'clamp(0.4rem, 0.7vw, 1.1rem)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 1, // Number of lines to show
                            textTransform: 'capitalize',
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.name}
                        </Content>
                      </Tooltip>
                    </Td>
                    <Td>
                      {/* Visual Bar */}
                      <div>
                        <div
                          style={{
                            position: 'relative',
                            height: '8px',
                            backgroundColor: '#F5F5F5',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${item.count}%`,
                              backgroundColor: `${getColor(
                                item.legendCategory,
                              )}`,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </Td>
                    <Td
                      width={10}
                      style={{ paddingRight: '0px', textAlign: 'center' }}
                    >
                      <Content component="p"
                        style={{ fontSize: 'clamp(0.4rem, 0.7vw, 1.1rem)' }}
                      >
                        {item.count}
                      </Content>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default MigrationChart;
