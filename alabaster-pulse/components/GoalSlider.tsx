import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Radii, Spacing, Typography } from '../constants/theme';

type Props = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  presets: number[];
  onChange: (v: number) => void;
};

/** Reusable slider for goal-editing screens with preset quick-select buttons. */
export default function GoalSlider({ label, unit, value, min, max, step, presets, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value.toLocaleString()} {unit}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.primary}
      />
      <View style={styles.presets}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, value === p && styles.presetActive]}
            onPress={() => onChange(p)}
          >
            <Text style={[styles.presetText, value === p && styles.presetTextActive]}>
              {p.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: Radii.card,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
  },
  value: {
    ...Typography.metric,
    color: Colors.textPrimary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  preset: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.pill,
    backgroundColor: Colors.secondary,
  },
  presetActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    ...Typography.labelLarge,
    color: Colors.textMuted,
  },
  presetTextActive: {
    color: '#fff',
  },
});
