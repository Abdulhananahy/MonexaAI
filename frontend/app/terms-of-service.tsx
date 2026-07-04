import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.updated}>Last updated: July 2026</Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By creating an account and using Monexa, you agree to these Terms of Service. If you do
          not agree, please do not use the app.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.body}>
          Monexa is a personal finance tracking app that lets you record transactions, view
          spending analytics, chat with an AI financial assistant, and optionally subscribe to
          paid plans for additional features (charts, CSV export, higher AI usage limits).
        </Text>

        <Text style={styles.heading}>3. Subscriptions & Billing</Text>
        <Text style={styles.body}>
          Paid plans (Starter, Pro) are billed monthly through Stripe. You can cancel anytime from
          Profile → Manage Subscription; cancellation stops future billing but does not refund the
          current billing period unless required by law. Prices are shown in USD and may change
          with advance notice.
        </Text>

        <Text style={styles.heading}>4. AI Assistant Disclaimer</Text>
        <Text style={styles.body}>
          The AI assistant provides general informational insights based on the data you enter. It
          is not a licensed financial advisor, and its suggestions should not be treated as
          professional financial, tax, or legal advice.
        </Text>

        <Text style={styles.heading}>5. User Responsibilities</Text>
        <Text style={styles.body}>
          You are responsible for the accuracy of the data you enter and for keeping your account
          credentials secure. Do not use Monexa for unlawful purposes.
        </Text>

        <Text style={styles.heading}>6. Limitation of Liability</Text>
        <Text style={styles.body}>
          Monexa is provided "as is" without warranties of any kind. We are not liable for
          financial decisions made based on information or insights shown in the app.
        </Text>

        <Text style={styles.heading}>7. Termination</Text>
        <Text style={styles.body}>
          We may suspend or terminate accounts that violate these terms. You may delete your
          account at any time by contacting support.
        </Text>

        <Text style={styles.heading}>8. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these terms periodically. Continued use of the app after changes
          constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.footer}>
          Questions about these terms? Reach us via the Help & Support screen.
        </Text>
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
  updated: { fontSize: 12, color: '#9CA3AF', marginBottom: 20 },
  heading: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  footer: { fontSize: 13, color: '#6B7280', marginTop: 24, marginBottom: 40, fontStyle: 'italic' },
});
