import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth, Role, User } from '@pulse-map/shared';
import { useTranslation } from 'react-i18next';
import ImageStack from '../../components/ImageStack';

const AZURE_API = 'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api';

export default function LoginScreen({ navigation }: any) {
  const { loginUser, logoutUser, tokenService } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${AZURE_API}/Location/featured?count=6`)
      .then((r) => r.json())
      .then((data: Array<{ imageUrls: string[] }>) => {
        const imgs = data.flatMap((l) => l.imageUrls).filter(Boolean).slice(0, 4);
        if (imgs.length >= 2) setHeroImages(imgs);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eroare', t('auth.login.fillAll'));
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      const loggedUser = await tokenService.getUser<User>();
      if (loggedUser?.role === Role.Admin) {
        await logoutUser();
        Alert.alert('Eroare', t('auth.login.adminBlocked'));
        return;
      }
    } catch {
      Alert.alert('Eroare', t('auth.login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {heroImages.length >= 2 && (
        <View style={styles.heroStack}>
          <ImageStack images={heroImages} width={220} height={140} autoplayDelay={2500} />
        </View>
      )}
      <Text style={styles.title}>PulseMap</Text>
      <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.login.email')}
        placeholderTextColor="#6B6B8A"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.login.password')}
        placeholderTextColor="#6B6B8A"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.login.submit')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>{t('auth.login.noAccount')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#22C55E',
    textAlign: 'center',
    fontSize: 14,
  },
  heroStack: {
    alignItems: 'center',
    marginBottom: 20,
    height: 160,
    justifyContent: 'center',
  },
});
