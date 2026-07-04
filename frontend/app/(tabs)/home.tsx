import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatNumber } from '../../utils/format';
import { useCallback } from 'react';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

interface AnalyticsSummary {
  balance: number;
  total_income: number;
  total_expense: number;
  top_spending_categories: { name: string; amount: number }[];
  transaction_count: number;
  monthly_budget?: number | null;
  current_month_expense?: number;
  budget_percent_used?: number | null;
  budget_alert?: boolean;
  budget_alert_threshold?: number;
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const balanceParts = formatNumber(summary?.balance || 0).split('.');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Mascot mood="happy" size={56} />
            </View>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>Hi {user?.full_name?.split(' ')[0] || 'User'} 👋</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
            {summary?.budget_alert && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceCircleTop} />
          <View style={styles.balanceCircleBottom} />
          
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>{user?.currency || 'USD'}</Text>
            </View>
          </View>

          <Text style={styles.balanceAmount}>
            {user?.currency === 'USD' || !user?.currency ? '$' : user.currency + ' '}
            {balanceParts[0]}
            {balanceParts[1] && <Text style={styles.balanceDecimals}>.{balanceParts[1]}</Text>}
          </Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="arrow-down" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={styles.balanceItemValue}>
                  {user?.currency === 'USD' || !user?.currency ? '$' : ''}
                  {formatNumber(summary?.total_income || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceVerticalDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="arrow-up" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Expenses</Text>
                <Text style={styles.balanceItemValue}>
                  {user?.currency === 'USD' || !user?.currency ? '$' : ''}
                  {formatNumber(summary?.total_expense || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {summary?.budget_alert && (
          <TouchableOpacity
            style={styles.budgetAlertCard}
            onPress={() => router.push('/(tabs)/insights' as any)}
          >
            <Ionicons name="warning" size={20} color={COLORS.expense} />
            <Text style={styles.budgetAlertText}>
              You've used {summary.budget_percent_used}% of your monthly budget
              {summary.monthly_budget ? ` (${user?.currency || 'USD'} ${formatNumber(summary.monthly_budget)})` : ''}.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <Text style={styles.seeAll}>See All</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((tx, index) => (
                <TouchableOpacity 
                  key={tx.id || index} 
                  style={styles.transactionItem}
                  onPress={() => router.push(`/edit-transaction/${tx.id}` as any)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: tx.type === 'income' ? COLORS.incomeSoft : COLORS.primarySoft }]}>
                      <Text style={styles.transactionEmoji}>
                        {tx.type === 'income' ? '💰' : '💸'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.transactionTitle} numberOfLines={1}>
                        {tx.type === 'income' ? (tx.income_source || 'Income') : tx.category_name}
                      </Text>
                      <Text style={styles.transactionDate}>{tx.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.ink }]}>
                    {tx.type === 'income' ? '+' : ''}
                    {user?.currency === 'USD' || !user?.currency ? '$' : ''}
                    {formatNumber(tx.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateMini}>
                <Text style={styles.emptyStateTextMini}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.chatCtaContainer}>
        <TouchableOpacity 
          style={styles.chatCtaButton}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Mascot mood="happy" size={32} />
          <Text style={styles.chatCtaText}>Chat with Monexa ✨</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
  },
  userName: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    lineHeight: 28,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOW.soft,
      android: { ...SHADOW.soft, elevation: 4 },
    }),
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.expense,
    borderWidth: 2,
    borderColor: COLORS.bgElevated,
  },
  balanceCard: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: SHADOW.card,
      android: { ...SHADOW.card, elevation: 8 },
    }),
  },
  balanceCircleTop: {
    position: 'absolute',
    top: -96,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceCircleBottom: {
    position: 'absolute',
    bottom: -64,
    left: -48,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currencyText: {
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
    color: COLORS.white,
  },
  balanceAmount: {
    fontSize: 40,
    fontFamily: FONTS.display,
    color: COLORS.white,
    marginBottom: 24,
  },
  balanceDecimals: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceVerticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceItemLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceItemValue: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.white,
  },
  budgetAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  budgetAlertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
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
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.bgElevated,
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
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  emptyStateMini: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateTextMini: {
    color: COLORS.inkSoft,
    fontFamily: FONTS.body,
  },
  spacer: {
    height: 40,
  },
  chatCtaContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 50,
  },
  chatCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: SHADOW.card,
      android: { ...SHADOW.card, elevation: 6 },
    }),
  },
  chatCtaText: {
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    color: COLORS.white,
  },
});
