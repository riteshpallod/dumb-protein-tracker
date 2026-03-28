import { Stack } from 'expo-router';

/** Nested stack for the settings tab — enables proper back navigation between sub-screens. */
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
