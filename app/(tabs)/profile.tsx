import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, useColorScheme, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { farmerApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';
import { useLanguage } from '../../src/lib/LanguageContext';

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos',
  'Meru', 'Kirinyaga', 'Nyeri', 'Uasin Gishu', 'Trans Nzoia',
  'Kajiado', 'Nandi', 'Laikipia', 'Kakamega', 'Kericho', 'Bomet',
  'Siaya', 'Kisii', 'Migori', 'Homa Bay', 'Other',
];

function Avatar({ name, theme }: { name: string; theme: any }) {
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: '#fff', fontWeight: '600' }}>{initials}</Text>
    </View>
  );
}

function RowItem({ icon, label, value, onPress, danger, theme, right }: any) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border }}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: danger ? theme.colors.danger : theme.colors.textPrimary }}>{label}</Text>
      {value && !right && <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{value}</Text>}
      {right && right}
      {onPress && !right && <Text style={{ fontSize: 16, color: theme.colors.textMuted }}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const { user, updateUser, logout } = useAuthStore();
  const { t, language, toggleLanguage } = useLanguage();

  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    county: user?.county || '',
    farmSize: user?.farmSize?.toString() || '',
    primaryCrop: '',
    subCounty: '',
  });
  const [countyPicker, setCountyPicker] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => farmerApi.getProfile().then((r) => r.data?.data),
  });

  const { data: creditData } = useQuery({
    queryKey: ['credit'],
    queryFn: () => farmerApi.getCreditScore().then((r) => r.data?.data),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      farmerApi.upsertProfile({
        county: form.county || user?.county || 'Nairobi',
        subCounty: form.subCounty || profileData?.subCounty || 'Central',
        farmSizeAcres: parseFloat(form.farmSize) || 1,
        primaryCrop: form.primaryCrop || profileData?.primaryCrop || 'Maize',
        secondaryCrops: profileData?.secondaryCrops || [],
        soilType: profileData?.soilType || 'LOAM',
        irrigationType: profileData?.irrigationType || 'NONE',
        yearsFarming: profileData?.yearsFarming || 1,
        hasStorage: profileData?.hasStorage || false,
      }),
    onSuccess: () => {
      updateUser({ county: form.county, farmSize: parseFloat(form.farmSize) || undefined });
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditModal(false);
      Alert.alert(t.profileUpdated, t.profileUpdatedMsg);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.updateFailed;
      Alert.alert(t.error, msg);
    },
  });

  const handleLogout = () => {
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
        style: 'destructive',
        onPress: () => {
          logout();
          queryClient.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const creditScore = creditData?.score ?? user?.creditScore ?? 0;
  const creditTier =
    creditScore >= 750 ? t.excellent :
    creditScore >= 670 ? t.good :
    creditScore >= 580 ? t.fair : t.poor;

  const walletBalance = profileData?.wallet?.balanceKes ?? 0;
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Avatar name={user?.name || 'JK'} theme={theme} />
          <TouchableOpacity style={s.editBtn} onPress={() => {
            setForm({
              name: user?.name || '',
              county: user?.county || profileData?.county || '',
              farmSize: profileData?.farmSizeAcres?.toString() || user?.farmSize?.toString() || '',
              primaryCrop: profileData?.primaryCrop || '',
              subCounty: profileData?.subCounty || '',
            });
            setEditModal(true);
          }}>
            <Text style={s.editBtnText}>✏️ {t.editProfile}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.userName}>{user?.name || t.farmer}</Text>
        <Text style={s.userRole}>
          {user?.role === 'FARMER' ? `🌾 ${t.farmer}` : `🛒 ${t.buyer}`} · {user?.county || profileData?.county || 'Kenya'}
        </Text>
        <Text style={s.userPhone}>{user?.phone}</Text>
        <View style={s.scorePill}>
          <Text style={s.scorePillText}>⭐ {t.creditScore}: {creditScore} ({creditTier})</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet summary */}
        <View style={s.walletRow}>
          <View style={s.walletItem}>
            <Text style={s.walletLabel}>{t.walletBalance}</Text>
            <Text style={s.walletValue}>KES {walletBalance.toLocaleString()}</Text>
          </View>
          <View style={[s.walletItem, { borderLeftWidth: 0.5, borderLeftColor: theme.colors.border }]}>
            <Text style={s.walletLabel}>{t.memberSince}</Text>
            <Text style={s.walletValue}>Jan 2024</Text>
          </View>
        </View>

        {/* Farm info */}
        <Text style={s.sectionTitle}>{t.farmDetails.toUpperCase()}</Text>
        <View style={s.section}>
          <RowItem icon="📍" label={t.county} value={profileData?.county || user?.county || '—'} theme={theme} />
          <RowItem icon="🌿" label={t.farmSize} value={profileData?.farmSizeAcres ? `${profileData.farmSizeAcres} acres` : '—'} theme={theme} />
          <RowItem icon="🌱" label={t.primaryCrop} value={profileData?.primaryCrop || '—'} theme={theme} />
          <RowItem icon="🛡️" label={t.insuranceStatus} value={`${t.active} · ${t.crops}`} theme={theme} />
          <RowItem icon="💳" label={t.shambaPay} value={t.linked} theme={theme} />
        </View>

        {/* Settings */}
        <Text style={s.sectionTitle}>{t.settings.toUpperCase()}</Text>
        <View style={s.section}>
          <RowItem
            icon="🌙"
            label={`${t.appearance}: ${colorScheme === 'dark' ? t.dark : t.light}`}
            theme={theme}
            value={t.system}
          />
          <RowItem
            icon="🔔"
            label={t.notifications}
            theme={theme}
            value={t.on}
            onPress={() => Alert.alert(t.notifications, t.notificationsMsg)}
          />
          {/* Language toggle */}
          <RowItem
            icon="🌍"
            label={t.language}
            theme={theme}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 12, color: language === 'en' ? theme.colors.textMuted : theme.colors.primary, fontWeight: language === 'sw' ? '700' : '400' }}>SW</Text>
                <Switch
                  value={language === 'en'}
                  onValueChange={toggleLanguage}
                  trackColor={{ false: theme.colors.primary, true: theme.colors.primary }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <Text style={{ fontSize: 12, color: language === 'sw' ? theme.colors.textMuted : theme.colors.primary, fontWeight: language === 'en' ? '700' : '400' }}>EN</Text>
              </View>
            }
          />
        </View>

        {/* Support */}
        <Text style={s.sectionTitle}>{t.support.toUpperCase()}</Text>
        <View style={s.section}>
          <RowItem icon="❓" label={t.helpFaq} theme={theme}
            onPress={() => Alert.alert(t.helpFaq, 'shamba.africa/help\n+254 700 000 000')} />
          <RowItem icon="📞" label={t.contactSupport} theme={theme}
            onPress={() => Alert.alert(t.contactSupport, 'support@shamba.africa\n+254 700 000 000')} />
          <RowItem icon="📋" label={t.terms} theme={theme}
            onPress={() => Alert.alert(t.terms, 'shamba.africa/terms')} />
          <RowItem icon="🔒" label={t.privacy} theme={theme}
            onPress={() => Alert.alert(t.privacy, 'shamba.africa/privacy')} />
        </View>

        <View style={[s.section, { marginTop: 8 }]}>
          <RowItem icon="🚪" label={t.logout} theme={theme} onPress={handleLogout} danger />
        </View>

        <Text style={s.versionText}>{t.version}</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={[s.modalCard, { margin: 20 }]}>
              <Text style={s.modalTitle}>{t.editProfile}</Text>

              <Text style={s.label}>{t.name}</Text>
              <TextInput
                style={s.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder={t.name}
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
              />

              <Text style={s.label}>{t.county}</Text>
              <TouchableOpacity
                style={[s.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setCountyPicker(!countyPicker)}
              >
                <Text style={{ color: form.county ? theme.colors.textPrimary : theme.colors.textMuted, fontSize: 15 }}>
                  {form.county || t.selectCounty}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>▼</Text>
              </TouchableOpacity>
              {countyPicker && (
                <View style={s.dropdown}>
                  {COUNTIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.dropdownItem, form.county === c && { backgroundColor: theme.colors.primaryLight }]}
                      onPress={() => { setForm({ ...form, county: c }); setCountyPicker(false); }}
                    >
                      <Text style={{ fontSize: 14, color: form.county === c ? theme.colors.primary : theme.colors.textPrimary }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>{t.primaryCrop}</Text>
              <TextInput
                style={s.input}
                value={form.primaryCrop}
                onChangeText={(v) => setForm({ ...form, primaryCrop: v })}
                placeholder="e.g. Maize, Tomatoes, Tea"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={s.label}>{t.farmSize}</Text>
              <TextInput
                style={s.input}
                value={form.farmSize}
                onChangeText={(v) => setForm({ ...form, farmSize: v })}
                placeholder="e.g. 2.5"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
              />

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditModal(false)}>
                  <Text style={s.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.saveBtn}
                  onPress={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.saveBtnText}>{t.save}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { backgroundColor: theme.colors.header, padding: 20, paddingTop: 52, paddingBottom: 24 },
    editBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    editBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    userName: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 12, letterSpacing: -0.3 },
    userRole: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 },
    userPhone: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    scorePill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
    scorePillText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    walletRow: { flexDirection: 'row', backgroundColor: theme.colors.cardBg, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
    walletItem: { flex: 1, padding: 16 },
    walletLabel: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 },
    walletValue: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
    sectionTitle: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary, marginHorizontal: 16, marginTop: 18, marginBottom: 6, letterSpacing: 0.8 },
    section: { backgroundColor: theme.colors.cardBg, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: theme.colors.border },
    versionText: { textAlign: 'center', fontSize: 11, color: theme.colors.textMuted, marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 18 },
    label: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: theme.colors.background, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 14 },
    dropdown: { borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.sm, backgroundColor: theme.colors.cardBg, marginBottom: 14, maxHeight: 200 },
    dropdownItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, color: theme.colors.textSecondary },
    saveBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
