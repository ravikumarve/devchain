import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, RefreshControl
} from 'react-native';
import { productsAPI } from '../services/api';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  downloadsCount: number;
  seller: { username: string };
}

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProducts = async (searchTerm = '') => {
    try {
      const res = await productsAPI.getAll({ search: searchTerm || undefined });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const categoryColors: Record<string, string> = {
    'react-components': '#7C3AED',
    'node-packages': '#059669',
    'python-scripts': '#2563EB',
    'mobile-templates': '#DC2626',
    'ui-kits': '#D97706',
    'apis': '#0891B2',
    'tools': '#7C3AED',
    'blockchain': '#F59E0B',
    'other': '#6B7280',
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.cardTop}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColors[item.category] + '22' }]}>
          <Text style={[styles.categoryText, { color: categoryColors[item.category] || '#7C3AED' }]}>
            {item.category}
          </Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.seller}>@{item.seller?.username}</Text>
        <Text style={styles.downloads}>⬇️ {item.downloadsCount}</Text>
      </View>

      <View style={styles.tags}>
        {item.tags.slice(0, 3).map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⛓️ DevChain</Text>
          <Text style={styles.headerSub}>Developer Marketplace</Text>
        </View>
        <TouchableOpacity style={styles.sellBtn} onPress={() => navigation.navigate('CreateProduct')}>
          <Text style={styles.sellBtnText}>+ Sell</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, templates..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchProducts(search)}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(search); }}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
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
  header: { padding: 20, paddingTop: 50, backgroundColor: '#111', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellBtn: { backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sellBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#7C3AED' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  searchBox: { padding: 16, backgroundColor: '#111' },
  searchInput: {
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222'
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#111', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 12
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  seller: { fontSize: 12, color: '#555' },
  downloads: { fontSize: 12, color: '#555' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#1a1a1a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 11, color: '#555' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#555', marginTop: 8 },
});
