import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal
} from 'react-native';
import { productsAPI, ownershipAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  techStack: string[];
  downloadsCount: number;
  previewUrl: string | null;
  seller: { id: string; username: string; reputationScore: number };
}

interface OwnershipCert {
  hash: string;
  purchasedAt: string;
  product: { title: string };
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { user, isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [cert, setCert] = useState<OwnershipCert | null>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await productsAPI.getOne(productId);
      setProduct(res.data.product);
    } catch (err) {
      Alert.alert('Error', 'Failed to load product.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      window.alert('Please login to purchase products.');
      return;
    }
    if (product?.seller.id === user?.id) {
      window.alert("You can't buy your own product!");
      return;
    }
    const confirmed = window.confirm(`Buy "${product?.title}" for $${product?.price.toFixed(2)}? You'll receive a blockchain ownership certificate.`);
    if (!confirmed) return;
    setBuying(true);
    try {
      const res = await ownershipAPI.purchase(productId);
      setCert(res.data);
      setCertModal(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Purchase failed.';
      window.alert('Purchase Failed: ' + msg);
    } finally {
      setBuying(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) return null;

  const isOwner = product.seller.id === user?.id;
  const color = categoryColors[product.category] || '#7C3AED';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.categoryBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.categoryText, { color }]}>{product.category}</Text>
          </View>
        </View>

        {/* ── Title & Price ── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>

        {/* ── Seller ── */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>
              {product.seller.username[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.sellerName}>@{product.seller.username}</Text>
            <Text style={styles.sellerRep}>⭐ {product.seller.reputationScore} reputation</Text>
          </View>
          <View style={styles.downloadsBox}>
            <Text style={styles.downloadsNum}>{product.downloadsCount}</Text>
            <Text style={styles.downloadsLabel}>sales</Text>
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* ── Tech Stack ── */}
        {product.techStack?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tech Stack</Text>
            <View style={styles.chips}>
              {product.techStack.map(tech => (
                <View key={tech} style={[styles.chip, { borderColor: color }]}>
                  <Text style={[styles.chipText, { color }]}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tags ── */}
        {product.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.chips}>
              {product.tags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Blockchain Badge ── */}
        <View style={styles.blockchainBadge}>
          <Text style={styles.blockchainIcon}>🔐</Text>
          <View>
            <Text style={styles.blockchainTitle}>Blockchain Ownership Certificate</Text>
            <Text style={styles.blockchainDesc}>
              Every purchase generates a unique SHA-256 certificate proving your ownership — permanently on-chain.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Buy Button ── */}
      <View style={styles.buyBar}>
        {isOwner ? (
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerText}>✅ You own this product</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.buyBtn, buying && styles.buyBtnDisabled]}
            onPress={handleBuy}
            disabled={buying}
          >
            {buying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buyBtnText}>Buy for ${product.price.toFixed(2)}</Text>
                <Text style={styles.buyBtnSub}>Get ownership certificate</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Ownership Certificate Modal ── */}
      <Modal visible={certModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Purchase Successful!</Text>
            <Text style={styles.modalSubtitle}>Your ownership certificate is ready</Text>

            <View style={styles.certBox}>
              <Text style={styles.certLabel}>BLOCKCHAIN CERTIFICATE</Text>
              <Text style={styles.certProduct}>{cert?.product?.title || 'Product'}</Text>
              <View style={styles.certHashBox}>
                <Text style={styles.certHashLabel}>SHA-256 Hash</Text>
                <Text style={styles.certHash} numberOfLines={2}>{cert?.certificate?.ownershipHash}</Text>
              </View>
              <Text style={styles.certDate}>
                Issued: {cert?.purchasedAt || cert?.createdAt ? new Date(cert.purchasedAt).toLocaleString() : ''}
              </Text>
            </View>

            <Text style={styles.certNote}>
              Save this hash — it's your permanent proof of ownership on DevChain.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setCertModal(false); navigation.goBack(); }}
            >
              <Text style={styles.modalBtnText}>Awesome! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666', marginTop: 12 },
  scroll: { padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8 },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8, lineHeight: 32 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#7C3AED' },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 12, padding: 14, marginBottom: 20, gap: 12
  },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center'
  },
  sellerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  sellerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sellerRep: { color: '#666', fontSize: 12, marginTop: 2 },
  downloadsBox: { marginLeft: 'auto', alignItems: 'center' },
  downloadsNum: { color: '#7C3AED', fontWeight: 'bold', fontSize: 22 },
  downloadsLabel: { color: '#666', fontSize: 11 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#999', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  description: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  tagChip: { backgroundColor: '#1a1a1a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  tagChipText: { color: '#666', fontSize: 13 },
  blockchainBadge: {
    flexDirection: 'row', gap: 12, backgroundColor: '#0d0d1a',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#7C3AED33'
  },
  blockchainIcon: { fontSize: 28 },
  blockchainTitle: { color: '#7C3AED', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  blockchainDesc: { color: '#666', fontSize: 13, lineHeight: 18 },
  buyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1e1e1e'
  },
  buyBtn: {
    backgroundColor: '#7C3AED', borderRadius: 14, padding: 18, alignItems: 'center'
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buyBtnSub: { color: '#c4b5fd', fontSize: 12, marginTop: 2 },
  ownerBadge: {
    backgroundColor: '#05966922', borderRadius: 14, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#059669'
  },
  ownerText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: '#000000cc',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40
  },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  certBox: {
    backgroundColor: '#0d0d1a', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#7C3AED55', marginBottom: 16
  },
  certLabel: { fontSize: 10, color: '#7C3AED', fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  certProduct: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 14 },
  certHashBox: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginBottom: 10 },
  certHashLabel: { fontSize: 10, color: '#555', marginBottom: 4, fontWeight: '600' },
  certHash: { fontSize: 11, color: '#7C3AED', fontFamily: 'monospace', lineHeight: 16 },
  certDate: { fontSize: 12, color: '#555' },
  certNote: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalBtn: {
    backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center'
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
