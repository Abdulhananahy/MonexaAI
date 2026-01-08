import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Analytics {
  balance: number;
  total_income: number;
  total_expense: number;
  top_spending_categories: { name: string; amount: number }[];
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/insights'),
      ]);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data.insights || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {analytics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Current Balance</Text>
                  <Text style={styles.statValue}>
                    {user?.currency || 'USD'} {analytics.balance.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Income</Text>
                  <Text style={[styles.statValue, styles.incomeValue]}>
                    {analytics.total_income.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Expenses</Text>
                  <Text style={[styles.statValue, styles.expenseValue]}>
                    {analytics.total_expense.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {analytics.top_spending_categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Spending Highlights</Text>
                <View style={styles.categoriesList}>
                  {analytics.top_spending_categories.map((cat, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryRank}>{index + 1}</Text>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        {user?.currency || 'USD'} {cat.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.section}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={24} color="#D32F2F" />
            <Text style={styles.sectionTitle}>Monexa Insights</Text>
          </View>
          {insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noInsights}>No insights available yet</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Ask Monexa for More Insights</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  incomeValue: {
    color: '#10B981',
  },
  expenseValue: {
    color: '#EF4444',
  },
  categoriesList: {
    gap: 12,
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
  categoryRank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
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
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
  },
  noInsights: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 24,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});