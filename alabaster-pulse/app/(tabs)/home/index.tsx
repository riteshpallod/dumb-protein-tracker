import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getDb } from '../../../hooks/useDatabase';
import { getSettings, getLogForDate, deleteLogEntry, insertWeightEntry, getWeightForDate } from '../../../db/queries';
import { useAppStore } from '../../../store/useAppStore';
import ProgressRings from '../../../components/ProgressRings';
import FoodLogItem from '../../../components/FoodLogItem';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

function todayString() {
  return new Date().toISOString().split('T')[0];
}


/** Today's dashboard — progress rings + food log. */
export default function HomeScreen() {
  const { settings, setSettings, todayLog, setTodayLog, removeLogEntry } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [todayWeight, setTodayWeight] = useState<number | null>(null);

  const fabRotation = useSharedValue(0);
  const fabMenuOpacity = useSharedValue(0);

  /** Toggle FAB expanded state. */
  function toggleFab() {
    const next = !fabOpen;
    setFabOpen(next);
    fabRotation.value = withTiming(next ? 1 : 0, { duration: 200 });
    fabMenuOpacity.value = withTiming(next ? 1 : 0, { duration: 150 });
  }

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value * 45}deg` }],
  }));
  const fabMenuStyle = useAnimatedStyle(() => ({
    opacity: fabMenuOpacity.value,
  }));

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const [s, log, wEntry] = await Promise.all([
        getSettings(db),
        getLogForDate(db, todayString()),
        getWeightForDate(db, todayString()),
      ]);
      setSettings(s);
      setTodayLog(log);
      setTodayWeight(wEntry?.weight_kg ?? null);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleDelete(id: number) {
    try {
      const db = getDb();
      await deleteLogEntry(db, id);
      removeLogEntry(id);
    } catch (e) {
      console.error(e);
    }
  }

  /** Save a weight entry for today. */
  async function handleSaveWeight() {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg <= 0 || kg > 500) {
      Alert.alert('Invalid weight', 'Please enter a valid weight in kg.');
      return;
    }
    try {
      const db = getDb();
      await insertWeightEntry(db, { log_date: todayString(), weight_kg: kg });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTodayWeight(kg);
      setWeightInput('');
      setWeightModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save weight.');
    }
  }

  const totalCalories = todayLog.reduce((s, e) => s + e.calories_total, 0);
  const totalProtein = todayLog.reduce((s, e) => s + e.protein_total, 0);
  const calorieGoal = settings?.calorie_goal ?? 2150;
  const proteinGoal = settings?.protein_goal ?? 165;
  const caloriesLeft = Math.max(0, calorieGoal - totalCalories);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>Today</Text>
        </View>

        {/* Progress Rings */}
        <View style={styles.ringsWrapper}>
          <ProgressRings
            caloriesConsumed={totalCalories}
            calorieGoal={calorieGoal}
            proteinConsumed={totalProtein}
            proteinGoal={proteinGoal}
            size={280}
          />
          <View style={styles.ringsCenter}>
            <Text style={styles.kcalLeft}>{caloriesLeft.toLocaleString()}</Text>
            <Text style={styles.kcalLabel}>kcal left</Text>
            <View style={styles.proteinRow}>
              <View style={styles.proteinDot} />
              <Text style={styles.proteinText}>
                {Math.round(totalProtein)}/{proteinGoal}g P
              </Text>
            </View>
          </View>
        </View>

        {/* Logged food header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logged Food</Text>
          <Text style={styles.sectionCount}>{todayLog.length} item{todayLog.length !== 1 ? 's' : ''}</Text>
        </View>

        {todayLog.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No food logged yet.</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first entry.</Text>
          </View>
        )}

        {todayLog.map((entry) => (
          <FoodLogItem key={entry.id} entry={entry} onDelete={handleDelete} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB menu items */}
      <Animated.View style={[styles.fabMenu, fabMenuStyle]} pointerEvents={fabOpen ? 'auto' : 'none'}>
        <TouchableOpacity
          style={styles.fabMenuItem}
          onPress={() => { setFabOpen(false); fabRotation.value = withTiming(0, { duration: 150 }); fabMenuOpacity.value = withTiming(0, { duration: 100 }); setWeightModalVisible(true); }}
          activeOpacity={0.8}
        >
          <View style={[styles.fabMenuIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="scale-outline" size={18} color="#3b82f6" />
          </View>
          <Text style={styles.fabMenuLabel}>Add Weight</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabMenuItem}
          onPress={() => { setFabOpen(false); fabRotation.value = withTiming(0, { duration: 150 }); fabMenuOpacity.value = withTiming(0, { duration: 100 }); router.push('/log-food'); }}
          activeOpacity={0.8}
        >
          <View style={[styles.fabMenuIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.fabMenuLabel}>Track Food</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
        <Animated.View style={fabIconStyle}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop when FAB open */}
      {fabOpen && (
        <TouchableOpacity style={styles.fabBackdrop} onPress={toggleFab} activeOpacity={1} />
      )}

      {/* Weight input modal */}
      {weightModalVisible && (
        <View style={styles.weightOverlay}>
          <TouchableOpacity style={styles.weightBackdrop} onPress={() => setWeightModalVisible(false)} activeOpacity={1} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.weightModalWrap}>
            <View style={styles.weightModal}>
              <Text style={styles.weightModalTitle}>Log Weight</Text>
              {todayWeight !== null && (
                <Text style={styles.weightModalSub}>Today: {todayWeight} kg</Text>
              )}
              <View style={styles.weightInputRow}>
                <TextInput
                  style={styles.weightInput}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder="e.g. 76.5"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              <TouchableOpacity style={styles.weightSaveBtn} onPress={handleSaveWeight} activeOpacity={0.85}>
                <Text style={styles.weightSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundMuted,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerDate: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
  },
  ringsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    position: 'relative',
  },
  ringsCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  kcalLeft: {
    ...Typography.display,
    fontSize: 38,
    lineHeight: 44,
    color: Colors.textPrimary,
  },
  kcalLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  proteinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  proteinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.calorieRing,
  },
  proteinText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  sectionCount: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.diffuse,
    zIndex: 20,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    marginTop: -2,
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 155,
    right: Spacing.xl,
    zIndex: 15,
    gap: Spacing.sm,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  fabMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  // Weight modal
  weightOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  weightModalWrap: {
    width: '85%',
  },
  weightModal: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    ...Shadow.diffuse,
  },
  weightModalTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  weightModalSub: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.base,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  weightInput: {
    flex: 1,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textPrimary,
  },
  weightUnit: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
  },
  weightSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  weightSaveBtnText: {
    ...Typography.bodySemibold,
    color: '#fff',
    fontSize: 16,
  },
});
