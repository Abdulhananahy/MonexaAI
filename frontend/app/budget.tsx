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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatNumber } from '../utils/format';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';

type BudgetPeriod = 'day' | 'week' | 'month';

const { width } = Dimensions.get('window');
const RING_SIZE = 180;
const STROKE_WIDTH = 16;
const RADIUS_RING = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_RING;

export default function BudgetScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<BudgetPeriod>('month');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [spent, setSpent] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, summaryRes] = await Promise.all([
        api.get('/profile'),
        api.get('/transactions/summary')
      ]);
      
      if (profileRes.data.monthly_budget) {
        setBudget(profileRes.data.monthly_budget.toString());
      }
      
      // Calculate spent for current month
      const currentMonth = summaryRes.data.monthly_stats?.find((s: any) => {
        const d = new Date();
        return s.month === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      });
      setSpent(currentMonth?.expense || 0);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  };

  const handleSaveBudget = async () => {
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      const monthlyBudget = period === 'month' ? budgetValue :
                           period === 'week' ? budgetValue * 4 :
                           budgetValue * 30;

      await api.put('/profile/preferences', {
        monthly_budget: monthlyBudget,
      });
      setIsEditing(false);
      Alert.alert('Success', `${period}ly budget set successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const budgetLimit = parseFloat(budget) || 0;
  const remaining = budgetLimit - spent;
  const percent = budgetLimit > 0 ? Math.min(100, Math.round((spent / budgetLimit) * 100)) : 0;
  const isOver = budgetLimit > 0 && spent > budgetLimit;
  const isClose = percent > 80 && !isOver;

  const strokeDashoffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Budget</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {(['day', 'week', 'month'] as BudgetPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodTab,
                period === p && styles.periodTabActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  period === p && styles.periodTabTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Budget Card */}
        <View style={styles.mainCard}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isOver ? COLORS.expenseSoft : isClose ? COLORS.goldSoft : COLORS.incomeSoft }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              { color: isOver ? COLORS.expense : isClose ? '#D9A020' : COLORS.income }
            ]}>
              {isOver ? 'Over Budget!' : isClose ? 'Almost there!' : 'On Track'}
            </Text>
          </View>

          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS_RING}
                stroke="#F4F3FB"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS_RING}
                stroke={isOver ? COLORS.expense : isClose ? COLORS.gold : COLORS.primary}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <View style={styles.ringTextContainer}>
              <Text style={styles.spentLabel}>Spent</Text>
              <Text style={styles.spentAmount}>
                {user?.currency || '$'}{formatNumber(spent)}
              </Text>
              <Text style={styles.totalLabel}>
                of {user?.currency || '$'}{formatNumber(budgetLimit)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={styles.summaryLabel}>Days Left</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[
                styles.summaryValue,
                { color: remaining < 0 ? COLORS.expense : COLORS.ink }
              ]}>
                {user?.currency || '$'}{formatNumber(Math.abs(remaining))}{remaining < 0 ? ' over' : ''}
              </Text>
              <Text style={styles.summaryValue}>12 Days</Text>
            </View>
          </View>
        </View>

        {/* Edit Budget Section */}
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>{period.charAt(0).toUpperCase() + period.slice(1)}ly Limit</Text>
          
          {isEditing ? (
            <View style={styles.editControls}>
              <TouchableOpacity 
                style={styles.stepButton}
                onPress={() => setBudget(prev => (Math.max(0, (parseFloat(prev) || 0) - 100)).toString())}
              >
                <Feather name="minus" size={20} color={COLORS.ink} />
              </TouchableOpacity>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity 
                style={styles.stepButton}
                onPress={() => setBudget(prev => ((parseFloat(prev) || 0) + 100).toString())}
              >
                <Feather name="plus" size={20} color={COLORS.ink} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSaveBudget}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.displayBox}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.displayValue}>
                {user?.currency || '$'}{formatNumber(budgetLimit)}
              </Text>
              <Feather name="edit-2" size={16} color={COLORS.inkSoft} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mascot Message */}
        <View style={styles.mascotCard}>
          <View style={styles.mascotWrapper}>
            <Mascot mood={isOver ? 'thinking' : isClose ? 'thinking' : 'happy'} size={48} />
          </View>
          <View style={styles.mascotContent}>
            <Text style={styles.mascotTitle}>
              {isOver ? 'Oops! Over limit.' : isClose ? 'Watch out!' : 'Looking good!'}
            </Text>
            <Text style={styles.mascotText}>
              {isOver 
                ? "You've exceeded your budget this period. Let's review expenses." 
                : isClose 
                ? "You're getting close to your budget limit. Tap the brakes on spending."
                : "You're well within your budget. Keep up the great financial habits!"}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE9F8',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 4,
    ...SHADOW.soft,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.inkSoft,
  },
  periodTabTextActive: {
    color: COLORS.white,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    ...SHADOW.card,
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.display,
    fontWeight: '700',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spentLabel: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
  },
  spentAmount: {
    fontSize: 28,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    lineHeight: 34,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  summaryBox: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9F8FD',
    borderRadius: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  editSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  displayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayValue: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.primary,
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInput: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
    width: 80,
    padding: 0,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  mascotCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...SHADOW.soft,
  },
  mascotWrapper: {
    width: 48,
    height: 48,
  },
  mascotContent: {
    flex: 1,
  },
  mascotTitle: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 2,
  },
  mascotText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    lineHeight: 18,
  },
});

