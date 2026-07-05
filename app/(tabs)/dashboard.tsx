import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { farmerApi, marketApi, weatherApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';
import { useLanguage } from '../../src/lib/LanguageContext';

function ScreenHeader({ name, theme, t }: { name: string; theme: any; t: any }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.greetingMorning : hour < 17 ? t.greetingAfternoon : t.greetingEvening;

  return (
    <View style={{ backgroundColor: theme.colors.header, padding: 16, paddingTop: 52, paddingBottom: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{greeting}</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 2 }}>{name} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthStore();

  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => farmerApi.getDashboard().then((r) => r.data?.data),
  });

  const { data: creditData, refetch: refetchCredit } = useQuery({
    queryKey: ['credit'],
    queryFn: () => farmerApi.getCreditScore().then((r) => r.data?.data),
  });

  const { data: weatherData, refetch: refetchWeather } = useQuery({
    queryKey: ['weather'],
    queryFn: () => weatherApi.getMyFarmWeather().then((r) => r.data?.data).catch(() => null),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['prices'],
    queryFn: () => marketApi.getPrices({ pageSize: 5 }).then((r) => r.data?.data),
  });

  const onRefresh = () => {
    refetchDash();
    refetchCredit();
    refetchWeather();
  };

  const balance = dashData?.wallet?.balanceKes ?? 0;
  const activeLoans = Array.isArray(dashData?.loans) ? dashData.loans.filter((l: any) => l.status === 'ACTIVE') : [];
  const creditScore = creditData?.score ?? user?.creditScore ?? 680;
  const creditRating = creditData?.rating ?? 'GOOD';
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <ScreenHeader name={user?.name?.split(' ')[0] || t.farmer} theme={theme} t={t} />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Wallet card */}
        <View style={s.walletCard}>
          <Text style={s.walletLabel}>{t.shambaWallet}</Text>
          {dashLoading
            ? <ActivityIndicator color="#fff" style={{ marginVertical: 6 }} />
            : <Text style={s.walletAmount}>KES {balance.toLocaleString()}</Text>
          }
          <View style={s.walletMeta}>
            <Text style={s.walletMetaText}>{user?.phone}</Text>
            <Text style={s.walletMetaText}>{user?.role === 'FARMER' ? `🌾 ${t.farmer}` : `🛒 ${t.buyer}`}</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.sectionRow}>
          {[
            { icon: '💳', label: t.loans, onPress: () => router.push('/(tabs)/loans') },
            { icon: '🛒', label: t.market, onPress: () => router.push('/(tabs)/market') },
            { icon: '👥', label: t.groups, onPress: () => router.push('/(tabs)/groups') },
            { icon: '👤', label: t.profile, onPress: () => router.push('/(tabs)/profile') },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={s.qaCard} onPress={a.onPress} activeOpacity={0.7}>
              <Text style={s.qaIcon}>{a.icon}</Text>
              <Text style={s.qaLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>{t.summary}</Text>
        <View style={s.statsGrid}>
          <StatCard theme={theme} label={t.creditScore} value={creditScore.toString()} sub={creditRating} subColor={theme.colors.success} />
          <StatCard theme={theme} label={t.activeLoans} value={activeLoans.length.toString()} sub={activeLoans.length > 0 ? t.hasDebt : t.noDebt} subColor={activeLoans.length > 0 ? theme.colors.warning : theme.colors.success} />
          <StatCard theme={theme} label={t.insuranceStatus} value={dashData?.insurance?.length > 0 ? t.active : t.none} sub={t.crops} subColor={theme.colors.success} />
          <StatCard theme={theme} label={t.groups} value={dashData?.groups?.length?.toString() ?? '0'} sub={t.joined} subColor={theme.colors.textSecondary} />
        </View>

        {/* Weather */}
        <View style={s.weatherCard}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>⛅</Text>
          <View>
            <Text style={s.weatherTemp}>
              {weatherData?.current?.temp ? `${Math.round(weatherData.current.temp)}°C` : '22°C'}
            </Text>
            <Text style={s.weatherDesc}>
              {user?.county || t.kenyaFallback} · {weatherData?.current?.description || t.weatherGood}
            </Text>
          </View>
        </View>

        {/* Crop prices strip */}
        {pricesData?.items?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{t.pricesToday}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingBottom: 8 }}>
              {pricesData.items.slice(0, 6).map((p: any) => (
                <View key={p.id} style={{ backgroundColor: theme.colors.cardBg, borderRadius: 10, padding: 10, minWidth: 100, borderWidth: 0.5, borderColor: theme.colors.cardBorder }}>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{p.crop}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginTop: 2 }}>KES {p.priceKes}</Text>
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>/{p.unit}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Active loan alert */}
        {activeLoans.length > 0 && (
          <TouchableOpacity style={s.loanAlert} onPress={() => router.push('/(tabs)/loans')}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>⚠️</Text>
            <Text style={s.loanAlertText}>
              {t.activeLoanPrefix} <Text style={{ fontWeight: '600' }}>KES {activeLoans[0]?.principalKes?.toLocaleString() || '0'}</Text> {t.activeLoanSuffix}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ theme, label, value, sub, subColor }: any) {
  return (
    <View style={{ flex: 1, minWidth: '45%', backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 13, borderWidth: 0.5, borderColor: theme.colors.cardBorder }}>
      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    walletCard: { margin: 14, borderRadius: theme.radius.lg, backgroundColor: theme.colors.primary, padding: 20 },
    walletLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
    walletAmount: { color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
    walletMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    walletMetaText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
    sectionRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginBottom: 16 },
    qaCard: { flex: 1, backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    qaIcon: { fontSize: 22, marginBottom: 4 },
    qaLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '500' },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginHorizontal: 14, marginBottom: 8 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 14, marginBottom: 14 },
    weatherCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 14, marginHorizontal: 14, marginBottom: 12, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    weatherTemp: { fontSize: 22, fontWeight: '600', color: theme.colors.textPrimary },
    weatherDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    loanAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.warningBg, borderRadius: theme.radius.md, padding: 13, marginHorizontal: 14, marginBottom: 8, borderWidth: 0.5, borderColor: theme.colors.border },
    loanAlertText: { fontSize: 13, color: theme.colors.warningText, flex: 1 },
  });