// src/screens/JobsScreen.tsx
// Fixed — uses gigsAPI instead of old jobsAPI, matches backend response
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { gigsAPI } from '../services/api';

interface Gig {
  id: string;
  title: string;
  description: string;
  price_from: number;
  price_to: number | null;
  currency: string;
  delivery_days: number;
  category: string;
  tags: string[];
  skills: string[];
  rating: number;
  order_count: number;
  review_count: number;
  freelancer: {
    username: string;
    display_name: string;
    is_verified: boolean;
    rating: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#7C3AED', backend: '#2563EB', mobile: '#059669',
  devops: '#D97706', blockchain: '#F59E0B', ai_ml: '#0891B2',
  design: '#DC2626', other: '#6B7280',
};

const FILTERS = ['All', 'frontend', 'backend', 'mobile', 'devops', 'blockchain', 'ai_ml', 'design'];

export default function JobsScreen({ navigation }: any) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchGigs = async (reset = false) => {
    try {
      const params: any = { page: 1, limit: 20 };
      if (activeFilter !== 'All') params.category = activeFilter;

      const res = await gigsAPI.getAll(params);
      // Our backend: { success: true, data: { items, total, hasMore } }
      setGigs(res.data.data.items);
    } catch (err) {
      console.error('[JobsScreen] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { fetchGigs(); return; }
    try {
      setLoading(true);
      const res = await gigsAPI.search(search.trim());
      setGigs(res.data.data.items);
    } catch (err) {
      console.error('[JobsScreen] search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGigs(); }, [activeFilter]);

  const formatPrice = (from: number, to: number | null, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const fromStr = `${symbol}${(from / 100).toFixed(0)}`;
    if (!to) return fromStr;
    return `${fromStr}–${symbol}${(to / 100).toFixed(0)}`;
  };

  const renderGig = ({ item }: { item: Gig }) => {
    const color = CATEGORY_COLORS[item.category] || '#6B7280';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('JobDetail', { gigId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.categoryText, { color }]}>{item.category}</Text>
          </View>
          <Text style={styles.price}>
            {formatPrice(item.price_from, item.price_to, item.currency)}
          </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>

        {item.skills.length > 0 && (
          <View style={styles.skills}>
            {item.skills.slice(0, 4).map(skill => (
              <View key={skill} style={[styles.skill, { backgroundColor: color + '15' }]}>
                <Text style={[styles.skillText, { color }]}>{skill}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.freelancer}>
            @{item.freelancer?.username}
            {item.freelancer?.is_verified ? ' ✓' : ''}
          </Text>
          <View style={styles.footerStats}>
            <Text style={styles.stat}>🕐 {item.delivery_days}d</Text>
            {item.rating > 0 && <Text style={styles.stat}>⭐ {item.rating.toFixed(1)}</Text>}
            {item.order_count > 0 && <Text style={styles.stat}>✅ {item.order_count}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💼 Job Board</Text>
          <Text style={styles.headerSub}>Find freelance work on DevChain</Text>
        </View>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search gigs, skills..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === item && styles.filterBtnActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={item => item.id}
          renderItem={renderGig}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchGigs(true); }}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyText}>No gigs posted yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateJob')}>
                <Text style={styles.emptyBtnText}>Post the first gig →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    padding: 20, paddingTop: 50, backgroundColor: '#111',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  postBtn: { backgroundColor: '#059669', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  searchBox: { padding: 16, paddingBottom: 8, backgroundColor: '#111' },
  searchInput: {
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222',
  },
  filterList: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#111', gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222',
  },
  filterBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterText: { color: '#666', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#111', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#7C3AED' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 10 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skill: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  skillText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  freelancer: { fontSize: 12, color: '#555' },
  footerStats: { flexDirection: 'row', gap: 8 },
  stat: { fontSize: 12, color: '#555' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 16 },
  emptyBtn: { backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold' },
});
