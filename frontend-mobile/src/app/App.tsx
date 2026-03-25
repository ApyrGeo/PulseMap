import React, { useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import {
  initializeEnvironment,
  AuthProvider,
  LocationsProvider,
  MobileStorageAdapter,
  TokenService,
} from '@pulse-map/shared';
import { AppNavigator } from '../navigation/AppNavigator';

// Initialize API/WS URLs for React Native runtime
initializeEnvironment({
  apiUrl: __DEV__
    ? 'https://localhost:7215/api'
    : 'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api',
  wsUrl: __DEV__
    ? 'wss://localhost:7215/ws'
    : 'wss://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/ws',
  isDevelopment: __DEV__,
});

const storage = new MobileStorageAdapter();
const tokenService = new TokenService(storage);

export const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <AuthProvider tokenService={tokenService}>
        <LocationsProvider>
          <AppNavigator />
        </LocationsProvider>
      </AuthProvider>
    </>
  );
};

export default App;
