import { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { chatAPI } from '../services/api';

interface Sender {
  id: string;
  username: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: Sender;
}

export default function ChatThreadScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { conversationId, otherUser } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: `@${otherUser.username}` });
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await chatAPI.getMessages(conversationId);
      setMessages(res.data.messages ?? []);
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');

    const optimistic: Message = {
      id: 'temp-' + Date.now(),
      conversationId,
      senderId: user?.id ?? '',
      content,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id ?? '', username: user?.username ?? '' },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      setSending(true);
      const res = await chatAPI.sendMessage(conversationId, { content });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? res.data.message : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isOwn ? styles.ownRow : styles.otherRow]}>
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.msgText, isOwn && { color: '#fff' }]}>{item.content}</Text>
        </View>
        <Text style={[styles.msgTime, isOwn ? { textAlign: 'right' } : { textAlign: 'left' }]}>
          {item.sender.username}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 15 }}>No messages yet. Say hello!</Text>
          </View>
        }
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  msgRow: { marginBottom: 12, maxWidth: '80%' },
  ownRow: { alignSelf: 'flex-end' },
  otherRow: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  ownBubble: { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#222', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: '#ddd', lineHeight: 20 },
  msgTime: { fontSize: 10, color: '#555', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: '#1e1e1e',
  },
  input: {
    flex: 1, backgroundColor: '#151515', borderRadius: 10,
    padding: 12, color: '#fff', fontSize: 15,
    maxHeight: 100, borderWidth: 1, borderColor: '#1e1e1e',
  },
  sendBtn: {
    backgroundColor: '#7C3AED', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
