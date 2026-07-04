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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { format, parseISO } from 'date-fns';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';

interface Category {
  id: string;
  name: string;
  type: string;
}

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

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [categoriesRes, transactionsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/transactions'),
      ]);
      setCategories(categoriesRes.data);

      const txn = transactionsRes.data.find((t: any) => t.id === id);
      if (!txn) {
        Alert.alert('Error', 'Transaction not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setType(txn.type);
      setAmount(String(txn.amount));
      setCategoryId(txn.category_name);
      setIncomeSource(txn.income_source || '');
      setNote(txn.note || '');
      try {
        setDate(parseISO(txn.date));
      } catch {
        setDate(new Date());
      }
    } catch (error) {
      console.error('Failed to load transaction:', error);
      Alert.alert('Error', 'Failed to load transaction');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please fill in amount');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
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
        category_name: categoryId,
        date: format(date, 'yyyy-MM-dd'),
        note: note || null,
      };

      if (type === 'income' && incomeSource) {
        payload.income_source = incomeSource;
      }

      await api.put(`/transactions/${id}`, payload);
      Alert.alert('Success', 'Transaction updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/transactions/${id}`);
              router.back();
            } catch (error) {
              console.error('Failed to delete transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
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
            style={styles.headerIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Transaction</Text>
          <TouchableOpacity 
            style={[styles.headerIconButton, { backgroundColor: COLORS.expenseSoft }]}
            onPress={handleDelete} 
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={COLORS.expense} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
            )}
          </TouchableOpacity>
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
              <Text style={[styles.currencyPrefix, { color: type === 'expense' ? COLORS.expense : COLORS.income }]}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.inkSoft + '40'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
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
              {categories
                .filter((cat) => (cat.type || 'expense') === type)
                .map((cat) => (
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
                ))}
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

            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Date</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>{format(date, 'MMM dd, yyyy')}</Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.inkSoft} />
            </View>

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
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  headerIconButton: {
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
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
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
