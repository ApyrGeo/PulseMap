import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@pulse-map/shared';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useTips } from '../contexts/TipsContext';

const TUTORIAL_KEY = 'pulsemap_tutorial_seen';

const SettingsScreen = () => {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const { tipsEnabled, setTipsEnabled } = useTips();

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('pulsemap_lang', lang);
  };

  const currentLang = i18n.language;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.username')}</Text>
            <Text style={styles.rowValue}>{user?.username ?? '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.langBtn, currentLang === 'ro' && styles.langBtnActive]}
              onPress={() => changeLanguage('ro')}
            >
              <Text style={[styles.langBtnText, currentLang === 'ro' && styles.langBtnTextActive]}>
                {t('language.ro')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>
                {t('language.en')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tips section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settingsExtended.tips')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{tipsEnabled ? t('settingsExtended.tipsOn') : t('settingsExtended.tipsOff')}</Text>
            <TouchableOpacity
              style={[styles.langBtn, { flex: 0, paddingHorizontal: 16 }, tipsEnabled && styles.langBtnActive]}
              onPress={() => setTipsEnabled(!tipsEnabled)}
            >
              <Text style={[styles.langBtnText, tipsEnabled && styles.langBtnTextActive]}>
                {tipsEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#2D2D44' }]}>
            <Text style={styles.rowLabel}>{t('settingsExtended.resetTutorial')}</Text>
            <TouchableOpacity
              style={[styles.langBtn, { flex: 0, paddingHorizontal: 16 }]}
              onPress={async () => {
                await AsyncStorage.removeItem(TUTORIAL_KEY);
                Alert.alert('', t('settingsExtended.resetTutorialDone'));
              }}
            >
              <Text style={styles.langBtnText}>↺</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logoutUser} activeOpacity={0.8}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E8E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  rowValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  langBtnActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  langBtnText: {
    color: '#8E8E8E',
    fontSize: 14,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsScreen;
