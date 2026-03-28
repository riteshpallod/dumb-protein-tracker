import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';
import type { FoodLogEntry } from '../db/queries';

type Props = {
  entry: FoodLogEntry;
  onDelete: (id: number) => void;
};

const DELETE_THRESHOLD = -80;
const ICON_SIZE = 40;

/** Map food category to a background color for the avatar circle. */
const CATEGORY_COLORS: Record<string, string> = {
  'High Protein': '#ec1329',
  'Cheat Meal': '#f59e0b',
  Snacks: '#ec4899',
  Drinks: '#3b82f6',
  Other: '#71717a',
};

/** Swipeable food log row with swipe-to-delete. */
export default function FoodLogItem({ entry, onDelete }: Props) {
  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        runOnJS(confirmDelete)();
        translateX.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
      }
    });

  function confirmDelete() {
    Alert.alert('Remove entry?', `Remove "${entry.name}" from today's log?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(entry.id) },
    ]);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const initials = (entry.name ?? 'F').charAt(0).toUpperCase();
  const avatarColor = CATEGORY_COLORS[entry.category ?? 'Other'] ?? CATEGORY_COLORS.Other;

  return (
    <View style={styles.wrapper}>
      {/* Delete background */}
      <View style={styles.deleteBackground}>
        <Text style={styles.deleteText}>Remove</Text>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + '1A' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
            <Text style={styles.serving}>
              {entry.servings !== 1 ? `${entry.servings}× ` : ''}{entry.serving_label}
            </Text>
          </View>
          <View style={styles.macros}>
            <Text style={styles.kcal}>{entry.calories_total} kcal</Text>
            <Text style={styles.protein}>{Math.round(entry.protein_total)}g P</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.swipeDelete,
    borderRadius: Radii.card,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.lg,
  },
  deleteText: {
    color: '#fff',
    ...Typography.bodySemibold,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadow.card,
  },
  avatar: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.bodySemibold,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  serving: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  macros: {
    alignItems: 'flex-end',
  },
  kcal: {
    ...Typography.bodySemibold,
    color: Colors.textPrimary,
  },
  protein: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
