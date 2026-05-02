import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ro from './locales/ro.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('pulsemap_lang') ?? 'ro';

i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'ro',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('pulsemap_lang', lang);
}

export default i18n;
