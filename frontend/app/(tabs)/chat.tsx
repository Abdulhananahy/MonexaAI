import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

interface ChatMessage {
  id: string;
  role: string;
  text: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const suggestedPrompts = [
    "Am I on track this month?",
    "How much did I spend on food?",
    "Set a $200 budget for groceries",
    "Analyze my recent spending"
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await api.get('/chat/history');
      const history = response.data;
      
      // If no chat history, add a friendly welcome message
      if (history.length === 0) {
        const welcomeMessage = {
          id: 'welcome',
          role: 'assistant',
          text: "Hi there! 👋 I'm Momo, your financial wing-owl. What can I help you with today?",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setInitialLoad(false);
    }
  };

  const handleNewChat = () => {
    Alert.alert(
      'Start New Chat',
      'What would you like to do with the current conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive & Start New',
          onPress: async () => {
            try {
              await api.post('/chat/archive');
              setMessages([]);
              Alert.alert('Success', 'Previous chat archived. Starting fresh!');
              setShowMenu(false);
              loadChatHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to archive chat');
            }
          },
        },
        {
          text: 'Delete & Start New',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/chat/history');
              setMessages([]);
              Alert.alert('Success', 'Chat deleted. Starting fresh!');
              setShowMenu(false);
              loadChatHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  const handleViewArchives = () => {
    setShowMenu(false);
    router.push('/chat-archives' as any);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/chat/history');
              setMessages([]);
              Alert.alert('Success', 'Chat history cleared');
              setShowMenu(false);
              loadChatHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear chat');
            }
          },
        },
      ]
    );
  };

  const sendMessage = async (text?: string) => {
    const messageToSend = text || inputText;
    if (!messageToSend.trim() || loading) return;

    const userMessage = messageToSend.trim();
    if (!text) setInputText('');

    // Add user message to UI
    const tempUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    setLoading(true);
    try {
      const response = await api.post('/chat', { message: userMessage });
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.data.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageWrapper,
      item.role === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper
    ]}>
      {item.role !== 'user' && (
        <View style={styles.mascotBubbleContainer}>
          <Mascot mood={messages.indexOf(item) === 0 ? "waving" : "happy"} size={32} />
        </View>
      )}
      <View
        style={[
          styles.messageContainer,
          item.role === 'user' ? styles.userMessage : styles.aiMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  if (initialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <View style={styles.mascotContainer}>
            <Mascot mood="happy" size={42} />
            <View style={styles.onlineStatus} />
          </View>
          <View>
            <Text style={styles.title}>Monexa</Text>
            <Text style={styles.statusText}>Always online ✨</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleNewChat}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.ink} />
              <Text style={styles.menuItemText}>Start New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Clear History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Ionicons name="close-circle-outline" size={20} color={COLORS.inkSoft} />
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Mascot mood="thinking" size={120} />
            <Text style={styles.emptyStateText}>Start a conversation</Text>
            <Text style={styles.emptyStateSubtext}>
              Ask me about your spending, budgets, or financial insights
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.bottomSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={suggestedPrompts}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.promptChip}
                onPress={() => sendMessage(item)}
              >
                <Text style={styles.promptText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            style={styles.promptsList}
            contentContainerStyle={styles.promptsContainer}
          />
          <View style={styles.inputOuterContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask Momo anything..."
                placeholderTextColor={COLORS.inkSoft}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!inputText.trim() || loading) && styles.sendButtonDisabled,
                  inputText.trim() && { backgroundColor: COLORS.primary }
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? COLORS.white : COLORS.primary} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(251, 247, 241, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primarySoft,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    marginLeft: -8,
    padding: 4,
  },
  mascotContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.bgElevated,
    position: 'relative',
    overflow: 'hidden',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.income,
    borderWidth: 2,
    borderColor: COLORS.bgElevated,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    lineHeight: 24,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.income,
    fontFamily: FONTS.bodyMedium,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  mascotBubbleContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  messageContainer: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOW.soft,
  },
  userMessage: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 8,
  },
  aiMessage: {
    backgroundColor: COLORS.primarySoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  userMessageText: {
    color: COLORS.white,
  },
  aiMessageText: {
    color: COLORS.ink,
  },
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    backgroundColor: 'transparent',
  },
  promptsList: {
    maxHeight: 50,
    marginBottom: 8,
  },
  promptsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    ...SHADOW.soft,
  },
  promptText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontFamily: FONTS.bodyMedium,
  },
  inputOuterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bgElevated,
    borderRadius: 32,
    padding: 6,
    ...SHADOW.card,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  menuContainer: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.card,
    padding: 8,
    ...SHADOW.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
    marginLeft: 12,
  },
  menuItemDanger: {
    color: COLORS.expense,
  },
});