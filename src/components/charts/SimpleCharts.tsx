// Dependency-free stand-ins for the recharts BarChart/LineChart used by
// Adapt/components/calories/AbsorptionTracker.tsx (grid, axes, legend).
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

export interface Series {
  key: string;
  name: string;
  color: string;
}

export interface ChartDatum {
  label: string;
  [key: string]: string | number;
}

const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

function niceTicks(min: number, max: number, count = 5): number[] {
  if (max === min) max = min + 1;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + step * i));
}

function useChartWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width) };
}

function Legend({ series }: { series: Series[] }) {
  return (
    <View className="mt-2 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {series.map((s) => (
        <View key={s.key} className="flex-row items-center gap-1.5">
          <View style={{ width: 10, height: 10, backgroundColor: s.color, borderRadius: 2 }} />
          <Text className="text-xs text-muted-foreground">{s.name}</Text>
        </View>
      ))}
    </View>
  );
}

export function SimpleBarChart({ data, series, height = 300 }: { data: ChartDatum[]; series: Series[]; height?: number }) {
  const { colors } = useTheme();
  const { width, onLayout } = useChartWidth();
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  const ticks = niceTicks(0, max);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const groupW = data.length > 0 ? plotW / data.length : 0;
  const barW = (groupW * 0.7) / Math.max(1, series.length);
  const y = (v: number) => PAD.top + plotH - (v / ticks[ticks.length - 1]) * plotH;

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.border} strokeDasharray="3 3" />
              <SvgText x={PAD.left - 6} y={y(t) + 4} fontSize={10} fill={colors.mutedForeground} textAnchor="end">
                {t}
              </SvgText>
            </React.Fragment>
          ))}
          {data.map((d, i) => {
            const x0 = PAD.left + i * groupW + groupW * 0.15;
            return (
              <React.Fragment key={d.label}>
                {series.map((s, j) => {
                  const v = Number(d[s.key]) || 0;
                  return <Rect key={s.key} x={x0 + j * barW} y={y(v)} width={barW - 2} height={PAD.top + plotH - y(v)} fill={s.color} rx={2} />;
                })}
                <SvgText x={x0 + (groupW * 0.7) / 2} y={height - 10} fontSize={10} fill={colors.mutedForeground} textAnchor="middle">
                  {d.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
      <Legend series={series} />
    </View>
  );
}

export function SimpleLineChart({
  data,
  series,
  height = 250,
  domain,
}: {
  data: ChartDatum[];
  series: Series[];
  height?: number;
  domain?: [number, number];
}) {
  const { colors } = useTheme();
  const { width, onLayout } = useChartWidth();
  const values = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
  const [min, max] = domain ?? [Math.min(...values), Math.max(...values)];
  const ticks = niceTicks(min, max);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - ((v - min) / Math.max(1, max - min)) * plotH;

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.border} strokeDasharray="3 3" />
              <SvgText x={PAD.left - 6} y={y(t) + 4} fontSize={10} fill={colors.mutedForeground} textAnchor="end">
                {t}
              </SvgText>
            </React.Fragment>
          ))}
          {data.map((d, i) => (
            <SvgText key={d.label} x={x(i)} y={height - 10} fontSize={10} fill={colors.mutedForeground} textAnchor="middle">
              {d.label}
            </SvgText>
          ))}
          {series.map((s) => (
            <Polyline
              key={s.key}
              points={data.map((d, i) => `${x(i)},${y(Number(d[s.key]) || 0)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      )}
      <Legend series={series} />
    </View>
  );
}
