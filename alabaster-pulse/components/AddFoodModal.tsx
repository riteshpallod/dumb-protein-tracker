import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';
import type { FoodItem } from '../db/queries';
import { getFoodItems, insertLogEntry } from '../db/queries';
import { getDb } from '../hooks/useDatabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
};

type ExpandedItem = { item: FoodItem; servings: number } | null;

const DAY_OFFSETS = [
  { label: 'Yesterday', offset: -1 },
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
];

function dateForOffset(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

/** Bottom-sheet modal for logging food from inventory. */
export default function AddFoodModal({ visible, onClose, onAdded }: Props) {
  const [dayOffset, setDayOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedItem>(null);

  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      loadItems('');
    } else {
      translateY.value = withTiming(600, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
      setSearch('');
      setExpanded(null);
    }
  }, [visible]);

  async function loadItems(query: string) {
    setLoading(true);
    try {
      const db = getDb();
      const results = await getFoodItems(db, query);
      setItems(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => loadItems(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  async function handleAdd() {
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
      onAdded();
      onClose();
    } catch (e) {
      console.error(e);
    }
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible && translateY.value >= 600) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Day picker */}
          <View style={styles.dayRow}>
            {DAY_OFFSETS.map(({ label, offset }) => (
              <TouchableOpacity
                key={offset}
                style={[styles.dayTab, dayOffset === offset && styles.dayTabActive]}
                onPress={() => setDayOffset(offset)}
              >
                <Text style={[styles.dayTabText, dayOffset === offset && styles.dayTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory or add new..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>

          {/* Food list */}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.id)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isExpanded = expanded?.item.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.foodRow, isExpanded && styles.foodRowExpanded]}
                    onPress={() =>
                      setExpanded(isExpanded ? null : { item, servings: 1 })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.foodRowTop}>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{item.name}</Text>
                        <Text style={styles.foodSub}>{item.serving_label}</Text>
                      </View>
                      <View style={styles.foodMacros}>
                        <View style={styles.macroBadge}>
                          <Text style={[styles.macroBadgeText, isExpanded && { color: Colors.primary }]}>
                            {isExpanded
                              ? Math.round(item.calories * (expanded?.servings ?? 1))
                              : item.calories}{' '}
                            kcal
                          </Text>
                        </View>
                        <View style={[styles.macroBadge, styles.proteinBadge]}>
                          <Text style={[styles.macroBadgeText, styles.proteinBadgeText]}>
                            {isExpanded
                              ? Math.round(item.protein_grams * (expanded?.servings ?? 1))
                              : item.protein_grams}g P
                          </Text>
                        </View>
                        {!isExpanded && (
                          <View style={styles.addCircle}>
                            <Text style={styles.addCircleText}>+</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isExpanded && expanded && (
                      <View style={styles.servingExpand}>
                        <View style={styles.servingRow}>
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
                        <View style={styles.sliderLabels}>
                          <Text style={styles.sliderEdge}>0.5</Text>
                          <Text style={styles.sliderEdge}>10</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Add CTA */}
          {expanded && (
            <TouchableOpacity style={styles.addCta} onPress={handleAdd}>
              <Text style={styles.addCtaText}>
                Add 1 Item ({Math.round(expanded.item.calories * expanded.servings)} kcal)
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '85%',
    ...Shadow.diffuse,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  dayTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.secondary,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
  },
  dayTabText: {
    ...Typography.labelLarge,
    color: Colors.textMuted,
  },
  dayTabTextActive: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 44,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  list: {
    flex: 1,
  },
  foodRow: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  foodRowExpanded: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  foodRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  foodSub: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  foodMacros: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  macroBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.badge,
  },
  macroBadgeText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  proteinBadge: {
    backgroundColor: Colors.primaryLight,
  },
  proteinBadgeText: {
    color: Colors.primary,
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCircleText: {
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  servingExpand: {
    marginTop: Spacing.sm,
  },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  servingValue: {
    ...Typography.metricSm,
    color: Colors.textPrimary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEdge: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  addCta: {
    backgroundColor: Colors.success,
    borderRadius: Radii.pill,
    padding: Spacing.base,
    marginTop: Spacing.base,
    alignItems: 'center',
  },
  addCtaText: {
    ...Typography.bodySemibold,
    color: '#fff',
  },
});
