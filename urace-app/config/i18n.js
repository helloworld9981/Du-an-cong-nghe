import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import vi from '../locales/vi.json'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'vi',
  fallbackLng: 'en',
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    zh: { translation: zh}
  },
  interpolation: {
    escapeValue: false
  }
})

export default i18n