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
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const isPaid = subscription?.plan_type !== 'free' && subscription?.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
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
            <Ionicons name="chatbubbles-outline" size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              {subscription?.limits.ai_messages_per_day === -1
                ? 'Unlimited AI messages'
                : `${subscription?.limits.ai_messages_per_day} AI messages/day`}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="stats-chart-outline" size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              {subscription?.limits.charts_enabled ? 'Charts enabled' : 'Charts locked'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="download-outline" size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              {subscription?.limits.export_enabled ? 'CSV export enabled' : 'CSV export locked'}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.featureText}>
              {subscription?.limits.history_days === -1
                ? 'Unlimited history'
                : `${subscription?.limits.history_days} days history`}
            </Text>
          </View>
        </View>

        {!isPaid ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/upgrade' as any)}>
            <Ionicons name="star" size={18} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/upgrade' as any)}>
              <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Change Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  title: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1, padding: 24 },
  planCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  planLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  planName: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#1F2937' },
  dateText: { fontSize: 13, color: '#6B7280' },
  featuresCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { fontSize: 14, color: '#374151' },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  upgradeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 32,
  },
  cancelButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
