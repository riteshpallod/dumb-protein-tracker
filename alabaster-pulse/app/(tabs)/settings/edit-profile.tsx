import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getDb } from '../../../hooks/useDatabase';
import { getSettings, updateSettings, getAllWeightEntries } from '../../../db/queries';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

type GoalType = 'shred' | 'maintain' | 'bulk';

const GOALS: { key: GoalType; label: string; desc: string; color: string }[] = [
  { key: 'shred',    label: 'Shred',    desc: 'Fat loss focused calorie deficit',    color: Colors.primary },
  { key: 'maintain', label: 'Maintain', desc: 'Stability and body recomposition',    color: '#22c55e' },
  { key: 'bulk',     label: 'Bulk',     desc: 'Muscle growth with surplus intake',   color: '#6366f1' },
];

/** Goal type icon SVGs. */
function GoalIcon({ type, active }: { type: GoalType; active: boolean }) {
  const color = active ? Colors.primary : Colors.textMuted;
  const bgColor = active ? Colors.primaryLight : Colors.secondary;
  return (
    <View style={[styles.goalIconCircle, { backgroundColor: bgColor }]}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        {type === 'shred' && (
          <Path d="M12 23c-4.97 0-9-3.58-9-8 0-4 3.5-7.5 4-11 .5 4 3 6 5 7.5C13.5 10 14 8 14 6c3 3 5 6.5 5 9 0 4.42-3.13 8-7 8z" fill={color} />
        )}
        {type === 'maintain' && (
          <>
            <Path d="M12 3v18" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M3 12h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M5 7l7-4 7 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {type === 'bulk' && (
          <>
            <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1="4" y1="8" x2="4" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1="20" y1="8" x2="20" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1="7" y1="9" x2="7" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1="17" y1="9" x2="17" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
          </>
        )}
      </Svg>
    </View>
  );
}

/** Edit profile screen — name, height, weight, goal type. */
export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75.0);
  const [goalType, setGoalType] = useState<GoalType>('maintain');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const db = getDb();
        const [s, weightEntries] = await Promise.all([getSettings(db), getAllWeightEntries(db)]);
        setName(s.name ?? '');
        setHeight(s.height_cm ? Math.round(s.height_cm) : 175);
        // Prefer latest tracked weight over settings weight
        const latestWeight = weightEntries[0]?.weight_kg ?? s.weight_kg ?? 75;
        setWeight(latestWeight);
        setGoalType(s.goal_type);
        setAvatarUri(s.avatar_uri ?? null);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    try {
      const db = getDb();
      await updateSettings(db, {
        name: name.trim() || null,
        height_cm: height,
        weight_kg: weight,
        goal_type: goalType,
        avatar_uri: avatarUri,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.');
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.headerSave}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar section */}
          <TouchableOpacity style={styles.avatarSection} onPress={handlePickPhoto} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
            <Text style={styles.avatarLabel}>TAP TO CHANGE PHOTO</Text>
          </TouchableOpacity>

          {/* Full Name */}
          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.textLight}
          />

          {/* Height slider */}
          <View style={styles.sliderCard}>
            <View style={styles.sliderHeader}>
              <Text style={styles.fieldLabel}>HEIGHT</Text>
              <Text style={styles.sliderValue}>{height} <Text style={styles.sliderUnit}>cm</Text></Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={250}
              step={1}
              value={height}
              onValueChange={(v) => setHeight(Math.round(v))}
              minimumTrackTintColor={Colors.textPrimary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.textPrimary}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>100 cm</Text>
              <Text style={styles.sliderRangeText}>250 cm</Text>
            </View>
          </View>

          {/* Weight slider */}
          <View style={styles.sliderCard}>
            <View style={styles.sliderHeader}>
              <Text style={styles.fieldLabel}>WEIGHT</Text>
              <Text style={styles.sliderValue}>{weight.toFixed(1)} <Text style={styles.sliderUnit}>kg</Text></Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={250}
              step={0.1}
              value={weight}
              onValueChange={(v) => setWeight(+v.toFixed(1))}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>30 kg</Text>
              <Text style={styles.sliderRangeText}>250 kg</Text>
            </View>
          </View>

          {/* Goal Type — stacked rows */}
          <Text style={styles.sectionLabel}>CURRENT GOAL</Text>
          {GOALS.map((g) => {
            const active = goalType === g.key;
            return (
              <Pressable
                key={g.key}
                style={[
                  styles.goalRow,
                  { borderColor: active ? g.color : 'transparent', backgroundColor: active ? g.color + '15' : Colors.card },
                ]}
                onPress={() => setGoalType(g.key)}
                android_ripple={null}
              >
                <GoalIcon type={g.key} active={active} />
                <View style={styles.goalTextContainer}>
                  <Text style={[styles.goalLabel, active && { color: g.color, fontFamily: 'PlusJakartaSans_700Bold' }]}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </View>
                <View style={[styles.radio, active && { borderColor: g.color }]}>
                  {active && <View style={[styles.radioInner, { backgroundColor: g.color }]} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundMuted },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  headerBack: { ...Typography.title, color: Colors.textPrimary },
  headerTitle: { ...Typography.title, color: Colors.textPrimary },
  headerSave: { ...Typography.bodyMedium, color: Colors.primary },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: Colors.textMuted,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
  },
  fieldLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  fieldInput: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  sliderCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  sliderUnit: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 4,
  },
  sliderRangeText: {
    ...Typography.label,
    color: Colors.textLight,
    fontSize: 10,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  goalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.card,
    borderWidth: 1.5,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.card,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  goalDesc: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
