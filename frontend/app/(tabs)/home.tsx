import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useCallback } from 'react';

interface AnalyticsSummary {
  balance: number;
  total_income: number;
  total_expense: number;
  top_spending_categories: { name: string; amount: number }[];
  transaction_count: number;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_name: string;
  income_source?: string;
  date: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload data when screen comes into focus (e.g., after currency change)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/transactions?limit=5')
      ]);
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {user?.currency || 'USD'} {formatNumber(summary?.balance || 0)}
          </Text>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down" size={20} color="#10B981" />
              <View>
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={styles.balanceItemValue}>
                  {formatNumber(summary?.total_income || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up" size={20} color="#EF4444" />
              <View>
                <Text style={styles.balanceItemLabel}>Expenses</Text>
                <Text style={styles.balanceItemValue}>
                  {formatNumber(summary?.total_expense || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-transaction' as any)}
          >
            <Ionicons name="add-circle" size={20} color="#D32F2F" />
            <Text style={styles.actionButtonText}>Add Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/insights')}
          >
            <Ionicons name="analytics" size={20} color="#D32F2F" />
            <Text style={styles.actionButtonText}>Quick Insights</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Ionicons name="chatbubbles" size={20} color="#D32F2F" />
            <Text style={styles.actionButtonText}>Ask Monexa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/budget' as any)}
          >
            <Ionicons name="wallet" size={20} color="#D32F2F" />
            <Text style={styles.actionButtonText}>Set Budget</Text>
          </TouchableOpacity>
        </View>

        {transactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((tx, index) => (
                <View key={tx.id || index} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: tx.type === 'income' ? '#D1FAE5' : '#FEE2E2' }]}>
                      <Ionicons 
                        name={tx.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                        size={16} 
                        color={tx.type === 'income' ? '#10B981' : '#EF4444'} 
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>
                        {tx.type === 'income' ? (tx.income_source || 'Income') : tx.category_name}
                      </Text>
                      <Text style={styles.transactionDate}>{tx.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: tx.type === 'income' ? '#10B981' : '#EF4444' }]}>
                    {tx.type === 'income' ? '+' : '-'}{user?.currency || 'USD'} {formatNumber(tx.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {summary && summary.top_spending_categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Spending</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
              {summary.top_spending_categories.slice(0, 3).map((cat, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <Ionicons name="pricetag" size={20} color="#6B7280" />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>
                    {user?.currency || 'USD'} {formatNumber(cat.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(!summary || summary.transaction_count === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking your income and expenses
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/add-transaction' as any)}
            >
              <Text style={styles.emptyStateButtonText}>Add First Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  balanceCard: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: '#D32F2F',
    borderRadius: 16,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  balanceDetails: {
    flexDirection: 'row',
    gap: 32,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  categoriesList: {
    gap: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
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
    fontSize: 14,
    fontWeight: '600',
  },
});