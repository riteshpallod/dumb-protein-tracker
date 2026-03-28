import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';

/** Standalone restore-backup screen (accessible from onboarding). */
export default function RestoreScreen() {
  const [loading, setLoading] = useState(false);

  async function pickAndRestore() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      Alert.alert(
        'Restore Backup?',
        `This will overwrite all current data with "${file.name}". This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => doRestore(file.uri),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker.');
    }
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
      Alert.alert('Restored!', 'Backup restored. Please restart the app.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to restore backup. The file may be invalid.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="arrow-back" size={18} color={Colors.textMuted} />
          <Text style={styles.backText}>Back</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.title}>Restore Backup</Text>
      <Text style={styles.subtitle}>
        Select a previously exported <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>.db</Text> backup file to restore your data.
      </Text>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠ Warning</Text>
        <Text style={styles.warningBody}>
          Restoring will permanently replace all your current data.
          Make sure you have a backup of your current state before proceeding.
        </Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={pickAndRestore} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Choose Backup File</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  back: { marginBottom: Spacing.xl },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  warningCard: {
    backgroundColor: 'rgba(236,19,41,0.06)',
    borderRadius: Radii.card,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.base,
    marginBottom: Spacing.xxl,
  },
  warningTitle: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  warningBody: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
    ...Shadow.diffuse,
  },
  btnText: {
    ...Typography.bodySemibold,
    color: '#fff',
    fontSize: 17,
  },
});
