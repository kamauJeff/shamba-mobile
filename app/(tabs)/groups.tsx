import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useGroups, useMyGroups, useJoinGroup } from '../../src/hooks/useApi'
import { colors, spacing, radius, shadow } from '../../src/lib/theme'
import { formatKes } from '../../src/lib/utils'

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  SACCO:             { bg: '#dcfce7', text: '#14532d' },
  COOPERATIVE:       { bg: '#dbeafe', text: '#1e40af' },
  BUYING_GROUP:      { bg: '#fef3c7', text: '#92400e' },
  IRRIGATION_SCHEME: { bg: '#f3f4f6', text: '#374151' },
}

function GroupCard({ group, isMember }: { group: any; isMember: boolean }) {
  const join = useJoinGroup()
  const tc = TYPE_COLORS[group.type] ?? { bg: '#f3f4f6', text: '#374151' }

  return (
    <View style={[s.card, shadow.sm as any]}>
      <View style={s.cardTop}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, flex: 1 }}>
          <View style={s.iconWrap}>
            <Ionicons name="people" size={20} color={colors.shamba[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.groupName}>{group.name}</Text>
            <Text style={s.groupCounty}>{group.county}</Text>
          </View>
        </View>
        <View style={[s.typeBadge, { backgroundColor: tc.bg }]}>
          <Text style={[s.typeText, { color: tc.text }]}>{group.type?.replace('_', ' ')}</Text>
        </View>
      </View>

      {group.description ? <Text style={s.desc} numberOfLines={2}>{group.description}</Text> : null}

      <View style={s.cardFooter}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={s.meta}>{group._count?.members ?? 0} members</Text>
          <Text style={s.meta}>·</Text>
          <Text style={s.meta}>{formatKes(group.totalSavingsKes ?? 0)} saved</Text>
        </View>

        {!isMember ? (
          <TouchableOpacity
            style={[s.joinBtn, join.isPending && { opacity: 0.5 }]}
            disabled={join.isPending}
            onPress={() => join.mutate(
              { id: group.id },
              {
                onSuccess: () => Alert.alert('Joined!', `Welcome to ${group.name}`),
                onError:   (e: any) => Alert.alert('Error', e.response?.data?.error ?? 'Failed to join'),
              }
            )}
          >
            {join.isPending
              ? <ActivityIndicator size="small" color={colors.shamba[600]} />
              : <Text style={s.joinBtnText}>Join</Text>}
          </TouchableOpacity>
        ) : (
          <View style={s.memberBadge}>
            <Text style={s.memberBadgeText}>Member ✓</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function GroupsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: groups, isLoading, refetch } = useGroups()
  const { data: myGroups } = useMyGroups()
  const myGroupIds = new Set((myGroups ?? []).map((m: any) => m.groupId))

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false) }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray[50] }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
    >
      <View style={s.header}>
        <Text style={s.title}>Farmer Groups</Text>
        <Text style={s.subtitle}>SACCOs, cooperatives and buying groups</Text>
      </View>

      <View style={s.body}>
        {myGroups && myGroups.length > 0 && (
          <View style={[s.myGroupsCard, shadow.sm as any]}>
            <Text style={s.sectionTitle}>My groups</Text>
            {myGroups.map((m: any) => (
              <View key={m.groupId} style={s.myGroupRow}>
                <Ionicons name="people" size={16} color={colors.shamba[600]} />
                <Text style={s.myGroupName}>{m.group?.name ?? 'Group'}</Text>
                <Text style={s.myGroupRole}>{m.role?.toLowerCase()}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.sectionTitle}>Discover groups</Text>

        {isLoading && <ActivityIndicator color={colors.shamba[600]} style={{ marginTop: 40 }} />}

        {!isLoading && (!groups || groups.length === 0) && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
            <Text style={{ fontSize: 14, color: colors.gray[400], marginTop: 8 }}>No groups found</Text>
          </View>
        )}

        {(groups ?? []).map((g: any) => (
          <GroupCard key={g.id} group={g} isMember={myGroupIds.has(g.id)} />
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  header:         { backgroundColor: colors.shamba[800], paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title:          { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle:       { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  body:           { padding: spacing.xl },
  myGroupsCard:   { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl },
  sectionTitle:   { fontSize: 14, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
  myGroupRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.shamba[50], borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  myGroupName:    { flex: 1, fontSize: 13, fontWeight: '600', color: colors.shamba[800] },
  myGroupRole:    { fontSize: 11, color: colors.shamba[500], textTransform: 'capitalize' },
  card:           { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.md },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  iconWrap:       { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.shamba[100], alignItems: 'center', justifyContent: 'center' },
  groupName:      { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  groupCounty:    { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  typeBadge:      { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  typeText:       { fontSize: 10, fontWeight: '700' },
  desc:           { fontSize: 13, color: colors.gray[500], lineHeight: 18, marginBottom: spacing.md },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta:           { fontSize: 12, color: colors.gray[400] },
  joinBtn:        { borderWidth: 1.5, borderColor: colors.shamba[600], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 6, minWidth: 52, alignItems: 'center' },
  joinBtnText:    { fontSize: 12, fontWeight: '700', color: colors.shamba[600] },
  memberBadge:    { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.shamba[100] },
  memberBadgeText:{ fontSize: 10, fontWeight: '700', color: colors.shamba[800] },
})
