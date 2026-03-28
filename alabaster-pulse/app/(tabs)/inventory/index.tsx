import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../../../hooks/useDatabase';
import { getFoodItems, deleteFoodItem } from '../../../db/queries';
import type { FoodItem } from '../../../db/queries';
import InventoryCard from '../../../components/InventoryCard';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Shadow, Typography } from '../../../constants/theme';

const FILTERS = ['All', 'High Protein', 'Cheat Meal', 'Snacks', 'Drinks'];

/** Food inventory list with search, filter tabs, and swipe actions. */
export default function InventoryScreen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q = '') => {
    try {
      const db = getDb();
      let data = await getFoodItems(db, q);
      if (filter > 0) {
        const category = FILTERS[filter];
        data = data.filter((i) => i.category === category);
      }
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(search); }, [load, search]));

  async function handleDelete(id: number) {
    try {
      const db = getDb();
      await deleteFoodItem(db, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Food Inventory</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search meals..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={(t) => { setSearch(t); load(t); }}
          returnKeyType="search"
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === i && styles.filterTabActive]}
              onPress={() => setFilter(i)}
            >
              <Text style={[styles.filterText, filter === i && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(search)} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <InventoryCard
            item={item}
            onEdit={(i) => router.push(`/(tabs)/inventory/${i.id}`)}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items yet.</Text>
            <Text style={styles.emptySub}>Tap + to add your first food item.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/inventory/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.diffuse,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    height: 46,
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
  filterWrapper: {
    height: 40,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingLeft: Spacing.base,
    paddingRight: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
    height: 40,
  },
  filterTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.secondary,
  },
  filterTabActive: {
    backgroundColor: Colors.textPrimary,
  },
  filterText: {
    ...Typography.labelLarge,
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
