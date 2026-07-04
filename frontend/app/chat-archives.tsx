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
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Chat Archives</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : archives.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="archive-outline" size={64} color={COLORS.primarySoft} />
          </View>
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.archiveCard} onPress={() => openArchive(item.id)}>
              <View style={[styles.archiveIcon, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.archiveInfo}>
                <Text style={styles.archivePreview} numberOfLines={1}>{item.preview}</Text>
                <Text style={styles.archiveMeta}>
                  {new Date(item.archived_at).toLocaleDateString()} · {item.message_count} messages
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteArchive(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={viewingArchive !== null || viewingLoading} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setViewingArchive(null)}>
              <Ionicons name="close" size={24} color={COLORS.ink} />
            </TouchableOpacity>
            <Text style={styles.title}>Archived Chat</Text>
            <View style={{ width: 40 }} />
          </View>
          {viewingLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={viewingArchive || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  title: { fontSize: 24, fontFamily: FONTS.display, color: COLORS.ink },
  list: { padding: 24 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOW.soft,
  },
  emptyText: { fontSize: 20, fontFamily: FONTS.display, color: COLORS.ink, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.inkSoft, marginTop: 8, textAlign: 'center' },
  archiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    ...SHADOW.soft,
  },
  archiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveInfo: { flex: 1 },
  archivePreview: { fontSize: 16, fontFamily: FONTS.bodyBold, color: COLORS.ink },
  archiveMeta: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.inkSoft, marginTop: 4 },
  deleteBtn: { padding: 8, backgroundColor: COLORS.expenseSoft, borderRadius: 12 },
  messageBubble: { padding: 16, borderRadius: 20, marginBottom: 12, maxWidth: '85%', ...SHADOW.soft },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: COLORS.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userText: { color: COLORS.white, fontSize: 15, fontFamily: FONTS.body },
  assistantText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.body },
});
