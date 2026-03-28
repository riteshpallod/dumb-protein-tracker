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

/** Leaf icon for Maintenance preset. */
function LeafIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Dumbbell icon for High Protein preset. */
function DumbbellIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 6.5h11v11h-11z" stroke="none" fill="none" />
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

/** Edit protein goal screen. */
export default function EditProteinScreen() {
  const [value, setValue] = useState(165);

  useEffect(() => {
    async function load() {
      try {
        const db = getDb();
        const s = await getSettings(db);
        setValue(s.protein_goal);
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

  const midValue = Math.round((50 + 300) / 2);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
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
        {/* Hero */}
        <Text style={styles.heroNumber}>{value}</Text>
        <Text style={styles.heroUnit}>grams</Text>
        <Text style={styles.heroLabel}>DAILY TARGET</Text>

        {/* Slider card */}
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
            <Text style={styles.sliderRangeText}>{midValue}G</Text>
            <Text style={styles.sliderRangeText}>300G</Text>
          </View>
        </View>

        {/* Preset cards */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetCard, value === 140 && styles.presetCardActive]}
            onPress={() => setValue(140)}
          >
            <View style={[styles.presetIconCircle, value === 140 && styles.presetIconCircleActive]}>
              <LeafIcon color={value === 140 ? Colors.primary : Colors.textMuted} />
            </View>
            <Text style={styles.presetCardLabel}>MAINTENANCE</Text>
            <View style={styles.presetValueRow}>
              <Text style={[styles.presetCardNumber, value === 140 && styles.presetCardNumberActive]}>140</Text>
              <Text style={[styles.presetCardUnit, value === 140 && styles.presetCardUnitActive]}> g</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetCard, value === 185 && styles.presetCardActive]}
            onPress={() => setValue(185)}
          >
            <View style={[styles.presetIconCircle, value === 185 && styles.presetIconCircleActive]}>
              <DumbbellIcon color={value === 185 ? Colors.primary : Colors.textMuted} />
            </View>
            <Text style={styles.presetCardLabel}>HIGH PROTEIN</Text>
            <View style={styles.presetValueRow}>
              <Text style={[styles.presetCardNumber, value === 185 && styles.presetCardNumberActive]}>185</Text>
              <Text style={[styles.presetCardUnit, value === 185 && styles.presetCardUnitActive]}> g</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIconCircle}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Why this matters?</Text>
            <Text style={styles.infoBannerText}>
              A higher protein intake supports{' '}
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: Colors.primary }}>muscle synthesis</Text>
              {' '}and metabolism. For your current weight and activity level, staying between 160g-190g ensures optimal recovery.
            </Text>
          </View>
        </View>

        {/* Bottom card */}
        <View style={styles.bottomCard}>
          <Text style={styles.bottomCardText}>Fuel your body with the right sources.</Text>
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
  headerClose: { ...Typography.title, color: Colors.textMuted },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  headerSave: { ...Typography.bodyMedium, color: Colors.primary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40, alignItems: 'center' },
  heroNumber: {
    fontSize: 56,
    lineHeight: 64,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
  },
  heroUnit: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  heroLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  sliderCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  sliderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  targetBadge: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  targetBadgeText: {
    ...Typography.label,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderRangeText: {
    ...Typography.label,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.base,
  },
  presetCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadow.card,
  },
  presetCardActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  presetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  presetIconCircleActive: {
    backgroundColor: Colors.primaryLight,
  },
  presetCardLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  presetValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  presetCardNumber: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
  },
  presetCardNumberActive: {
    color: Colors.primary,
  },
  presetCardUnit: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  presetCardUnitActive: {
    color: Colors.primary,
  },
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
  infoBannerIconText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  infoBannerContent: { flex: 1 },
  infoBannerTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoBannerText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomCard: {
    width: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  bottomCardText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
