import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { authApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { setToken, setRefreshToken, setUser } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Missing fields', 'Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(phone, password);
      const payload = res.data?.data ?? res.data;
      const token = payload.tokens?.accessToken || payload.accessToken || payload.token;
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
      const user = payload.user;
      if (!token) throw new Error('No token in login response');
      setToken(token);
      if (refreshToken) setRefreshToken(refreshToken);
      setUser(user);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Check your credentials.';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logoEmoji}>🌱</Text>
          <Text style={s.logoText}>Shamba</Text>
          <Text style={s.tagline}>From seed to sale</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in</Text>
          <Text style={s.cardSubtitle}>Welcome back, mkulima</Text>

          <View style={s.field}>
            <Text style={s.label}>Phone number</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+254712345678"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Text style={s.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.forgotWrap}>
            <Text style={s.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.registerBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={s.registerText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <View style={s.demoBox}>
          <Text style={s.demoTitle}>Demo credentials</Text>
          <Text style={s.demoRow}>Farmer: +254712345678 / Farmer@1234</Text>
          <Text style={s.demoRow}>Admin: +254700000001 / Admin@1234</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 28 },
    logoEmoji: { fontSize: 40, marginBottom: 4 },
    logoText: { fontSize: 32, fontWeight: '700', color: theme.colors.primary, letterSpacing: -1 },
    tagline: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    card: {
      backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.lg, padding: 22,
      borderWidth: 0.5, borderColor: theme.colors.cardBorder, ...theme.shadow.sm,
    },
    cardTitle: { fontSize: 22, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 22 },
    field: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: theme.colors.background, borderWidth: 0.5, borderColor: theme.colors.border,
      borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: theme.colors.textPrimary, marginBottom: 0,
    },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn: { padding: 10 },
    eyeText: { fontSize: 18 },
    forgotWrap: { alignItems: 'flex-end', marginBottom: 18 },
    forgot: { fontSize: 12, color: theme.colors.primary },
    submitBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
    dividerLine: { flex: 1, height: 0.5, backgroundColor: theme.colors.border },
    dividerText: { fontSize: 12, color: theme.colors.textMuted },
    registerBtn: { borderWidth: 0.5, borderColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    registerText: { color: theme.colors.primary, fontWeight: '500', fontSize: 14 },
    demoBox: { marginTop: 20, padding: 14, backgroundColor: theme.colors.infoBg, borderRadius: theme.radius.md, borderWidth: 0.5, borderColor: theme.colors.border },
    demoTitle: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6 },
    demoRow: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 18 },
  });
