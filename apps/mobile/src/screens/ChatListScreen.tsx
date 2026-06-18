import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { chatAPI } from '../services/api';

interface OtherUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(iso).toLocaleDateString();
}

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data.conversations ?? []);
    } catch (err) {
      console.error('Chat list load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.convItem}
      onPress={() => navigation.navigate('ChatThread', { conversationId: item.id, otherUser: item.otherUser })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.otherUser.username[0].toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.username}>@{item.otherUser.username}</Text>
          {item.lastMessage && (
            <Text style={styles.time}>{relativeTime(item.lastMessage.createdAt)}</Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessage
            ? item.lastMessage.content.substring(0, 60)
            : 'No messages yet'}
        </Text>
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
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7C3AED" />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No conversations yet</Text>
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
  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#151515', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1e1e1e',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  username: { fontSize: 15, fontWeight: '600', color: '#fff' },
  time: { fontSize: 11, color: '#555' },
  preview: { fontSize: 13, color: '#888', marginTop: 2 },
});
