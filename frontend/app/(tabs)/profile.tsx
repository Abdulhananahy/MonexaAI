import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../constants/theme';
import { Mascot } from '../../components/Mascot';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const performLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const menuItems = [
    {
      icon: <Feather name="user" size={20} />,
      title: 'Personal Info',
      onPress: () => router.push('/personal-info' as any),
    },
    {
      icon: <Feather name="settings" size={20} />,
      title: 'Preferences',
      onPress: () => router.push('/preferences' as any),
    },
    {
      icon: <Feather name="tag" size={20} />,
      title: 'Categories',
      onPress: () => router.push('/categories' as any),
    },
    {
      icon: <Feather name="pie-chart" size={20} />,
      title: 'Budget',
      onPress: () => router.push('/budget' as any),
    },
    {
      icon: <MaterialCommunityIcons name="crown-outline" size={20} />,
      title: 'Manage Subscription',
      badge: 'Pro',
      iconColor: '#D49A11',
      iconBg: '#FFC94D20',
      onPress: () => router.push('/manage-subscription' as any),
    },
    {
      icon: <Feather name="help-circle" size={20} />,
      title: 'Help & Support',
      onPress: () => router.push('/help' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.mascotCircle}>
              <Mascot mood="happy" size={80} />
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.full_name || 'Alex Johnson'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'alex@example.com'}</Text>
          
          <View style={styles.proBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#D49A11" />
            <Text style={styles.proBadgeText}>Pro Plan</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primarySoft }]}>
              <Feather name="calendar" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>Member Since</Text>
            <Text style={styles.statValue}>Oct 2023</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.incomeSoft }]}>
              <Feather name="activity" size={20} color={COLORS.income} />
            </View>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>1,284</Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.slice(0, 4).map((item, index) => (
            <SettingRow key={index} {...item} />
          ))}
          
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Support & More</Text>
          {menuItems.slice(4).map((item, index) => (
            <SettingRow key={index} {...item} />
          ))}

          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <View style={[styles.rowIcon, { backgroundColor: COLORS.expenseSoft }]}>
              <Feather name="log-out" size={20} color={COLORS.expense} />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Monexa v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, title, badge, iconBg, iconColor, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={onPress}
    >
      <View style={[
        styles.rowIcon, 
        { 
          backgroundColor: iconBg || COLORS.bgElevated,
          // @ts-ignore
          color: iconColor || COLORS.primary 
        }
      ]}>
        {React.cloneElement(icon, { color: iconColor || COLORS.primary })}
      </View>
      <Text style={styles.menuItemTitle}>{title}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={20} color={COLORS.inkSoft} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  userName: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    marginBottom: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 201, 77, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 77, 0.3)',
  },
  proBadgeText: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    color: '#D49A11',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    ...SHADOW.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.inkSoft,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: COLORS.border,
  },
  menuSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: COLORS.ink,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    paddingRight: 16,
    borderRadius: 20,
    gap: 16,
    ...SHADOW.soft,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.ink,
  },
  badge: {
    backgroundColor: 'rgba(255, 201, 77, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    color: '#D49A11',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    gap: 16,
    marginTop: 8,
    ...SHADOW.soft,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: COLORS.expense,
  },
  version: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginTop: 32,
  },
});
