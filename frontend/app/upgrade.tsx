import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useStripeNative } from '../utils/stripeNative';
import { COLORS, RADIUS, SHADOW, FONTS } from '../constants/theme';
import { Mascot } from '../components/Mascot';
import { getCurrencySymbol, formatNumber } from '../utils/format';

export default function UpgradeScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const { initPaymentSheet, presentPaymentSheet } = useStripeNative();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const [loading, setLoading] = useState(false);
  const [publishableKey, setPublishableKey] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoDiscount, setPromoDiscount] = useState('');
  const [convertedPrices, setConvertedPrices] = useState<{ starter?: number; pro?: number }>({});
  const [userCurrency, setUserCurrency] = useState('USD');

  useEffect(() => {
    loadStripeConfig();
    loadPricing();
  }, []);

  const loadStripeConfig = async () => {
    try {
      const response = await api.get('/subscription/config');
      setPublishableKey(response.data.publishable_key);
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
    }
  };

  const loadPricing = async () => {
    try {
      const response = await api.get('/subscription/pricing');
      setUserCurrency(response.data.currency);
      setConvertedPrices(response.data.converted_prices || {});
    } catch (error) {
      console.error('Failed to load pricing:', error);
    }
  };

  const priceSubtext = (planId: 'starter' | 'pro') => {
    const converted = convertedPrices[planId];
    if (userCurrency === 'USD' || converted === undefined) return null;
    return `≈ ${getCurrencySymbol(userCurrency)}${formatNumber(converted)}/mo`;
  };

  const tiers = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: '$3',
      period: '/mo',
      description: 'Perfect for everyday budgeters.',
      features: [
        { text: '50 AI messages per day', included: true },
        { text: 'Basic transaction tracking', included: true },
        { text: 'Visual spending charts', included: true },
        { text: 'Data export', included: false },
      ],
      popular: false,
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$9',
      period: '/mo',
      description: 'For true financial mastery.',
      features: [
        { text: 'Unlimited AI messages', included: true },
        { text: 'Advanced transaction tracking', included: true },
        { text: 'Visual spending charts', included: true },
        { text: 'Data export (CSV, PDF)', included: true },
      ],
      popular: true,
    },
  ];

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const response = await api.post('/promo-codes/validate', null, { params: { code: promoCode } });
      if (response.data.valid) {
        setPromoValid(true);
        setPromoDiscount(response.data.discount);
      } else {
        setPromoValid(false);
        setPromoDiscount('');
      }
    } catch (error) {
      setPromoValid(false);
      setPromoDiscount('');
    }
  };

  const handleWebCheckout = async () => {
    if (!publishableKey) {
      Alert.alert('Error', 'Payment system not configured. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        plan_type: selectedPlan,
        success_url: window.location.origin + '/payment-success',
        cancel_url: window.location.origin + '/upgrade',
      };
      
      if (promoCode.trim() && promoValid) {
        payload.promo_code = promoCode.trim();
      }
      
      const response = await api.post('/subscription/create-checkout-session', payload);

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const handleMobilePayment = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/subscription/create-payment-sheet', {
        plan_type: selectedPlan,
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Monexa',
        customerId: data.customer_id,
        customerEphemeralKeySecret: data.ephemeral_key,
        paymentIntentClientSecret: data.payment_intent_client_secret,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        Alert.alert('Error', initError.message || 'Failed to set up payment');
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', presentError.message || 'Please try again');
        }
        return;
      }

      await api.post('/subscription/confirm-payment', {
        subscription_id: data.subscription_id,
      });

      router.replace('/payment-success' as any);
    } catch (error: any) {
      console.error('Mobile payment error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (isWeb) {
      await handleWebCheckout();
    } else {
      await handleMobilePayment();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Mascot mood="celebrating" size={140} />
          <Text style={styles.title}>Unlock your full money story ✨</Text>
          <Text style={styles.subtitle}>
            Choose the plan that fits your financial journey.
          </Text>
        </View>

        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierCard,
                selectedPlan === tier.id && styles.selectedTierCard,
                tier.popular && styles.popularTier,
              ]}
              onPress={() => setSelectedPlan(tier.id)}
            >
              {tier.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <View>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{tier.price}</Text>
                    {tier.period && <Text style={styles.period}>{tier.period}</Text>}
                  </View>
                  {priceSubtext(tier.id) && (
                    <Text style={styles.priceSubtext}>{priceSubtext(tier.id)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.featuresList}>
                {tier.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    {feature.included ? (
                      <View style={[styles.featureIcon, styles.featureIconIncluded]}>
                        <Ionicons name="checkmark" size={12} color={COLORS.income} />
                      </View>
                    ) : (
                      <View style={[styles.featureIcon, styles.featureIconExcluded]}>
                        <Ionicons name="close" size={12} color={COLORS.expense} />
                      </View>
                    )}
                    <Text style={[
                      styles.featureText,
                      !feature.included && styles.featureTextExcluded
                    ]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.promoSection}>
          <View style={styles.promoInputRow}>
            <View style={styles.promoIconContainer}>
              <Ionicons name="pricetag-outline" size={18} color={COLORS.inkSoft} />
            </View>
            <TextInput
              style={[
                styles.promoInput,
                promoValid === true && styles.promoInputValid,
                promoValid === false && styles.promoInputInvalid,
              ]}
              placeholder="Have a promo code?"
              placeholderTextColor={COLORS.inkSoft}
              value={promoCode}
              onChangeText={(text) => {
                setPromoCode(text.toUpperCase());
                setPromoValid(null);
                setPromoDiscount('');
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.promoApplyButton} onPress={validatePromoCode}>
              <Text style={styles.promoApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoValid === true && (
            <View style={styles.promoSuccess}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.income} />
              <Text style={styles.promoSuccessText}>{promoDiscount} applied!</Text>
            </View>
          )}
          {promoValid === false && (
            <Text style={styles.promoError}>Invalid or expired promo code</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.subscribeButtonText}>
              Continue with {tiers.find(t => t.id === selectedPlan)?.name}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Cancel anytime. Terms and conditions apply.
        </Text>
        
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.income} />
          <Text style={styles.securityText}>Secured by Stripe</Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.displayExtra,
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  tiersContainer: {
    gap: 16,
    marginBottom: 32,
  },
  tierCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.card,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOW.soft,
  },
  selectedTierCard: {
    borderColor: COLORS.primary,
    transform: [{ scale: 1.02 }],
    ...SHADOW.card,
  },
  popularTier: {
    borderColor: COLORS.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularText: {
    color: COLORS.ink,
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
    textTransform: 'uppercase',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tierName: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  tierDescription: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontFamily: FONTS.displayExtra,
    color: COLORS.primary,
  },
  period: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
  },
  priceSubtext: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'right',
    marginTop: 2,
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.bg,
    paddingTop: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconIncluded: {
    backgroundColor: COLORS.incomeSoft,
  },
  featureIconExcluded: {
    backgroundColor: COLORS.expenseSoft,
    opacity: 0.5,
  },
  featureText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  featureTextExcluded: {
    color: COLORS.inkSoft,
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
  promoSection: {
    marginBottom: 24,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: 16,
    padding: 4,
    ...SHADOW.soft,
  },
  promoIconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  promoInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  promoInputValid: {
    borderColor: COLORS.income,
    backgroundColor: COLORS.incomeSoft,
  },
  promoInputInvalid: {
    borderColor: COLORS.expense,
    backgroundColor: COLORS.expenseSoft,
  },
  promoApplyButton: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  promoApplyText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  promoSuccessText: {
    fontSize: 13,
    fontFamily: FONTS.bodySemi,
    color: COLORS.income,
  },
  promoError: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.expense,
    marginTop: 8,
    paddingLeft: 4,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.card,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginTop: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
  },
});
