import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';
import { Mascot } from '../components/Mascot';

export default function PersonalInfoScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await api.put('/profile', { full_name: fullName.trim() });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.mascotCircle}>
              <Mascot mood="happy" size={80} />
            </View>
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Ionicons name="camera" size={20} color={COLORS.primary} />
            <Text style={styles.changeAvatarText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.inkSoft}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
              />
              <Text style={styles.helperText}>
                Email cannot be changed
              </Text>
            </View>

            <View style={[styles.inputContainer, { marginBottom: 0 }]}>
              <Text style={styles.label}>Member Since</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
                editable={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={styles.sectionTitle}>Security</Text>
            <Ionicons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.inkSoft}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.inkSoft}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.inkSoft}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.inkSoft}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.changePasswordButtonText}>
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOW.soft,
  },
  mascotCircle: {
    marginTop: 8,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    ...SHADOW.soft,
  },
  changeAvatarText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 20,
    ...SHADOW.soft,
  },
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: COLORS.inkSoft,
    borderColor: '#F3F4F6',
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    marginTop: 4,
    marginLeft: 4,
  },
  changePasswordButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOW.soft,
  },
  changePasswordButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
});
