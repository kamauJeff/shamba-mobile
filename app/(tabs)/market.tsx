import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useListings, usePrices, usePlaceOrder } from '../../src/hooks/useApi'
import { colors, spacing, radius, shadow } from '../../src/lib/theme'
import { formatKes, formatDate } from '../../src/lib/utils'

function ListingCard({ item, onOrder }: { item: any; onOrder: () => void }) {
  return (
    <View style={[lc.card, shadow.sm as any]}>
      <View style={lc.top}>
        <View style={{ flex: 1 }}>
          <Text style={lc.crop}>{item.cropName}{item.variety ? ` · ${item.variety}` : ''}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <View style={lc.chip}><Text style={lc.chipText}>{item.county}</Text></View>
            <View style={lc.chip}><Text style={lc.chipText}>{item.quantityKg?.toLocaleString()} kg</Text></View>
            <View style={[lc.chip, { backgroundColor: item.grade === 'EXPORT' ? colors.shamba[100] : colors.gray[100] }]}>
              <Text style={[lc.chipText, { color: item.grade === 'EXPORT' ? colors.shamba[700] : colors.gray[600] }]}>{item.grade}</Text>
            </View>
          </View>
          {item.description ? <Text style={lc.desc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={lc.price}>{formatKes(item.pricePerKgKes)}</Text>
          <Text style={lc.perKg}>/ kg</Text>
        </View>
      </View>
      <View style={lc.footer}>
        <Text style={lc.seller}>{item.seller?.name ?? 'Farmer'}</Text>
        <TouchableOpacity style={lc.orderBtn} onPress={onOrder}>
          <Text style={lc.orderBtnText}>Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const lc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  top: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  crop: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[100], borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10, color: colors.gray[600] },
  desc: { fontSize: 12, color: colors.gray[500], lineHeight: 16, marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800', color: colors.shamba[700] },
  perKg: { fontSize: 10, color: colors.gray[400] },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  seller: { fontSize: 12, color: colors.gray[500] },
  orderBtn: { backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 7 },
  orderBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})

function OrderModal({ listing, onClose }: { listing: any; onClose: () => void }) {
  const [qty, setQty] = useState('')
  const order = usePlaceOrder()

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing['2xl'], paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 }}>Order {listing.cropName}</Text>
          <Text style={{ fontSize: 13, color: colors.gray[500], marginBottom: spacing.xl }}>{listing.quantityKg} kg at {formatKes(listing.pricePerKgKes)}/kg</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 }}>Quantity (kg)</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, height: 46, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900], marginBottom: spacing.lg }}
            keyboardType="numeric" value={qty} onChangeText={setQty} placeholder={`Max ${listing.quantityKg} kg`} placeholderTextColor={colors.gray[400]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity style={{ flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[600] }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 2, backgroundColor: colors.shamba[600], borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', opacity: (!qty || order.isPending) ? 0.5 : 1 }}
              disabled={!qty || order.isPending}
              onPress={() => order.mutate({ listingId: listing.id, quantityKg: Number(qty) }, { onSuccess: () => { Alert.alert('Order placed!', 'The seller will be notified.'); onClose() }, onError: (e: any) => Alert.alert('Error', e.response?.data?.error ?? 'Order failed') })}>
              {order.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Place order</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function MarketScreen() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const { data, isLoading } = useListings({ crop: search || undefined, page, pageSize: 10 })

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ backgroundColor: '#15803d', paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>Marketplace</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.lg }}>Connect directly with buyers · 7% commission</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44 }}>
          <Ionicons name="search" size={16} color={colors.gray[400]} />
          <TextInput style={{ flex: 1, fontSize: 14, color: colors.gray[900] }} placeholder="Search crop…" placeholderTextColor={colors.gray[400]} value={search} onChangeText={v => { setSearch(v); setPage(1) }} />
        </View>
      </View>
      {isLoading
        ? <ActivityIndicator color={colors.shamba[600]} style={{ marginTop: 40 }} />
        : <FlatList
            data={data?.items ?? []}
            keyExtractor={i => i.id}
            renderItem={({ item }) => <ListingCard item={item} onOrder={() => setSelected(item)} />}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
            ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Ionicons name="storefront-outline" size={48} color={colors.gray[300]} /><Text style={{ fontSize: 14, color: colors.gray[400], marginTop: 8 }}>No listings found</Text></View>}
          />
      }
      {selected && <OrderModal listing={selected} onClose={() => setSelected(null)} />}
    </View>
  )
}
