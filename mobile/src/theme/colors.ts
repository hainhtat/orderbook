export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  danger: '#DC2626',
  dangerSurface: '#FEF2F2',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  danger: '#F87171',
  dangerSurface: '#450A0A',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
};

export type ThemeColors = typeof lightColors;

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(preference: ThemePreference, systemScheme: 'light' | 'dark' | null): ResolvedTheme {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function getColors(theme: ResolvedTheme): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}
