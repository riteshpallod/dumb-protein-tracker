import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../../../hooks/useDatabase';
import { getDailySummaries, getAllDailySummaries, getStreak, getSettings, getWeightEntries, getAllWeightEntries } from '../../../db/queries';
import type { DailySummary, WeightEntry } from '../../../db/queries';
import InsightsChart from '../../../components/InsightsChart';
import WeightChart from '../../../components/WeightChart';
import BMIChart from '../../../components/BMIChart';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: 'All', days: 0 },
];

/** Insights screen — streak, averages, bento grid, chart. */
export default function InsightsScreen() {
  const [range, setRange] = useState(0); // index into RANGES
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2150);
  const [heightCm, setHeightCm] = useState(0);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const { days } = RANGES[range];
      const [data, s, settings, weights] = await Promise.all([
        days > 0 ? getDailySummaries(db, days) : getAllDailySummaries(db),
        getStreak(db),
        getSettings(db),
        days > 0 ? getWeightEntries(db, days) : getAllWeightEntries(db),
      ]);
      setSummaries(data);
      setStreak(s);
      setCalorieGoal(settings.calorie_goal);
      setHeightCm(settings.height_cm ?? 0);
      setWeightData(weights);
    } catch (e) {
      console.error(e);
    }
  }, [range]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const validCalDays = summaries.filter((d) => d.total_calories > 0);
  const validProtDays = summaries.filter((d) => d.total_protein > 0);
  const avgKcal = validCalDays.length > 0 ? Math.round(validCalDays.reduce((s, d) => s + d.total_calories, 0) / validCalDays.length) : 0;
  const avgProtein = validProtDays.length > 0 ? Math.round(validProtDays.reduce((s, d) => s + d.total_protein, 0) / validProtDays.length) : 0;
  const pctVsGoal = calorieGoal > 0 ? ((avgKcal - calorieGoal) / calorieGoal) * 100 : 0;

  const chartData = [...summaries].reverse().slice(-30);

  // % change from last day for calories and protein
  const lastDayCal = validCalDays.length > 0 ? validCalDays[0].total_calories : 0;
  const pctCalFromLast = avgKcal > 0 && lastDayCal > 0
    ? Math.round(((lastDayCal - avgKcal) / avgKcal) * 100)
    : 0;
  const lastDayProt = validProtDays.length > 0 ? validProtDays[0].total_protein : 0;
  const pctProtFromLast = avgProtein > 0 && lastDayProt > 0
    ? Math.round(((lastDayProt - avgProtein) / avgProtein) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Insights</Text>

        {/* Range selector */}
        <View style={styles.rangeBar}>
          {RANGES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.rangeTab, range === i && styles.rangeTabActive]}
              onPress={() => setRange(i)}
            >
              <Text style={[styles.rangeText, range === i && styles.rangeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 1: Streak + Avg Calories + Avg Protein */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoCard, styles.streakCard]}>
            <Ionicons name="flame" size={20} color="#f59e0b" style={styles.cardIcon} />
            <Text style={styles.bentoLabel}>Streak</Text>
            <Text style={styles.cardNumber}>{streak}</Text>
            <Text style={styles.bentoSub}>days</Text>
          </View>
          <View style={[styles.bentoCard, styles.metricCard]}>
            <Ionicons name="restaurant" size={20} color={Colors.calorieRing} style={styles.cardIcon} />
            <Text style={styles.bentoLabel}>Avg Calories</Text>
            <Text style={styles.cardNumber}>{avgKcal.toLocaleString()}</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricUnit}>kcal</Text>
              {pctCalFromLast !== 0 && (
                <Text style={[styles.pctBadge, pctCalFromLast > 0 ? styles.pctOver : styles.pctGood]}>
                  {pctCalFromLast > 0 ? '↑' : '↓'}{Math.abs(pctCalFromLast)}%
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.bentoCard, styles.metricCard]}>
            <Ionicons name="barbell" size={20} color={Colors.primary} style={styles.cardIcon} />
            <Text style={styles.bentoLabel}>Avg Protein</Text>
            <Text style={styles.cardNumber}>{avgProtein.toLocaleString()}</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricUnit}>g</Text>
              {pctProtFromLast !== 0 && (
                <Text style={[styles.pctBadge, pctProtFromLast > 0 ? styles.pctGood : styles.pctOver]}>
                  {pctProtFromLast > 0 ? '↑' : '↓'}{Math.abs(pctProtFromLast)}%
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Row 2: Calorie chart */}
        <View style={[styles.bentoCard, styles.chartCard]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Calorie Trend</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.calorieRing }]} />
              <Text style={styles.legendText}>KCAL</Text>
            </View>
          </View>
          <InsightsChart data={chartData} mode="calories" />
        </View>

        {/* Row 3: Protein chart */}
        <View style={[styles.bentoCard, styles.chartCard]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Protein Trend</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>PROTEIN</Text>
            </View>
          </View>
          <InsightsChart data={chartData} mode="protein" />
        </View>

        {/* Row 4: Weight chart */}
        <View style={[styles.bentoCard, styles.chartCard]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Trend</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
              <Text style={styles.legendText}>KG</Text>
            </View>
          </View>
          <WeightChart data={weightData} />
        </View>

        {/* Row 5: BMI chart */}
        <View style={[styles.bentoCard, styles.chartCard]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>BMI Trend</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>BMI</Text>
            </View>
          </View>
          <BMIChart data={weightData} heightCm={heightCm} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  rangeBar: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.pill,
    padding: 4,
    marginBottom: Spacing.base,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radii.pill - 2,
  },
  rangeTabActive: {
    backgroundColor: Colors.background,
    ...Shadow.card,
  },
  rangeText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  rangeTextActive: {
    color: Colors.textPrimary,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bentoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    ...Shadow.card,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#eef8f5',
  },
  metricCard: {
    flex: 1,
  },
  chartCard: {
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  cardIcon: {
    marginBottom: 4,
  },
  bentoLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 2,
    fontSize: 10,
  },
  cardNumber: {
    ...Typography.metric,
    color: Colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
  },
  bentoSub: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metricUnit: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  pctBadge: {
    ...Typography.label,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
  },
  pctGood: {
    color: Colors.success,
  },
  pctOver: {
    color: Colors.primary,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  chartTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    fontSize: 9,
  },
});
