import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { jobsAPI } from '../services/api';

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  skillsRequired: string[];
  status: string;
  deadline: string;
  client: { username: string };
  proposalCount: number;
}

export default function JobsScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await jobsAPI.getAll();
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.budget}>
          ${item.budgetMin}–${item.budgetMax}
        </Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>

      <View style={styles.skills}>
        {item.skillsRequired.slice(0, 4).map(skill => (
          <View key={skill} style={styles.skill}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.client}>👤 @{item.client?.username}</Text>
        <Text style={styles.proposals}>📝 {item.proposalCount} proposals</Text>
      </View>

      {item.deadline && (
        <Text style={styles.deadline}>
          🗓️ Due: {new Date(item.deadline).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💼 Job Board</Text>
        <Text style={styles.headerSub}>Find freelance work on DevChain</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJobs(); }}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No jobs posted yet</Text>
              <Text style={styles.emptySubText}>Post the first job on DevChain!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#111' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#111', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 12
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { backgroundColor: '#05966922', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  budget: { fontSize: 16, fontWeight: 'bold', color: '#7C3AED' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 10 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skill: { backgroundColor: '#1a1a1a', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  skillText: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  client: { fontSize: 12, color: '#555' },
  proposals: { fontSize: 12, color: '#555' },
  deadline: { fontSize: 12, color: '#F59E0B' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#555', marginTop: 8 },
});
