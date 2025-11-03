import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import { fontFamily } from '../modules';

const LanguageSwitcher = () => {
  const {i18n} = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <TouchableOpacity onPress={toggleLanguage} style={styles.container}>
      <Text style={styles.text}>
        {i18n.language === 'en' ? '한국어' : 'English'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  text: {
    fontSize: 16,
    fontFamily: fontFamily
  },
});

export default LanguageSwitcher;
