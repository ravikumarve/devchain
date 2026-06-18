// src/screens/ProfileScreen.tsx — Fixed scroll + logout
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import api, { ordersAPI, certificatesAPI } from '../services/api';

interface ProfileStats {
  products: number;
  sales: number;
  purchases: number;
  certificates: number;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_verified: boolean;
  rating: number;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  stats: ProfileStats;
}

interface Certificate {
  cert_id: string;
  chain: string;
  tx_hash: string;
  issued_at: string;
  product: { title: string; category: string };
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  order_items: Array<{ product: { title: string; category: string } }>;
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchases' | 'certificates' | 'settings'>('purchases');

  const fetchProfile = async () => {
    try {
      const [profileRes, ordersRes, certsRes] = await Promise.all([
        api.get('/users/me'),
        ordersAPI.getAll(),
        certificatesAPI.mine(),
      ]);
      setProfile(profileRes.data.data);
      setOrders(ordersRes.data.data?.items || []);
      setCertificates(certsRes.data.data || []);
    } catch (err) {
      console.error('[ProfileScreen] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ─── FIXED LOGOUT ────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // For web — force reload to clear all state
            if (Platform.OS === 'web') {
              window.location.href = '/';
            }
          },
        },
      ]
    );
  };

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'INR') return `₹${(amount / 100).toFixed(0)}`;
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  const displayUser = profile || user;
  const stats = profile?.stats || { products: 0, sales: 0, purchases: 0, certificates: 0 };

  return (
    // ─── FIXED: contentContainerStyle with minHeight for web scroll ───
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchProfile(); }}
          tintColor="#7C3AED"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayUser?.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>
          {profile?.display_name || displayUser?.username}
          {profile?.is_verified ? ' ✓' : ''}
        </Text>
        <Text style={styles.username}>@{displayUser?.username}</Text>
        <Text style={styles.email}>{displayUser?.email}</Text>

        <View style={[styles.roleBadge, profile?.role === 'seller' && styles.roleBadgeSeller]}>
          <Text style={styles.roleText}>
            {profile?.role === 'seller' ? '🛍️ Seller' : profile?.role === 'admin' ? '⚡ Admin' : '🛒 Buyer'}
          </Text>
        </View>

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.socialRow}>
          {profile?.github_url && <Text style={styles.socialLink}>GitHub</Text>}
          {profile?.twitter_url && <Text style={styles.socialLink}>Twitter</Text>}
          {profile?.website_url && <Text style={styles.socialLink}>Website</Text>}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.products}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.sales}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.purchases}</Text>
          <Text style={styles.statLabel}>Purchases</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.certificates}</Text>
          <Text style={styles.statLabel}>Certs</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['purchases', 'certificates', 'settings'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'purchases' ? '🧾 Purchases' : tab === 'certificates' ? '⛓️ Certs' : '⚙️ Settings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>

        {activeTab === 'purchases' && (
          orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyText}>No purchases yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.emptyLink}>Browse marketplace →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {orders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderTop}>
                    <Text style={styles.orderTitle} numberOfLines={1}>
                      {order.order_items?.[0]?.product?.title || 'Product'}
                    </Text>
                    <Text style={styles.orderAmount}>
                      {formatPrice(order.amount, order.currency)}
                    </Text>
                  </View>
                  <View style={styles.orderBottom}>
                    <View style={[styles.statusBadge,
                      order.status === 'completed' ? styles.statusCompleted : styles.statusRefunded
                    ]}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'certificates' && (
          certificates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⛓️</Text>
              <Text style={styles.emptyText}>No certificates yet</Text>
              <Text style={styles.emptySubText}>Purchase a product to get your first ownership certificate</Text>
            </View>
          ) : (
            <>
              {certificates.map(cert => (
                <View key={cert.cert_id} style={styles.certCard}>
                  <Text style={styles.certLabel}>⛓️ OWNERSHIP CERTIFICATE</Text>
                  <Text style={styles.certTitle}>{cert.product?.title}</Text>
                  <View style={styles.certHashBox}>
                    <Text style={styles.certHashLabel}>CERTIFICATE ID</Text>
                    <Text style={styles.certHash}>{cert.cert_id}</Text>
                  </View>
                  <View style={styles.certHashBox}>
                    <Text style={styles.certHashLabel}>TX HASH</Text>
                    <Text style={styles.certHash} numberOfLines={1}>{cert.tx_hash}</Text>
                  </View>
                  <View style={styles.certFooter}>
                    <Text style={styles.certChain}>{cert.chain}</Text>
                    <Text style={styles.certDate}>
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'settings' && (
          <View>
            {(profile?.role === 'seller' || profile?.role === 'admin') && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('CreateProduct')}
              >
                <Text style={styles.menuIcon}>📦</Text>
                <Text style={styles.menuText}>My Products</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>✏️</Text>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Change Password</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  // ─── KEY FIX: flexGrow:1 enables proper scroll on web ───
  contentContainer: { flexGrow: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', padding: 32, paddingTop: 60, backgroundColor: '#111' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 14, color: '#7C3AED', marginTop: 2 },
  email: { fontSize: 13, color: '#555', marginTop: 4 },
  roleBadge: {
    backgroundColor: '#1a1a1a', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
  },
  roleBadgeSeller: { backgroundColor: '#7C3AED22', borderWidth: 1, borderColor: '#7C3AED44' },
  roleText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  bio: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 20 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  socialLink: { color: '#7C3AED', fontSize: 13, fontWeight: '600' },
  stats: {
    flexDirection: 'row', backgroundColor: '#111', marginTop: 1,
    padding: 20, justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222' },
  tabs: { flexDirection: 'row', backgroundColor: '#111', marginTop: 1 },
  tab: { flex: 1, padding: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#7C3AED' },
  tabContent: { padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#555', textAlign: 'center' },
  emptyLink: { color: '#7C3AED', fontSize: 14, fontWeight: '600', marginTop: 8 },
  orderCard: {
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 10,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderTitle: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600', marginRight: 8 },
  orderAmount: { fontSize: 16, fontWeight: 'bold', color: '#7C3AED' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusCompleted: { backgroundColor: '#05966922' },
  statusRefunded: { backgroundColor: '#DC262622' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669', textTransform: 'uppercase' },
  orderDate: { fontSize: 12, color: '#555' },
  certCard: {
    backgroundColor: '#0d0d1a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#7C3AED33', marginBottom: 10,
  },
  certLabel: { fontSize: 10, color: '#7C3AED', fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  certTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  certHashBox: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 10, marginBottom: 6 },
  certHashLabel: { fontSize: 9, color: '#555', fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  certHash: { fontSize: 11, color: '#7C3AED', fontFamily: 'monospace' },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  certChain: { fontSize: 11, color: '#555', textTransform: 'uppercase' },
  certDate: { fontSize: 11, color: '#555' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    padding: 16, borderRadius: 12, marginBottom: 8,
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#555' },
  logoutBtn: {
    marginTop: 16, backgroundColor: '#1a1a1a', borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DC2626',
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
});
