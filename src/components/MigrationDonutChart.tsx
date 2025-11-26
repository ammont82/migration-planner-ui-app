import React, { useCallback, useMemo } from 'react';

import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts';

interface OSData {
  name: string;
  count: number;
  legendCategory: string;
  countDisplay?: string;
}

interface MigrationDonutChartProps {
  data: OSData[];
  legend?: Record<string, string>;
  customColors?: Record<string, string>;
  height?: number;
  width?: number;
  title?: string;
  subTitle?: string;
  titleColor?: string;
  subTitleColor?: string;
  itemsPerRow?: number;
  isExportMode?: boolean;
}

const legendColors = ['#0066cc', '#5e40be', '#b6a6e9', '#b98412'];

const MigrationDonutChart: React.FC<MigrationDonutChartProps> = ({
  data,
  legend,
  customColors,
  height = 200,
  width = 300,
  title,
  subTitle,
  titleColor = '#000000',
  subTitleColor = '#000000',
  itemsPerRow = 1,
  isExportMode,
}: MigrationDonutChartProps) => {
  const dynamicLegend = useMemo(() => {
    return data.reduce(
      (acc, current) => {
        const key = `${current.legendCategory}`;
        if (!acc.seen.has(key)) {
          acc.seen.add(key);
          const color =
            customColors?.[key] ??
            legendColors[(acc.seen.size - 1) % legendColors.length];
          acc.result.push({ [key]: color });
        }
        return acc;
      },
      { seen: new Set(), result: [] },
    ).result;
  }, [data, customColors]);

  const chartLegend = legend ? legend : Object.assign({}, ...dynamicLegend);
  const getColor = useCallback(
    (name: string): string => chartLegend[name],
    [chartLegend],
  );

  const chartData = useMemo(() => {
    return data.map((item) => ({
      x: item.name,
      y: item.count,
      legendCategory: item.legendCategory,
      countDisplay: item.countDisplay ?? item.count,
    }));
  }, [data]);

  const colorScale = useMemo(() => {
    return chartData.map((item) => getColor(item.legendCategory));
  }, [chartData, getColor]);

  const legendData = useMemo(() => {
    return chartData.map((item) => ({
      name: `${item.x} (${item.countDisplay})`,
      symbol: { fill: getColor(item.legendCategory) },
    }));
  }, [chartData, getColor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <ChartDonut
        ariaDesc="Migration data donut chart"
        ariaTitle="Migration data donut chart"
        data={chartData}
        labels={({ datum }) => `${datum.x}: ${datum.countDisplay ?? datum.y}`}
        colorScale={colorScale}
        constrainToVisibleArea
        title={title}
        subTitle={subTitle}
        height={height}
        width={width}
        padding={{
          bottom: 5,
          left: 20,
          right: 20,
          top: 0,
        }}
        animate={isExportMode ? false : undefined}
        titleComponent={
          title ? (
            <ChartLabel
              style={[
                {
                  fill: titleColor,
                  fontSize: 22,
                  fontWeight: 'bold',
                },
              ]}
            />
          ) : undefined
        }
        subTitleComponent={
          subTitle ? (
            <ChartLabel
              style={[
                {
                  fill: subTitleColor,
                  fontSize: 12,
                },
              ]}
            />
          ) : undefined
        }
      />
      <div style={{ marginLeft: '34%' }}>
        <ChartLegend
          data={legendData}
          orientation="horizontal"
          height={200}
          width={1000}
          itemsPerRow={itemsPerRow}
          style={{
            labels: { fontSize: 25 },
          }}
        />
      </div>
    </div>
  );
};

export default MigrationDonutChart;
