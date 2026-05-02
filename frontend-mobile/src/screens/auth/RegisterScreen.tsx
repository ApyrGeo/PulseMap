import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useAuth, Role } from '@pulse-map/shared';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }: any) {
  const { registerUser } = useAuth();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !password) {
      Alert.alert('Eroare', t('auth.register.fillAll'));
      return;
    }
    setLoading(true);
    try {
      await registerUser({ firstName, lastName, username, email, password, role: Role.User });
      Alert.alert('Succes', t('auth.register.success'), [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      if (e?.message === 'USER_ALREADY_EXISTS') {
        Alert.alert('Eroare', t('auth.register.emailExists'));
      } else {
        Alert.alert('Eroare', t('auth.register.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#1A1A2E' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('auth.register.title')}</Text>

        {[
          { label: 'First Name', value: firstName, setter: setFirstName },
          { label: 'Last Name', value: lastName, setter: setLastName },
          { label: 'Username', value: username, setter: setUsername, autoCapitalize: 'none' as const },
          { label: 'Email', value: email, setter: setEmail, autoCapitalize: 'none' as const, keyboardType: 'email-address' as const },
        ].map(({ label, value, setter, autoCapitalize, keyboardType }) => (
          <TextInput
            key={label}
            style={styles.input}
            placeholder={label}
            placeholderTextColor="#6B6B8A"
            value={value}
            onChangeText={setter}
            autoCapitalize={autoCapitalize ?? 'words'}
            keyboardType={keyboardType}
          />
        ))}

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B6B8A"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.register.submit')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>{t('auth.register.hasAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#22C55E', textAlign: 'center', fontSize: 14 },
});
