import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
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
  title: { 
    fontSize: 20, 
    fontFamily: FONTS.display, 
    color: COLORS.ink 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24 
  },
  updated: { 
    fontSize: 12, 
    fontFamily: FONTS.body,
    color: COLORS.inkSoft, 
    marginBottom: 20 
  },
  heading: { 
    fontSize: 18, 
    fontFamily: FONTS.display, 
    color: COLORS.ink, 
    marginTop: 24, 
    marginBottom: 8 
  },
  body: { 
    fontSize: 15, 
    lineHeight: 22, 
    fontFamily: FONTS.body,
    color: COLORS.inkSoft 
  },
  footer: { 
    fontSize: 14, 
    fontFamily: FONTS.body,
    color: COLORS.inkSoft, 
    marginTop: 32, 
    fontStyle: 'italic' 
  },
});
