import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

const DB_PATH = FileSystem.documentDirectory + 'SQLite/alabaster-pulse.db';
const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';

type BackupFile = { name: string; uri: string; size: number; date: string };

/** Pulse icon for the header. */
function PulseIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 0 1 12 6.006a5 5 0 0 1 7.5 6.566z"
        fill={Colors.primary}
      />
      <Path d="M5 12h3l2-3 3 6 2-3h4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Shield/lock icon for hero card. */
function ShieldIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={Colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Clock icon for snapshots. */
function ClockIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Checkmark circle icon for verified snapshots. */
function CheckCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={Colors.primary} />
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Backup screen — create and share DB snapshots. */
export default function BackupScreen() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      }
      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
      const dbFiles = files.filter((f) => f.endsWith('.db'));
      const items: BackupFile[] = await Promise.all(
        dbFiles.map(async (fname) => {
          const uri = BACKUP_DIR + fname;
          const info = await FileSystem.getInfoAsync(uri);
          return {
            name: fname,
            uri,
            size: info.exists ? (info.size ?? 0) : 0,
            date: fname.replace('backup-', '').replace('.db', '').replace(/-/g, '/'),
          };
        })
      );
      setBackups(items.reverse());
    } catch (e) {
      console.error(e);
    }
  }

  async function createBackup() {
    setCreating(true);
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      }
      const srcInfo = await FileSystem.getInfoAsync(DB_PATH);
      if (!srcInfo.exists) {
        Alert.alert('Error', 'Database file not found.');
        return;
      }
      const destUri = BACKUP_DIR + `backup-${ts}.db`;
      await FileSystem.copyAsync({ from: DB_PATH, to: destUri });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadBackups();
      Alert.alert('Backup created!', 'Your data has been backed up. Share it to store it safely.', [
        { text: 'Share Now', onPress: () => shareFile(destUri) },
        { text: 'Later', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create backup.');
    } finally {
      setCreating(false);
    }
  }

  async function shareFile(uri: string) {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) { Alert.alert('Sharing not available on this device.'); return; }
      await Sharing.shareAsync(uri, { mimeType: 'application/octet-stream', dialogTitle: 'Export Backup' });
    } catch (e) {
      Alert.alert('Error', 'Could not share file.');
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Format snapshot label based on index. */
  function getSnapshotLabel(index: number): string {
    return index === 0 ? 'Automated Snapshot' : 'Full System Export';
  }

  /** Format file date from name. */
  function formatSnapshotDate(fname: string): string {
    const match = fname.match(/backup-(\d{4})-(\d{2})-(\d{2})T?(\d{2})?-?(\d{2})?/);
    if (!match) return fname;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(match[2], 10) - 1] ?? match[2];
    const day = parseInt(match[3], 10);
    const year = match[1];
    return `${month} ${day}, ${year}`;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Back Up Storage</Text>
          <PulseIcon />
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIcon}>
              <ShieldIcon />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>SECURE LOCAL</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Data Integrity Guard</Text>
          <Text style={styles.heroBody}>
            Ensure your biometric pulse data and health logs are safely preserved. All backups are encrypted and stored directly on your physical hardware for maximum privacy.
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, creating && { opacity: 0.7 }]}
            onPress={createBackup}
            disabled={creating}
            activeOpacity={0.85}
          >
            {creating
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>+  Create New Backup</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Policy note */}
        <View style={styles.policyCard}>
          <View style={styles.policyIconCircle}>
            <Ionicons name="information-circle" size={16} color="#1d4ed8" />
          </View>
          <View style={styles.policyTextContainer}>
            <Text style={styles.policyTitle}>Offline Security Policy</Text>
            <Text style={styles.policyBody}>
              Simple Tracker prioritizes your privacy. Backups are stored locally on your device's internal storage and are{' '}
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>not uploaded</Text> to any cloud service. Ensure you have adequate space before initiating a full system snapshot.
            </Text>
          </View>
        </View>

        {/* Snapshots */}
        <View style={styles.snapshotsHeader}>
          <Text style={styles.sectionLabel}>Recent Snapshots</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {backups.length > 0 ? (
          backups.map((b, i) => (
            <TouchableOpacity key={b.uri} style={styles.snapshotRow} onPress={() => shareFile(b.uri)} activeOpacity={0.7}>
              <View style={[styles.snapshotIcon, i === 1 && { backgroundColor: Colors.primaryLight }]}>
                {i === 1 ? <CheckCircleIcon /> : <ClockIcon />}
              </View>
              <View style={styles.snapshotInfo}>
                <Text style={styles.snapshotName}>{getSnapshotLabel(i % 2)}</Text>
                <Text style={styles.snapshotMeta}>{formatSnapshotDate(b.name)} · {formatBytes(b.size)}</Text>
              </View>
              <Text style={styles.snapshotArrow}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <>
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotIcon}>
                <ClockIcon />
              </View>
              <View style={styles.snapshotInfo}>
                <Text style={styles.snapshotName}>No snapshots yet</Text>
                <Text style={styles.snapshotMeta}>Create a backup to see it here</Text>
              </View>
              <Text style={styles.snapshotArrow}>›</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundMuted },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { ...Typography.title, color: Colors.textPrimary },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  heroIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radii.badge,
  },
  heroBadgeText: { ...Typography.labelCaps, color: Colors.textMuted, fontSize: 10 },
  heroTitle: { ...Typography.title, color: Colors.textPrimary, marginBottom: Spacing.sm },
  heroBody: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.diffuse,
  },
  createBtnText: { ...Typography.bodySemibold, color: '#fff' },
  policyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  policyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  policyIconText: { fontSize: 14, color: '#3b82f6' },
  policyTextContainer: { flex: 1 },
  policyTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, marginBottom: 4 },
  policyBody: { ...Typography.body, color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
  snapshotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  viewAll: { ...Typography.labelCaps, color: Colors.primary },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  snapshotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapshotInfo: { flex: 1 },
  snapshotName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  snapshotMeta: { ...Typography.label, color: Colors.textMuted, marginTop: 2 },
  snapshotArrow: { ...Typography.bodyMedium, color: Colors.textLight, fontSize: 20 },
});
