import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { getDb } from '../../../hooks/useDatabase';
import { insertFoodItem } from '../../../db/queries';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

const CATEGORIES = ['High Protein', 'Cheat Meal', 'Snacks', 'Drinks'];

/** Add new food item to inventory. */
export default function AddInventoryScreen() {
  const [name, setName] = useState('');
  const [servingLabel, setServingLabel] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState('High Protein');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !servingLabel.trim()) {
      Alert.alert('Missing fields', 'Please enter a name and serving size.');
      return;
    }
    const prot = parseFloat(proteinGrams);
    const cal = parseInt(calories, 10);
    const weight = parseFloat(weightGrams);
    if (isNaN(prot) || isNaN(cal) || isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid values', 'Please enter valid numbers for weight, protein, and calories.');
      return;
    }
    setSaving(true);
    try {
      const db = getDb();
      await insertFoodItem(db, {
        name: name.trim(),
        serving_label: servingLabel.trim(),
        weight_grams: weight,
        protein_grams: prot,
        calories: cal,
        category,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
                <Text style={styles.cancel}>Cancel</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.title}>Add Item</Text>
            <View style={{ width: 70 }} />
          </View>

          {/* Name */}
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Grilled Chicken Breast"
            placeholderTextColor={Colors.textLight}
          />

          {/* Serving Size */}
          <Text style={styles.fieldLabel}>SERVING SIZE</Text>
          <TextInput
            style={styles.fieldInput}
            value={servingLabel}
            onChangeText={setServingLabel}
            placeholder="e.g. 1 breast (172g)"
            placeholderTextColor={Colors.textLight}
          />

          {/* Weight */}
          <Text style={styles.fieldLabel}>WEIGHT (G)</Text>
          <TextInput
            style={styles.fieldInput}
            value={weightGrams}
            onChangeText={setWeightGrams}
            placeholder="172"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />

          {/* Combined protein + calories card */}
          <View style={styles.macroCard}>
            {/* Protein section */}
            <View style={styles.macroSection}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill={Colors.primary} />
                  </Svg>
                </View>
                <Text style={styles.macroLabel}>PROTEIN</Text>
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={[styles.macroInput, { color: Colors.primary }]}
                  value={proteinGrams}
                  onChangeText={setProteinGrams}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                />
                <Text style={[styles.macroUnit, { color: Colors.primary }]}>g</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 32 }}
                minimumValue={0}
                maximumValue={200}
                step={1}
                value={parseFloat(proteinGrams) || 0}
                onValueChange={(v) => setProteinGrams(String(Math.round(v)))}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
            </View>

            <View style={styles.macroDivider} />

            {/* Calories section */}
            <View style={styles.macroSection}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f59e0b" />
                  </Svg>
                </View>
                <Text style={[styles.macroLabel, { color: Colors.textMuted }]}>CALORIES</Text>
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={[styles.macroInput, { color: Colors.textPrimary }]}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                />
                <Text style={[styles.macroUnit, { color: Colors.textMuted }]}>kcal</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 32 }}
                minimumValue={0}
                maximumValue={1500}
                step={5}
                value={parseInt(calories, 10) || 0}
                onValueChange={(v) => setCalories(String(Math.round(v)))}
                minimumTrackTintColor="#f59e0b"
                maximumTrackTintColor={Colors.border}
                thumbTintColor="#f59e0b"
              />
            </View>
          </View>

          {/* Category Selector */}
          <TouchableOpacity style={styles.categorySelector} onPress={() => setCategoryOpen(!categoryOpen)} activeOpacity={0.7}>
            <Text style={styles.categorySelectorLabel}>Category</Text>
            <View style={styles.categorySelectorRight}>
              <Text style={styles.categorySelectorValue}>{category}</Text>
              <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {categoryOpen && (
            <View style={styles.categoryDropdown}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryOption, category === c && styles.categoryOptionActive]}
                  onPress={() => { setCategory(c); setCategoryOpen(false); }}
                >
                  <Text style={[styles.categoryOptionText, category === c && styles.categoryOptionTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Note */}
          <Text style={styles.fdaNote}>
            Nutritional values are calculated based on the selected weight and standard FDA data.
          </Text>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.saveBtnText}>Add Item</Text>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                </View>
            }
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>THIS ITEM WILL BE SAVED TO YOUR LOCAL LOG</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  cancel: { ...Typography.bodyMedium, color: Colors.textMuted },
  title: { ...Typography.title, color: Colors.textPrimary },
  fieldLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.base,
  },
  fieldInput: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  macroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginTop: Spacing.lg,
    ...Shadow.card,
  },
  macroSection: {
    paddingVertical: Spacing.sm,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroLabel: {
    ...Typography.labelCaps,
    color: Colors.primary,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  macroInput: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk_700Bold',
    minWidth: 60,
    paddingVertical: 0,
  },
  macroUnit: {
    ...Typography.bodyLarge,
    paddingBottom: 2,
  },
  macroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    marginTop: Spacing.lg,
    ...Shadow.card,
  },
  categorySelectorLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  categorySelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categorySelectorValue: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  categorySelectorChevron: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  categoryDropdown: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    ...Shadow.card,
  },
  categoryOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.sm,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  categoryOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  categoryOptionTextActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  fdaNote: {
    ...Typography.label,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.diffuse,
  },
  saveBtnText: { ...Typography.bodySemibold, color: '#fff', fontSize: 17 },
  footerNote: {
    ...Typography.labelCaps,
    color: Colors.textLight,
    textAlign: 'center',
    fontSize: 10,
  },
});
