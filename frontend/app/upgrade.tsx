import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

// Conditionally import Stripe only for native
let CardField: any = null;
let useStripe: any = null;

if (Platform.OS !== 'web') {
  const stripeModule = require('@stripe/stripe-react-native');
  CardField = stripeModule.CardField;
  useStripe = stripeModule.useStripe;
}

export default function UpgradeScreen() {
  const router = useRouter();
  const stripe = Platform.OS !== 'web' && useStripe ? useStripe() : null;
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const isWeb = Platform.OS === 'web';

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 3,
      features: [
        '50 AI messages per day',
        'Basic charts (Bar & Pie)',
        '90 days history',
        'Budget alerts',
        'Email support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9,
      popular: true,
      features: [
        'Unlimited AI messages',
        'All chart types',
        'Unlimited history',
        'CSV export',
        'Advanced insights',
        'Priority support',
      ],
    },
  ];

  const handleSubscribe = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);
    try {
      // Create payment method
      const { paymentMethod, error: pmError } = await confirmPayment(
        {
          paymentMethodType: 'Card',
        },
        { handleActions: false }
      );

      if (pmError) {
        Alert.alert('Payment Error', pmError.message);
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        Alert.alert('Error', 'Failed to create payment method');
        setLoading(false);
        return;
      }

      // Create subscription with backend
      const response = await api.post('/subscription/create', {
        plan_type: selectedPlan,
        payment_method_id: paymentMethod.id,
      });

      // Handle 3D Secure if needed
      if (response.data.client_secret) {
        const { error: confirmError } = await confirmPayment(response.data.client_secret);
        
        if (confirmError) {
          Alert.alert('Payment Failed', confirmError.message);
          setLoading(false);
          return;
        }
      }

      Alert.alert(
        'Success!',
        `You're now subscribed to ${selectedPlan === 'starter' ? 'Starter' : 'Pro'}! Enjoy your premium features.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Failed',
        error.response?.data?.detail || error.message || 'Failed to process payment'
      );
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
        <Text style={styles.title}>Upgrade to Premium</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <Ionicons name="star" size={64} color="#D32F2F" />
          <Text style={styles.heroTitle}>Unlock All Features</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited AI insights and advanced analytics
          </Text>
        </View>

        <View style={styles.plansSection}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id as 'starter' | 'pro')}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>${plan.price}</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === plan.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPlan === plan.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Text style={styles.sectionSubtitle}>
            Secure payment powered by Stripe
          </Text>

          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={true}
              placeholder={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={styles.card}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color="#10B981" />
            <Text style={styles.securityText}>
              Your payment information is secure and encrypted
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan:</Text>
            <Text style={styles.summaryValue}>
              {selectedPlan === 'starter' ? 'Starter' : 'Pro'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Billing:</Text>
            <Text style={styles.summaryValue}>Monthly</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>
              ${selectedPlan === 'starter' ? '3' : '9'}/month
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading || !cardComplete}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="#FFFFFF" />
              <Text style={styles.subscribeButtonText}>
                Subscribe Now - ${selectedPlan === 'starter' ? '3' : '9'}/mo
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Cancel anytime. No hidden fees.
        </Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
  },
  planCardSelected: {
    borderColor: '#D32F2F',
    backgroundColor: '#FEF2F2',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '600',
    color: '#D32F2F',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#D32F2F',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  paymentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  cardFieldContainer: {
    marginBottom: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  summarySection: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D32F2F',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subscribeButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.5,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
