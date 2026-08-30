import colors from '@/constants/colors';

export const typography = {
  display: 34,
  title: 24,
  section: 18,
  body: 15,
  caption: 12,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type AppColors = typeof colors.light;