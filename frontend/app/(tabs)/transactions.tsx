import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_name: string;
  date: string;
  note?: string;
  income_source?: string;
}

interface GroupedTransactions {
  [date: string]: {
    transactions: Transaction[];
    totalIncome: number;
    totalExpense: number;
    isExpanded: boolean;
  };
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadExportEntitlement();
    }, [])
  );

  const loadExportEntitlement = async () => {
    try {
      const response = await api.get('/subscription/usage');
      setExportEnabled(!!response.data.export_enabled);
    } catch (error) {
      console.error('Failed to load export entitlement:', error);
    }
  };

  const handleExport = async () => {
    if (!exportEnabled) {
      Alert.alert(
        'Pro Feature',
        'CSV export is available on the Pro plan. Upgrade to export your transactions.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/upgrade' as any) },
        ]
      );
      return;
    }

    setExporting(true);
    try {
      if (Platform.OS === 'web') {
        const response = await api.get('/transactions/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `monexa_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const FileSystem = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        const response = await api.get('/transactions/export');
        const fileUri = FileSystem.documentDirectory + `monexa_transactions_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, response.data, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Exported', `CSV saved to ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      const txns = response.data;
      setTransactions(txns);
      groupTransactionsByDate(txns);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupTransactionsByDate = (txns: Transaction[]) => {
    const grouped: GroupedTransactions = {};
    
    // First filter by search and type
    const filtered = txns.filter(txn => {
      const matchesFilter = filter === 'all' || txn.type === filter;
      const matchesSearch = txn.category_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (txn.note && txn.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (txn.income_source && txn.income_source.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    filtered.forEach((txn) => {
      const dateKey = txn.date;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          isExpanded: true, // Auto expand in rebrand
        };
      }
      
      grouped[dateKey].transactions.push(txn);
      
      if (txn.type === 'income') {
        grouped[dateKey].totalIncome += txn.amount;
      } else {
        grouped[dateKey].totalExpense += txn.amount;
      }
    });
    
    setGroupedTransactions(grouped);
  };

  useEffect(() => {
    groupTransactionsByDate(transactions);
  }, [filter, searchQuery, transactions]);

  const toggleDateExpansion = (date: string) => {
    setGroupedTransactions((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        isExpanded: !prev[date].isExpanded,
      },
    }));
  };

  const getDateLabel = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM dd, yyyy');
      }
    } catch {
      return dateString;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.ink} />
          ) : (
            <Ionicons name={exportEnabled ? 'download-outline' : 'lock-closed-outline'} size={24} color={COLORS.ink} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.inkSoft} style={styles.searchIcon} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={COLORS.inkSoft}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'income', 'expense'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[
              styles.filterTab,
              filter === tab && styles.filterTabActive
            ]}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab && styles.filterTabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Mascot mood="thinking" size={120} />
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filters.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => { setFilter('all'); setSearchQuery(''); }}
            >
              <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {sortedDates.map((date) => {
              const group = groupedTransactions[date];
              const isExpanded = group.isExpanded;
              
              return (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateLabel}>{getDateLabel(date)}</Text>
                  
                  <View style={styles.transactionsList}>
                    {group.transactions.map((txn) => (
                      <TouchableOpacity
                        key={txn.id}
                        style={styles.transactionItem}
                        onPress={() => router.push(`/edit-transaction/${txn.id}` as any)}
                      >
                        <View style={styles.transactionLeft}>
                          <View
                            style={[
                              styles.iconContainer,
                              { backgroundColor: txn.type === 'income' ? COLORS.incomeSoft : COLORS.primarySoft }
                            ]}
                          >
                            <Text style={styles.transactionEmoji}>
                              {txn.type === 'income' ? '💰' : '💸'}
                            </Text>
                          </View>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.categoryName} numberOfLines={1}>
                              {txn.type === 'income' ? (txn.income_source || 'Income') : txn.category_name}
                            </Text>
                            <View style={styles.transactionMeta}>
                              <Text style={styles.subcategoryText}>
                                {txn.type === 'income' ? txn.category_name : 'Expense'}
                              </Text>
                              <View style={styles.dot} />
                              <Text style={styles.timeText}>{txn.date.split(' ')[1] || ''}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.transactionRight}>
                          <Text
                            style={[
                              styles.transactionAmount,
                              { color: txn.type === 'income' ? COLORS.income : COLORS.ink }
                            ]}
                          >
                            {txn.type === 'income' ? '+' : ''}
                            {user?.currency === 'USD' || !user?.currency ? '$' : ''}
                            {formatNumber(txn.amount)}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={COLORS.inkSoft} style={styles.chevron} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
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
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 2 },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  filterTab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 2 },
    }),
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.inkSoft,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  transactionsContainer: {
    paddingHorizontal: 24,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.inkSoft,
    marginBottom: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 2 },
    }),
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
    marginBottom: 2,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subcategoryText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.inkSoft,
    opacity: 0.5,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  chevron: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
});

