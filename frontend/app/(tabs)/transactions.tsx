import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

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

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

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
    
    txns.forEach((txn) => {
      const dateKey = txn.date;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          isExpanded: false,
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
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-transaction' as any)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your income and expenses
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/add-transaction' as any)}
            >
              <Text style={styles.emptyStateButtonText}>Add First Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {sortedDates.map((date) => {
              const group = groupedTransactions[date];
              const isExpanded = group.isExpanded;
              
              return (
                <View key={date} style={styles.dateGroup}>
                  {/* Date Header - Clickable */}
                  <TouchableOpacity
                    style={styles.dateHeader}
                    onPress={() => toggleDateExpansion(date)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateHeaderLeft}>
                      <Ionicons 
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                        size={20} 
                        color="#D32F2F" 
                      />
                      <Text style={styles.dateText}>{getDateLabel(date)}</Text>
                      <View style={styles.transactionCount}>
                        <Text style={styles.transactionCountText}>
                          {group.transactions.length}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dateHeaderRight}>
                      {group.totalIncome > 0 && (
                        <View style={styles.summaryBadge}>
                          <Ionicons name="arrow-down" size={14} color="#10B981" />
                          <Text style={styles.incomeSummary}>
                            {user?.currency} {formatNumber(group.totalIncome)}
                          </Text>
                        </View>
                      )}
                      {group.totalExpense > 0 && (
                        <View style={styles.summaryBadge}>
                          <Ionicons name="arrow-up" size={14} color="#EF4444" />
                          <Text style={styles.expenseSummary}>
                            {user?.currency} {formatNumber(group.totalExpense)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Transaction List */}
                  {isExpanded && (
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
                                txn.type === 'income' ? styles.incomeIconBg : styles.expenseIconBg,
                              ]}
                            >
                              <Ionicons
                                name={txn.type === 'income' ? 'arrow-down' : 'arrow-up'}
                                size={16}
                                color={txn.type === 'income' ? '#10B981' : '#EF4444'}
                              />
                            </View>
                            <View style={styles.transactionInfo}>
                              <Text style={styles.categoryName}>{txn.category_name}</Text>
                              {txn.note && (
                                <Text style={styles.transactionNote} numberOfLines={1}>
                                  {txn.note}
                                </Text>
                              )}
                              {txn.income_source && (
                                <Text style={styles.incomeSourceText}>
                                  {txn.income_source}
                                </Text>
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.transactionRight}>
                            <Text
                              style={[
                                styles.transactionAmount,
                                txn.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                              ]}
                            >
                              {txn.type === 'income' ? '+' : '-'}{user?.currency} {formatNumber(txn.amount)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#D32F2F',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  transactionsContainer: {
    padding: 16,
    gap: 12,
  },
  dateGroup: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateHeaderRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionCount: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  transactionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  incomeSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  expenseSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  transactionsList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIconBg: {
    backgroundColor: '#D1FAE5',
  },
  expenseIconBg: {
    backgroundColor: '#FEE2E2',
  },
  transactionInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 13,
    color: '#6B7280',
  },
  incomeSourceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#10B981',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
