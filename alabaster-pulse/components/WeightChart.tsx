import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../constants/theme';
import type { WeightEntry } from '../db/queries';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - Spacing.lg * 2;
const CHART_H = 160;
const PAD_LEFT = 32;
const PAD_RIGHT = 12;
const PAD_TOP = 20;
const PAD_BOT = 28;

type Props = {
  data: WeightEntry[];
};

/** Smooth line chart for weight entries. */
export default function WeightChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No weight data yet</Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const weights = sorted.map((d) => d.weight_kg);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const rangeW = maxW - minW || 1;

  const innerW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOT;

  /** Get x position for an index. */
  function xPos(i: number): number {
    if (sorted.length === 1) return PAD_LEFT + innerW / 2;
    return PAD_LEFT + (i / (sorted.length - 1)) * innerW;
  }

  /** Get y position for a weight value. */
  function yPos(w: number): number {
    return PAD_TOP + innerH - ((w - minW) / rangeW) * innerH;
  }

  // Build SVG path
  const points = sorted.map((d, i) => ({ x: xPos(i), y: yPos(d.weight_kg) }));
  let pathD = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Y-axis labels (3 ticks)
  const yTicks = [minW, minW + rangeW / 2, maxW];

  // X-axis labels
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labelStep = sorted.length <= 7 ? 1 : Math.ceil(sorted.length / 7);

  /** Format x-axis label. */
  function formatXLabel(logDate: string): string {
    if (sorted.length <= 7) {
      const d = new Date(logDate + 'T00:00:00');
      return DAY_ABBR[d.getDay()];
    }
    return logDate.slice(5);
  }

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Horizontal grid lines */}
      {yTicks.map((tick) => (
        <Line
          key={tick}
          x1={PAD_LEFT}
          y1={yPos(tick)}
          x2={CHART_W - PAD_RIGHT}
          y2={yPos(tick)}
          stroke={Colors.border}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick) => (
        <SvgText
          key={`label-${tick}`}
          x={PAD_LEFT - 6}
          y={yPos(tick) + 3}
          textAnchor="end"
          fontSize={9}
          fill={Colors.textMuted}
        >
          {tick.toFixed(1)}
        </SvgText>
      ))}

      {/* Line */}
      <Path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <Circle key={sorted[i].log_date} cx={p.x} cy={p.y} r={3.5} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* X-axis labels */}
      {sorted.map((d, i) => {
        if (i % labelStep !== 0) return null;
        return (
          <SvgText
            key={d.log_date}
            x={xPos(i)}
            y={CHART_H - 4}
            textAnchor="middle"
            fontSize={10}
            fill={Colors.textMuted}
          >
            {formatXLabel(d.log_date)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: CHART_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
