import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

export interface UserCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationContextValue {
  userCoords: UserCoords | null;
}

const LocationContext = createContext<LocationContextValue>({ userCoords: null });

const LOCATION_HTML = `<!DOCTYPE html><html><body><script>
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    function(pos) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }));
    },
    function() {},
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
  );
}
</script></body></html>`;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(Platform.OS !== 'android');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Location Permission',
      message: 'PulseMap needs your location to show nearby places.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }).then((result) => {
      setPermissionGranted(result === PermissionsAndroid.RESULTS.GRANTED);
    });
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.latitude === 'number') {
        setUserCoords({ latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy });
      }
    } catch {}
  }, []);

  return (
    <LocationContext.Provider value={{ userCoords }}>
      {Platform.OS !== 'web' && permissionGranted && (
        <View style={{ position: 'absolute', width: 1, height: 1, top: -10, left: -10 }}>
          <WebView
            source={{ html: LOCATION_HTML, baseUrl: 'https://localhost' }}
            onMessage={handleMessage}
            javaScriptEnabled
            geolocationEnabled
            onGeolocationPermissionsShowPrompt={({ origin, callback }) => callback(origin, true, true)}
            style={{ flex: 1 }}
          />
        </View>
      )}
      {children}
    </LocationContext.Provider>
  );
}

export function useDeviceLocation(): LocationContextValue {
  return useContext(LocationContext);
}
