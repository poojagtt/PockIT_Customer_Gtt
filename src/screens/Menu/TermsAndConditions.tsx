import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {fontFamily, Size, useTheme} from '../../modules';
import {useDispatch} from '../../context';
import {MenuRoutes} from '../../routes/Menu';
import {Icon} from '../../components';
import {useTranslation} from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';


interface TermsOfServiceProps extends MenuRoutes<'TermsAndConditions'> {}
const TermsOfService: React.FC<TermsOfServiceProps> = ({navigation}) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  const {t} = useTranslation();
  return (
    <SafeAreaView style={styles._container}>
      <Icon
        type="MaterialIcons"
        name="keyboard-backspace"
        size={27}
        color={'#999999'}
        onPress={() => navigation.goBack()}
      />
      <Text style={styles._headingTxt}>{t('menu.terms.title')}</Text>
    </SafeAreaView>
  );
};
export default TermsOfService;
const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
    backgroundColor: '#FFF',
  },
  _headingTxt: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size['2xl'],
    marginBottom: Size.lg,
  },
});
