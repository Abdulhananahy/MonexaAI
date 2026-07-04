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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'PKR',
  'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'KRW', 'TRY', 'RUB', 'AED', 'SAR',
  'CUSTOM'
];

export default function PreferencesScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [toggles, setToggles] = useState({
    budgetAlerts: true,
    weeklySummary: false,
    transactionReminders: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get('/profile');
      const userCurrency = response.data.currency || 'USD';
      setCurrency(userCurrency);
      
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
    setCurrencyOpen(false);
  };

  const handleSave = async () => {
    const finalCurrency = currency === 'CUSTOM' ? customCurrency.trim().toUpperCase() : currency;
    
    if (!finalCurrency) {
      Alert.alert('Error', 'Please select or enter a currency');
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/profile/preferences', {
        currency: finalCurrency,
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
      });
      await refreshUser();
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={20} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Playful top section */}
        <View style={styles.promoCard}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Make it yours!</Text>
            <Text style={styles.promoSubtitle}>Customize your experience</Text>
          </View>
          <View style={styles.promoMascot}>
            <Mascot mood="happy" size={80} />
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            {/* Currency Selector */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setCurrencyOpen(!currencyOpen)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Feather name="globe" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>Currency</Text>
                  <Text style={styles.menuSublabel}>{currency === 'CUSTOM' ? customCurrency : currency} - {currency}</Text>
                </View>
              </View>
              <Feather 
                name="chevron-right" 
                size={20} 
                color="#9CA3AF" 
                style={{ transform: [{ rotate: currencyOpen ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {currencyOpen && (
              <View style={styles.currencyGrid}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyChip,
                      currency === curr && styles.currencyChipActive,
                    ]}
                    onPress={() => handleCurrencySelect(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyChipText,
                        currency === curr && styles.currencyChipTextActive,
                      ]}
                    >
                      {curr === 'CUSTOM' ? '+ Custom' : curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showCustomInput && (
              <View style={styles.customCurrencyContainer}>
                <Text style={styles.inputLabel}>Enter Currency Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., BTC, ETH, CUSTOM"
                  value={customCurrency}
                  onChangeText={setCustomCurrency}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>
            )}

            <View style={styles.divider} />

            {/* Dark Mode Placeholder */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
                  <Feather name="moon" size={20} color={COLORS.ink} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>Dark Mode</Text>
                  <Text style={styles.menuSublabel}>Easier on the eyes</Text>
                </View>
              </View>
              <Switch
                value={false}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Budget Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budgeting</Text>
          <View style={styles.card}>
            <View style={styles.budgetHeader}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.goldSoft }]}>
                <MaterialCommunityIcons name="wallet-outline" size={20} color={COLORS.gold} />
              </View>
              <View>
                <Text style={styles.menuLabel}>Monthly Budget</Text>
                <Text style={styles.menuSublabel}>Quick-set your limit</Text>
              </View>
            </View>
            
            <View style={styles.budgetInputWrapper}>
              <Text style={styles.currencySymbol}>{user?.currency || '$'}</Text>
              <TextInput 
                style={styles.budgetInput}
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                keyboardType="decimal-pad"
                placeholder="2,500"
              />
              <TouchableOpacity style={styles.budgetSaveBtn} onPress={handleSave}>
                <Text style={styles.budgetSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ToggleRow 
              icon={<Feather name="bell" size={20} color="#FF7675" />}
              iconBg="#FF767510"
              title="Budget Alerts"
              subtitle="When near your limit"
              value={toggles.budgetAlerts}
              onValueChange={(val: boolean) => setToggles({...toggles, budgetAlerts: val})}
            />
            <View style={styles.divider} />
            <ToggleRow 
              icon={<Feather name="mail" size={20} color="#00B894" />}
              iconBg="#00B89410"
              title="Weekly Summary"
              subtitle="Email report on Mondays"
              value={toggles.weeklySummary}
              onValueChange={(val: boolean) => setToggles({...toggles, weeklySummary: val})}
            />
            <View style={styles.divider} />
            <ToggleRow 
              icon={<Feather name="message-square" size={20} color="#0984E3" />}
              iconBg="#0984E310"
              title="Transaction Reminders"
              subtitle="Push notifications"
              value={toggles.transactionReminders}
              onValueChange={(val: boolean) => setToggles({...toggles, transactionReminders: val})}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
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
            <Text style={styles.saveButtonText}>Save All Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({ icon, iconBg, title, subtitle, value, onValueChange }: any) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View>
          <Text style={styles.menuLabel}>{title}</Text>
          <Text style={styles.menuSublabel}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
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
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 32,
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    ...SHADOW.soft,
  },
  promoTextContainer: {
    zIndex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  promoMascot: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ scale: 1.2 }],
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    ...SHADOW.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
  },
  menuSublabel: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  currencyChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyChipText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
  },
  currencyChipTextActive: {
    color: COLORS.white,
  },
  customCurrencyContainer: {
    padding: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.1)',
    margin: 12,
    marginTop: 0,
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  budgetSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    ...SHADOW.soft,
  },
  budgetSaveBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
});
