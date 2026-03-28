import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line, Rect } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../constants/theme';
import type { WeightEntry } from '../db/queries';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - Spacing.lg * 2;
const CHART_H = 160;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 20;
const PAD_BOT = 28;

/** BMI category color given a BMI value. */
function bmiColor(bmi: number): string {
  if (bmi < 18.5) return '#f59e0b';       // underweight — amber
  if (bmi < 25)   return '#22c55e';       // normal — green
  if (bmi < 30)   return '#f59e0b';       // overweight — amber
  return Colors.primary;                   // obese — red
}

/** BMI label string. */
function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

type Props = {
  data: WeightEntry[];
  heightCm: number;
};

/** Smooth line chart for BMI trend derived from weight entries + fixed height. */
export default function BMIChart({ data, heightCm }: Props) {
  if (data.length === 0 || heightCm <= 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {heightCm <= 0 ? 'Set your height in Profile to see BMI' : 'No weight data yet'}
        </Text>
      </View>
    );
  }

  const hM = heightCm / 100;
  const sorted = [...data].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const bmis = sorted.map((d) => d.weight_kg / (hM * hM));
  const latest = bmis[bmis.length - 1];

  const minB = Math.min(...bmis) - 0.5;
  const maxB = Math.max(...bmis) + 0.5;
  const rangeB = maxB - minB || 1;

  const innerW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOT;

  function xPos(i: number): number {
    if (sorted.length === 1) return PAD_LEFT + innerW / 2;
    return PAD_LEFT + (i / (sorted.length - 1)) * innerW;
  }

  function yPos(b: number): number {
    return PAD_TOP + innerH - ((b - minB) / rangeB) * innerH;
  }

  const points = bmis.map((b, i) => ({ x: xPos(i), y: yPos(b) }));
  let pathD = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  const yTicks = [minB, minB + rangeB / 2, maxB];
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labelStep = sorted.length <= 7 ? 1 : Math.ceil(sorted.length / 7);
  const lineColor = bmiColor(latest);

  function formatXLabel(logDate: string): string {
    if (sorted.length <= 7) {
      const d = new Date(logDate + 'T00:00:00');
      return DAY_ABBR[d.getDay()];
    }
    return logDate.slice(5);
  }

  return (
    <View>
      {/* BMI badge */}
      <View style={[styles.bmiBadge, { backgroundColor: lineColor + '18' }]}>
        <Text style={[styles.bmiBadgeNum, { color: lineColor }]}>{latest.toFixed(1)}</Text>
        <Text style={[styles.bmiBadgeLabel, { color: lineColor }]}>{bmiLabel(latest)}</Text>
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Reference zone: normal BMI band (18.5 – 25), clipped to chart */}
        {(() => {
          const yNormalHi = yPos(Math.min(25, maxB));
          const yNormalLo = yPos(Math.max(18.5, minB));
          if (yNormalLo > PAD_TOP && yNormalHi < PAD_TOP + innerH) {
            return (
              <Rect
                x={PAD_LEFT}
                y={yNormalHi}
                width={innerW}
                height={yNormalLo - yNormalHi}
                fill="rgba(34,197,94,0.06)"
              />
            );
          }
          return null;
        })()}

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <Line
            key={tick}
            x1={PAD_LEFT} y1={yPos(tick)}
            x2={CHART_W - PAD_RIGHT} y2={yPos(tick)}
            stroke={Colors.border} strokeWidth={0.5} strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <SvgText
            key={`y-${tick}`}
            x={PAD_LEFT - 6} y={yPos(tick) + 3}
            textAnchor="end" fontSize={9} fill={Colors.textMuted}
          >
            {tick.toFixed(1)}
          </SvgText>
        ))}

        {/* Line */}
        <Path d={pathD} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={sorted[i].log_date} cx={p.x} cy={p.y} r={3.5} fill={lineColor} stroke="#fff" strokeWidth={1.5} />
        ))}

        {/* X-axis labels */}
        {sorted.map((d, i) => {
          if (i % labelStep !== 0) return null;
          return (
            <SvgText key={d.log_date} x={xPos(i)} y={CHART_H - 4} textAnchor="middle" fontSize={10} fill={Colors.textMuted}>
              {formatXLabel(d.log_date)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
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
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  bmiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: Spacing.sm,
  },
  bmiBadgeNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    lineHeight: 22,
  },
  bmiBadgeLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
});
