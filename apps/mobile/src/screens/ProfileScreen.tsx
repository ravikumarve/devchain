import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.repBadge}>
          <Text style={styles.repText}>⭐ {user?.reputationScore} Reputation</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Purchases</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>My Products</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🧾</Text>
          <Text style={styles.menuText}>My Purchases</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💼</Text>
          <Text style={styles.menuText}>My Jobs</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuText}>My Proposals</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { alignItems: 'center', padding: 32, paddingTop: 60, backgroundColor: '#111' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  repBadge: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  repText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  stats: {
    flexDirection: 'row', backgroundColor: '#111', marginTop: 1,
    padding: 20, justifyContent: 'space-around'
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222' },
  menu: { padding: 16, marginTop: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    padding: 16, borderRadius: 12, marginBottom: 8
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#555' },
  logoutBtn: {
    margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DC2626'
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
});
