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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

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

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        <View style={[styles.iconContainer, activeTab === 'income' ? styles.incomeIconBg : styles.expenseIconBg]}>
          <Ionicons 
            name={activeTab === 'income' ? 'arrow-down' : 'pricetag'} 
            size={20} 
            color={activeTab === 'income' ? '#10B981' : '#D32F2F'} 
          />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteCategory(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={() => {
          setNewCategoryType(activeTab);
          setShowAddModal(true);
        }}>
          <Ionicons name="add" size={28} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeIncomeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeIncomeTabText]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {showAddModal && (
        <View style={styles.addModal}>
          <View style={styles.addModalContent}>
            <Text style={styles.addModalTitle}>
              Add {newCategoryType === 'income' ? 'Income' : 'Expense'} Category
            </Text>
            <TextInput
              style={styles.addModalInput}
              placeholder="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, newCategoryType === 'expense' && styles.typeButtonActiveExpense]}
                onPress={() => setNewCategoryType('expense')}
              >
                <Text style={[styles.typeButtonText, newCategoryType === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, newCategoryType === 'income' && styles.typeButtonActiveIncome]}
                onPress={() => setNewCategoryType('income')}
              >
                <Text style={[styles.typeButtonText, newCategoryType === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addModalButtons}>
              <TouchableOpacity
                style={[styles.addModalButton, styles.addModalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.addModalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addModalButton, styles.addModalButtonAdd]}
                onPress={handleAddCategory}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addModalButtonAddText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {filteredCategories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name={activeTab === 'income' ? 'arrow-down-circle-outline' : 'pricetag-outline'} 
            size={64} 
            color="#E5E7EB" 
          />
          <Text style={styles.emptyStateText}>
            No {activeTab} categories yet
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Tap + to add your first {activeTab} category
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FEE2E2',
  },
  activeIncomeTab: {
    backgroundColor: '#D1FAE5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#D32F2F',
  },
  activeIncomeTabText: {
    color: '#10B981',
  },
  listContainer: {
    padding: 24,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconBg: {
    backgroundColor: '#FEE2E2',
  },
  incomeIconBg: {
    backgroundColor: '#D1FAE5',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  addModal: {
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
  addModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addModalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#D32F2F',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  addModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addModalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  addModalButtonCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  addModalButtonAdd: {
    backgroundColor: '#D32F2F',
  },
  addModalButtonAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
