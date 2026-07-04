import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';

export default function PaymentSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Refresh user subscription status
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <Mascot mood="happy" size={160} />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Welcome to Monexa Pro! Your subscription is now active.
        </Text>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
