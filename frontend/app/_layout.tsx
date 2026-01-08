import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api from '../utils/api';

// Conditionally import Stripe only for native platforms
let StripeProvider: any = null;
if (Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
  } catch (error) {
    console.warn('Stripe not available:', error);
  }
}

export default function RootLayout() {
  const [publishableKey, setPublishableKey] = useState('');
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Only fetch Stripe key for native platforms
    if (!isWeb) {
      api.get('/subscription/config')
        .then(res => setPublishableKey(res.data.publishable_key))
        .catch(err => console.error('Failed to fetch Stripe config:', err));
    }
  }, []);

  // For web, skip Stripe provider
  if (isWeb) {
    return (
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    );
  }

  // For native, wait for publishable key
  if (!publishableKey) {
    return null;
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </StripeProvider>
  );
}