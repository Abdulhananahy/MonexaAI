import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

export default function HelpScreen() {
  const router = useRouter();

  const faqItems = [
    {
      question: 'How do I add a transaction?',
      answer: 'Tap the + button on the home screen or go to Transactions tab and tap the + icon.',
    },
    {
      question: 'How does the AI chat work?',
      answer: 'Monexa AI analyzes your transaction data to provide personalized insights and answer your questions.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Data export is available in the Premium version. Upgrade to unlock this feature.',
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes! All data is encrypted and stored securely. We never share your information.',
    },
    {
      question: 'How do I change my budget?',
      answer: 'Go to Profile → Preferences to set or update your monthly budget.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.card}>
            {faqItems.map((item, index) => (
              <View key={index} style={[styles.faqItem, index === faqItems.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkItem} onPress={() => router.push('/privacy-policy' as any)}>
              <View style={styles.linkItemLeft}>
                <View style={[styles.linkIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Feather name="shield" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.inkSoft} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/terms-of-service' as any)}>
              <View style={styles.linkItemLeft}>
                <View style={[styles.linkIcon, { backgroundColor: COLORS.goldSoft }]}>
                  <Feather name="file-text" size={20} color={COLORS.gold} />
                </View>
                <Text style={styles.linkText}>Terms of Service</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.inkSoft} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:support@monexa.app?subject=Monexa%20Support%20Request')}
          >
            <View style={[styles.contactIcon, { backgroundColor: COLORS.expenseSoft }]}>
              <Feather name="mail" size={24} color={COLORS.expense} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>support@monexa.app</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.inkSoft} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    color: COLORS.ink,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    ...SHADOW.soft,
  },
  faqItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
    gap: 6,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    lineHeight: 20,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  linkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 12,
    ...SHADOW.soft,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
});
