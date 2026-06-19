// src/screens/ProductDetailScreen.tsx
// Updated — Buy button now calls real orders API
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { productsAPI, ownershipAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  tech_stack: string[];
  download_count: number;
  rating: number;
  review_count: number;
  preview_url: string | null;
  blockchain_cert_id: string | null;
  seller: {
    id: string;
    username: string;
    display_name: string;
    is_verified: boolean;
    rating: number;
    total_sales: number;
  };
}

interface PurchaseResult {
  order: { id: string; amount: number; currency: string; status: string };
  certificate: {
    certId: string;
    txHash: string;
    chain: string;
    issuedAt: string;
  } | null;
  product: { id: string; title: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  template: '#7C3AED', tool: '#059669', library: '#2563EB',
  script: '#DC2626', component: '#D97706', api: '#0891B2', other: '#6B7280',
};

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { user, isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);

  useEffect(() => { fetchProduct(); }, []);

  const fetchProduct = async () => {
    try {
      const res = await productsAPI.getOne(productId);
      setProduct(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load product.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    if (currency === 'INR') return `₹${(price / 100).toFixed(0)}`;
    return `$${(price / 100).toFixed(2)}`;
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to purchase products.');
      return;
    }
    if (product?.seller.id === user?.id) {
      Alert.alert('Error', "You can't buy your own product!");
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy "${product?.title}" for ${formatPrice(product?.price || 0, product?.currency || 'USD')}?\n\nYou'll receive a blockchain ownership certificate instantly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now 🚀', onPress: processPurchase },
      ]
    );
  };

  const processPurchase = async () => {
    setBuying(true);
    try {
      const res = await ownershipAPI.purchase({ productId: product!.id });
      const result = res.data as PurchaseResult;
      setPurchaseResult(result);
      setCertModal(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Purchase failed. Please try again.';
      Alert.alert('Purchase Failed', msg);
    } finally {
      setBuying(false);
    }
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
  const color = CATEGORY_COLORS[product.category] || '#7C3AED';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.categoryBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.categoryText, { color }]}>{product.category}</Text>
          </View>
        </View>

        {/* Title & Price */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
        </View>

        {/* Seller */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>
              {product.seller.username[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerName}>
              @{product.seller.username}
              {product.seller.is_verified ? ' ✓' : ''}
            </Text>
            {product.seller.rating > 0 && (
              <Text style={styles.sellerRep}>⭐ {product.seller.rating.toFixed(1)} rating</Text>
            )}
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsNum}>{product.download_count}</Text>
            <Text style={styles.statsLabel}>sales</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Tech Stack */}
        {product.tech_stack?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tech Stack</Text>
            <View style={styles.chips}>
              {product.tech_stack.map(tech => (
                <View key={tech} style={[styles.chip, { borderColor: color }]}>
                  <Text style={[styles.chipText, { color }]}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
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

        {/* Blockchain badge */}
        <View style={styles.blockchainBadge}>
          <Text style={styles.blockchainIcon}>⛓️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockchainTitle}>Blockchain Ownership Certificate</Text>
            <Text style={styles.blockchainDesc}>
              Every purchase generates a unique certificate proving your ownership — permanently recorded.
            </Text>
            {product.blockchain_cert_id && (
              <Text style={styles.certId}>{product.blockchain_cert_id}</Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Buy Button */}
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
                <Text style={styles.buyBtnText}>
                  Buy for {formatPrice(product.price, product.currency)}
                </Text>
                <Text style={styles.buyBtnSub}>Get blockchain ownership certificate</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Success Modal */}
      <Modal visible={certModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 Purchase Successful!</Text>
            <Text style={styles.modalSubtitle}>Your ownership certificate has been issued</Text>

            {purchaseResult?.certificate && (
              <View style={styles.certBox}>
                <Text style={styles.certLabel}>⛓️ BLOCKCHAIN CERTIFICATE</Text>
                <Text style={styles.certProduct}>{purchaseResult.product.title}</Text>

                <View style={styles.certHashBox}>
                  <Text style={styles.certHashLabel}>CERTIFICATE ID</Text>
                  <Text style={styles.certHash}>{purchaseResult.certificate.certId}</Text>
                </View>

                <View style={styles.certHashBox}>
                  <Text style={styles.certHashLabel}>TRANSACTION HASH</Text>
                  <Text style={styles.certHash} numberOfLines={2}>
                    {purchaseResult.certificate.txHash}
                  </Text>
                </View>

                <View style={styles.certRow}>
                  <Text style={styles.certMeta}>Chain: {purchaseResult.certificate.chain}</Text>
                  <Text style={styles.certMeta}>
                    {new Date(purchaseResult.certificate.issuedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.certNote}>
              Save your certificate ID — it's your permanent proof of ownership on DevChain.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setCertModal(false);
                navigation.goBack();
              }}
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
  categoryText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8, lineHeight: 32 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#7C3AED' },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 12, padding: 14, marginBottom: 20, gap: 12,
  },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
  },
  sellerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  sellerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sellerRep: { color: '#666', fontSize: 12, marginTop: 2 },
  statsBox: { alignItems: 'center' },
  statsNum: { color: '#7C3AED', fontWeight: 'bold', fontSize: 20 },
  statsLabel: { color: '#666', fontSize: 11 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 10,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  description: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  tagChip: { backgroundColor: '#1a1a1a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  tagChipText: { color: '#666', fontSize: 13 },
  blockchainBadge: {
    flexDirection: 'row', gap: 12, backgroundColor: '#0d0d1a',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#7C3AED33',
  },
  blockchainIcon: { fontSize: 28 },
  blockchainTitle: { color: '#7C3AED', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  blockchainDesc: { color: '#666', fontSize: 13, lineHeight: 18 },
  certId: { color: '#7C3AED', fontSize: 11, fontFamily: 'monospace', marginTop: 6, opacity: 0.7 },
  buyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1e1e1e',
  },
  buyBtn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 18, alignItems: 'center' },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buyBtnSub: { color: '#c4b5fd', fontSize: 12, marginTop: 2 },
  ownerBadge: {
    backgroundColor: '#05966922', borderRadius: 14, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#059669',
  },
  ownerText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  certBox: {
    backgroundColor: '#0d0d1a', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#7C3AED55', marginBottom: 16,
  },
  certLabel: { fontSize: 10, color: '#7C3AED', fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  certProduct: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 14 },
  certHashBox: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginBottom: 8 },
  certHashLabel: { fontSize: 10, color: '#555', marginBottom: 4, fontWeight: '600', letterSpacing: 1 },
  certHash: { fontSize: 11, color: '#7C3AED', fontFamily: 'monospace', lineHeight: 16 },
  certRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  certMeta: { fontSize: 11, color: '#555' },
  certNote: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalBtn: { backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
