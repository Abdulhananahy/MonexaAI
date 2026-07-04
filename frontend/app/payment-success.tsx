import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    confirmSubscription();
  }, []);

  const confirmSubscription = async () => {
    // The Stripe webhook usually activates the subscription within seconds, but if it's
    // delayed or missed, poll /subscription/current briefly so the user isn't stuck
    // believing they're on Pro when the backend still thinks they're on Free.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const { data } = await api.get('/subscription/current');
        if (data.plan_type !== 'free' && data.status === 'active') {
          setConfirmed(true);
          await refreshUser();
          break;
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setChecking(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotContainer}>
          <Mascot mood="happy" size={160} />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        {checking ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.subtitle}>Confirming your subscription...</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            {confirmed
              ? 'Welcome to Monexa Pro! Your subscription is now active.'
              : "Your payment went through. It's taking a little longer than usual to activate — pull to refresh on your Subscription page in a moment, or contact support if it doesn't update."}
          </Text>
        )}

        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>You now have access to:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.checkIcon, { backgroundColor: COLORS.incomeSoft }]}>
                <Feather name="check" size={16} color={COLORS.income} />
              </View>
              <Text style={styles.featureText}>Unlimited AI Messages</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.checkIcon, { backgroundColor: COLORS.incomeSoft }]}>
                <Feather name="check" size={16} color={COLORS.income} />
              </View>
              <Text style={styles.featureText}>Advanced Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.checkIcon, { backgroundColor: COLORS.incomeSoft }]}>
                <Feather name="check" size={16} color={COLORS.income} />
              </View>
              <Text style={styles.featureText}>Priority Support</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.checkIcon, { backgroundColor: COLORS.incomeSoft }]}>
                <Feather name="check" size={16} color={COLORS.income} />
              </View>
              <Text style={styles.featureText}>CSV Export</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/home' as any)}
        >
          <Text style={styles.buttonText}>Start Using Monexa Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <Text style={styles.secondaryButtonText}>View My Subscription</Text>
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
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  mascotContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresBox: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 32,
    ...SHADOW.soft,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 16,
  },
  featuresList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.chip,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.soft,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.white,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
});
