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
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';

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

export default function InsightsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [chartType, setChartType] = useState<ChartType>('bar');
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
      const [analyticsRes, insightsRes, transactionsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/insights'),
        api.get('/transactions'),
      ]);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data.insights || []);
      setTransactions(transactionsRes.data);
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

    return sorted.map(([name, value], index) => ({
      value,
      label: name.length > 8 ? name.substring(0, 8) + '...' : name,
      frontColor: ['#D32F2F', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'][index % 6],
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

    const sorted = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const colors = ['#D32F2F', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'];

    return sorted.map(([name, value], index) => ({
      value,
      text: `${((value / analytics!.total_expense) * 100).toFixed(0)}%`,
      color: colors[index % 5],
      name: name,
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
      { value: income, label: 'Income', frontColor: '#10B981' },
      { value: expense, label: 'Expenses', frontColor: '#EF4444' },
    ];
  };

  const renderChart = () => {
    if (!analytics || transactions.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color="#E5E7EB" />
          <Text style={styles.emptyChartText}>No data available for charts</Text>
          <Text style={styles.emptyChartSubtext}>
            Add some transactions to see visualizations
          </Text>
        </View>
      );
    }

    const chartData = viewMode === 'categories' ? getCategoryChartData() : getIncomeExpenseBarData();

    if (chartType === 'bar') {
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
            yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
            noOfSections={4}
            maxValue={Math.max(...chartData.map((d) => d.value)) * 1.2}
          />
        </View>
      );
    }

    if (chartType === 'pie' && viewMode === 'categories') {
      const pieData = getPieChartData();
      return (
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            donut
            radius={90}
            innerRadius={50}
            centerLabelComponent={() => (
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterText}>Total</Text>
                <Text style={styles.pieCenterValue}>
                  {user?.currency} {analytics.total_expense.toFixed(0)}
                </Text>
              </View>
            )}
          />
          <View style={styles.pieLegend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
                <Text style={styles.legendValue}>
                  {user?.currency} {item.value.toFixed(0)}
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
              color1="#10B981"
              color2="#EF4444"
              thickness={3}
              startFillColor1="#10B981"
              startFillColor2="#EF4444"
              startOpacity={0.3}
              endOpacity={0.1}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
              xAxisLabelTexts={lineData.labels}
            />
          ) : (
            <LineChart
              data={lineData.balance || []}
              height={220}
              width={width - 100}
              spacing={40}
              initialSpacing={10}
              color1="#D32F2F"
              thickness={3}
              startFillColor1="#D32F2F"
              startOpacity={0.3}
              endOpacity={0.1}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
              xAxisLabelTexts={lineData.labels}
            />
          )}
          <View style={styles.lineChartLegend}>
            {viewMode === 'income-expense' ? (
              <>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
              </>
            ) : (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#D32F2F' }]} />
                <Text style={styles.legendText}>Balance</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return null;
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
        <Text style={styles.title}>AI Insights</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Chart Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visualization</Text>
          <View style={styles.chartTypeSelector}>
            {(['bar', 'pie', 'line'] as ChartType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chartTypeButton, chartType === type && styles.chartTypeButtonActive]}
                onPress={() => setChartType(type)}
              >
                <Ionicons
                  name={
                    type === 'bar'
                      ? 'bar-chart'
                      : type === 'pie'
                      ? 'pie-chart'
                      : 'analytics'
                  }
                  size={20}
                  color={chartType === type ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.chartTypeButtonText,
                    chartType === type && styles.chartTypeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Period Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodSelector}>
              {(['today', 'yesterday', 'week', 'month', 'year', 'all', 'custom'] as TimePeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodChip, timePeriod === period && styles.periodChipActive]}
                  onPress={() => {
                    if (period === 'custom') {
                      setShowDatePicker(true);
                    }
                    setTimePeriod(period);
                  }}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      timePeriod === period && styles.periodChipTextActive,
                    ]}
                  >
                    {period === 'today' 
                      ? 'Today' 
                      : period === 'yesterday' 
                      ? 'Yesterday' 
                      : period === 'custom' 
                      ? 'Custom Date' 
                      : period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          {/* Custom Date Picker */}
          {showDatePicker && timePeriod === 'custom' && (
            <View style={styles.customDateContainer}>
              <Text style={styles.customDateLabel}>Select Date Range:</Text>
              <View style={styles.dateInputsRow}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      // For web, use a simple prompt. On native, you'd use DateTimePicker
                      const dateStr = prompt('Enter start date (YYYY-MM-DD):');
                      if (dateStr) {
                        setCustomStartDate(new Date(dateStr));
                      }
                    }}
                  >
                    <Text style={styles.dateInputText}>
                      {customStartDate ? customStartDate.toLocaleDateString() : 'Select Date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      const dateStr = prompt('Enter end date (YYYY-MM-DD):');
                      if (dateStr) {
                        setCustomEndDate(new Date(dateStr));
                      }
                    }}
                  >
                    <Text style={styles.dateInputText}>
                      {customEndDate ? customEndDate.toLocaleDateString() : 'Select Date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.applyDateButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.applyDateButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* View Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>View</Text>
          <View style={styles.viewModeSelector}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'categories' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('categories')}
            >
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === 'categories' && styles.viewModeButtonTextActive,
                ]}
              >
                By Categories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'income-expense' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('income-expense')}
            >
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === 'income-expense' && styles.viewModeButtonTextActive,
                ]}
              >
                Income vs Expense
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart Display */}
        <View style={styles.section}>{renderChart()}</View>

        {/* Financial Overview */}
        {analytics && (
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
        )}

        {/* Monexa Insights */}
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
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  chartTypeButtonActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  chartTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chartTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  periodChipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodChipTextActive: {
    color: '#FFFFFF',
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewModeButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  pieLegend: {
    marginTop: 24,
    gap: 8,
    width: '100%',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  lineChartLegend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pieCenterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  customDateContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  dateInputText: {
    fontSize: 14,
    color: '#1F2937',
  },
  applyDateButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyDateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
