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
 * Mifflin-St Jeor BMR × 1.4 (moderate activity) = TDEE.
 * Rounded to nearest 50 kcal.
 */
function calcTDEE(weight: number, height: number, age: number, sex: 'male' | 'female' | null): number {
  const bmr = sex === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  return Math.round((bmr * 1.4) / 50) * 50;
}

function ScalesIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="3" x2="12" y2="21" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M4 7l8-4 8 4" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 7l-2 7h8L8 7" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 7l-2 7h-8l2-7" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8" y1="21" x2="16" y2="21" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function TrendDownIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7l6 6 4-4 8 8" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 17h4v-4" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Edit calorie goal screen with Mifflin-St Jeor personalised estimates. */
export default function EditCaloriesScreen() {
  const [value, setValue] = useState(2150);
  const [tdee, setTdee] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const db = getDb();
        const s = await getSettings(db);
        setValue(s.calorie_goal);
        if (s.weight_kg && s.height_cm && s.age) {
          setTdee(calcTDEE(s.weight_kg, s.height_cm, s.age, s.sex ?? null));
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const hasProfile = tdee !== null;
  const maintenance = tdee ?? 2200;
  const shred = maintenance - 500;
  const bulk = maintenance + 350;

  async function handleSave() {
    try {
      const db = getDb();
      await updateSettings(db, { calorie_goal: value });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save.');
    }
  }

  const rangeText = hasProfile
    ? `Your range: ${shred.toLocaleString()} – ${bulk.toLocaleString()} kcal`
    : 'Set your profile for a personalised estimate';

  const bannerText = hasProfile
    ? `Your maintenance is ~${maintenance.toLocaleString()} kcal/day (Mifflin-St Jeor, moderate activity). Shred target: ${shred.toLocaleString()} kcal. Bulk target: ${bulk.toLocaleString()} kcal.`
    : 'Set your height, weight, age and sex in Profile to get a personalised calorie target.';

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Calorie Goal</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroLabel}>CURRENT DAILY TARGET</Text>
        <Text style={styles.heroNumber}>{value.toLocaleString()}</Text>
        <Text style={styles.heroUnit}>kcal</Text>

        <View style={styles.rangePill}>
          <Text style={styles.rangePillText}>{rangeText}</Text>
        </View>

        <View style={styles.sliderCard}>
          <View style={styles.sliderHeaderRow}>
            <View>
              <Text style={styles.sliderTitle}>Adjust Goal</Text>
              <Text style={styles.sliderSubtitle}>Slide to refine your target</Text>
            </View>
            <View style={styles.flameIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 23c-4.97 0-9-3.58-9-8 0-4 3.5-7.5 4-11 .5 4 3 6 5 7.5C13.5 10 14 8 14 6c3 3 5 6.5 5 9 0 4.42-3.13 8-7 8z" fill={Colors.primary} />
              </Svg>
            </View>
          </View>
          <Slider
            style={{ width: '100%', height: 40, marginTop: Spacing.sm }}
            minimumValue={1200}
            maximumValue={4000}
            step={50}
            value={value}
            onValueChange={(v) => setValue(Math.round(v))}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.sliderRangeText}>1,200</Text>
            <Text style={styles.sliderRangeText}>4,000</Text>
          </View>
        </View>

        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetCard, value === maintenance && styles.presetCardActive]}
            onPress={() => setValue(maintenance)}
          >
            <View style={[styles.presetIconCircle, value === maintenance && styles.presetIconCircleActive]}>
              <ScalesIcon />
            </View>
            <Text style={styles.presetLabel}>Maintenance</Text>
            <Text style={[styles.presetValue, value === maintenance && styles.presetValueActive]}>
              {maintenance.toLocaleString()} kcal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetCard, value === shred && styles.presetCardActive]}
            onPress={() => setValue(shred)}
          >
            <View style={[styles.presetIconCircle, value === shred && styles.presetIconCircleActive]}>
              <TrendDownIcon />
            </View>
            <Text style={styles.presetLabel}>Lose Weight</Text>
            <Text style={[styles.presetValue, value === shred && styles.presetValueActive]}>
              {shred.toLocaleString()} kcal
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIconCircle}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.infoBannerText}>{bannerText}</Text>
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
  headerCancel: { ...Typography.bodyMedium, color: Colors.textMuted },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  headerSave: { ...Typography.bodyMedium, color: Colors.primary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40, alignItems: 'center' },
  heroLabel: { ...Typography.labelCaps, color: Colors.textMuted, marginBottom: Spacing.sm },
  heroNumber: {
    fontSize: 56,
    lineHeight: 64,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
  },
  heroUnit: { ...Typography.bodyLarge, color: Colors.textMuted, marginBottom: Spacing.lg },
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
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sliderTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: 2 },
  sliderSubtitle: { ...Typography.label, color: Colors.textMuted },
  flameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderRangeText: { ...Typography.label, color: Colors.textMuted },
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
  presetLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 4 },
  presetValue: { ...Typography.bodyMedium, color: Colors.textPrimary, textAlign: 'center' },
  presetValueActive: { color: Colors.primary },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.sm,
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
  infoBannerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
});
