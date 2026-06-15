import React, { useEffect } from 'react';
import { StatusBar, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    background: '#FDF8FA',
  },
};

export default function App() {
  const { fetchData, checkTrackingAndPermission } = useStore();

  useEffect(() => {
    // 1. Initial data fetch
    fetchData();
    checkTrackingAndPermission();

    // 2. Setup listener for background intercepted notifications
    const subscription = DeviceEventEmitter.addListener('onNotificationReceived', (event) => {
      console.log('Notification event received in React Native:', event);
      // Trigger a store refresh to update screens instantly
      fetchData();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDF8FA" />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
