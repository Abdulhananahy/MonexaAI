import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function UpgradeScreen() {
  const router = useRouter();

  const features = [
    {
      icon: 'infinite',
      title: 'Unlimited AI Chats',
      description: 'Ask Monexa anything, anytime',
      free: false,
      premium: true,
    },
    {
      icon: 'analytics',
      title: 'Advanced Analytics',
      description: 'Detailed charts and spending trends',
      free: false,
      premium: true,
    },
    {
      icon: 'cloud-download',
      title: 'Export Data',
      description: 'Download your transactions as CSV',
      free: false,
      premium: true,
    },
    {
      icon: 'notifications',
      title: 'Smart Alerts',
      description: 'Budget warnings and spending notifications',
      free: false,
      premium: true,
    },
    {
      icon: 'list',
      title: 'Basic Tracking',
      description: 'Track income and expenses',
      free: true,
      premium: true,
    },
    {
      icon: 'chatbubbles',
      title: 'Limited AI Chat',
      description: '10 messages per day',
      free: true,
      premium: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <Ionicons name="star" size={64} color="#D32F2F" />
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>
            Get the most out of Monexa with unlimited AI insights and advanced analytics
          </Text>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>BEST VALUE</Text>
          </View>
          <Text style={styles.pricingAmount}>$9.99</Text>
          <Text style={styles.pricingPeriod}>per month</Text>
          <Text style={styles.pricingNote}>Cancel anytime</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureLeft}>
                <Ionicons name={feature.icon as any} size={24} color="#D32F2F" />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
              {feature.premium && !feature.free && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Start Free 7-Day Trial</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          You won't be charged until after your trial ends
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  pricingCard: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D32F2F',
    alignItems: 'center',
    marginBottom: 32,
  },
  pricingBadge: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  pricingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pricingAmount: {
    fontSize: 48,
    fontWeight: '600',
    color: '#D32F2F',
  },
  pricingPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  pricingNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  premiumBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D32F2F',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  upgradeButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});