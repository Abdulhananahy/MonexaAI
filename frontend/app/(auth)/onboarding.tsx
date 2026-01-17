import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={80} color="#D32F2F" />
        </View>
        
        <Text style={styles.title}>Welcome to Monexa</Text>
        <Text style={styles.subtitle}>
          Your AI-powered personal finance assistant
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="trending-up" size={24} color="#D32F2F" />
            <Text style={styles.featureText}>Track income and expenses</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="pie-chart" size={24} color="#D32F2F" />
            <Text style={styles.featureText}>Organize by categories</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="chatbubbles" size={24} color="#D32F2F" />
            <Text style={styles.featureText}>Get AI-powered insights</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </Link>
        
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
});