import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadow } from '../../constants/theme';

/** Map tab names to Ionicons. */
const TAB_ICONS: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
  home: { outline: 'sunny-outline', filled: 'sunny' },
  inventory: { outline: 'list-outline', filled: 'list' },
  insights: { outline: 'bar-chart-outline', filled: 'bar-chart' },
  settings: { outline: 'settings-outline', filled: 'settings' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: -2 },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.home.filled : TAB_ICONS.home.outline} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.inventory.filled : TAB_ICONS.inventory.outline} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.insights.filled : TAB_ICONS.insights.outline} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? TAB_ICONS.settings.filled : TAB_ICONS.settings.outline} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceBlur,
    borderTopWidth: 0,
    borderTopLeftRadius: Radii.pill,
    borderTopRightRadius: Radii.pill,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 82 : 64,
    ...Shadow.diffuse,
  },
});
