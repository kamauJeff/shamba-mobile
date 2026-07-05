import { useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';
import { useLanguage } from '../../src/lib/LanguageContext';

const CROP_ICONS: Record<string, string> = {
  'maize': '🌽', 'mahindi': '🌽', 'milk': '🥛', 'maziwa': '🥛',
  'tomato': '🍅', 'nyanya': '🍅', 'onion': '🧅', 'vitunguu': '🧅',
  'chicken': '🐔', 'kuku': '🐔', 'fertiliser': '🪣', 'mbolea': '🪣',
  'avocado': '🥑', 'parachichi': '🥑', 'banana': '🍌', 'ndizi': '🍌',
  'beans': '🫘', 'maharagwe': '🫘', 'potato': '🥔', 'viazi': '🥔',
};

function getCropIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CROP_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🌾';
}

export default function MarketScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const CATEGORIES = [t.catAll, t.catCrops, t.catLivestock, t.catInputs, t.catDairy];

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [buyModal, setBuyModal] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [newListing, setNewListing] = useState({
    cropName: '', pricePerKgKes: '', unit: 'kg',
    quantityKg: '', county: '', region: '', availableFrom: '', availableUntil: '',
    harvestDate: '', grade: 'B',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['market-listings', activeCategory, search],
    queryFn: () =>
      marketApi.getListings({
        search: search || undefined,
        pageSize: 20,
      }).then((r) => r.data?.data),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['market-prices'],
    queryFn: () => marketApi.getPrices({ pageSize: 10 }).then((r) => r.data?.data),
  });

  const buyMutation = useMutation({
    mutationFn: ({ listingId, qty }: { listingId: string; qty: number }) =>
      marketApi.placeOrder({
        listingId,
        quantityKg: qty,
        deliveryAddress: deliveryAddress || undefined,
        notes: 'Ununuzi kupitia Shamba Mobile',
      }),
    onSuccess: () => {
      Alert.alert(t.purchaseSuccess, t.purchaseSuccessMsg);
      setBuyModal(null);
      setQuantity('1');
      setDeliveryAddress('');
      queryClient.invalidateQueries({ queryKey: ['market-listings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.purchaseFailed;
      Alert.alert(t.error, msg);
    },
  });

  const today = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const createMutation = useMutation({
    mutationFn: () =>
      marketApi.createListing({
        ...newListing,
        pricePerKgKes: parseFloat(newListing.pricePerKgKes),
        quantityKg: parseFloat(newListing.quantityKg),
        harvestDate: today,
        availableFrom: today,
        availableUntil: nextMonth,
        region: newListing.county || 'Nairobi',
        photos: [],
        certifications: [],
        minimumOrderKg: 1,
      }),
    onSuccess: () => {
      Alert.alert(t.listSuccess, t.listSuccessMsg);
      setCreateModal(false);
      setNewListing({ cropName: '', pricePerKgKes: '', unit: 'kg', quantityKg: '', county: '', region: '', availableFrom: '', availableUntil: '', harvestDate: '', grade: 'B' });
      queryClient.invalidateQueries({ queryKey: ['market-listings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.listFailed;
      Alert.alert(t.error, msg);
    },
  });

  const listings = data?.items || data || MOCK_LISTINGS;
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={s.headerTitle}>{t.shambaMarket}</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setCreateModal(true)}>
            <Text style={s.createBtnText}>+ {t.sell}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchMarketPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.tab, activeCategory === cat && s.tabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[s.tabText, activeCategory === cat && s.tabTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Price ticker */}
      {pricesData?.items?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, gap: 12 }}>
          {pricesData.items.map((p: any) => (
            <View key={p.id} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{p.crop}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.primary }}>KES {p.priceKes}/{p.unit}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Listings */}
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🌾</Text>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>{t.noProducts}</Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <View style={s.listingCard}>
              <View style={s.listingImg}>
                <Text style={{ fontSize: 26 }}>{getCropIcon(item.cropName || item.name || '')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.listingName}>{item.cropName || item.name}</Text>
                <Text style={s.listingMeta}>{item.county} · {item.quantityKg || item.quantity} {item.unit || 'kg'} {t.available}</Text>
                <Text style={s.listingPrice}>KES {item.pricePerKgKes || item.price} / {item.unit || 'kg'}</Text>
              </View>
              <TouchableOpacity style={s.buyBtn} onPress={() => { setBuyModal(item); setQuantity('1'); }}>
                <Text style={s.buyBtnText}>{t.buy}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Buy modal */}
      <Modal visible={!!buyModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.confirmPurchase}</Text>
            {buyModal && (
              <>
                <Text style={s.modalItem}>{buyModal.cropName || buyModal.name}</Text>
                <Text style={s.modalMeta}>KES {buyModal.pricePerKgKes || buyModal.price} / {buyModal.unit || 'kg'} · {buyModal.county}</Text>

                <Text style={s.label}>{t.quantity} ({buyModal.unit || 'kg'})</Text>
                <TextInput
                  style={s.modalInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={s.label}>{t.deliveryAddressOptional}</Text>
                <TextInput
                  style={s.modalInput}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder={t.deliveryPlaceholder}
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={s.modalTotal}>
                  {t.total}: KES {((buyModal.pricePerKgKes || buyModal.price || 0) * parseInt(quantity || '0')).toLocaleString()}
                </Text>

                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setBuyModal(null)}>
                    <Text style={s.cancelBtnText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.confirmBtn}
                    onPress={() => buyMutation.mutate({ listingId: buyModal.id, qty: parseInt(quantity) })}
                    disabled={buyMutation.isPending}
                  >
                    {buyMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>{t.confirm}</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create listing modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={[s.modalCard, { margin: 20 }]}>
              <Text style={s.modalTitle}>{t.listProduct}</Text>
              {[
                { key: 'cropName', label: t.cropProductName, placeholder: t.cropNamePlaceholder },
                { key: 'pricePerKgKes', label: t.pricePerUnit, placeholder: '0', type: 'numeric' },
                { key: 'unit', label: t.unitLabel, placeholder: 'kg / lita / kichwa' },
                { key: 'quantityKg', label: t.quantityLabel, placeholder: '100', type: 'numeric' },
                { key: 'county', label: t.countyLabel, placeholder: 'Nakuru' },
              ].map((field) => (
                <View key={field.key} style={{ marginBottom: 12 }}>
                  <Text style={s.label}>{field.label}</Text>
                  <TextInput
                    style={s.modalInput}
                    value={(newListing as any)[field.key]}
                    onChangeText={(v) => setNewListing({ ...newListing, [field.key]: v })}
                    placeholder={field.placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
                  />
                </View>
              ))}
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setCreateModal(false)}>
                  <Text style={s.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>{t.listProduct}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const MOCK_LISTINGS = [
  { id: '1', cropName: 'Mahindi — Daraja A', county: 'Nakuru', quantityKg: 500, unit: 'kg', pricePerKgKes: 42 },
  { id: '2', cropName: 'Maziwa Safi', county: 'Kiambu', quantityKg: 200, unit: 'lita', pricePerKgKes: 55 },
  { id: '3', cropName: 'Nyanya (Truss)', county: 'Meru', quantityKg: 300, unit: 'kg', pricePerKgKes: 80 },
  { id: '4', cropName: 'Vitunguu (Nyekundu)', county: 'Kajiado', quantityKg: 150, unit: 'kg', pricePerKgKes: 65 },
  { id: '5', cropName: 'Kuku wa Kienyeji', county: 'Machakos', quantityKg: 40, unit: 'kichwa', pricePerKgKes: 650 },
  { id: '6', cropName: 'Mbolea ya DAP', county: 'Nakuru', quantityKg: 50, unit: 'mfuko', pricePerKgKes: 3800 },
];

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { backgroundColor: theme.colors.header, padding: 16, paddingTop: 52, paddingBottom: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
    createBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    createBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    tabsScroll: { backgroundColor: theme.colors.cardBg, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
    tabsContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: '#fff' },
    list: { padding: 14, gap: 10 },
    listingCard: { backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    listingImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    listingName: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary },
    listingMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    listingPrice: { fontSize: 14, fontWeight: '600', color: theme.colors.primary, marginTop: 4 },
    buyBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    buyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 14 },
    modalItem: { fontSize: 15, fontWeight: '500', color: theme.colors.textPrimary },
    modalMeta: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 6 },
    modalInput: { backgroundColor: theme.colors.background, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 10 },
    modalTotal: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginVertical: 10 },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, color: theme.colors.textSecondary },
    confirmBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
    confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
