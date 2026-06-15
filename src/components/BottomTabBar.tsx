import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Radius } from '../theme/colors';

export type TabName = 'Dashboard' | 'Reports' | 'Accounts' | 'Settings';

interface Props {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string; label: string }[] = [
  { name: 'Dashboard', icon: 'view-grid', label: 'Dashboard' },
  { name: 'Reports', icon: 'chart-bar', label: 'Reports' },
  { name: 'Accounts', icon: 'wallet', label: 'Accounts' },
  { name: 'Settings', icon: 'cog', label: 'Settings' },
];

export default function BottomTabBar({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <View style={styles.activePill}>
                <Icon name={tab.icon} size={20} color={Colors.white} />
                <Text style={styles.activeLabel}>{tab.label}</Text>
              </View>
            ) : (
              <Icon name={tab.icon} size={24} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 6,
  },
  activeLabel: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
