import { useEffect, useState, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import api from '../utils/api';
import { StripeProvider } from '../utils/stripeNative';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useBaloo2Fonts,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { COLORS } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [baloo2Loaded] = useBaloo2Fonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsLoaded = baloo2Loaded && interLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.primary }} />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
    </View>
  );
}