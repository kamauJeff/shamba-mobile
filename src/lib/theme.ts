import { Platform } from 'react-native'

export const colors = {
  shamba: {
    50:  '#f0fdf6',
    100: '#dcfcec',
    200: '#bbf7d8',
    400: '#4ade82',
    500: '#22c566',
    600: '#15a552',
    700: '#138544',
    800: '#146638',
    900: '#13522e',
  },
  amber: {
    100: '#fef3c7',
    400: '#fbbf24',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  red: {
    100: '#fee2e2',
    400: '#f87171',
    600: '#dc2626',
    800: '#991b1b',
  },
  blue: {
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    800: '#1e40af',
  },
  gray: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
}

export const spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
}

export const radius = {
  sm:    6,
  md:    10,
  lg:    14,
  xl:    18,
  '2xl': 24,
  full:  9999,
}

export const shadow = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 16 },
    android: { elevation: 8 },
  }),
}
