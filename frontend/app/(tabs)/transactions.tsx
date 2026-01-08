import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_name: string;
  date: string;
  note?: string;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => router.push(`/edit-transaction/${item.id}` as any)}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.iconContainer,
            item.type === 'income' ? styles.incomeIcon : styles.expenseIcon,
          ]}
        >
          <Ionicons
            name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
            size={20}
            color={item.type === 'income' ? '#10B981' : '#EF4444'}
          />
        </View>
        <View>
          <Text style={styles.categoryName}>{item.category_name}</Text>
          <Text style={styles.transactionDate}>
            {format(new Date(item.date), 'MMM dd, yyyy')}
          </Text>
          {item.note && (
            <Text style={styles.transactionNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          item.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
        ]}
      >
        {item.type === 'income' ? '+' : '-'}
        {user?.currency || 'USD'} {item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
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
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-transaction' as any)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#E5E7EB" />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first transaction to start tracking
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/add-transaction' as any)}
          >
            <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 24,
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
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {
    backgroundColor: '#D1FAE5',
  },
  expenseIcon: {
    backgroundColor: '#FEE2E2',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
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