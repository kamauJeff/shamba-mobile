import { useColorScheme } from 'react-native';

export const palette = {
  green50: '#E1F5EE',
  green100: '#9FE1CB',
  green200: '#5DCAA5',
  green400: '#1D9E75',
  green600: '#0F6E56',
  green800: '#085041',
  green900: '#04342C',

  amber50: '#FAEEDA',
  amber400: '#BA7517',
  amber500: '#f5a623',

  red50: '#FCEBEB',
  red400: '#E24B4A',
  red600: '#A32D2D',

  blue50: '#E6F1FB',
  blue400: '#378ADD',

  gray50: '#F5F7F5',
  gray100: '#E8EDE8',
  gray200: '#C8CEC8',
  gray400: '#888780',
  gray600: '#4A4A48',
  gray800: '#1F2A1F',
  gray900: '#0F1A0F',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type Theme = typeof lightTheme;

export const lightTheme = {
  dark: false,

  colors: {
    // Backgrounds
    background: palette.gray50,
    surface: palette.white,
    surfaceElevated: palette.white,
    header: palette.green600,
    headerDeep: palette.green800,

    // Brand
    primary: palette.green400,
    primaryDark: palette.green600,
    primaryLight: palette.green50,

    // Text
    textPrimary: palette.gray800,
    textSecondary: palette.gray400,
    textOnPrimary: palette.white,
    textMuted: '#9AA09A',

    // Borders
    border: palette.gray100,
    borderStrong: palette.gray200,

    // Semantic
    success: palette.green400,
    successBg: palette.green50,
    successText: palette.green600,

    warning: palette.amber500,
    warningBg: '#FFF9E6',
    warningText: '#7a5a10',

    danger: palette.red400,
    dangerBg: palette.red50,
    dangerText: palette.red600,

    info: palette.blue400,
    infoBg: palette.blue50,

    // Nav
    navBg: palette.white,
    navActive: palette.green400,
    navInactive: palette.gray200,

    // Card
    cardBg: palette.white,
    cardBorder: palette.gray100,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  typography: {
    displayLg: { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.5 },
    displayMd: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
    displaySm: { fontSize: 18, fontWeight: '500' as const },
    headingMd: { fontSize: 16, fontWeight: '500' as const },
    headingSm: { fontSize: 14, fontWeight: '500' as const },
    bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    caption: { fontSize: 11, fontWeight: '400' as const },
    label: { fontSize: 12, fontWeight: '500' as const },
  },

  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

export const darkTheme: Theme = {
  ...lightTheme,
  dark: true,

  colors: {
    background: '#0D1A0D',
    surface: '#152015',
    surfaceElevated: '#1C2A1C',
    header: '#0A1A0A',
    headerDeep: '#071207',

    primary: palette.green400,
    primaryDark: palette.green200,
    primaryLight: '#0F2A1F',

    textPrimary: '#E8F0E8',
    textSecondary: '#8FA88F',
    textOnPrimary: palette.white,
    textMuted: '#5A7A5A',

    border: '#1E301E',
    borderStrong: '#2A402A',

    success: palette.green200,
    successBg: '#0A2A1A',
    successText: palette.green200,

    warning: palette.amber500,
    warningBg: '#2A1E00',
    warningText: '#E8C060',

    danger: '#F07070',
    dangerBg: '#2A0A0A',
    dangerText: '#F07070',

    info: '#60A8E8',
    infoBg: '#0A1A2A',

    navBg: '#0D1A0D',
    navActive: palette.green400,
    navInactive: '#3A503A',

    cardBg: '#152015',
    cardBorder: '#1E301E',
  },

  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
