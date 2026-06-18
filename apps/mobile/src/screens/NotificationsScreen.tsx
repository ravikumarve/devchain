import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { notificationsAPI } from '../services/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  proposal_received: '📩',
  proposal_accepted: '✅',
  proposal_rejected: '❌',
  new_sale: '💰',
  new_review: '⭐',
  escrow_funded: '🔒',
  release_requested: '🔓',
  payment_released: '💸',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await notificationsAPI.getMy();
      setNotifications(res.data.notifications ?? []);
    } catch (err) {
      console.error('Notifications load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await notificationsAPI.delete(id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch {}
      }},
    ]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.isRead && styles.unread]}
      onPress={() => handleMarkRead(item.id)}
      onLongPress={() => handleDelete(item.id)}
    >
      <Text style={styles.icon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        {item.message && <Text style={styles.message}>{item.message}</Text>}
        <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7C3AED" />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 16 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#151515', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1e1e1e',
  },
  unread: { borderColor: '#7C3AED' },
  icon: { fontSize: 24 },
  title: { fontSize: 14, fontWeight: '600', color: '#ddd', marginBottom: 2 },
  unreadText: { color: '#fff', fontWeight: '700' },
  message: { fontSize: 12, color: '#888', marginBottom: 4 },
  time: { fontSize: 11, color: '#555' },
});
