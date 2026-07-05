import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../src/api/client';
import { useTheme } from '../../src/lib/theme';
import { useLanguage } from '../../src/lib/LanguageContext';

export default function GroupsScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [myGroupsOnly, setMyGroupsOnly] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allGroupsData, isLoading, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getGroups().then((r) => r.data?.data),
  });

  const { data: myGroupsData } = useQuery({
    queryKey: ['groups-my'],
    queryFn: () => groupsApi.getMyGroups().then((r) => r.data?.data),
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => groupsApi.join(id),
    onSuccess: () => {
      Alert.alert(t.joinSuccess, t.joinSuccessMsg);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups-my'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || t.joinFailed;
      Alert.alert(t.error, msg);
    },
  });

  const allGroups = allGroupsData?.groups || allGroupsData || MOCK_GROUPS;
  const myGroups = myGroupsData?.groups || myGroupsData || [];
  const myGroupIds = new Set(myGroups.map((g: any) => g.id));

  const raw = myGroupsOnly ? myGroups : allGroups;
  const groups = search
    ? raw.filter((g: any) => g.name?.toLowerCase().includes(search.toLowerCase()))
    : raw;

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.shambaGroups}</Text>
        <Text style={s.subtitle}>{t.joinGroupsSubtitle}</Text>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchGroupsPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
      </View>

      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, !myGroupsOnly && s.toggleBtnActive]}
          onPress={() => setMyGroupsOnly(false)}
        >
          <Text style={[s.toggleText, !myGroupsOnly && s.toggleTextActive]}>{t.allGroups}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, myGroupsOnly && s.toggleBtnActive]}
          onPress={() => setMyGroupsOnly(true)}
        >
          <Text style={[s.toggleText, myGroupsOnly && s.toggleTextActive]}>{t.myGroups}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>👥</Text>
              <Text style={s.emptyText}>
                {myGroupsOnly ? t.noGroupsJoined : t.noGroupsAvailable}
              </Text>
            </View>
          }
          renderItem={({ item }: any) => {
            const isMember = myGroupIds.has(item.id);
            return (
              <View style={s.groupCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={s.groupName}>{item.name}</Text>
                    <Text style={s.groupMeta}>{item.county} · {item.type}</Text>
                  </View>
                  {isMember ? (
                    <View style={s.joinedBtn}>
                      <Text style={s.joinedBtnText}>✓ {t.member}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.joinBtn}
                      onPress={() => {
                        Alert.alert(
                          t.joinGroup,
                          `${t.joinGroupConfirmPrefix} ${item.name}?`,
                          [
                            { text: t.no, style: 'cancel' },
                            { text: t.yes, onPress: () => joinMutation.mutate(item.id) },
                          ]
                        );
                      }}
                      disabled={joinMutation.isPending}
                    >
                      <Text style={s.joinBtnText}>{t.join}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={s.statsRow}>
                  <StatPill icon="👥" value={`${item.memberCount || item.members || 0}`} label={t.members} theme={theme} />
                  <StatPill icon="💰" value={`KES ${((item.totalSavingsKes || item.pool || 0) / 1000).toFixed(0)}k`} label={t.pool} theme={theme} />
                </View>

                {item.description && (
                  <Text style={s.groupDesc} numberOfLines={2}>{item.description}</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function StatPill({ icon, value, label, theme }: any) {
  return (
    <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primaryDark }}>{value}</Text>
      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const MOCK_GROUPS = [
  { id: '1', name: 'Kirinyaga Dairy Chama', county: 'Kirinyaga', type: 'COOPERATIVE', memberCount: 47, totalSavingsKes: 230000, description: 'A dairy cooperative supporting smallholder dairy farmers in Kirinyaga.' },
  { id: '2', name: 'Nakuru Maize Farmers', county: 'Nakuru', type: 'BUYING_GROUP', memberCount: 82, totalSavingsKes: 1100000, description: 'Joint buying and selling of maize and grain in Nakuru.' },
  { id: '3', name: 'Meru Tea Growers', county: 'Meru', type: 'COOPERATIVE', memberCount: 118, totalSavingsKes: 890000, description: 'Empowering tea farmers with better markets and fair prices.' },
  { id: '4', name: 'Kajiado Livestock Sacco', county: 'Kajiado', type: 'SACCO', memberCount: 63, totalSavingsKes: 540000, description: 'Savings and credit SACCO for livestock farmers.' },
  { id: '5', name: 'Kiambu Horticultural Group', county: 'Kiambu', type: 'BUYING_GROUP', memberCount: 55, totalSavingsKes: 310000, description: 'Joint selling of flowers and vegetables for horticultural farmers.' },
];

const makeStyles = (theme: ReturnType<typeof import('../../src/lib/theme').useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { backgroundColor: theme.colors.header, padding: 16, paddingTop: 52, paddingBottom: 20 },
    title: { color: '#fff', fontSize: 18, fontWeight: '600' },
    subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2, marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    toggleRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: theme.colors.cardBg, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: theme.colors.border, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    toggleText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    toggleTextActive: { color: '#fff' },
    list: { padding: 12, gap: 10 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    groupCard: { backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.md, padding: 14, borderWidth: 0.5, borderColor: theme.colors.cardBorder },
    groupName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    groupMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    groupDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 17 },
    statsRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
    joinBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
    joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    joinedBtn: { borderWidth: 0.5, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    joinedBtnText: { fontSize: 12, color: theme.colors.textSecondary },
  });
