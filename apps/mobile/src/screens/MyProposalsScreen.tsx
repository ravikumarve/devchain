import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { jobsAPI, escrowAPI } from '../services/api';

interface Proposal {
  id: string;
  job: { id: string; title: string; client: { username: string } };
  proposedRate: number;
  deliveryDays?: number;
  status: string;
  createdAt: string;
  escrow?: { id: string; status: string };
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b', accepted: '#10b981', rejected: '#ef4444',
};

export default function MyProposalsScreen() {
  const navigation = useNavigation<any>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobsAPI.myProposals();
      setProposals(res.data.proposals ?? []);
    } catch (err) {
      console.error('MyProposals load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRequestRelease = async (proposalId: string) => {
    try {
      await escrowAPI.requestRelease(proposalId);
      load(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <Text style={styles.title}>My Proposals</Text>
      </View>
      <FlatList
        data={proposals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7C3AED" />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No proposals submitted yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.jobTitle}>{item.job.title}</Text>
              <View style={[styles.badge, { backgroundColor: (statusColors[item.status] ?? '#666') + '22' }]}>
                <Text style={[styles.badgeText, { color: statusColors[item.status] ?? '#666' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.client}>Client: @{item.job.client.username}</Text>
            <Text style={styles.rate}>${item.proposedRate} · {item.deliveryDays ?? '—'} days</Text>

            {item.status === 'accepted' && item.escrow?.status === 'funded' && (
              <TouchableOpacity style={styles.releaseBtn} onPress={() => handleRequestRelease(item.id)}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Request Release</Text>
              </TouchableOpacity>
            )}

            {item.escrow && (
              <Text style={{ fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
                Escrow: {item.escrow.status}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 16 },
  card: {
    backgroundColor: '#151515', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#1e1e1e',
  },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  client: { fontSize: 13, color: '#888', marginTop: 4 },
  rate: { fontSize: 14, color: '#7C3AED', fontWeight: '600', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  releaseBtn: {
    backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 10,
    alignItems: 'center', marginTop: 10,
  },
});
