import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../constants/theme';
import { Mascot, MascotMood } from '../../components/Mascot';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "Track spending effortlessly",
    description: "Add expenses in seconds and keep your budget in check without the headache. 💰",
    icon: "wallet",
    mascotMood: "happy" as MascotMood,
  },
  {
    id: 2,
    title: "Meet Momo, your AI guide",
    description: "Chat with Momo anytime for personalized financial advice and tips. ✨",
    icon: "chatbubbles",
    mascotMood: "waving" as MascotMood,
  },
  {
    id: 3,
    title: "See your money story",
    description: "Beautiful charts and insights to help you understand where your money goes. 📊",
    icon: "trending-up",
    mascotMood: "celebrating" as MascotMood,
  }
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.push('/(auth)/signup');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const skip = () => {
    setCurrentSlide(SLIDES.length - 1);
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isLastSlide ? (
          <Pressable onPress={skip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.mascotOuterContainer}>
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          
          <View style={styles.mascotInnerContainer}>
            <Mascot mood={slide.mascotMood} size={180} />
          </View>
          
          <View style={styles.floatingIcon}>
            <Ionicons name={slide.icon as any} size={32} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, idx) => (
            <View 
              key={idx}
              style={[
                styles.dot,
                idx === currentSlide && styles.activeDot
              ]}
            />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
          {!isLastSlide && <Ionicons name="arrow-forward" size={20} color="white" />}
        </Pressable>

        {isLastSlide && (
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                I already have an account <Text style={styles.loginLinkTextBold}>Log In</Text>
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    height: 48,
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: COLORS.inkSoft,
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mascotOuterContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  blob1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 130,
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
  blob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 80,
    opacity: 0.7,
    right: -20,
    bottom: -20,
  },
  mascotInnerContainer: {
    zIndex: 10,
  },
  floatingIcon: {
    position: 'absolute',
    bottom: -8,
    right: -24,
    backgroundColor: COLORS.bgElevated,
    padding: 14,
    borderRadius: 20,
    ...SHADOW.soft,
    transform: [{ rotate: '6deg' }],
    zIndex: 20,
    borderWidth: 4,
    borderColor: COLORS.bg,
  },
  textContainer: {
    alignItems: 'center',
    minHeight: 140,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primarySoft,
  },
  activeDot: {
    width: 32,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW.card,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: COLORS.inkSoft,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  loginLinkTextBold: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
  },
});
