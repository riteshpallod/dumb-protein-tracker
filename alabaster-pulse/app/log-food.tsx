import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';
import type { FoodItem } from '../db/queries';
import { getFoodItems, insertLogEntry } from '../db/queries';
import { getDb } from '../hooks/useDatabase';

const DAY_OFFSETS = [
  { label: 'Yesterday', offset: -1 },
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
];

/** Get ISO date string for a day offset from today. */
function dateForOffset(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

type ExpandedItem = { item: FoodItem; servings: number } | null;

/** Full-screen food logging page. */
export default function LogFoodScreen() {
  const [dayOffset, setDayOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [expanded, setExpanded] = useState<ExpandedItem>(null);
  const [mode, setMode] = useState<'inventory' | 'quick'>('inventory');

  // Quick-add state
  const [quickName, setQuickName] = useState('');
  const [quickCalories, setQuickCalories] = useState('');
  const [quickProtein, setQuickProtein] = useState('');

  const loadItems = useCallback(async (query: string) => {
    try {
      const db = getDb();
      const results = await getFoodItems(db, query);
      setItems(results);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadItems('');
  }, [loadItems]);

  useEffect(() => {
    const t = setTimeout(() => loadItems(search), 250);
    return () => clearTimeout(t);
  }, [search, loadItems]);

  /** Log an item from inventory. */
  async function handleAddFromInventory() {
    if (!expanded) return;
    try {
      const db = getDb();
      const { item, servings } = expanded;
      await insertLogEntry(db, {
        food_item_id: item.id,
        log_date: dateForOffset(dayOffset),
        servings,
        calories_total: Math.round(item.calories * servings),
        protein_total: +(item.protein_grams * servings).toFixed(1),
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpanded(null);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to log food.');
    }
  }

  /** Quick-add a manual entry. */
  async function handleQuickAdd() {
    const cal = parseInt(quickCalories, 10);
    const prot = parseFloat(quickProtein);
    if (isNaN(cal) || cal <= 0) {
      Alert.alert('Invalid', 'Enter valid calories.');
      return;
    }
    try {
      const db = getDb();
      // Insert a temporary food item then log it
      const result = await db.runAsync(
        'INSERT INTO food_items (name, serving_label, weight_grams, protein_grams, calories, category) VALUES (?, ?, ?, ?, ?, ?)',
        [quickName.trim() || 'Quick Entry', '1 serving', 0, isNaN(prot) ? 0 : prot, cal, 'Other']
      );
      await insertLogEntry(db, {
        food_item_id: result.lastInsertRowId,
        log_date: dateForOffset(dayOffset),
        servings: 1,
        calories_total: cal,
        protein_total: isNaN(prot) ? 0 : prot,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to log food.');
    }
  }

  /** Render an inventory item row. */
  function renderItem({ item }: { item: FoodItem }) {
    const isExp = expanded?.item.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.foodCard, isExp && styles.foodCardExpanded]}
        onPress={() => setExpanded(isExp ? null : { item, servings: 1 })}
        activeOpacity={0.8}
      >
        <View style={styles.foodTop}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.foodSub}>{item.serving_label} · {item.calories} kcal · {item.protein_grams}g P</Text>
          </View>
          {!isExp ? (
            <View style={styles.addCircle}>
              <Ionicons name="add" size={18} color={Colors.textMuted} />
            </View>
          ) : (
            <View style={styles.expandedMacros}>
              <Text style={styles.expandedCal}>
                {Math.round(item.calories * (expanded?.servings ?? 1))} kcal
              </Text>
              <Text style={styles.expandedProt}>
                {Math.round(item.protein_grams * (expanded?.servings ?? 1))}g P
              </Text>
            </View>
          )}
        </View>

        {isExp && expanded && (
          <View style={styles.servingSection}>
            <View style={styles.servingHeader}>
              <Text style={styles.servingLabel}>Servings</Text>
              <Text style={styles.servingValue}>{expanded.servings.toFixed(1)}</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 36 }}
              minimumValue={0.5}
              maximumValue={10}
              step={0.5}
              value={expanded.servings}
              onValueChange={(v) => setExpanded({ ...expanded, servings: v })}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderEdge}>0.5</Text>
              <Text style={styles.sliderEdge}>10</Text>
            </View>
            <TouchableOpacity style={styles.logBtn} onPress={handleAddFromInventory} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.logBtnText}>
                Log {expanded.servings.toFixed(1)} serving{expanded.servings !== 1 ? 's' : ''} ({Math.round(item.calories * expanded.servings)} kcal)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Food</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Day picker */}
        <View style={styles.dayRow}>
          {DAY_OFFSETS.map(({ label, offset }) => (
            <TouchableOpacity
              key={offset}
              style={[styles.dayTab, dayOffset === offset && styles.dayTabActive]}
              onPress={() => setDayOffset(offset)}
            >
              <Text style={[styles.dayText, dayOffset === offset && styles.dayTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'inventory' && styles.modeTabActive]}
            onPress={() => setMode('inventory')}
          >
            <Ionicons name="list" size={16} color={mode === 'inventory' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.modeText, mode === 'inventory' && styles.modeTextActive]}>From Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'quick' && styles.modeTabActive]}
            onPress={() => setMode('quick')}
          >
            <Ionicons name="flash" size={16} color={mode === 'quick' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.modeText, mode === 'quick' && styles.modeTextActive]}>Quick Add</Text>
          </TouchableOpacity>
        </View>

        {mode === 'inventory' ? (
          <>
            {/* Search */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your foods..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Inventory list */}
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={40} color={Colors.textLight} />
                  <Text style={styles.emptyTitle}>No items in inventory</Text>
                  <Text style={styles.emptySub}>Add foods to your inventory first, or use Quick Add.</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => router.push('/(tabs)/inventory/add')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.emptyBtnText}>Add to Inventory</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        ) : (
          /* Quick Add form */
          <View style={styles.quickForm}>
            <Text style={styles.quickLabel}>NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.quickInput}
              value={quickName}
              onChangeText={setQuickName}
              placeholder="e.g. Lunch, Snack..."
              placeholderTextColor={Colors.textLight}
            />

            <View style={styles.quickRow}>
              <View style={styles.quickField}>
                <Text style={styles.quickLabel}>CALORIES</Text>
                <View style={styles.quickInputRow}>
                  <TextInput
                    style={[styles.quickInput, styles.quickInputNum]}
                    value={quickCalories}
                    onChangeText={setQuickCalories}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.quickUnit}>kcal</Text>
                </View>
              </View>
              <View style={styles.quickField}>
                <Text style={styles.quickLabel}>PROTEIN</Text>
                <View style={styles.quickInputRow}>
                  <TextInput
                    style={[styles.quickInput, styles.quickInputNum]}
                    value={quickProtein}
                    onChangeText={setQuickProtein}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.quickUnit}>g</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.quickAddBtn} onPress={handleQuickAdd} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.quickAddBtnText}>Log Entry</Text>
            </TouchableOpacity>

            <Text style={styles.quickNote}>Quick entries are saved to your inventory for future use.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.title, color: Colors.textPrimary },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  dayTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.secondary,
  },
  dayTabActive: { backgroundColor: Colors.primary },
  dayText: { ...Typography.labelLarge, color: Colors.textMuted },
  dayTextActive: { color: '#fff' },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.pill,
    padding: 3,
    marginBottom: Spacing.base,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill - 2,
  },
  modeTabActive: {
    backgroundColor: Colors.background,
    ...Shadow.card,
  },
  modeText: { ...Typography.labelLarge, color: Colors.textMuted },
  modeTextActive: { color: Colors.primary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 40 },
  foodCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  foodCardExpanded: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  foodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  foodInfo: { flex: 1 },
  foodName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  foodSub: { ...Typography.label, color: Colors.textMuted, marginTop: 2 },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedMacros: { alignItems: 'flex-end' },
  expandedCal: { ...Typography.bodySemibold, color: Colors.primary, fontSize: 15 },
  expandedProt: { ...Typography.label, color: Colors.textMuted, marginTop: 1 },
  servingSection: { marginTop: Spacing.base },
  servingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  servingLabel: { ...Typography.body, color: Colors.textMuted },
  servingValue: { ...Typography.metricSm, color: Colors.textPrimary },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEdge: { ...Typography.label, color: Colors.textMuted },
  logBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logBtnText: { ...Typography.bodySemibold, color: '#fff' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  emptyBtnText: { ...Typography.bodySemibold, color: '#fff' },
  // Quick add
  quickForm: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  quickLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.base,
  },
  quickInput: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickField: { flex: 1 },
  quickInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quickInputNum: { flex: 1 },
  quickUnit: { ...Typography.bodyMedium, color: Colors.textMuted },
  quickAddBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base,
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickAddBtnText: { ...Typography.bodySemibold, color: '#fff', fontSize: 16 },
  quickNote: {
    ...Typography.label,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.base,
    fontStyle: 'italic',
  },
});
