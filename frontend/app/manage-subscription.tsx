import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

interface SubscriptionInfo {
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  limits: {
    ai_messages_per_day: number;
    charts_enabled: boolean;
    export_enabled: boolean;
    history_days: number;
  };
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter ($3/mo)',
  pro: 'Pro ($9/mo)',
};

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [])
  );

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscription/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const doCancel = async () => {
    setCancelling(true);
    try {
      await api.post('/subscription/cancel');
      await loadSubscription();
      if (Platform.OS === 'web') {
        window.alert('Your subscription has been cancelled. You now have Free plan access.');
      } else {
        Alert.alert('Subscription Cancelled', 'You now have Free plan access.');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to cancel subscription';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features immediately.')) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your subscription? You will lose access to premium features immediately.',
        [
          { text: 'Keep Subscription', style: 'cancel' },
          { text: 'Cancel Subscription', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const isPaid = subscription?.plan_type !== 'free' && subscription?.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Current Plan</Text>
          <Text style={styles.planName}>
            {PLAN_LABELS[subscription?.plan_type || 'free'] || subscription?.plan_type}
          </Text>
          <View style={[styles.statusBadge, subscription?.status === 'active' ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{subscription?.status?.toUpperCase()}</Text>
          </View>
          {subscription?.end_date && (
            <Text style={styles.dateText}>
              {subscription.status === 'cancelled' ? 'Access ends: ' : 'Renews: '}
              {new Date(subscription.end_date).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Your Features</Text>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primarySoft }]}>
              <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              {subscription?.limits.ai_messages_per_day === -1
                ? 'Unlimited AI messages'
                : `${subscription?.limits.ai_messages_per_day} AI messages/day`}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.incomeSoft }]}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.income} />
            </View>
            <Text style={styles.featureText}>
              {subscription?.limits.charts_enabled ? 'Charts enabled' : 'Charts locked'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.goldSoft }]}>
              <Ionicons name="download-outline" size={20} color={COLORS.gold} />
            </View>
            <Text style={styles.featureText}>
              {subscription?.limits.export_enabled ? 'CSV export enabled' : 'CSV export locked'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primarySoft }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              {subscription?.limits.history_days === -1
                ? 'Unlimited history'
                : `${subscription?.limits.history_days} days history`}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isPaid ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/upgrade' as any)}>
              <Ionicons name="star" size={18} color={COLORS.white} />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/upgrade' as any)}>
                <Ionicons name="swap-horizontal" size={18} color={COLORS.white} />
                <Text style={styles.upgradeButtonText}>Change Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color={COLORS.expense} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color={COLORS.expense} />
                    <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  title: { fontSize: 24, fontFamily: FONTS.display, color: COLORS.ink },
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 24,
    ...SHADOW.soft,
  },
  planLabel: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.inkSoft, marginBottom: 4 },
  planName: { fontSize: 28, fontFamily: FONTS.display, color: COLORS.ink, marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusActive: { backgroundColor: COLORS.incomeSoft },
  statusInactive: { backgroundColor: COLORS.expenseSoft },
  statusText: { fontSize: 12, fontFamily: FONTS.bodyBold, color: COLORS.ink },
  dateText: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.inkSoft },
  featuresCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 24,
    ...SHADOW.soft,
  },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.display, color: COLORS.ink, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 15, fontFamily: FONTS.bodyMedium, color: COLORS.ink },
  buttonContainer: { gap: 12, marginBottom: 40 },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    ...SHADOW.soft,
  },
  upgradeButtonText: { color: COLORS.white, fontSize: 16, fontFamily: FONTS.bodyBold },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.expenseSoft,
    backgroundColor: COLORS.white,
  },
  cancelButtonText: { color: COLORS.expense, fontSize: 16, fontFamily: FONTS.bodyBold },
});
