import React from 'react';
import {Text, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {fontFamily, Size, useTheme} from '../../modules';
import {useDispatch} from '../../context';
import {MenuRoutes} from '../../routes/Menu';
import {Icon} from '../../components';

interface LicensesProps extends MenuRoutes<'Licenses'> {}
const Licenses: React.FC<LicensesProps> = ({navigation}) => {
  const dispatch = useDispatch();
  const colors = useTheme();
  return (
    <SafeAreaView style={styles._container}>
      <Icon
        type="MaterialIcons"
        name="keyboard-backspace"
        size={27}
        color={'#999999'}
        onPress={() => navigation.goBack()}
      />
      <Text style={styles._headingTxt}>Licenses</Text>
    </SafeAreaView>
  );
};
export default Licenses;
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
