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
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

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
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
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

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>AI Insights</Text>
              <Text style={styles.rowSubtitle}>Show AI-generated tips on your Home and Insights screens</Text>
            </View>
            <Switch
              value={notifyAiInsights}
              onValueChange={setNotifyAiInsights}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 24,
    ...SHADOW.soft,
  },
  note: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.inkSoft, marginBottom: 24, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 16, fontFamily: FONTS.bodyBold, color: COLORS.ink },
  rowSubtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.inkSoft, marginTop: 4 },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    marginVertical: 8,
    paddingRight: 12,
  },
  thresholdInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thresholdInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    backgroundColor: COLORS.white,
    color: COLORS.ink,
  },
  thresholdSuffix: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.inkSoft },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
    ...SHADOW.soft,
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontFamily: FONTS.bodyBold },
});
