import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { getDb } from '../hooks/useDatabase';
import { getSettings, updateSettings } from '../db/queries';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';

/** Heart-pulse SVG icon for the logo. */
function HeartPulseIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 0 1 12 6.006a5 5 0 0 1 7.5 6.566z"
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M5 12h3l2-3 3 6 2-3h4"
        stroke={Colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Startup / Onboarding screen. Redirects to tabs if already onboarded. */
export default function OnboardingScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const db = getDb();
        const settings = await getSettings(db);
        if (settings.onboarding_complete === 1) {
          router.replace('/(tabs)/home');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    }
    check();
  }, []);

  async function handleStart() {
    try {
      const db = getDb();
      await updateSettings(db, { calorie_goal: 2150, onboarding_complete: 1 });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error(e);
    }
  }

  if (checking) return null;

  return (
    <SafeAreaView style={styles.root}>
      {/* Top: logo + name + tagline */}
      <View style={styles.top}>
        <View style={styles.logoIcon}>
          <HeartPulseIcon />
        </View>
        <Text style={styles.appName}>
          Simple <Text style={{ color: Colors.primary }}>Tracker</Text>
        </Text>
        <Text style={styles.tagline}>Log food. Hit your goals. That's it.</Text>
      </View>

      {/* Bottom: CTA + restore */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreBtn} onPress={() => router.push('/restore')}>
          <Text style={styles.restoreText}>Restore from backup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.base,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.diffuse,
  },
  appName: {
    ...Typography.titleLarge,
    fontSize: 32,
    color: Colors.textPrimary,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bottom: {
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base + 4,
    alignItems: 'center',
    ...Shadow.diffuse,
  },
  ctaText: {
    ...Typography.bodySemibold,
    fontSize: 17,
    color: '#fff',
  },
  restoreBtn: {
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
