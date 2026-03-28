import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../constants/theme';
import type { DailySummary } from '../db/queries';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - Spacing.lg * 2;
const CHART_H = 140;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOT = 28;
const PAD_LEFT_LINE = 32;

type Props = {
  data: DailySummary[];
  mode: 'calories' | 'protein';
};

/** Bar chart for calories, smooth line chart for protein. */
export default function InsightsChart({ data, mode }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet — start logging!</Text>
      </View>
    );
  }

  const reversed = [...data].reverse();
  const getValue = (d: DailySummary) => mode === 'calories' ? d.total_calories : d.total_protein;
  const values = reversed.map(getValue);
  const maxVal = Math.max(...values, 1);
  const labelStep = reversed.length <= 7 ? 1 : Math.ceil(reversed.length / 7);
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** Format x-axis label. */
  function formatXLabel(logDate: string): string {
    if (reversed.length <= 7) {
      const d = new Date(logDate + 'T00:00:00');
      return DAY_ABBR[d.getDay()];
    }
    return logDate.slice(5);
  }

  // Protein: smooth line chart
  if (mode === 'protein') {
    const padL = PAD_LEFT_LINE;
    const innerW = CHART_W - padL - PAD_RIGHT;
    const innerH = CHART_H - PAD_TOP - PAD_BOT;
    const minVal = Math.min(...values) * 0.9;
    const range = maxVal - minVal || 1;

    function lxPos(i: number): number {
      if (reversed.length === 1) return padL + innerW / 2;
      return padL + (i / (reversed.length - 1)) * innerW;
    }
    function lyPos(v: number): number {
      return PAD_TOP + innerH - ((v - minVal) / range) * innerH;
    }

    const points = reversed.map((d, i) => ({ x: lxPos(i), y: lyPos(getValue(d)) }));

    // Bezier curve path
    let pathD = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Y-axis ticks (3)
    const yTicks = [minVal, minVal + range / 2, maxVal];

    return (
      <Svg width={CHART_W} height={CHART_H}>
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <Line key={tick} x1={padL} y1={lyPos(tick)} x2={CHART_W - PAD_RIGHT} y2={lyPos(tick)} stroke={Colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
        ))}
        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <SvgText key={`yl-${tick}`} x={padL - 6} y={lyPos(tick) + 3} textAnchor="end" fontSize={9} fill={Colors.textMuted}>
            {Math.round(tick)}
          </SvgText>
        ))}
        {/* Line */}
        <Path d={pathD} fill="none" stroke={Colors.primary} strokeWidth={2.5} strokeLinecap="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={reversed[i].log_date} cx={p.x} cy={p.y} r={3.5} fill={Colors.primary} stroke="#fff" strokeWidth={1.5} />
        ))}
        {/* X-axis labels */}
        {reversed.map((d, i) => {
          if (i % labelStep !== 0) return null;
          return (
            <SvgText key={d.log_date} x={lxPos(i)} y={CHART_H - 4} textAnchor="middle" fontSize={10} fill={Colors.textMuted}>
              {formatXLabel(d.log_date)}
            </SvgText>
          );
        })}
      </Svg>
    );
  }

  // Calories: bar chart
  const innerW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOT;
  const barWidth = Math.max(6, innerW / reversed.length - 6);

  function xPos(i: number) {
    return PAD_LEFT + (i + 0.5) * (innerW / reversed.length);
  }
  function valH(val: number) {
    return (val / maxVal) * innerH;
  }

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {reversed.map((d, i) => {
        const h = valH(getValue(d));
        return (
          <Rect
            key={d.log_date}
            x={xPos(i) - barWidth / 2}
            y={PAD_TOP + innerH - h}
            width={barWidth}
            height={h}
            rx={barWidth / 2}
            fill={Colors.calorieRing}
            opacity={0.85}
          />
        );
      })}

      {reversed.map((d, i) => {
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
