import { Stack } from 'expo-router';

/** Nested stack for the inventory tab — enables proper back navigation between sub-screens. */
export default function InventoryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
