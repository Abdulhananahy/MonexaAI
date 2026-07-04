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
import { COLORS, RADIUS, SHADOW, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCurrencySymbol } from '../utils/format';

interface Category {
  id: string;
  name: string;
  type: string;
}

// Common income sources
const INCOME_SOURCES = [
  { id: 'salary', name: 'Salary', icon: '💼' },
  { id: 'freelance', name: 'Freelance', icon: '💻' },
  { id: 'business', name: 'Business', icon: '🏢' },
  { id: 'investment', name: 'Investment', icon: '📈' },
  { id: 'rental', name: 'Rental', icon: '🏠' },
  { id: 'gift', name: 'Gift', icon: '🎁' },
  { id: 'bonus', name: 'Bonus', icon: '🧧' },
  { id: 'other', name: 'Other', icon: '✨' },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
      setIncomeSource(INCOME_SOURCES[0].name);
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.title}>New Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.typeSelectorContainer}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonExpenseActive,
                ]}
                onPress={() => setType('expense')}
              >
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
                  type === 'income' && styles.typeButtonIncomeActive,
                ]}
                onPress={() => setType('income')}
              >
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
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.labelAmount}>Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: type === 'expense' ? COLORS.expense : COLORS.income }]}>{getCurrencySymbol(user?.currency)}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.inkSoft + '40'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/categories' as any)}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {categories.filter(cat => (cat.type || 'expense') === type).length > 0 ? (
                categories.filter(cat => (cat.type || 'expense') === type).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      categoryId === cat.name && (type === 'expense' ? styles.categoryCardExpenseActive : styles.categoryCardIncomeActive),
                    ]}
                    onPress={() => setCategoryId(cat.name)}
                  >
                    <Text style={styles.categoryEmoji}>
                      {type === 'income' ? '💰' : '💸'}
                    </Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        categoryId === cat.name && styles.categoryLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noCategoriesText}>
                  No {type} categories found.
                </Text>
              )}
            </View>

            {type === 'income' && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Income Source</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.sourceList}>
                    {INCOME_SOURCES.map((source) => (
                      <TouchableOpacity
                        key={source.id}
                        style={[
                          styles.sourceChip,
                          incomeSource === source.name && styles.sourceChipActive,
                        ]}
                        onPress={() => setIncomeSource(source.name)}
                      >
                        <Text style={styles.sourceEmoji}>{source.icon}</Text>
                        <Text
                          style={[
                            styles.sourceChipText,
                            incomeSource === source.name && styles.sourceChipTextActive,
                          ]}
                        >
                          {source.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.inkSoft + '80'}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: type === 'expense' ? COLORS.expense : COLORS.income }
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                Save {type === 'expense' ? 'Expense' : 'Income'}
              </Text>
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
    backgroundColor: COLORS.bg,
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 2 },
    }),
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  content: {
    flex: 1,
  },
  typeSelectorContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 30,
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 2 },
    }),
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
  },
  typeButtonExpenseActive: {
    backgroundColor: COLORS.expense,
  },
  typeButtonIncomeActive: {
    backgroundColor: COLORS.income,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.inkSoft,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  labelAmount: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 32,
    fontFamily: FONTS.display,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    minWidth: 150,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    padding: 24,
    paddingBottom: 120,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#4C3F91',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (Platform.OS === 'web' ? 100 : 96),
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardExpenseActive: {
    backgroundColor: COLORS.expenseSoft,
    borderColor: COLORS.expense,
  },
  categoryCardIncomeActive: {
    backgroundColor: COLORS.incomeSoft,
    borderColor: COLORS.income,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: COLORS.ink,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  sourceList: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
  },
  sourceChipActive: {
    backgroundColor: COLORS.primarySoft,
  },
  sourceEmoji: {
    fontSize: 16,
  },
  sourceChipText: {
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
  },
  sourceChipTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
    minHeight: 56,
  },
  noCategoriesText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  saveButton: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOW.card,
      android: { ...SHADOW.card, elevation: 4 },
    }),
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
  },
});