import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enAuth from '@/i18n/locales/en/auth.json'
import enCommon from '@/i18n/locales/en/common.json'
import enFeatures from '@/i18n/locales/en/features.json'
import enPages from '@/i18n/locales/en/pages.json'
import myAuth from '@/i18n/locales/my/auth.json'
import myCommon from '@/i18n/locales/my/common.json'
import myFeatures from '@/i18n/locales/my/features.json'
import myPages from '@/i18n/locales/my/pages.json'

const LOCALE_STORAGE_KEY = 'order-notebook.locale'

function getStoredLocale(): string {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return stored === 'my' ? 'my' : 'en'
  } catch {
    return 'en'
  }
}

const initialLocale = getStoredLocale()
document.documentElement.lang = initialLocale

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      pages: enPages,
      features: enFeatures,
    },
    my: {
      common: myCommon,
      auth: myAuth,
      pages: myPages,
      features: myFeatures,
    },
  },
  lng: initialLocale,
  fallbackLng: 'en',
  supportedLngs: ['en', 'my'],
  defaultNS: 'common',
  ns: ['common', 'auth', 'pages', 'features'],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  localStorage.setItem(LOCALE_STORAGE_KEY, language)
})

export default i18n
