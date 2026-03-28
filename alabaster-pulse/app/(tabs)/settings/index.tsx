import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../../../hooks/useDatabase';
import { getSettings } from '../../../db/queries';
import { seedDemoData } from '../../../db/seed';
import { useAppStore } from '../../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

type RowProps = {
  label: string;
  value?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  danger?: boolean;
};

function SettingsRow({ label, value, icon, iconColor, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? Colors.textMuted) + '18' }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? Colors.textMuted} />
        </View>
        <Text style={[styles.rowLabel, danger && { color: Colors.primary }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

/** Settings home screen. */
export default function SettingsScreen() {
  const { settings, setSettings } = useAppStore();
  const [seeding, setSeeding] = useState(false);
  const [devTaps, setDevTaps] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);

  function handleVersionTap() {
    const next = devTaps + 1;
    setDevTaps(next);
    if (next >= 10) {
      setDevUnlocked(true);
      setDevTaps(0);
    }
  }

  async function handleSeed() {
    Alert.alert('Load Demo Data?', 'This will replace all current data with demo entries.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load',
        onPress: async () => {
          setSeeding(true);
          try {
            const db = getDb();
            await seedDemoData(db);
            const s = await getSettings(db);
            setSettings(s);
            Alert.alert('Done', 'Demo data loaded successfully.');
          } catch (e) {
            Alert.alert('Error', 'Failed to load demo data.');
          } finally {
            setSeeding(false);
          }
        },
      },
    ]);
  }

  useFocusEffect(useCallback(() => {
    async function load() {
      try {
        const db = getDb();
        const s = await getSettings(db);
        setSettings(s);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []));

  const goalLabel: Record<string, string> = { shred: 'Shred', maintain: 'Maintain', bulk: 'Bulk' };
  const goalColor: Record<string, string> = { shred: Colors.primary, maintain: '#22c55e', bulk: '#6366f1' };
  const goal = settings?.goal_type ?? 'maintain';
  const initials = settings?.name
    ? settings.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const avatarUri = settings?.avatar_uri ?? null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => router.push('/(tabs)/settings/edit-profile')}
            activeOpacity={0.85}
          >
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarPhoto} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{settings?.name ?? 'Set your name'}</Text>

          <View style={[styles.goalBadge, { backgroundColor: (goalColor[goal] ?? '#71717a') + '18' }]}>
            <View style={[styles.goalDot, { backgroundColor: goalColor[goal] ?? '#71717a' }]} />
            <Text style={[styles.goalBadgeText, { color: goalColor[goal] ?? '#71717a' }]}>
              {goalLabel[goal] ?? 'Not set'}
            </Text>
          </View>

          {(settings?.height_cm || settings?.weight_kg) ? (
            <View style={styles.statsRow}>
              {settings?.height_cm ? (
                <View style={styles.statPill}>
                  <Ionicons name="resize-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.statText}>{settings.height_cm} cm</Text>
                </View>
              ) : null}
              {settings?.weight_kg ? (
                <View style={styles.statPill}>
                  <Ionicons name="scale-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.statText}>{settings.weight_kg} kg</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Goals */}
        <Text style={styles.sectionHeader}>Goals</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Calorie Goal"
            icon="flame-outline"
            iconColor="#f59e0b"
            value={`${settings?.calorie_goal?.toLocaleString() ?? '–'} kcal`}
            onPress={() => router.push('/(tabs)/settings/edit-calories')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Protein Goal"
            icon="barbell-outline"
            iconColor={Colors.primary}
            value={`${settings?.protein_goal ?? '–'} g`}
            onPress={() => router.push('/(tabs)/settings/edit-protein')}
          />
        </View>

        {/* Profile */}
        <Text style={styles.sectionHeader}>Profile</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Edit Profile"
            icon="person-outline"
            iconColor="#6366f1"
            value={settings?.name ?? 'Not set'}
            onPress={() => router.push('/(tabs)/settings/edit-profile')}
          />
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Data</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Backup Data"
            icon="cloud-upload-outline"
            iconColor="#22c55e"
            onPress={() => router.push('/(tabs)/settings/backup')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label="Restore Backup"
            icon="cloud-download-outline"
            iconColor="#3b82f6"
            onPress={() => router.push('/(tabs)/settings/restore')}
          />
        </View>

        {devUnlocked && (
          <TouchableOpacity
            style={[styles.demoBtn, seeding && { opacity: 0.7 }]}
            onPress={handleSeed}
            disabled={seeding}
            activeOpacity={0.85}
          >
            <Text style={styles.demoBtnText}>{seeding ? 'Loading...' : 'Load Demo Data'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleVersionTap} activeOpacity={1}>
          <Text style={styles.version}>Simple Tracker v1.0.0 · Offline-first</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundMuted },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: 100 },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.diffuse,
  },
  avatarPhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundMuted,
  },
  heroName: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.pill,
    marginBottom: Spacing.sm,
  },
  goalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  goalBadgeText: {
    ...Typography.labelLarge,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radii.pill,
    ...Shadow.card,
  },
  statText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  title: { ...Typography.titleLarge, color: Colors.textPrimary },
  sectionHeader: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    overflow: 'hidden',
    ...Shadow.card,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowValue: { ...Typography.body, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.base },
  demoBtn: {
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  demoBtnText: { ...Typography.bodyMedium, color: Colors.textMuted },
  version: { ...Typography.label, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.xxl },
});
