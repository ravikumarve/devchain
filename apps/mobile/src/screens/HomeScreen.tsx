// src/screens/HomeScreen.tsx
// ─────────────────────────────────────────────────────────────
// Main marketplace screen — lists products with search,
// filters, and pull-to-refresh. Matches our backend response.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  RefreshControl, StatusBar,
} from 'react-native';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  title: string;
  short_description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  download_count: number;
  rating: number;
  review_count: number;
  blockchain_cert_id: string;
  seller: {
    username: string;
    display_name: string;
    is_verified: boolean;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  template: '#7C3AED',
  tool: '#059669',
  library: '#2563EB',
  script: '#DC2626',
  component: '#D97706',
  api: '#0891B2',
  other: '#6B7280',
};

const FILTERS = ['All', 'template', 'tool', 'library', 'script', 'component', 'api'];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const params: any = { page: currentPage, limit: 20 };
      if (activeFilter !== 'All') params.category = activeFilter;

      const res = await productsAPI.getAll(params);
      // Our backend: { success: true, data: { items, total, hasMore } }
      const { items, hasMore: more } = res.data.data;

      setProducts(reset ? items : (prev) => [...prev, ...items]);
      setHasMore(more);
      if (!reset) setPage(currentPage + 1);
    } catch (err) {
      console.error('[HomeScreen] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    setPage(1);
    fetchProducts(true);
  }, [activeFilter]);

  const handleSearch = async () => {
    if (!search.trim()) { fetchProducts(true); return; }
    try {
      setLoading(true);
      const res = await productsAPI.search(search.trim());
      setProducts(res.data.data.items);
      setHasMore(false);
    } catch (err) {
      console.error('[HomeScreen] search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    if (currency === 'INR') return `₹${(price / 100).toFixed(0)}`;
    return `$${(price / 100).toFixed(2)}`;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={[styles.categoryBadge, { backgroundColor: (CATEGORY_COLORS[item.category] || '#6B7280') + '22' }]}>
          <Text style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] || '#6B7280' }]}>
            {item.category}
          </Text>
        </View>
        <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.short_description}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.seller}>
          @{item.seller?.username}
          {item.seller?.is_verified ? ' ✓' : ''}
        </Text>
        <View style={styles.stats}>
          {item.rating > 0 && <Text style={styles.stat}>⭐ {item.rating.toFixed(1)}</Text>}
          <Text style={styles.stat}>⬇️ {item.download_count}</Text>
        </View>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tags}>
          {item.tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {item.blockchain_cert_id && (
        <Text style={styles.cert}>⛓️ {item.blockchain_cert_id}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⛓️ DevChain</Text>
          <Text style={styles.headerSub}>Developer Marketplace</Text>
        </View>
        {user?.role === 'seller' || user?.role === 'admin' ? (
          <TouchableOpacity
            style={styles.sellBtn}
            onPress={() => navigation.navigate('CreateProduct')}
          >
            <Text style={styles.sellBtnText}>+ Sell</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, templates..."
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

      {/* Product list */}
      {loading ? (
        <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setPage(1); fetchProducts(true); }}
              tintColor="#7C3AED"
            />
          }
          onEndReached={() => { if (hasMore && !loading) fetchProducts(); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>Be the first to list a product!</Text>
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
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#7C3AED' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  sellBtn: { backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sellBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
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
  filterBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
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
  price: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seller: { fontSize: 12, color: '#555' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { fontSize: 12, color: '#555' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: '#1a1a1a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 11, color: '#555' },
  cert: { fontSize: 10, color: '#7C3AED', opacity: 0.7, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#555', marginTop: 8 },
});
