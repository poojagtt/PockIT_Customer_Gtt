// import i18n from 'i18next';
// import {initReactI18next} from 'react-i18next';
// import {TranslationKeys} from './i18nTypes';

// const loadResources = async () => {
//   try {
//     const response = await fetch(
//       'https://1786vqrk-9887.inc1.devtunnels.ms/static/DraftJson/Default.json',
//     );
//     const translations = await response.json();
//     return {
//       en: {
//         translation: translations,
//       },
//     };
//   } catch (error) {
//     console.error('Failed to load translations:', error);
//     return {
//       en: {
//         translation: {},
//       },
//     };
//   }
// };

// const initializeI18n = async () => {
//   const resources = await loadResources();

//   await i18n.use(initReactI18next).init({
//     resources,
//     lng: 'en', // default language
//     fallbackLng: 'en',
//     interpolation: {
//       escapeValue: false,
//     },
//   });
// };

// // Initialize i18n
// initializeI18n();

// export default i18n;

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';
import {TranslationKeys} from './i18nTypes';

const resources: Record<string, {translation: any}> = {
  en: {translation: en},
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
