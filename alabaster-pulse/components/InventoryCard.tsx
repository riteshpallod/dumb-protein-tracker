import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../constants/theme';
import type { FoodItem } from '../db/queries';

type Props = {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (id: number) => void;
};

/** Get protein badge color based on grams: green >15, yellow 5-15, red <5. */
function getProteinColor(grams: number): { bg: string; text: string } {
  if (grams > 15) return { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' };
  if (grams >= 5) return { bg: 'rgba(245,158,11,0.12)', text: '#d97706' };
  return { bg: 'rgba(236,19,41,0.1)', text: Colors.primary };
}

/** Get calorie badge color: red if >500, else based on protein/calorie ratio. */
function getCalorieColor(calories: number, protein: number): { bg: string; text: string } {
  if (calories > 500) return { bg: 'rgba(236,19,41,0.1)', text: Colors.primary };
  if (calories <= 0) return { bg: 'rgba(113,113,122,0.1)', text: Colors.textMuted };
  const ratio = (protein * 4) / calories; // protein kcal / total kcal
  if (ratio > 0.15) return { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' };
  if (ratio >= 0.10) return { bg: 'rgba(245,158,11,0.12)', text: '#d97706' };
  return { bg: 'rgba(236,19,41,0.1)', text: Colors.primary };
}

/** Swipeable inventory card — swipe left to reveal edit/delete actions. */
export default function InventoryCard({ item, onEdit, onDelete }: Props) {
  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.max(-140, Math.min(0, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -60) {
        translateX.value = withSpring(-140);
      } else {
        translateX.value = withSpring(0);
      }
    });

  function handleDelete() {
    Alert.alert('Delete item?', `"${item.name}" will be removed from inventory and all log entries.`, [
      { text: 'Cancel', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(item.id) },
    ]);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Action buttons revealed on swipe */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => { translateX.value = withSpring(0); onEdit?.(item); }}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.serving_label}, {item.weight_grams}g • {item.calories} kcal
            </Text>
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getProteinColor(item.protein_grams).bg }]}>
              <Text style={[styles.badgeText, { color: getProteinColor(item.protein_grams).text }]}>{item.protein_grams}g P</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getCalorieColor(item.calories, item.protein_grams).bg }]}>
              <Text style={[styles.badgeText, { color: getCalorieColor(item.calories, item.protein_grams).text }]}>{item.calories} kcal</Text>
            </View>
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
  actions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: Radii.card,
  },
  actionBtn: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: Colors.swipeEdit,
  },
  deleteBtn: {
    backgroundColor: Colors.swipeDelete,
    borderTopRightRadius: Radii.card,
    borderBottomRightRadius: Radii.card,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  sub: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 3,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.badge,
  },
  badgeText: {
    ...Typography.label,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
