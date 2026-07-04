import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, { bg: string, text: string }> = {
  'Food & Dining': { bg: '#FFEDD5', text: '#EA580C' },
  'Groceries': { bg: '#DCFCE7', text: '#16A34A' },
  'Transport': { bg: '#DBEAFE', text: '#2563EB' },
  'Shopping': { bg: '#FCE7F3', text: '#DB2777' },
  'Entertainment': { bg: '#F3E8FF', text: '#9333EA' },
  'Bills': { bg: '#FEE2E2', text: '#DC2626' },
  'Health': { bg: '#CCFBF1', text: '#0D9488' },
  'Salary': { bg: '#D1FAE5', text: '#059669' },
  'Freelance': { bg: '#E0E7FF', text: '#4F46E5' },
  'Investments': { bg: '#CFFAFE', text: '#0891B2' },
  'Gifts': { bg: '#FFE4E6', text: '#E11D48' },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'Food & Dining': '🍔',
  'Groceries': '🛒',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Bills': '📄',
  'Health': '💊',
  'Salary': '💰',
  'Freelance': '💻',
  'Investments': '📈',
  'Gifts': '🎁',
  'Other': '📦',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a category name');
      } else {
        Alert.alert('Error', 'Please enter a category name');
      }
      return;
    }

    setAdding(true);
    try {
      await api.post('/categories', { 
        name: newCategoryName.trim(),
        type: newCategoryType
      });
      setNewCategoryName('');
      setShowAddModal(false);
      loadCategories();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to add category';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        await api.delete(`/categories/${id}`);
        loadCategories();
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Failed to delete category');
        } else {
          Alert.alert('Error', 'Failed to delete category');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: doDelete,
          },
        ]
      );
    }
  };

  const filteredCategories = categories.filter(cat => (cat.type || 'expense') === activeTab);

  const renderCategory = ({ item }: { item: Category }) => {
    const colors = CATEGORY_COLORS[item.name] || { bg: '#F3F4F6', text: '#374151' };
    const emoji = CATEGORY_EMOJIS[item.name] || '📦';

    return (
      <View style={styles.categoryItem}>
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() => handleDeleteCategory(item.id, item.name)}
        >
          <Feather name="trash-2" size={16} color={COLORS.inkSoft} />
        </TouchableOpacity>

        <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </View>
        <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setNewCategoryType(activeTab);
            setShowAddModal(true);
          }}
        >
          <Feather name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <View style={[
            styles.tabIndicator,
            { left: activeTab === 'expense' ? 4 : (width - 48 - 8) / 2 + 4 }
          ]} />
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('expense')}
          >
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <View style={styles.mascotInfo}>
            <View style={styles.mascotWrapper}>
              <Mascot mood="happy" size={48} />
            </View>
            <View style={styles.mascotContent}>
              <Text style={styles.mascotTitle}>Organize your flow</Text>
              <Text style={styles.mascotText}>
                Custom categories help Momo track your money better!
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity 
            style={styles.addCard}
            onPress={() => {
              setNewCategoryType(activeTab);
              setShowAddModal(true);
            }}
          >
            <View style={styles.addIconBox}>
              <Feather name="plus" size={24} color={COLORS.inkSoft} />
            </View>
            <Text style={styles.addCardText}>Add New</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : null}
      />

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {newCategoryType === 'income' ? 'Income' : 'Expense'} Category
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnAdd]}
                onPress={handleAddCategory}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnAddText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOW.soft,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  tabWrapper: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48.5%', // Slightly less than 50% to account for padding
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOW.soft,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
  },
  tabTextActive: {
    color: COLORS.ink,
  },
  listContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  mascotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...SHADOW.soft,
  },
  mascotWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotContent: {
    flex: 1,
  },
  mascotTitle: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  mascotText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    lineHeight: 18,
    marginTop: 2,
  },
  categoryItem: {
    width: (width - 48 - 16) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
    ...SHADOW.soft,
  },
  deleteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
  },
  addCard: {
    width: (width - 48 - 16) / 2,
    height: 140,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  addCardText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '80%',
    gap: 16,
    ...SHADOW.card,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnCancelText: {
    color: COLORS.inkSoft,
    fontSize: 16,
    fontFamily: FONTS.bodySemi,
  },
  modalBtnAdd: {
    backgroundColor: COLORS.primary,
  },
  modalBtnAddText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bodySemi,
  },
});

