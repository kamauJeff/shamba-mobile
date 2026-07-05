import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { useTheme } from '../src/lib/theme';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login');
    }, 1800);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.header }]}>
      <View style={styles.logoWrap}>
        <View style={[styles.logoIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>
        <Text style={styles.logoText}>Shamba</Text>
        <Text style={styles.tagline}>From seed to sale</Text>
      </View>
      <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 48 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
});
