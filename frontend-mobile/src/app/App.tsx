import React from 'react';
import { Platform, StatusBar } from 'react-native';
import {
  initializeEnvironment,
  AuthProvider,
  LocationsProvider,
  MobileStorageAdapter,
  TokenService,
} from '@pulse-map/shared';
import { AppNavigator } from '../navigation/AppNavigator';
import { LocationProvider } from '../contexts/LocationContext';

const AZURE_API = 'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api';
const AZURE_WS = 'wss://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/ws';

const LOCAL_API = 'https://localhost:7215/api';
const LOCAL_WS = 'wss://localhost:7215/ws';

// In browser (web debug), localhost resolves to the dev machine — use local BE.
// On a physical device, localhost refers to the device itself — use Azure.
const isWeb = Platform.OS === 'web';

initializeEnvironment({
  apiUrl: isWeb ? LOCAL_API : AZURE_API,
  wsUrl: isWeb ? LOCAL_WS : AZURE_WS,
  isDevelopment: __DEV__,
});

const storage = new MobileStorageAdapter();
const tokenService = new TokenService(storage);

export const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <AuthProvider tokenService={tokenService}>
        <LocationProvider>
          <LocationsProvider>
            <AppNavigator />
          </LocationsProvider>
        </LocationProvider>
      </AuthProvider>
    </>
  );
};

export default App;
