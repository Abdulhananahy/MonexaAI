import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PKR',
  'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'KRW', 'TRY', 'RUB', 'AED', 'SAR',
  'CUSTOM'
];

export default function PreferencesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get('/profile');
      const userCurrency = response.data.currency || 'USD';
      setCurrency(userCurrency);
      
      // Check if currency is custom (not in predefined list)
      if (!CURRENCIES.includes(userCurrency) && userCurrency !== 'CUSTOM') {
        setCustomCurrency(userCurrency);
        setShowCustomInput(true);
        setCurrency('CUSTOM');
      }
      
      setMonthlyBudget(response.data.monthly_budget?.toString() || '');
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleCurrencySelect = (curr: string) => {
    if (curr === 'CUSTOM') {
      setShowCustomInput(true);
      setCurrency(curr);
    } else {
      setShowCustomInput(false);
      setCustomCurrency('');
      setCurrency(curr);
    }
  };

  const handleSave = async () => {
    const finalCurrency = currency === 'CUSTOM' ? customCurrency.trim().toUpperCase() : currency;
    
    if (!finalCurrency) {
      Alert.alert('Error', 'Please select or enter a currency');
      return;
    }
    
    if (currency === 'CUSTOM' && customCurrency.trim().length > 10) {
      Alert.alert('Error', 'Currency code must be 10 characters or less');
      return;
    }

    setLoading(true);
    try {
      await api.put('/profile/preferences', {
        currency: finalCurrency,
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
      });
      Alert.alert('Success', 'Preferences updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyChip,
                  currency === curr && styles.currencyChipActive,
                ]}
                onPress={() => setCurrency(curr)}
              >
                <Text
                  style={[
                    styles.currencyChipText,
                    currency === curr && styles.currencyChipTextActive,
                  ]}
                >
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Budget (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter monthly budget"
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helperText}>
            Set a monthly spending limit to track your budget
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  currencyChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  currencyChipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  currencyChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
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