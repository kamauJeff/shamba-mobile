import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  farmerApi, loanApi, insuranceApi, marketApi,
  walletApi, weatherApi, predictApi, groupApi, supplyApi,
} from '../api/endpoints'

// ─── Helper ───────────────────────────────────────────────────
const q = (key: any, fn: () => Promise<any>, opts?: any) =>
  useQuery({ queryKey: Array.isArray(key) ? key : [key], queryFn: () => fn().then((r) => r.data.data), ...opts })

// ─── Farmer ────────────────────────────────────────────────────
export const useDashboard    = () => q('dashboard',    farmerApi.dashboard)
export const useProfile      = () => q('profile',      farmerApi.profile)
export const useCredit       = () => q('credit',       farmerApi.credit)

// ─── Loans ─────────────────────────────────────────────────────
export const useLoans        = () => q('loans',        loanApi.list)

// ─── Insurance ─────────────────────────────────────────────────
export const usePolicies     = () => q('policies',     insuranceApi.list)
export const useThresholds   = () => q('thresholds',   insuranceApi.thresholds, { staleTime: Infinity })

// ─── Market ────────────────────────────────────────────────────
export const useListings     = (p?: any) => q(['listings', p],  () => marketApi.listings(p), { staleTime: 2 * 60 * 1000 })
export const useMyListings   = () => q('my-listings',   marketApi.myListings)
export const usePrices       = (p?: any) => q(['prices', p],    () => marketApi.prices(p),   { staleTime: 5 * 60 * 1000 })
export const useOrders       = (role?: string) => q(['orders', role], () => marketApi.orders(role))

// ─── Wallet ────────────────────────────────────────────────────
export const useWallet       = () => q('wallet',        walletApi.get)

// ─── Weather ───────────────────────────────────────────────────
export const useFarmerWeather = () => q('weather',      weatherApi.myFarm, { staleTime: 30 * 60 * 1000 })

// ─── Predict ───────────────────────────────────────────────────
export const usePredictHistory = () => q('pred-history', predictApi.history)

// ─── Groups ────────────────────────────────────────────────────
export const useGroups       = (p?: any) => q(['groups', p],    () => groupApi.list(p))
export const useMyGroups     = () => q('my-groups',     groupApi.mine)
export const useGroup        = (id: string) => q(['group', id], () => groupApi.get(id), { enabled: !!id })

// ─── Supply ────────────────────────────────────────────────────
export const useSupply       = (p?: any) => q(['supply', p],    () => supplyApi.list(p))

// ─── Mutations ─────────────────────────────────────────────────
const mut = (fn: any, invalidate?: string[]) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  })
}

export const useUpsertProfile   = () => mut((d: any) => farmerApi.upsert(d).then((r) => r.data),          ['profile', 'dashboard'])
export const useRefreshCredit   = () => mut(() => farmerApi.refreshCredit().then((r) => r.data),           ['credit'])
export const useApplyLoan       = () => mut((d: any) => loanApi.apply(d).then((r) => r.data),             ['loans', 'credit'])
export const useRepayLoan       = () => mut(({ id, ...d }: any) => loanApi.repay(id, d).then((r) => r.data), ['loans'])
export const useCreatePolicy    = () => mut((d: any) => insuranceApi.create(d).then((r) => r.data),       ['policies'])
export const useCreateListing   = () => mut((d: any) => marketApi.create(d).then((r) => r.data),          ['my-listings'])
export const usePlaceOrder      = () => mut((d: any) => marketApi.order(d).then((r) => r.data),           ['orders'])
export const useConfirmDelivery = () => mut((id: string) => marketApi.confirm(id).then((r) => r.data),    ['orders', 'wallet'])
export const useWithdraw        = () => mut((d: any) => walletApi.withdraw(d).then((r) => r.data),        ['wallet'])
export const usePredict         = () => useMutation({ mutationFn: (d: any) => predictApi.predict(d).then((r) => r.data.data) })
export const useJoinGroup       = () => mut(({ id }: { id: string }) => groupApi.join(id).then((r) => r.data), ['groups', 'my-groups'])
export const useContribute      = () => mut(({ id, ...d }: any) => groupApi.contribute(id, d).then((r) => r.data), ['groups'])
