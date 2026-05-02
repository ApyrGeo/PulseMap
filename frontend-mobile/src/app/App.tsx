import React, { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeEnvironment,
  AuthProvider,
  LocationsProvider,
  MobileStorageAdapter,
  TokenService,
  useAuth,
} from '@pulse-map/shared';
import { AppNavigator } from '../navigation/AppNavigator';
import { LocationProvider } from '../contexts/LocationContext';
import { TipsProvider } from '../contexts/TipsContext';
import TutorialStepper from '../components/TutorialStepper';
import i18n from '../i18n';

const TUTORIAL_KEY = 'pulsemap_tutorial_seen';

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

const AppWithTutorial: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialChecked, setTutorialChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setTutorialChecked(true); return; }
    AsyncStorage.getItem(TUTORIAL_KEY).then((v) => {
      setShowTutorial(!v);
      setTutorialChecked(true);
    });
  }, [isAuthenticated]);

  return (
    <>
      <AppNavigator />
      {tutorialChecked && showTutorial && isAuthenticated && (
        <TutorialStepper onDismiss={() => setShowTutorial(false)} />
      )}
    </>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    AsyncStorage.getItem('pulsemap_lang').then((lang) => {
      if (lang) i18n.changeLanguage(lang);
    });
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <AuthProvider tokenService={tokenService}>
        <LocationProvider>
          <LocationsProvider>
            <TipsProvider>
              <AppWithTutorial />
            </TipsProvider>
          </LocationsProvider>
        </LocationProvider>
      </AuthProvider>
    </>
  );
};

export default App;
