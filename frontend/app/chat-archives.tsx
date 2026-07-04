import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface ArchiveSummary {
  id: string;
  archived_at: string;
  message_count: number;
  preview: string;
}

interface ArchiveMessage {
  id: string;
  role: string;
  text: string;
  created_at: string;
}

export default function ChatArchivesScreen() {
  const router = useRouter();
  const [archives, setArchives] = useState<ArchiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingArchive, setViewingArchive] = useState<ArchiveMessage[] | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      const response = await api.get('/chat/archives');
      setArchives(response.data.archives || []);
    } catch (error) {
      console.error('Failed to load chat archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const openArchive = async (id: string) => {
    setViewingLoading(true);
    try {
      const response = await api.get(`/chat/archives/${id}`);
      setViewingArchive(response.data.messages || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load this conversation');
    } finally {
      setViewingLoading(false);
    }
  };

  const deleteArchive = (id: string) => {
    Alert.alert('Delete Archive', 'This will permanently delete this archived conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/chat/archives/${id}`);
            setArchives((prev) => prev.filter((a) => a.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete archive');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Chat Archives</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
      ) : archives.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No archived conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Archive a conversation from the chat menu to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={archives}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.archiveCard} onPress={() => openArchive(item.id)}>
              <View style={styles.archiveIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#D32F2F" />
              </View>
              <View style={styles.archiveInfo}>
                <Text style={styles.archivePreview} numberOfLines={1}>{item.preview}</Text>
                <Text style={styles.archiveMeta}>
                  {new Date(item.archived_at).toLocaleDateString()} · {item.message_count} messages
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteArchive(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={viewingArchive !== null || viewingLoading} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setViewingArchive(null)}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Archived Chat</Text>
            <View style={{ width: 24 }} />
          </View>
          {viewingLoading ? (
            <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={viewingArchive || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                    {item.text}
                  </Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  list: { padding: 24 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  archiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  archiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveInfo: { flex: 1 },
  archivePreview: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  archiveMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  deleteBtn: { padding: 8 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#D32F2F', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start' },
  userText: { color: '#FFFFFF', fontSize: 14 },
  assistantText: { color: '#1F2937', fontSize: 14 },
});
