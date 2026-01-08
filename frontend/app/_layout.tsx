import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api from '../utils/api';

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