import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { getDb } from '../../../hooks/useDatabase';
import { getSettings, updateSettings } from '../../../db/queries';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

/**
 * Evidence-based protein targets per kg of body weight:
 *   Maintain  — 1.6 g/kg (ISSN minimum for active adults)
 *   Shred     — 2.2 g/kg (high protein to preserve muscle in deficit)
 *   Bulk      — 1.8 g/kg (sufficient for muscle protein synthesis)
 * Rounded to nearest 5 g.
 */
function calcProteinTargets(weightKg: number) {
  const round5 = (v: number) => Math.round(v / 5) * 5;
  return {
    maintain: round5(weightKg * 1.6),
    shred: round5(weightKg * 2.2),
    bulk: round5(weightKg * 1.8),
  };
}

function LeafIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DumbbellIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4" y1="8" x2="4" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="20" y1="8" x2="20" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="7" y1="9" x2="7" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="17" y1="9" x2="17" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="2" y1="10" x2="2" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="22" y1="10" x2="22" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Edit protein goal screen with weight-based personalised estimates. */
export default function EditProteinScreen() {
  const [value, setValue] = useState(165);
  const [targets, setTargets] = useState({ maintain: 120, shred: 165, bulk: 140 });
  const [hasWeight, setHasWeight] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const db = getDb();
        const s = await getSettings(db);
        setValue(s.protein_goal);
        if (s.weight_kg) {
          setTargets(calcProteinTargets(s.weight_kg));
          setHasWeight(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  async function handleSave() {
    try {
      const db = getDb();
      await updateSettings(db, { protein_goal: value });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save.');
    }
  }

  const rangeText = hasWeight
    ? `Your range: ${targets.maintain}g – ${targets.shred}g`
    : 'Set your weight in Profile for a personalised estimate';

  const bannerText = hasWeight
    ? `Based on your weight:\n• Maintain: ${targets.maintain}g (1.6g/kg)\n• Shred: ${targets.shred}g (2.2g/kg)\n• Bulk: ${targets.bulk}g (1.8g/kg)`
    : 'Set your weight in Profile to get personalised protein targets.';

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Protein Goal</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroNumber}>{value}</Text>
        <Text style={styles.heroUnit}>grams</Text>
        <Text style={styles.heroLabel}>DAILY TARGET</Text>

        <View style={styles.rangePill}>
          <Text style={styles.rangePillText}>{rangeText}</Text>
        </View>

        <View style={styles.sliderCard}>
          <View style={styles.sliderTitleRow}>
            <Text style={styles.sliderTitle}>Adjust Goal</Text>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>Target</Text>
            </View>
          </View>
          <Slider
            style={{ width: '100%', height: 40, marginTop: Spacing.base }}
            minimumValue={50}
            maximumValue={300}
            step={5}
            value={value}
            onValueChange={(v) => setValue(Math.round(v))}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.sliderRangeText}>50G</Text>
            <Text style={styles.sliderRangeText}>175G</Text>
            <Text style={styles.sliderRangeText}>300G</Text>
          </View>
        </View>

        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetCard, value === targets.maintain && styles.presetCardActive]}
            onPress={() => setValue(targets.maintain)}
          >
            <View style={[styles.presetIconCircle, value === targets.maintain && styles.presetIconCircleActive]}>
              <LeafIcon color={value === targets.maintain ? Colors.primary : Colors.textMuted} />
            </View>
            <Text style={styles.presetCardLabel}>MAINTAIN</Text>
            <View style={styles.presetValueRow}>
              <Text style={[styles.presetCardNumber, value === targets.maintain && styles.presetCardNumberActive]}>
                {targets.maintain}
              </Text>
              <Text style={[styles.presetCardUnit, value === targets.maintain && styles.presetCardUnitActive]}> g</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetCard, value === targets.shred && styles.presetCardActive]}
            onPress={() => setValue(targets.shred)}
          >
            <View style={[styles.presetIconCircle, value === targets.shred && styles.presetIconCircleActive]}>
              <DumbbellIcon color={value === targets.shred ? Colors.primary : Colors.textMuted} />
            </View>
            <Text style={styles.presetCardLabel}>SHRED / BULK</Text>
            <View style={styles.presetValueRow}>
              <Text style={[styles.presetCardNumber, value === targets.shred && styles.presetCardNumberActive]}>
                {targets.shred}
              </Text>
              <Text style={[styles.presetCardUnit, value === targets.shred && styles.presetCardUnitActive]}> g</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIconCircle}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Why this matters</Text>
            <Text style={styles.infoBannerText}>{bannerText}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundMuted },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  headerSave: { ...Typography.bodyMedium, color: Colors.primary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40, alignItems: 'center' },
  heroNumber: {
    fontSize: 56,
    lineHeight: 64,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
  },
  heroUnit: { ...Typography.bodyLarge, color: Colors.textMuted, marginBottom: Spacing.xs },
  heroLabel: { ...Typography.labelCaps, color: Colors.textMuted, marginBottom: Spacing.lg },
  rangePill: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    marginBottom: Spacing.xl,
  },
  rangePillText: {
    ...Typography.label,
    color: Colors.success,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sliderCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  sliderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  targetBadge: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  targetBadgeText: { ...Typography.label, color: Colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderRangeText: { ...Typography.label, color: Colors.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' },
  presetRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginBottom: Spacing.base },
  presetCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadow.card,
  },
  presetCardActive: { borderWidth: 1.5, borderColor: Colors.primary },
  presetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  presetIconCircleActive: { backgroundColor: Colors.primaryLight },
  presetCardLabel: { ...Typography.labelCaps, color: Colors.textMuted, marginBottom: 4 },
  presetValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  presetCardNumber: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', color: Colors.textPrimary },
  presetCardNumberActive: { color: Colors.primary },
  presetCardUnit: { ...Typography.bodyMedium, color: Colors.textMuted },
  presetCardUnitActive: { color: Colors.primary },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  infoBannerIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoBannerContent: { flex: 1 },
  infoBannerTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: Spacing.xs },
  infoBannerText: { ...Typography.body, color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
