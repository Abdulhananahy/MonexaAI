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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatNumber } from '../utils/format';

type BudgetPeriod = 'day' | 'week' | 'month';

export default function BudgetScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<BudgetPeriod>('month');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudget();
  }, []);

  const loadBudget = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.monthly_budget) {
        setBudget(response.data.monthly_budget.toString());
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
    }
  };

  const handleSaveBudget = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      const budgetValue = parseFloat(budget);
      const monthlyBudget = period === 'month' ? budgetValue :
                           period === 'week' ? budgetValue * 4 :
                           budgetValue * 30;

      await api.put('/profile/preferences', {
        monthly_budget: monthlyBudget,
      });
      Alert.alert('Success', `${period}ly budget set successfully!`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Set Budget</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#D32F2F" />
          <Text style={styles.infoText}>
            Set a spending limit to track your expenses and stay on budget
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Budget Period</Text>
          <View style={styles.periodSelector}>
            {(['day', 'week', 'month'] as BudgetPeriod[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodButton,
                  period === p && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === p && styles.periodButtonTextActive,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Budget Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyLabel}>{user?.currency || 'USD'}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.helperText}>
            Maximum amount you want to spend per {period}
          </Text>
        </View>

        {budget && parseFloat(budget) > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Budget Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Period:</Text>
              <Text style={styles.previewValue}>{period}ly</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Limit:</Text>
              <Text style={styles.previewValue}>
                {user?.currency || 'USD'} {formatNumber(parseFloat(budget))}
              </Text>
            </View>
            {period !== 'month' && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Monthly:</Text>
                <Text style={styles.previewValue}>
                  {user?.currency || 'USD'}{' '}
                  {formatNumber(parseFloat(budget) * (period === 'week' ? 4 : 30))}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveBudget}
          disabled={loading || !budget}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Set Budget</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    margin: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  previewCard: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
