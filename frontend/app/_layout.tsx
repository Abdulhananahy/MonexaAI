import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function RootLayout() {
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    // Fetch Stripe publishable key
    api.get('/subscription/config')
      .then(res => setPublishableKey(res.data.publishable_key))
      .catch(err => console.error('Failed to fetch Stripe config:', err));
  }, []);

  if (!publishableKey) {
    return null; // Wait for key to load
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