import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQueryClient } from '@tanstack/react-query'
import { useProfile, useCredit, useWallet, useUpsertProfile, useRefreshCredit, useWithdraw } from '../../src/hooks/useApi'
import { useAuthStore } from '../../src/store/auth.store'
import { colors, spacing, radius, shadow } from '../../src/lib/theme'
import { formatKes, formatDate, scorePercent } from '../../src/lib/utils'

const KENYA_COUNTIES = ['Nakuru', 'Nairobi', 'Kiambu', 'Meru', 'Kisumu', 'Kakamega', 'Uasin Gishu', 'Trans Nzoia', 'Nyeri', 'Machakos', 'Mombasa', 'Kericho', "Murang'a", 'Embu', 'Nandi', 'Bungoma']

export default function ProfileScreen() {
  const qc = useQueryClient()
  const { user, logout } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')

  const { data: profileData, refetch } = useProfile()
  const { data: credit } = useCredit()
  const { data: walletData } = useWallet()
  const upsert = useUpsertProfile()
  const refreshCredit = useRefreshCredit()
  const withdraw = useWithdraw()

  const profile = profileData?.profile
  const wallet = walletData?.wallet
  const [form, setForm] = useState<any>({})

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refetch(), qc.invalidateQueries({ queryKey: ['credit'] }), qc.invalidateQueries({ queryKey: ['wallet'] })])
    setRefreshing(false)
  }

  function startEdit() { setForm({ ...profile }); setEditing(true) }

  function handleSave() {
    upsert.mutate(form, {
      onSuccess: () => { setEditing(false); Alert.alert('Saved', 'Profile updated') },
      onError: (e: any) => Alert.alert('Error', e.response?.data?.error ?? 'Failed to save'),
    })
  }

  function handleWithdraw() {
    if (!withdrawAmt) return
    withdraw.mutate({ amountKes: Number(withdrawAmt) }, {
      onSuccess: (d: any) => { Alert.alert('Success', d.message ?? 'Withdrawal initiated'); setWithdrawAmt('') },
      onError: (e: any) => Alert.alert('Error', e.response?.data?.error ?? 'Withdrawal failed'),
    })
  }

  const scoreVal = credit?.score ?? 0
  const ratingColor = !credit ? colors.gray[500]
    : scoreVal >= 700 ? colors.shamba[600]
    : scoreVal >= 500 ? colors.amber[600] : colors.red[600]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray[50] }} contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}>

      {/* Header */}
      <LinearGradient colors={['#13522e', '#138544']} style={{ paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{user?.name?.[0] ?? 'F'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{user?.name}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user?.phone}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md }}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Credit score strip */}
        {credit && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Credit score</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{credit.score}<Text style={{ fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.6)' }}>/850</Text></Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{credit.rating?.replace('_', ' ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Max loan</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{formatKes(credit.maxLoanKes ?? 0)}</Text>
              <TouchableOpacity onPress={() => refreshCredit.mutate()} style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                {refreshCredit.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>↻ Refresh</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Wallet card */}
        <View style={[{ backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' }, shadow.sm as any]}>
          <View style={{ padding: spacing.xl }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md }}>Shamba Wallet</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ flex: 1, backgroundColor: colors.shamba[50], borderRadius: radius.md, padding: spacing.md }}>
                <Text style={{ fontSize: 11, color: colors.shamba[600] }}>Available</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.shamba[800], marginTop: 2 }}>{formatKes(wallet?.balanceKes ?? 0)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.blue[100], borderRadius: radius.md, padding: spacing.md }}>
                <Text style={{ fontSize: 11, color: colors.blue[600] }}>Escrow</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.blue[800], marginTop: 2 }}>{formatKes(wallet?.escrowKes ?? 0)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TextInput style={{ flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, height: 44, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900] }}
                keyboardType="numeric" placeholder="Amount (KES)" placeholderTextColor={colors.gray[400]} value={withdrawAmt} onChangeText={setWithdrawAmt} />
              <TouchableOpacity style={{ backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', opacity: withdraw.isPending ? 0.5 : 1 }}
                disabled={withdraw.isPending} onPress={handleWithdraw}>
                {withdraw.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Withdraw</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Farm profile card */}
        <View style={[{ backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl }, shadow.sm as any]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.gray[900] }}>Farm profile</Text>
            <TouchableOpacity onPress={editing ? () => setEditing(false) : startEdit}>
              <Text style={{ fontSize: 13, color: colors.shamba[600], fontWeight: '600' }}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {!editing ? (
            <View style={{ gap: spacing.md }}>
              {[
                { label: 'Primary crop', value: profile?.primaryCrop },
                { label: 'Farm size', value: profile?.farmSizeAcres ? `${profile.farmSizeAcres} acres` : null },
                { label: 'County', value: profile?.county },
                { label: 'Sub-county', value: profile?.subCounty },
                { label: 'Years farming', value: profile?.yearsFarming ? `${profile.yearsFarming} years` : null },
                { label: 'Irrigation', value: profile?.irrigationType?.replace('_', ' ') },
                { label: 'Previous yield', value: profile?.previousYieldKg ? `${profile.previousYieldKg} kg` : null },
              ].map(({ label, value }) => value ? (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.gray[50] }}>
                  <Text style={{ fontSize: 13, color: colors.gray[500] }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[900] }}>{value}</Text>
                </View>
              ) : null)}
              {!profile && (
                <Text style={{ fontSize: 13, color: colors.gray[400], textAlign: 'center', paddingVertical: spacing.lg }}>No profile yet. Tap Edit to add your farm details.</Text>
              )}
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {[
                { k: 'primaryCrop', label: 'Primary crop', kb: 'default' as const },
                { k: 'farmSizeAcres', label: 'Farm size (acres)', kb: 'numeric' as const },
                { k: 'county', label: 'County', kb: 'default' as const },
                { k: 'subCounty', label: 'Sub-county', kb: 'default' as const },
                { k: 'yearsFarming', label: 'Years farming', kb: 'numeric' as const },
                { k: 'previousYieldKg', label: 'Previous yield (kg)', kb: 'numeric' as const },
                { k: 'nationalId', label: 'National ID', kb: 'default' as const },
              ].map(({ k, label, kb }) => (
                <View key={k}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.gray[600], marginBottom: 4 }}>{label}</Text>
                  <TextInput style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, height: 44, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900] }}
                    value={String(form[k] ?? '')} onChangeText={v => setForm((p: any) => ({ ...p, [k]: kb === 'numeric' ? Number(v) : v }))} keyboardType={kb} placeholderTextColor={colors.gray[400]} placeholder={label} />
                </View>
              ))}
              <TouchableOpacity style={{ backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.md, opacity: upsert.isPending ? 0.6 : 1 }} disabled={upsert.isPending} onPress={handleSave}>
                {upsert.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save profile</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent transactions */}
        {walletData?.transactions?.length > 0 && (
          <View style={[{ backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' }, shadow.sm as any]}>
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[50] }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.gray[900] }}>Recent transactions</Text>
            </View>
            {walletData.transactions.slice(0, 8).map((tx: any) => {
              const isCredit = ['INSURANCE_PAYOUT', 'MARKET_SALE', 'WALLET_TOPUP', 'REFERRAL_BONUS', 'LOAN_DISBURSEMENT'].includes(tx.type)
              return (
                <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[50] }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isCredit ? colors.shamba[50] : '#fee2e2' }}>
                    <Ionicons name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'} size={18} color={isCredit ? colors.shamba[600] : colors.red[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: colors.gray[800] }} numberOfLines={1}>{tx.description ?? tx.type.replace(/_/g, ' ')}</Text>
                    <Text style={{ fontSize: 11, color: colors.gray[400], marginTop: 1 }}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isCredit ? colors.shamba[700] : colors.red[600] }}>
                    {isCredit ? '+' : '-'}{formatKes(tx.amountKes)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
