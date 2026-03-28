export const Colors = {
  primary: '#ec1329',
  primaryLight: 'rgba(236,19,41,0.12)',
  secondary: '#f4f0f1',
  background: '#ffffff',
  backgroundMuted: '#f8f7f8',
  surfaceBlur: 'rgba(255,255,255,0.85)',
  card: '#ffffff',
  textPrimary: '#18181b',
  textMuted: '#71717a',
  textLight: '#a1a1aa',
  border: '#e4e4e7',
  success: '#22c55e',
  calorieRing: '#bfdbfe',
  proteinRing: '#ec1329',
  ringTrack: '#f0eef0',
  swipeEdit: '#52525b',
  swipeDelete: '#ec1329',
};

export const Radii = {
  sm: 12,
  card: 20,
  pill: 32,
  input: 14,
  badge: 8,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: 'SpaceGrotesk_700Bold' },
  titleLarge: { fontSize: 24, lineHeight: 32, fontFamily: 'PlusJakartaSans_700Bold' },
  title: { fontSize: 20, lineHeight: 28, fontFamily: 'PlusJakartaSans_700Bold' },
  bodyLarge: { fontSize: 18, lineHeight: 26, fontFamily: 'PlusJakartaSans_500Medium' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'PlusJakartaSans_400Regular' },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontFamily: 'PlusJakartaSans_500Medium' },
  bodySemibold: { fontSize: 16, lineHeight: 24, fontFamily: 'PlusJakartaSans_600SemiBold' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' },
  label: { fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans_500Medium', letterSpacing: 0.5 },
  labelCaps: { fontSize: 11, lineHeight: 14, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' as const },
  metric: { fontSize: 28, lineHeight: 36, fontFamily: 'SpaceGrotesk_700Bold' },
  metricSm: { fontSize: 20, lineHeight: 28, fontFamily: 'SpaceGrotesk_600SemiBold' },
};

export const Shadow = {
  diffuse: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
};
