import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboard, useWallet, usePrices } from '../../src/hooks/useApi'
import { useAuthStore } from '../../src/store/auth.store'
import { colors, spacing, radius, shadow } from '../../src/lib/theme'
import { formatKes } from '../../src/lib/utils'

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent: string }) {
  return (
    <View style={[sc.card, shadow.sm as any]}>
      <View style={[sc.icon, { backgroundColor: accent + '20' }]}>
        <Ionicons name={icon as any} size={20} color={accent} />
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sub ? <Text style={sc.sub}>{sub}</Text> : null}
    </View>
  )
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#ffffff', borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: 4 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '800', color: colors.gray[900] },
  label: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  sub: { fontSize: 10, color: colors.gray[400], marginTop: 1 },
})

export default function DashboardScreen() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const { data } = useDashboard()
  const { data: walletData } = useWallet()
  const { data: pricesData } = usePrices({ pageSize: 5 })

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  async function onRefresh() {
    setRefreshing(true)
    await qc.invalidateQueries()
    setRefreshing(false)
  }

  const stats = data
  const wallet = walletData?.wallet
  const prices = pricesData?.items ?? []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
    >
      <LinearGradient colors={['#13522e', '#15a552']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{user?.name?.split(' ')[0] ?? 'Farmer'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.walletStrip} onPress={() => router.push('/(tabs)/profile')}>
          <View>
            <Text style={s.walletLabel}>Wallet balance</Text>
            <Text style={s.walletBalance}>{formatKes(wallet?.balanceKes ?? 0)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={s.body}>
        <View style={s.statsRow}>
          <StatCard icon="leaf" label="Active loans" value={String(stats?.loans?.active ?? 0)} accent={colors.shamba[600]} />
          <StatCard icon="shield-checkmark" label="Policies" value={String(stats?.insurance?.active ?? 0)} accent={colors.blue[600]} />
          <StatCard icon="storefront" label="Sales" value={String(stats?.marketplace?.completedSales ?? 0)} accent={colors.amber[600]} />
        </View>

        {stats?.creditScore ? (
          <TouchableOpacity style={[s.creditCard, shadow.sm as any]} onPress={() => router.push('/(tabs)/profile')}>
            <View>
              <Text style={s.creditLabel}>Credit score</Text>
              <Text style={s.creditScore}>{stats.creditScore.score}<Text style={s.creditMax}>/850</Text></Text>
              <Text style={s.creditRating}>{stats.creditScore.rating?.replace('_', ' ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.maxLoanLabel}>Max loan</Text>
              <Text style={s.maxLoan}>{formatKes(stats.creditScore.maxLoanKes ?? 0)}</Text>
              <TouchableOpacity style={s.applyBtn} onPress={() => router.push('/(tabs)/loans')}>
                <Text style={s.applyBtnText}>Apply →</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={s.quickActions}>
          {[
            { icon: 'cloud-outline',  label: 'Weather', route: '/(tabs)/profile', color: colors.blue[600] },
            { icon: 'people-outline', label: 'Groups',  route: '/(tabs)/groups',  color: colors.amber[600] },
            { icon: 'map-outline',    label: 'Supply',  route: '/(tabs)/profile', color: colors.gray[600] },
            { icon: 'leaf-outline',   label: 'Predict', route: '/(tabs)/profile', color: colors.shamba[600] },
          ].map(({ icon, label, route, color }) => (
            <TouchableOpacity key={label} style={[s.quickBtn, shadow.sm as any]} onPress={() => router.push(route as any)}>
              <View style={[s.quickIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon as any} size={18} color={color} />
              </View>
              <Text style={s.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {prices.length > 0 && (
          <View style={[s.pricesCard, shadow.sm as any]}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Market prices</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/market')}>
                <Text style={s.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {prices.map((p: any, i: number) => (
              <View key={p.id} style={[s.priceRow, i > 0 && s.priceBorder]}>
                <View>
                  <Text style={s.priceCrop}>{p.crop}</Text>
                  <Text style={s.priceCounty}>{p.county}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.priceValue}>{formatKes(p.priceKes)}</Text>
                  <Text style={s.priceUnit}>per kg</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md },
  walletStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  walletBalance: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  body: { padding: spacing.xl },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  creditCard: { backgroundColor: '#ffffff', borderRadius: radius.lg, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  creditLabel: { fontSize: 11, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  creditScore: { fontSize: 40, fontWeight: '800', color: colors.gray[900], marginTop: 2 },
  creditMax: { fontSize: 16, fontWeight: '400', color: colors.gray[400] },
  creditRating: { fontSize: 12, color: colors.shamba[600], fontWeight: '700', marginTop: 2 },
  maxLoanLabel: { fontSize: 11, color: colors.gray[500] },
  maxLoan: { fontSize: 18, fontWeight: '800', color: colors.shamba[700], marginTop: 2 },
  applyBtn: { marginTop: 8, backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 7 },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickBtn: { flex: 1, backgroundColor: '#ffffff', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 6 },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '600', color: colors.gray[600], textAlign: 'center' },
  pricesCard: { backgroundColor: '#ffffff', borderRadius: radius.lg, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[50] },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  seeAll: { fontSize: 12, color: colors.shamba[600], fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  priceBorder: { borderTopWidth: 1, borderTopColor: colors.gray[50] },
  priceCrop: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  priceCounty: { fontSize: 11, color: colors.gray[500], marginTop: 1 },
  priceValue: { fontSize: 15, fontWeight: '800', color: colors.shamba[700] },
  priceUnit: { fontSize: 10, color: colors.gray[400] },
})
