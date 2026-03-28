import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

type BackupFile = { name: string; uri: string; size: number; isLatest: boolean; formattedDate: string; formattedTime: string };

/** Pulse icon. */
function PulseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 0 1 12 6.006a5 5 0 0 1 7.5 6.566z"
        fill={Colors.primary}
      />
      <Path d="M5 12h3l2-3 3 6 2-3h4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Clock icon. */
function ClockIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Trash icon. */
function TrashIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={Colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Parse backup filename into formatted date and time. */
function parseBackupName(fname: string): { date: string; time: string } {
  const match = fname.match(/backup-(\d{4})-(\d{2})-(\d{2})T?(\d{2})?-?(\d{2})?-?(\d{2})?/);
  if (!match) return { date: fname, time: '' };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(match[2], 10) - 1] ?? match[2];
  const day = parseInt(match[3], 10);
  const year = match[1];
  const hour = match[4] ? parseInt(match[4], 10) : 0;
  const min = match[5] ?? '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    date: `${month} ${day}, ${year}`,
    time: `${h12}:${min} ${ampm}`,
  };
}

/** Restore backup screen. */
export default function RestoreFromSettings() {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [search, setSearch] = useState('');
  const [expandedUri, setExpandedUri] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  function getBackupDir() {
    return new Directory(Paths.document, 'backups');
  }

  async function loadBackups() {
    try {
      const dir = getBackupDir();
      if (!dir.exists) { dir.create(); return; }
      const entries = dir.list();
      const items: BackupFile[] = [];
      for (const entry of entries) {
        if (!(entry instanceof File)) continue;
        if (!entry.uri.endsWith('.db')) continue;
        const fname = entry.uri.split('/').pop() ?? '';
        const parsed = parseBackupName(fname);
        items.push({
          name: fname,
          uri: entry.uri,
          size: entry.size ?? 0,
          isLatest: false,
          formattedDate: parsed.date,
          formattedTime: parsed.time,
        });
      }
      items.reverse();
      if (items.length > 0) items[0].isLatest = true;
      setBackups(items);
    } catch (e) {
      console.error(e);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function doRestore(uri: string) {
    setLoading(true);
    try {
      const sqliteDir = new Directory(Paths.document, 'SQLite');
      if (!sqliteDir.exists) sqliteDir.create();
      const srcFile = new File(uri);
      const destFile = new File(Paths.document, 'SQLite', 'alabaster-pulse.db');
      if (destFile.exists) destFile.delete();
      srcFile.copy(sqliteDir);
      const fname = uri.split('/').pop() ?? 'alabaster-pulse.db';
      if (fname !== 'alabaster-pulse.db') {
        const copied = new File(Paths.document, 'SQLite', fname);
        if (copied.exists) copied.rename('alabaster-pulse.db');
      }
      Alert.alert('Restored!', 'Backup restored successfully. Please restart the app.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to restore backup.');
    } finally {
      setLoading(false);
    }
  }

  function confirmRestore(uri: string, name: string) {
    Alert.alert(
      'Restore Backup?',
      `This will overwrite all current data with "${name}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => doRestore(uri) },
      ]
    );
  }

  function confirmDelete(uri: string, name: string) {
    Alert.alert(
      'Delete Backup?',
      `This will permanently delete "${name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              const f = new File(uri);
              if (f.exists) f.delete();
              loadBackups();
            } catch (e) {
              Alert.alert('Error', 'Could not delete backup.');
            }
          },
        },
      ]
    );
  }

  async function pickAndRestore() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      confirmRestore(file.uri, file.name);
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker.');
    }
  }

  const filtered = search.trim()
    ? backups.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.formattedDate.toLowerCase().includes(search.toLowerCase()))
    : backups;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Restore Backups</Text>
          <PulseIcon />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search backups..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Count label */}
        <View style={styles.countRow}>
          <Text style={styles.countLabel}>PREVIOUS BACKUPS</Text>
          <Text style={styles.countValue}>{filtered.length} TOTAL</Text>
        </View>

        {/* Backup list */}
        {filtered.map((b) => {
          const isExpanded = expandedUri === b.uri;
          return (
            <TouchableOpacity
              key={b.uri}
              style={[
                styles.backupCard,
                isExpanded && styles.backupCardExpanded,
                b.isLatest && styles.backupCardLatest,
              ]}
              onPress={() => setExpandedUri(isExpanded ? null : b.uri)}
              activeOpacity={0.7}
            >
              <View style={styles.backupTop}>
                <View style={[styles.clockIconCircle, b.isLatest && styles.clockIconCircleLatest]}>
                  <ClockIcon color={b.isLatest ? '#fff' : Colors.textMuted} />
                </View>
                <View style={styles.backupInfo}>
                  <View style={styles.backupNameRow}>
                    <Text style={styles.backupName}>{b.formattedDate}</Text>
                    {b.isLatest && (
                      <View style={styles.latestBadge}>
                        <Text style={styles.latestBadgeText}>LATEST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.backupMeta}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="10" stroke={Colors.textMuted} strokeWidth={2} />
                    </Svg>
                    {'  '}{b.formattedTime}  ·  {formatBytes(b.size)}
                  </Text>
                </View>
                {!isExpanded && <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />}
              </View>
              {isExpanded && (
                <View style={styles.expandedActions}>
                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={() => confirmRestore(b.uri, b.name)}
                  >
                    <ClockIcon color="#fff" />
                    <Text style={styles.restoreBtnText}>  Restore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(b.uri, b.name)}
                  >
                    <TrashIcon />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No backups found.</Text>
          </View>
        )}

        {/* Import from file */}
        <TouchableOpacity style={styles.importBtn} onPress={pickAndRestore} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.importBtnText}>Import from File</Text>
          }
        </TouchableOpacity>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIconCircle}>
            <Ionicons name="information-circle" size={16} color="#15803d" />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Important Note</Text>
            <Text style={styles.infoBannerText}>
              Restoring a backup will overwrite all current local data. We recommend making a fresh backup of your current state before proceeding.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundMuted },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  back: { ...Typography.title, color: Colors.textPrimary },
  title: { ...Typography.title, color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  countLabel: { ...Typography.labelCaps, color: Colors.textMuted },
  countValue: { ...Typography.labelCaps, color: Colors.primary },
  backupCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  backupCardExpanded: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backupCardLatest: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  backupTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  clockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockIconCircleLatest: {
    backgroundColor: Colors.primary,
  },
  backupInfo: { flex: 1 },
  backupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backupName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  latestBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.badge,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  latestBadgeText: { ...Typography.labelCaps, color: Colors.textMuted, fontSize: 9 },
  backupMeta: { ...Typography.label, color: Colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 12, color: Colors.textMuted },
  expandedActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtnText: { ...Typography.bodySemibold, color: '#fff' },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  importBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  importBtnText: { ...Typography.bodyMedium, color: Colors.primary },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  infoBannerIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
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
});
