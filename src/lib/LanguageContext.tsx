import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, Translations } from './i18n';

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'sw',
  t: translations.sw,
  setLanguage: () => {},
  toggleLanguage: () => {},
});

const LANG_KEY = 'shamba-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('sw');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((stored) => {
      if (stored === 'en' || stored === 'sw') setLang(stored);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'sw' ? 'en' : 'sw');
  };

  return (
    <LanguageContext.Provider value={{ language, t: translations[language], setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
