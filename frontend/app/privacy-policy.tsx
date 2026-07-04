import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.updated}>Last updated: July 2026</Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.body}>
          Monexa collects the information you provide directly, including your name, email
          address, transaction records, category names, and monthly budget you enter into the
          app. We also process the messages you send to the AI assistant so it can respond to you.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your data to operate the app's core features: tracking transactions, generating
          spending insights, powering the AI chat assistant, and processing subscription payments
          through Stripe. We do not sell your personal or financial data to third parties.
        </Text>

        <Text style={styles.heading}>3. Third-Party Services</Text>
        <Text style={styles.body}>
          Monexa uses Stripe to process subscription payments and Google Gemini to power AI
          insights and chat. These providers process the minimum data required to perform their
          function (e.g. Stripe handles your payment details directly; we never store your card
          number). Currency conversion uses a public exchange-rate API and does not receive any
          personal data.
        </Text>

        <Text style={styles.heading}>4. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored in an encrypted MongoDB database. Passwords are hashed and never
          stored in plain text. Access to the database is restricted to the application server.
        </Text>

        <Text style={styles.heading}>5. Data Retention & Deletion</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account is active. You can request deletion of
          your account and associated data at any time by contacting support at the email address
          listed on the Help & Support screen.
        </Text>

        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.body}>
          You may access, correct, export (Pro plan), or delete your data at any time. Contact us
          if you need help exercising these rights.
        </Text>

        <Text style={styles.heading}>7. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this policy from time to time. Material changes will be communicated
          in-app.
        </Text>

        <Text style={styles.footer}>
          Questions about this policy? Reach us via the Help & Support screen.
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
