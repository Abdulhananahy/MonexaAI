import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await signup(fullName, email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred';
      console.error('Signup screen error:', errorMsg);
      Alert.alert('Signup Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.decoration1} />
          <View style={styles.decoration2} />

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.mascotContainer}>
              <Mascot mood="happy" size={80} />
            </View>

            <Text style={styles.title}>Join Monexa</Text>
            <Text style={styles.subtitle}>Your personal AI money buddy ✨</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="sparkles-outline" size={20} color={COLORS.ink} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex Johnson"
                    placeholderTextColor="rgba(90, 84, 104, 0.4)"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.ink} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@awesome.com"
                    placeholderTextColor="rgba(90, 84, 104, 0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.ink} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(90, 84, 104, 0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={COLORS.inkSoft} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.agreementContainer}>
                <TouchableOpacity 
                  style={[styles.checkbox, agreed && styles.checkboxChecked]} 
                  onPress={() => setAgreed(!agreed)}
                >
                  {agreed && <Ionicons name="checkmark" size={14} color="white" />}
                </TouchableOpacity>
                <Text style={styles.agreementText}>
                  I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={20} color={COLORS.ink} />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  decoration1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: COLORS.goldSoft,
    opacity: 0.3,
  },
  decoration2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.4,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
    marginLeft: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.card,
    paddingHorizontal: 16,
    height: 60,
    ...SHADOW.soft,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.ink,
  },
  eyeIcon: {
    padding: 8,
    opacity: 0.4,
  },
  agreementContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    lineHeight: 20,
  },
  linkText: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    ...SHADOW.card,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.ink,
    opacity: 0.1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
    opacity: 0.4,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgElevated,
    height: 56,
    borderRadius: RADIUS.card,
    gap: 12,
    ...SHADOW.soft,
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
  },
  loginLink: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
});
