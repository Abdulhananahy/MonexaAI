import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  type: string;
}

// Common income sources
const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Gift',
  'Bonus',
  'Other',
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Reset selection when type changes - treat missing type as 'expense'
    const filteredCats = categories.filter(c => (c.type || 'expense') === type);
    if (type === 'income') {
      setIncomeSource(INCOME_SOURCES[0]);
      setCategoryId(filteredCats.length > 0 ? filteredCats[0].name : '');
    } else {
      setCategoryId(filteredCats.length > 0 ? filteredCats[0].name : '');
      setIncomeSource('');
    }
  }, [type, categories]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      const expenseCategories = response.data.filter((c: Category) => c.type === 'expense');
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].name);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please fill in amount');
      return;
    }

    if (!categoryId) {
      const msg = `Please select a category or create one in Profile → Categories first`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        type,
        amount: numAmount,
        date: format(date, 'yyyy-MM-dd'),
        note: note || null,
      };

      payload.category_name = categoryId;
      if (type === 'income' && incomeSource) {
        payload.income_source = incomeSource;
      }

      await api.post('/transactions', payload);
      Alert.alert('Success', 'Transaction added successfully');
      router.back();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActive,
              ]}
              onPress={() => setType('expense')}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={type === 'expense' ? '#FFFFFF' : '#EF4444'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActive,
              ]}
              onPress={() => setType('income')}
            >
              <Ionicons
                name="arrow-down"
                size={20}
                color={type === 'income' ? '#FFFFFF' : '#10B981'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryList}>
                  {categories.filter(cat => (cat.type || 'expense') === type).length > 0 ? (
                    categories.filter(cat => (cat.type || 'expense') === type).map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          categoryId === cat.name && styles.categoryChipActive,
                        ]}
                        onPress={() => setCategoryId(cat.name)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            categoryId === cat.name && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noCategoriesText}>
                      No {type} categories. Add one in Profile → Categories.
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>

            {type === 'income' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Income Source (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryList}>
                    {INCOME_SOURCES.map((source) => (
                      <TouchableOpacity
                        key={source}
                        style={[
                          styles.categoryChip,
                          incomeSource === source && styles.categoryChipActive,
                        ]}
                        onPress={() => setIncomeSource(source)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            incomeSource === source && styles.categoryChipTextActive,
                          ]}
                        >
                          {source}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Text style={styles.dateText}>{format(date, 'MMM dd, yyyy')}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note..."
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#1F2937',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});