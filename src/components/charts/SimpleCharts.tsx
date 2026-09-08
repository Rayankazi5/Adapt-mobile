// Dependency-free stand-ins for the recharts BarChart / LineChart /
// RadarChart used by the Absorption and Workout Analytics pages
// (grid, axes, legend).
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
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
                  return <Rect key={s.key} x={x0 + j * barW} y={y(v)} width={Math.max(0, barW - 2)} height={PAD.top + plotH - y(v)} fill={s.color} rx={2} />;
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
  const [min, max] = domain ?? [Math.min(0, ...values), Math.max(...values)];
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

export function SimpleRadarChart({
  data,
  labelKey,
  valueKey,
  name,
  color,
  max = 100,
  height = 320,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  name: string;
  color: string;
  max?: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const { width, onLayout } = useChartWidth();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(0, Math.min(width, height) / 2 - 36);
  const n = data.length;
  const angle = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const pt = (i: number, ratio: number) => ({ x: cx + Math.cos(angle(i)) * r * ratio, y: cy + Math.sin(angle(i)) * r * ratio });
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <View onLayout={onLayout}>
      {width > 0 && n > 0 && (
        <Svg width={width} height={height}>
          {rings.map((ratio) => (
            <Polygon
              key={ratio}
              points={data.map((_, i) => `${pt(i, ratio).x},${pt(i, ratio).y}`).join(' ')}
              fill="none"
              stroke={colors.border}
            />
          ))}
          {data.map((_, i) => (
            <Line key={i} x1={cx} y1={cy} x2={pt(i, 1).x} y2={pt(i, 1).y} stroke={colors.border} />
          ))}
          {rings.map((ratio) => (
            <SvgText key={`t${ratio}`} x={cx + 4} y={cy - r * ratio - 2} fontSize={9} fill={colors.mutedForeground}>
              {Math.round(max * ratio)}
            </SvgText>
          ))}
          <Polygon
            points={data.map((d, i) => {
              const p = pt(i, Math.min(1, (Number(d[valueKey]) || 0) / max));
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill={color}
            fillOpacity={0.6}
            stroke={color}
            strokeWidth={2}
          />
          {data.map((d, i) => {
            const p = pt(i, Math.min(1, (Number(d[valueKey]) || 0) / max));
            return <Circle key={`c${i}`} cx={p.x} cy={p.y} r={3} fill={color} />;
          })}
          {data.map((d, i) => {
            const p = pt(i, 1.18);
            return (
              <SvgText key={`l${i}`} x={p.x} y={p.y + 4} fontSize={11} fill={colors.mutedForeground} textAnchor="middle">
                {String(d[labelKey])}
              </SvgText>
            );
          })}
        </Svg>
      )}
      <Legend series={[{ key: valueKey, name, color }]} />
    </View>
  );
}
