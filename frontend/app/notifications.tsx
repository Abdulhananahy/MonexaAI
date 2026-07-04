import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifyBudgetAlerts, setNotifyBudgetAlerts] = useState(true);
  const [notifyAiInsights, setNotifyAiInsights] = useState(true);
  const [threshold, setThreshold] = useState('80');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const response = await api.get('/profile');
      setNotifyBudgetAlerts(response.data.notify_budget_alerts ?? true);
      setNotifyAiInsights(response.data.notify_ai_insights ?? true);
      setThreshold(String(response.data.budget_alert_threshold ?? 80));
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const parsedThreshold = parseInt(threshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 100) {
      Alert.alert('Invalid value', 'Alert threshold must be a number between 1 and 100.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/profile/preferences', {
        notify_budget_alerts: notifyBudgetAlerts,
        notify_ai_insights: notifyAiInsights,
        budget_alert_threshold: parsedThreshold,
      });
      Alert.alert('Saved', 'Notification preferences updated.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.note}>
          Monexa shows alerts inside the app (banners on your Home screen). Push notifications to
          your device are not yet available.
        </Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Budget Alerts</Text>
            <Text style={styles.rowSubtitle}>Get an in-app warning when you're close to your monthly budget</Text>
          </View>
          <Switch
            value={notifyBudgetAlerts}
            onValueChange={setNotifyBudgetAlerts}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={notifyBudgetAlerts ? '#D32F2F' : '#F3F4F6'}
          />
        </View>

        {notifyBudgetAlerts && (
          <View style={styles.thresholdRow}>
            <Text style={styles.rowTitle}>Alert me at</Text>
            <View style={styles.thresholdInputWrap}>
              <TextInput
                style={styles.thresholdInput}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.thresholdSuffix}>% of budget used</Text>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>AI Insights</Text>
            <Text style={styles.rowSubtitle}>Show AI-generated tips on your Home and Insights screens</Text>
          </View>
          <Switch
            value={notifyAiInsights}
            onValueChange={setNotifyAiInsights}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={notifyAiInsights ? '#D32F2F' : '#F3F4F6'}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
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
  note: { fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowText: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 16, fontWeight: '500', color: '#1F2937' },
  rowSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  thresholdInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thresholdInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
  },
  thresholdSuffix: { fontSize: 13, color: '#6B7280' },
  saveButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
