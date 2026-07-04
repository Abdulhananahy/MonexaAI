import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatNumber, formatCurrency, getCurrencySymbol } from '../../utils/format';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

const { width } = Dimensions.get('window');

interface Analytics {
  balance: number;
  total_income: number;
  total_expense: number;
  top_spending_categories: { name: string; amount: number }[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_name: string;
  date: string;
}

type ChartType = 'bar' | 'pie' | 'line';
type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom';
type ViewMode = 'categories' | 'income-expense';

interface SubscriptionUsage {
  plan_type: string;
  charts_enabled: boolean;
  export_enabled: boolean;
  ai_messages_limit: number;
  ai_messages_remaining: number;
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionUsage, setSubscriptionUsage] = useState<SubscriptionUsage | null>(null);
  
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [analyticsRes, insightsRes, transactionsRes, usageRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/insights'),
        api.get('/transactions'),
        api.get('/subscription/usage'),
      ]);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data.insights || []);
      setTransactions(transactionsRes.data);
      setSubscriptionUsage(usageRes.data);
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

  const filterTransactionsByPeriod = (transactions: Transaction[]) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    const filtered = transactions.filter((t) => {
      const transDate = new Date(t.date);
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      
      const diffTime = now.getTime() - transDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      switch (timePeriod) {
        case 'today':
          return transDate >= startOfToday && transDate <= now;
        case 'yesterday':
          return transDate >= startOfYesterday && transDate < startOfToday;
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case 'year':
          return diffDays <= 365;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return transDate >= start && transDate <= end;
          }
          return true;
        default:
          return true;
      }
    });
    return filtered;
  };

  const getCategoryChartData = () => {
    const filtered = filterTransactionsByPeriod(transactions);
    const categoryTotals: { [key: string]: number } = {};

    filtered
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category_name] = (categoryTotals[t.category_name] || 0) + t.amount;
      });

    const sorted = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const colors = [COLORS.primary, COLORS.expense, COLORS.gold, '#9D8AF2', COLORS.inkSoft, COLORS.primarySoft];

    return sorted.map(([name, value], index) => ({
      value,
      label: name.length > 8 ? name.substring(0, 8) + '...' : name,
      frontColor: colors[index % colors.length],
    }));
  };

  const getPieChartData = () => {
    const filtered = filterTransactionsByPeriod(transactions);
    const categoryTotals: { [key: string]: number } = {};

    filtered
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category_name] = (categoryTotals[t.category_name] || 0) + t.amount;
      });

    const totalPeriodExpense = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    const sorted = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const colors = [COLORS.primary, COLORS.expense, COLORS.gold, '#9D8AF2', COLORS.inkSoft];

    return sorted.map(([name, value], index) => ({
      value,
      text: `${((value / (totalPeriodExpense || 1)) * 100).toFixed(0)}%`,
      color: colors[index % colors.length],
      name: name,
      percentage: Math.round((value / (totalPeriodExpense || 1)) * 100),
    }));
  };

  const getLineChartData = () => {
    const filtered = filterTransactionsByPeriod(transactions);
    
    // Group by date
    const dailyData: { [key: string]: { income: number; expense: number } } = {};
    
    filtered.forEach((t) => {
      const date = t.date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyData[date].income += t.amount;
      } else {
        dailyData[date].expense += t.amount;
      }
    });

    const sorted = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10);

    if (viewMode === 'income-expense') {
      return {
        income: sorted.map(([, data]) => ({ value: data.income })),
        expense: sorted.map(([, data]) => ({ value: data.expense })),
        labels: sorted.map(([date]) => new Date(date).getDate().toString()),
      };
    } else {
      // Balance over time
      let runningBalance = 0;
      return {
        balance: sorted.map(([, data]) => {
          runningBalance += data.income - data.expense;
          return { value: runningBalance };
        }),
        labels: sorted.map(([date]) => new Date(date).getDate().toString()),
      };
    }
  };

  const getIncomeExpenseBarData = () => {
    const filtered = filterTransactionsByPeriod(transactions);
    
    const income = filtered.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return [
      { value: income, label: 'Income', frontColor: COLORS.income },
      { value: expense, label: 'Expenses', frontColor: COLORS.expense },
    ];
  };

  const renderChart = () => {
    if (!analytics || transactions.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Mascot mood="thinking" size={100} />
          <Text style={styles.emptyChartText}>No data available for charts</Text>
          <Text style={styles.emptyChartSubtext}>
            Add some transactions to see visualizations
          </Text>
        </View>
      );
    }

    if (chartType === 'bar') {
      const chartData = viewMode === 'categories' ? getCategoryChartData() : getIncomeExpenseBarData();
      return (
        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            width={width - 80}
            height={220}
            barWidth={40}
            spacing={20}
            roundedTop
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: COLORS.inkSoft, fontSize: 10, fontFamily: FONTS.body }}
            noOfSections={4}
            maxValue={Math.max(...chartData.map((d) => d.value), 1) * 1.2}
          />
        </View>
      );
    }

    if (chartType === 'pie') {
      const pieData = getPieChartData();
      const firstPercentage = pieData.length > 0 ? pieData[0].percentage : 0;
      return (
        <View style={styles.pieContainer}>
          <View style={styles.pieChartWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={60}
              innerRadius={45}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterValue}>
                    {firstPercentage}%
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.pieLegend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={styles.legendValue}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (chartType === 'line') {
      const lineData = getLineChartData();
      return (
        <View style={styles.chartContainer}>
          {viewMode === 'income-expense' ? (
            <LineChart
              data={lineData.income}
              data2={lineData.expense}
              height={220}
              width={width - 100}
              spacing={40}
              initialSpacing={10}
              color1={COLORS.income}
              color2={COLORS.expense}
              thickness={3}
              startFillColor1={COLORS.income}
              startFillColor2={COLORS.expense}
              startOpacity={0.3}
              endOpacity={0.1}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: COLORS.inkSoft, fontSize: 10, fontFamily: FONTS.body }}
              xAxisLabelTexts={lineData.labels}
              xAxisLabelTextStyle={{ color: COLORS.inkSoft, fontSize: 10, fontFamily: FONTS.body }}
            />
          ) : (
            <LineChart
              data={lineData.balance || []}
              height={220}
              width={width - 100}
              spacing={40}
              initialSpacing={10}
              color1={COLORS.income}
              thickness={4}
              startFillColor1={COLORS.income}
              startOpacity={0.4}
              endOpacity={0.0}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: COLORS.inkSoft, fontSize: 10, fontFamily: FONTS.body }}
              xAxisLabelTexts={lineData.labels}
              xAxisLabelTextStyle={{ color: COLORS.inkSoft, fontSize: 10, fontFamily: FONTS.body }}
            />
          )}
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const activeTimePeriodLabel = (['today', 'yesterday', 'week', 'month', 'year', 'all', 'custom'] as TimePeriod[]).find(p => p === timePeriod);
  const timeRangeLabel = timePeriod === 'month' ? 'This Month' : 
                        timePeriod === 'week' ? 'This Week' : 
                        timePeriod === 'year' ? 'This Year' : 
                        timePeriod === 'today' ? 'Today' : 
                        timePeriod === 'yesterday' ? 'Yesterday' :
                        timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity style={styles.headerIconButton} onPress={onRefresh}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Your Money Story 📊</Text>
          <View style={styles.introSubRow}>
            <Text style={styles.introSubtitle}>Overview of your spending habits.</Text>
            <TouchableOpacity 
              style={styles.timeRangeChip}
              onPress={() => {
                // Simplified period switcher for rebrand
                const periods: TimePeriod[] = ['week', 'month', 'year', 'all'];
                const currentIndex = periods.indexOf(timePeriod as any);
                const nextIndex = (currentIndex + 1) % periods.length;
                setTimePeriod(periods[nextIndex]);
              }}
            >
              <Ionicons name="calendar" size={14} color={COLORS.primary} />
              <Text style={styles.timeRangeText}>{timeRangeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Spent Summary Card */}
        {analytics && (
          <View style={styles.totalSpentCard}>
            <View style={styles.totalSpentLeft}>
              <Text style={styles.totalSpentLabel}>Total Spent</Text>
              <Text style={styles.totalSpentValue}>
                {formatCurrency(analytics.total_expense, getCurrencySymbol(user?.currency))}
              </Text>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={16} color={COLORS.expense} />
                <Text style={styles.trendText}>+12.5% vs last month</Text>
              </View>
            </View>
            <View style={styles.totalSpentMascot}>
              <Mascot mood="thinking" size={90} />
            </View>
            <View style={styles.cardDecoration} />
          </View>
        )}

        {/* Category Breakdown (Donut/Pie Chart) */}
        <View style={styles.chartSectionCard}>
          <h3 style={styles.sectionCardTitle}>Spending Breakdown</h3>
          {subscriptionUsage?.charts_enabled === true ? (
            renderChart()
          ) : (
            <View style={styles.upgradePrompt}>
              <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
              <Text style={styles.upgradeTitle}>Charts are a Premium Feature</Text>
              <Text style={styles.upgradeText}>
                Upgrade to Starter or Pro to unlock beautiful charts and visualize your spending patterns.
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/upgrade')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bar Chart Section */}
        <View style={styles.chartSectionCard}>
          <View style={styles.sectionHeaderRow}>
            <h3 style={styles.sectionCardTitle}>Top Categories</h3>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.barList}>
            {getCategoryChartData().slice(0, 3).map((cat, i) => (
              <View key={cat.label} style={styles.barItem}>
                <View style={styles.barInfo}>
                  <Text style={styles.barLabel}>{cat.label}</Text>
                  <Text style={styles.barValue}>{formatCurrency(cat.value, getCurrencySymbol(user?.currency))}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        backgroundColor: cat.frontColor,
                        width: `${Math.min(100, (cat.value / (analytics?.total_expense || 1)) * 100 * 1.5)}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Balance Over Time (Trend) */}
        <View style={styles.chartSectionCard}>
          <h3 style={styles.sectionCardTitle}>Balance Trend</h3>
          <Text style={styles.trendDescription}>
            Your balance has increased by <Text style={styles.trendHighlight}>$1,250</Text> this year ✨
          </Text>
          <View style={styles.trendChartContainer}>
             {/* We use line chart here */}
             {chartType !== 'line' ? (
                <TouchableOpacity style={styles.viewTrendButton} onPress={() => setChartType('line')}>
                  <Text style={styles.viewTrendButtonText}>View Detailed Trend</Text>
                </TouchableOpacity>
             ) : renderChart()}
          </View>
          {chartType === 'line' && (
            <View style={styles.trendXAxis}>
              <Text style={styles.xAxisLabel}>Jan</Text>
              <Text style={styles.xAxisLabel}>Jun</Text>
              <Text style={styles.xAxisLabel}>Dec</Text>
            </View>
          )}
        </View>

        {/* Monexa Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={24} color={COLORS.primary} />
            <Text style={styles.insightsTitle}>Monexa Insights</Text>
          </View>
          {insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.income} />
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
          <Ionicons name="chatbubbles" size={20} color={COLORS.white} />
          <Text style={styles.chatButtonText}>Ask Monexa for More Insights</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(251, 247, 241, 0.9)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.soft,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 32,
    fontFamily: FONTS.displayExtra,
    color: COLORS.ink,
    lineHeight: 38,
  },
  introSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  introSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    flex: 1,
  },
  timeRangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    ...SHADOW.soft,
  },
  timeRangeText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.primary,
  },
  totalSpentCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.card,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOW.card,
  },
  totalSpentLeft: {
    zIndex: 2,
    flex: 1,
  },
  totalSpentLabel: {
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    marginBottom: 4,
  },
  totalSpentValue: {
    fontSize: 40,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    lineHeight: 44,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.expenseSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  trendText: {
    fontSize: 13,
    fontFamily: FONTS.bodyBold,
    color: COLORS.expense,
  },
  totalSpentMascot: {
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    backgroundColor: COLORS.bg,
    borderRadius: 40,
    ...SHADOW.soft,
  },
  cardDecoration: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.5,
  },
  chartSectionCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 24,
    ...SHADOW.soft,
  },
  sectionCardTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pieChartWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieCenterValue: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  pieLegend: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
  },
  barList: {
    gap: 16,
  },
  barItem: {
    gap: 6,
  },
  barInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
  },
  barValue: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
  },
  barTrack: {
    height: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  trendDescription: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    marginBottom: 20,
  },
  trendHighlight: {
    color: COLORS.income,
    fontFamily: FONTS.bodyBold,
  },
  trendChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewTrendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 20,
  },
  viewTrendButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.primaryDark,
  },
  trendXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    color: COLORS.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightsSection: {
    marginTop: 8,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...SHADOW.soft,
  },
  insightText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.ink,
    flex: 1,
    lineHeight: 20,
  },
  noInsights: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginVertical: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    marginTop: 32,
    gap: 10,
    ...SHADOW.card,
  },
  chatButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bodySemi,
    color: COLORS.white,
  },
  emptyChart: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyChartText: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  emptyChartSubtext: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  upgradePrompt: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  upgradeTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
});
