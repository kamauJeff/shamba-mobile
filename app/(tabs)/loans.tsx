import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth.store';
import { useTheme } from '../../src/lib/theme';
import { useLanguage } from '../../src/lib/LanguageContext';

const SCORE_MIN = 300;
const SCORE_MAX = 850;

function CreditMeter({ score, theme, t }: { score: number; theme: any; t: any }) {
  const pct = ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const tier =
    score >= 750 ? { label: t.excellent, color: theme.colors.success } :
    score >= 670 ? { label: t.good, color: '#3a9bd5' } :
    score >= 580 ? { label: t.fair, color: theme.colors.warning } :
    { label: t.poor, color: theme.colors.danger };

  return (
    <View style={{ backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.lg, padding: 18, margin: 14, marginBottom: 6, borderWidth: 0.5, borderColor: theme.colors.cardBorder }}>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>{t.yourCreditScore}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ fontSize: 36, fontWeight: '700', color: tier.color }}>{score}</Text>
        <View style={{ backgroundColor: tier.color + '22', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: tier.color }}>{tier.label}</Text>
        </View>
      </View>
      <View style={{ height: 8, backgroundColor: theme.colors.border, borderRadius: 4, marginTop: 12 }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: tier.color, borderRadius: 4 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>300 ({t.poor})</Text>
        <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>850 ({t.excellent})</Text>
      </View>
    </View>
  );
}

export default function LoansScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [applyModal, setApplyModal] = useState(false);
  const [repayModal, setRepayModal] = useState<any>(null);
  const [loanForm, setLoanForm] = useState({ amount: '', purpose: 'SEEDS', duration: '3' });
  const [repayAmount, setRepayAmount] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loansApi.getMyLoans().then((r) => r.data?.data),
  });

  const { data: creditData } = useQuery({
    queryKey: ['credit'],
    queryFn: () => loansApi.getCreditScore ? loansApi.getCreditScore().then((r) => r.data?.data) : Promise.resolve(null),
  });

  const PURPOSES = [
    { key: 'SEEDS', label: t.purposeSeeds },
    { key: 'FERTILIZER', label: t.purposeFertilizer },
    { key: 'PESTICIDES', label: t.purposePesticides },
    { key: 'EQUIPMENT', label: t.purposeEquipment },
    { key: 'IRRIGATION', label: t.purposeIrrigation },
    { key: 'LABOR', label: t.purposeLabor },
    { key: 'STORAGE', label: t.purposeStorage },
    { key: 'OTHER', label: t.purposeOther },
  ];

  const applyMutation = useMutation({
    mutationFn: () =>
      loansApi.apply({
        principalKes: parseInt(loanForm.amount),
        termMonths: parseInt(loanForm.duration),
        purpose: loanForm.purpose as any,
        purposeDetails: `Loan request - ${loanForm.purpose}`,
      }),
    onSuccess: () => {
      Alert.alert(t.requestSent, t.requestSentMsg);
      setApplyModal(false);
      setLoanForm({ amount: '', purpose: 'SEEDS', duration: '3' });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.applicationFailed;
      Alert.alert(t.error, msg);
    },
  });

  const repayMutation = useMutation({
    mutationFn: () =>
      loansApi.repay(repayModal.id, {
        mpesaRef: mpesaRef || `DEMO${Date.now()}`,
        amountKes: parseFloat(repayAmount),
      }),
    onSuccess: () => {
      Alert.alert(t.paymentSent, t.paymentSentMsg);
      setRepayModal(null);
      setRepayAmount('');
      setMpesaRef('');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.paymentFailed;
      Alert.alert(t.error, msg);
    },
  });

  const loans = data?.loans || data || [];
  const active = Array.isArray(loans) ? loans.filter((l: any) => l.status === 'ACTIVE') : [];
  const history = Array.isArray(loans) ? loans.filter((l: any) => l.status !== 'ACTIVE') : [];
  const creditScore = creditData?.score || user?.creditScore || 680;
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t.shambaFinance}</Text>
        <Text style={s.headerSub}>{t.financeTagline}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} onScrollEndDrag={refetch}>
        <CreditMeter score={creditScore} theme={theme} t={t} />

        {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />}

        {active.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{t.activeLoans}</Text>
            {active.map((loan: any) => (
              <LoanCard key={loan.id} loan={loan} theme={theme} t={t} onRepay={() => { setRepayModal(loan); setRepayAmount(''); setMpesaRef(''); }} />
            ))}
          </>
        )}

        {history.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{t.loanHistory}</Text>
            {history.map((loan: any) => (
              <LoanCard key={loan.id} loan={loan} theme={theme} t={t} />
            ))}
          </>
        )}

        {loans.length === 0 && !isLoading && (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>💰</Text>
            <Text style={s.emptyText}>{t.noLoansYet}</Text>
          </View>
        )}

        <TouchableOpacity style={s.applyBtn} onPress={() => setApplyModal(true)}>
          <Text style={s.applyBtnText}>{t.applyForLoan} ↗</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Apply modal */}
      <Modal visible={applyModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={[s.modalCard, { margin: 20 }]}>
              <Text style={s.modalTitle}>{t.applyForLoan}</Text>

              <Text style={s.label}>{t.amount} (KES)</Text>
              <TextInput
                style={s.modalInput}
                value={loanForm.amount}
                onChangeText={(v) => setLoanForm({ ...loanForm, amount: v })}
                placeholder="e.g. 10000"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
              />

              <Text style={s.label}>{t.purpose}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PURPOSES.map((p) => (
                    <TouchableOpacity
                      key={p.key}
                      style={[s.purposeBtn, loanForm.purpose === p.key && s.purposeBtnActive]}
                      onPress={() => setLoanForm({ ...loanForm, purpose: p.key })}
                    >
                      <Text style={[s.purposeText, loanForm.purpose === p.key && { color: '#fff' }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.label}>{t.duration}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['1', '3', '6', '12'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.durationBtn, loanForm.duration === m && s.durationBtnActive]}
                    onPress={() => setLoanForm({ ...loanForm, duration: m })}
                  >
                    <Text style={[s.durationText, loanForm.duration === m && { color: '#fff' }]}>{m}mo</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {loanForm.amount ? (
                <View style={s.estimateBox}>
                  <Text style={s.estimateLabel}>{t.estimatedMonthly}</Text>
                  <Text style={s.estimateValue}>
                    KES {Math.round((parseInt(loanForm.amount || '0') * 1.15) / parseInt(loanForm.duration || '3')).toLocaleString()}
                  </Text>
                </View>
              ) : null}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setApplyModal(false)}>
                  <Text style={s.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending || !loanForm.amount}
                >
                  {applyMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>{t.submit}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Repay modal */}
      <Modal visible={!!repayModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.repayLoan}</Text>
            {repayModal && (
              <>
                <Text style={[s.label, { marginBottom: 2 }]}>{repayModal.purpose}</Text>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 14 }}>
                  {t.loan}: KES {repayModal.principalKes?.toLocaleString()}
                </Text>

                <Text style={s.label}>{t.mpesaNumber}</Text>
                <TextInput
                  style={s.modalInput}
                  value={mpesaRef}
                  onChangeText={setMpesaRef}
                  placeholder="e.g. QKA12345"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="characters"
                />

                <Text style={s.label}>{t.amountToRepay} (KES)</Text>
                <TextInput
                  style={s.modalInput}
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                  placeholder={t.enterAmount}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />

                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setRepayModal(null)}>
                    <Text style={s.cancelBtnText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.confirmBtn}
                    onPress={() => repayMutation.mutate()}
                    disabled={repayMutation.isPending || !repayAmount}
                  >
                    {repayMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>{t.pay}</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LoanCard({ loan, theme, t, onRepay }: any) {
  const isActive = loan.status === 'ACTIVE';
  return (
    <View style={{ backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 14, marginHorizontal: 14, marginBottom: 8, borderWidth: 0.5, borderColor: theme.colors.cardBorder }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary }}>{loan.purpose}</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
            KES {loan.principalKes?.toLocaleString()} · {loan.termMonths} {t.months}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: isActive ? theme.colors.successBg : '#1E1E3A' }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: isActive ? theme.colors.successText : '#9090D0' }}>
            {isActive ? t.active.toUpperCase() : loan.status}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>
          {loan.disbursedAt ? `${t.disbursedOn}: ${new Date(loan.disbursedAt).toLocaleDateString()}` : t.pending}
        </Text>
        <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>
          {loan.approvedAt ? `${t.approvedOn}: ${new Date(loan.approvedAt).toLocaleDateString()}` : ''}
        </Text>
      </View>
      {isActive && onRepay && (
        <TouchableOpacity
          style={{ marginTop: 10, borderWidth: 0.5, borderColor: theme.colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}
          onPress={onRepay}
        >
          <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '500' }}>💳 {t.payNow}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { backgroundColor: theme.colors.header, padding: 16, paddingTop: 52, paddingBottom: 22 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginHorizontal: 14, marginBottom: 8, marginTop: 8 },
    emptyBox: { alignItems: 'center', padding: 32 },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    applyBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 15, marginHorizontal: 14, alignItems: 'center', marginTop: 12 },
    applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 6 },
    modalInput: { backgroundColor: theme.colors.background, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 14 },
    purposeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
    purposeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    purposeText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    durationBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border, alignItems: 'center', backgroundColor: theme.colors.background },
    durationBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    durationText: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary },
    estimateBox: { backgroundColor: theme.colors.successBg, borderRadius: theme.radius.sm, padding: 12, marginBottom: 14 },
    estimateLabel: { fontSize: 11, color: theme.colors.successText, marginBottom: 2 },
    estimateValue: { fontSize: 18, fontWeight: '700', color: theme.colors.successText },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, color: theme.colors.textSecondary },
    confirmBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
