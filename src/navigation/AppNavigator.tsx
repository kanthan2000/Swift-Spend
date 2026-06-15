import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import WelcomeScreen from '../screens/WelcomeScreen';
import AddAccountScreen from '../screens/AddAccountScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NewExpenseScreen from '../screens/NewExpenseScreen';
import BottomTabBar, { TabName } from '../components/BottomTabBar';
import { Colors } from '../theme/colors';

export default function AppNavigator() {
  const { isOnboarded, isLoading, completeOnboarding, fetchData } = useStore();
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<TabName>('Dashboard');
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [newExpenseType, setNewExpenseType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && !isOnboarded && onboardingStep === 1) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isOnboarded) {
    if (onboardingStep === 1) {
      return (
        <WelcomeScreen
          onNext={(name) => {
            setOnboardingName(name);
            setOnboardingStep(2);
          }}
        />
      );
    }

    return (
      <AddAccountScreen
        onComplete={async (accountName, openingBalance) => {
          await completeOnboarding(onboardingName, accountName, openingBalance);
        }}
      />
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen onAddExpense={(type) => { setNewExpenseType(type); setShowNewExpense(true); }} />;
      case 'Reports':
        return <ReportsScreen onAddExpense={() => { setNewExpenseType('DEBIT'); setShowNewExpense(true); }} />;
      case 'Accounts':
        return <AccountsScreen />;
      case 'Settings':
        return <SettingsScreen />;
    }
  };

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {renderScreen()}
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
        <NewExpenseScreen
          visible={showNewExpense}
          onClose={() => setShowNewExpense(false)}
          defaultType={newExpenseType}
        />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
