import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIPS_KEY = 'pulsemap_tips_enabled';

interface TipsContextValue {
  tipsEnabled: boolean;
  setTipsEnabled: (v: boolean) => void;
}

const TipsContext = createContext<TipsContextValue>({ tipsEnabled: true, setTipsEnabled: () => {} });

export const TipsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tipsEnabled, setTipsEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TIPS_KEY).then((v) => {
      if (v !== null) setTipsEnabledState(v === 'true');
    });
  }, []);

  const setTipsEnabled = (v: boolean) => {
    setTipsEnabledState(v);
    AsyncStorage.setItem(TIPS_KEY, String(v));
  };

  return (
    <TipsContext.Provider value={{ tipsEnabled, setTipsEnabled }}>
      {children}
    </TipsContext.Provider>
  );
};

export const useTips = () => useContext(TipsContext);
