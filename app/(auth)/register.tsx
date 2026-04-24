import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../../src/api/endpoints'
import { useAuthStore } from '../../src/store/auth.store'
import { colors, spacing, radius } from '../../src/lib/theme'

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'FARMER' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password) return Alert.alert('Error', 'Please fill in all required fields')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      await setAuth(data.data.user, data.data.tokens.accessToken, '')
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.error ?? 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
      </TouchableOpacity>

      <View style={s.header}>
        <View style={s.logoCircle}>
          <Ionicons name="leaf" size={26} color="#ffffff" />
        </View>
        <Text style={s.heading}>Create account</Text>
        <Text style={s.sub}>Start managing your farm smarter</Text>
      </View>

      <View style={s.card}>
        {[
          { k: 'name',     label: 'Full name *',      placeholder: 'John Kamau',       kb: 'default' as const },
          { k: 'phone',    label: 'Phone number *',   placeholder: '+254712345678',    kb: 'phone-pad' as const },
          { k: 'email',    label: 'Email (optional)', placeholder: 'john@example.com', kb: 'email-address' as const },
        ].map(({ k, label, placeholder, kb }) => (
          <View key={k} style={s.field}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              style={s.input}
              placeholder={placeholder}
              placeholderTextColor={colors.gray[400]}
              value={(form as any)[k]}
              onChangeText={f(k)}
              keyboardType={kb}
              autoCapitalize="none"
            />
          </View>
        ))}

        <View style={s.field}>
          <Text style={s.label}>I am a</Text>
          <View style={s.roleRow}>
            {['FARMER', 'BUYER', 'AGENT'].map(role => (
              <TouchableOpacity
                key={role}
                style={[s.roleBtn, form.role === role && s.roleBtnActive]}
                onPress={() => setForm(p => ({ ...p, role }))}>
                <Text style={[s.roleBtnText, form.role === role && s.roleBtnTextActive]}>
                  {role === 'FARMER' ? '🌾 Farmer' : role === 'BUYER' ? '🏪 Buyer' : '👤 Agent'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Password *</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, { flex: 1, borderWidth: 0 }]}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              placeholderTextColor={colors.gray[400]}
              value={form.password}
              onChangeText={f('password')}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 8 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={s.btnText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', marginTop: spacing.lg }} onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: colors.gray[500] }}>
            Already have an account? <Text style={{ color: colors.shamba[600], fontWeight: '700' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: spacing.xl, paddingTop: 60 },
  back: { marginBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.shamba[600], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heading: { fontSize: 24, fontWeight: '700', color: colors.gray[900] },
  sub: { fontSize: 14, color: colors.gray[500], marginTop: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: radius['2xl'], padding: spacing['2xl'] },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.md, fontSize: 15, color: colors.gray[900], backgroundColor: colors.gray[50] },
  pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, paddingLeft: spacing.md, backgroundColor: colors.gray[50] },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, paddingVertical: 10, alignItems: 'center' },
  roleBtnActive: { borderColor: colors.shamba[600], backgroundColor: colors.shamba[50] },
  roleBtnText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  roleBtnTextActive: { color: colors.shamba[700], fontWeight: '700' },
  btn: { backgroundColor: colors.shamba[600], borderRadius: radius.lg, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  btnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
})
