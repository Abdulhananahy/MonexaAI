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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [adding, setAdding] = useState(false);

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
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setAdding(true);
    try {
      await api.post('/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowAddModal(false);
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="pricetag" size={20} color="#D32F2F" />
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
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={28} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {showAddModal && (
        <View style={styles.addModal}>
          <View style={styles.addModalContent}>
            <Text style={styles.addModalTitle}>Add New Category</Text>
            <TextInput
              style={styles.addModalInput}
              placeholder="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
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

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
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
});