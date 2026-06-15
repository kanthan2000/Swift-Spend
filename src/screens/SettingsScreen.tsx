import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing } from '../theme/colors';
import CategoriesModal from '../components/CategoriesModal';

export default function SettingsScreen() {
  const {
    userName,
    trackingEnabled,
    permissionGranted,
    setTrackingEnabled,
    requestPermission,
    resetOnboarding,
  } = useStore();
  
  const [showCategories, setShowCategories] = React.useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Icon name="account" size={28} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.profileName}>{userName || 'User'}</Text>
            <Text style={styles.profileSub}>SwiftSpend Member</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Icon name="bell-ring" size={22} color={Colors.primary} />
            <Text style={styles.settingText}>Auto-track expenses</Text>
            <Switch
              value={trackingEnabled}
              onValueChange={setTrackingEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
          {!permissionGranted && (
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionText}>Grant notification access</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>CUSTOMIZATION</Text>
        <TouchableOpacity style={styles.settingCard} onPress={() => setShowCategories(true)}>
          <View style={styles.settingRow}>
            <Icon name="shape-outline" size={22} color={Colors.primary} />
            <Text style={styles.settingText}>Manage Categories</Text>
            <Icon name="chevron-right" size={22} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>DATA</Text>
        <TouchableOpacity style={styles.settingCard} onPress={resetOnboarding}>
          <View style={styles.settingRow}>
            <Icon name="refresh" size={22} color={Colors.expense} />
            <Text style={[styles.settingText, { color: Colors.expense }]}>
              Reset onboarding
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <CategoriesModal visible={showCategories} onClose={() => setShowCategories(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 8,
    marginBottom: Spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: Spacing.lg,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.cardBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  profileSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  permissionBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.cardBlue,
    borderRadius: Radius.md,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
