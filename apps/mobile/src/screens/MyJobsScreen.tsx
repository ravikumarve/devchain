import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { jobsAPI, escrowAPI } from '../services/api';

interface Proposal {
  id: string;
  freelancer: { id: string; username: string };
  proposedRate: number;
  deliveryDays?: number;
  coverLetter?: string;
  status: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  status: string;
  proposals?: Proposal[];
}

const statusColors: Record<string, string> = {
  open: '#10b981', in_progress: '#7C3AED', closed: '#666',
};

export default function MyJobsScreen() {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await jobsAPI.myJobs();
      setJobs(res.data.jobs ?? []);
    } catch (err) {
      console.error('MyJobs load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAction = async (jobId: string, proposalId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await jobsAPI.acceptProposal(proposalId);
        Alert.alert('Accepted', 'Proposal accepted. Escrow created — request funding from client.');
      } else {
        await jobsAPI.rejectProposal(proposalId);
      }
      load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Action failed');
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
        <Text style={styles.title}>My Jobs</Text>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7C3AED" />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No jobs posted yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <TouchableOpacity onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: (statusColors[item.status] ?? '#666') + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColors[item.status] ?? '#666' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.budget}>${item.budgetMin} - ${item.budgetMax}</Text>
            </TouchableOpacity>

            {expandedId === item.id && item.proposals && (
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#1e1e1e', paddingTop: 12 }}>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>PROPOSALS</Text>
                {item.proposals.length === 0 ? (
                  <Text style={{ color: '#555', fontSize: 13 }}>No proposals yet</Text>
                ) : (
                  item.proposals.map((p) => (
                    <View key={p.id} style={styles.proposalItem}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>@{p.freelancer.username}</Text>
                      <Text style={{ color: '#888', fontSize: 13 }}>${p.proposedRate} · {p.deliveryDays}d</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                        {p.status === 'pending' && (
                          <>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAction(item.id, p.id, 'accept')}>
                              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item.id, p.id, 'reject')}>
                              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Reject</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        <Text style={{ color: '#555', fontSize: 12, fontStyle: 'italic', marginLeft: 4 }}>{p.status}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
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
  jobCard: {
    backgroundColor: '#151515', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#1e1e1e',
  },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  budget: { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  proposalItem: {
    backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  acceptBtn: { backgroundColor: '#7C3AED', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  rejectBtn: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#ef4444' },
});
