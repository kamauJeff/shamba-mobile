import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { authApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos',
  'Meru', 'Kakamega', 'Kilifi', 'Kirinyaga', 'Nyeri', 'Murang\'a',
  'Uasin Gishu', 'Trans Nzoia', 'Bungoma', 'Kajiado', 'Bomet',
  'Kericho', 'Nandi', 'Laikipia', 'Other',
];

export default function RegisterScreen() {
  const theme = useTheme();
  const { setToken, setRefreshToken, setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [county, setCounty] = useState('');
  const [showCounties, setShowCounties] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ name, phone, password, role, county });
      const payload = res.data?.data ?? res.data;
      const token = payload.tokens?.accessToken || payload.accessToken || payload.token;
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
      const user = payload.user;
      if (!token) throw new Error('No token in register response');
      setToken(token);
      if (refreshToken) setRefreshToken(refreshToken);
      setUser(user);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Join thousands of farmers across East Africa</Text>

        <View style={s.roleRow}>
          {(['FARMER', 'BUYER'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.roleBtn, role === r && s.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[s.roleText, role === r && s.roleTextActive]}>
                {r === 'FARMER' ? '🌾 Farmer' : '🛒 Buyer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.field}>
          <Text style={s.label}>Full name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="John Kamau"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Phone number</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+254712345678"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>County</Text>
          <TouchableOpacity
            style={[s.input, s.selectRow]}
            onPress={() => setShowCounties(!showCounties)}
          >
            <Text style={county ? { color: theme.colors.textPrimary } : { color: theme.colors.textMuted }}>
              {county || 'Select your county'}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>{showCounties ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCounties && (
            <View style={s.dropdown}>
              {COUNTIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.dropdownItem, county === c && s.dropdownItemActive]}
                  onPress={() => { setCounty(c); setShowCounties(false); }}
                >
                  <Text style={[s.dropdownText, county === c && { color: theme.colors.primary }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.loginLink} onPress={() => router.push('/(auth)/login')}>
          <Text style={s.loginLinkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    container: { flexGrow: 1, padding: 20 },
    back: { marginTop: 10, marginBottom: 20 },
    backText: { fontSize: 15, color: theme.colors.primary },
    title: { fontSize: 26, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 22 },
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    roleBtn: {
      flex: 1, paddingVertical: 12, borderRadius: theme.radius.md,
      borderWidth: 0.5, borderColor: theme.colors.border,
      alignItems: 'center', backgroundColor: theme.colors.cardBg,
    },
    roleBtnActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
    roleText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
    roleTextActive: { color: theme.colors.primary },
    field: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: theme.colors.cardBg, borderWidth: 0.5, borderColor: theme.colors.border,
      borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: theme.colors.textPrimary,
    },
    selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdown: {
      borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.cardBg, marginTop: 4, maxHeight: 200, overflow: 'scroll',
    },
    dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
    dropdownItemActive: { backgroundColor: theme.colors.primaryLight },
    dropdownText: { fontSize: 14, color: theme.colors.textPrimary },
    submitBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    loginLink: { alignItems: 'center', marginTop: 16 },
    loginLinkText: { fontSize: 13, color: theme.colors.primary },
  });
