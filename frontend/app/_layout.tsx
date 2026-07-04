import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import api from '../utils/api';
import { StripeProvider } from '../utils/stripeNative';

function AppContent({ children }: { children: React.ReactNode }) {
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    api
      .get('/subscription/config')
      .then((res) => setPublishableKey(res.data.publishable_key || ''))
      .catch(() => setPublishableKey(''));
  }, []);

  if (Platform.OS === 'web' || !publishableKey) {
    return <>{children}</>;
  }

  return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppContent>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AppContent>
    </AuthProvider>
  );
}