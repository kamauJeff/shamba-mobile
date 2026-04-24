import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useLoans, useApplyLoan, useCredit } from '../../src/hooks/useApi'
import { colors, spacing, radius, shadow } from '../../src/lib/theme'
import { formatKes, formatDate } from '../../src/lib/utils'

const PURPOSES = ['SEEDS', 'FERTILIZER', 'PESTICIDES', 'EQUIPMENT', 'IRRIGATION', 'LABOR', 'STORAGE', 'OTHER']
const PURPOSE_LABELS: Record<string, string> = { SEEDS: 'Seeds', FERTILIZER: 'Fertilizer', PESTICIDES: 'Pesticides', EQUIPMENT: 'Equipment', IRRIGATION: 'Irrigation', LABOR: 'Labor', STORAGE: 'Storage', OTHER: 'Other' }

function LoanCard({ loan }: { loan: any }) {
  const [exp, setExp] = useState(false)
  const paid = loan.repayments?.filter((r: any) => r.status === 'PAID').length ?? 0
  const total = loan.repayments?.length ?? 0
  const statusColor = { PENDING: colors.amber[600], APPROVED: colors.blue[600], ACTIVE: colors.shamba[600], CLOSED: colors.gray[500], DEFAULTED: colors.red[600] }[loan.status as string] ?? colors.gray[500]

  return (
    <View style={[lc.card, shadow.sm as any]}>
      <TouchableOpacity style={lc.header} onPress={() => setExp(!exp)} activeOpacity={0.8}>
        <View style={lc.icon}><Text style={{ fontSize: 18, fontWeight: '800', color: colors.amber[700] }}>₭</Text></View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={lc.amount}>{formatKes(loan.principalKes)}</Text>
            <View style={[lc.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[lc.badgeText, { color: statusColor }]}>{loan.status}</Text>
            </View>
          </View>
          <Text style={lc.sub}>{PURPOSE_LABELS[loan.purpose] ?? loan.purpose} · {loan.interestRatePct}% · {loan.termMonths}m</Text>
          {total > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <View style={{ flex: 1, height: 4, backgroundColor: colors.gray[100], borderRadius: 2 }}>
                <View style={{ width: `${(paid / total) * 100}%`, height: '100%', backgroundColor: colors.shamba[500], borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.gray[400] }}>{paid}/{total}</Text>
            </View>
          )}
        </View>
        <Ionicons name={exp ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray[400]} />
      </TouchableOpacity>

      {exp && loan.repayments?.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.gray[100], padding: spacing.lg }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', marginBottom: spacing.sm }}>Repayment Schedule</Text>
          {loan.repayments.map((r: any, i: number) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <Ionicons
                name={r.status === 'PAID' ? 'checkmark-circle' : r.status === 'LATE' ? 'alert-circle' : 'time-outline'}
                size={16}
                color={r.status === 'PAID' ? colors.shamba[600] : r.status === 'LATE' ? colors.red[600] : colors.gray[400]}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[800] }}>Instalment {i + 1}</Text>
                <Text style={{ fontSize: 11, color: colors.gray[500] }}>{formatDate(r.dueDate)}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: r.status === 'PAID' ? colors.gray[400] : colors.shamba[700] }}>{formatKes(r.amountDueKes)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const lc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.amber[100], alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  sub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
})

export default function LoansScreen() {
  const qc = useQueryClient()
  const { data: loans, isLoading, refetch } = useLoans()
  const { data: credit } = useCredit()
  const apply = useApplyLoan()
  const [showForm, setShowForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [form, setForm] = useState({ principalKes: '', termMonths: '6', purpose: 'SEEDS' })

  const hasActive = loans?.some((l: any) => ['PENDING', 'APPROVED', 'ACTIVE'].includes(l.status))

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false) }

  function handleApply() {
    if (!form.principalKes) return Alert.alert('Error', 'Enter loan amount')
    apply.mutate(
      { principalKes: Number(form.principalKes), termMonths: Number(form.termMonths), purpose: form.purpose },
      {
        onSuccess: () => { Alert.alert('Submitted!', 'Loan application received. Review within 24h.'); setShowForm(false); qc.invalidateQueries({ queryKey: ['loans'] }) },
        onError: (e: any) => Alert.alert('Error', e.response?.data?.error ?? 'Application failed'),
      }
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray[50] }} contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}>

      <View style={{ backgroundColor: colors.shamba[800], paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>Input Financing</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Loans disbursed as agro-dealer vouchers</Text>
        {credit?.eligible && (
          <View style={{ marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>Limit: {formatKes(credit.maxLoanKes ?? 0)} · {credit.score}/850</Text>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.xl }}>
        {!hasActive && credit?.eligible && !showForm && (
          <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.shamba[600], borderRadius: radius.lg, paddingVertical: 16, marginBottom: spacing.xl }, shadow.sm as any]} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Apply for input loan</Text>
          </TouchableOpacity>
        )}

        {!credit?.eligible && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.amber[100], borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.xl }}>
            <Ionicons name="information-circle" size={16} color={colors.amber[700]} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.amber[800], lineHeight: 18 }}>Complete your farmer profile to get a credit score and unlock loans.</Text>
          </View>
        )}

        {hasActive && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.amber[100], borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.xl }}>
            <Ionicons name="lock-closed" size={16} color={colors.amber[700]} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.amber[800] }}>Repay your current loan before applying for a new one.</Text>
          </View>
        )}

        {showForm && (
          <View style={[{ backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl }, shadow.sm as any]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg }}>Loan application</Text>

            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 }}>Amount (KES)</Text>
            <TextInput style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, height: 46, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900], marginBottom: spacing.lg }}
              keyboardType="numeric" value={form.principalKes} onChangeText={v => setForm(p => ({ ...p, principalKes: v }))} placeholder={`Max ${formatKes(credit?.maxLoanKes ?? 0)}`} placeholderTextColor={colors.gray[400]} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 }}>Term</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }}>
              {['3', '6', '9', '12'].map(m => (
                <TouchableOpacity key={m} style={{ borderWidth: 1.5, borderColor: form.termMonths === m ? colors.shamba[600] : colors.gray[200], borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: form.termMonths === m ? colors.shamba[50] : '#fff' }} onPress={() => setForm(p => ({ ...p, termMonths: m }))}>
                  <Text style={{ fontSize: 12, color: form.termMonths === m ? colors.shamba[700] : colors.gray[600], fontWeight: form.termMonths === m ? '700' : '500' }}>{m} months</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 }}>Purpose</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl }}>
              {PURPOSES.map(p => (
                <TouchableOpacity key={p} style={{ borderWidth: 1.5, borderColor: form.purpose === p ? colors.shamba[600] : colors.gray[200], borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: form.purpose === p ? colors.shamba[50] : '#fff' }} onPress={() => setForm(prev => ({ ...prev, purpose: p }))}>
                  <Text style={{ fontSize: 12, color: form.purpose === p ? colors.shamba[700] : colors.gray[600], fontWeight: form.purpose === p ? '700' : '500' }}>{PURPOSE_LABELS[p]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity style={{ flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' }} onPress={() => setShowForm(false)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[600] }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 2, backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', opacity: apply.isPending ? 0.6 : 1 }} disabled={apply.isPending} onPress={handleApply}>
                {apply.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md }}>Your loans</Text>
        {isLoading && <ActivityIndicator color={colors.shamba[600]} />}
        {!isLoading && (!loans || loans.length === 0) && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="cash-outline" size={48} color={colors.gray[300]} />
            <Text style={{ fontSize: 14, color: colors.gray[400], marginTop: 8 }}>No loans yet</Text>
          </View>
        )}
        {loans?.map((loan: any) => <LoanCard key={loan.id} loan={loan} />)}
      </View>
    </ScrollView>
  )
}
