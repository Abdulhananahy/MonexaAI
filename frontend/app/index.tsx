import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS } from '../constants/theme';
import { Mascot } from '../components/Mascot';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }, 2000); // Give splash some time to show the brand
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <LinearGradient
      colors={[COLORS.primarySoft, COLORS.primary]}
      style={styles.container}
    >
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <Mascot mood="waving" size={160} />
        </View>

        <Text style={styles.title}>Monexa</Text>
        <Text style={styles.subtitle}>Your money, made friendly 💜</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBarBg}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: loadingProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) 
              }
            ]} 
          />
        </View>
        <Text style={styles.loadingText}>Waking up Momo...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.1,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: COLORS.gold,
    top: -100,
    left: -150,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.white,
    bottom: -50,
    right: -100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  mascotContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 56,
    fontFamily: FONTS.display,
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 48,
    paddingBottom: 64,
    zIndex: 10,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 6,
  },
  loadingText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    marginTop: 16,
  },
});
