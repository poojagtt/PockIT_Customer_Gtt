import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Modal} from 'react-native';
import {Size, fontFamily, useTheme} from '../modules';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from './Icon';

interface SuccessModalProps {
  visible: boolean;
  message: string;
  title?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({visible, message, title}) => {
  const colors = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <SafeAreaView style={{flex: 1}}>
        <View
          style={{
            flex: 1,
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={styles._circle}>
              <Icon
                name="done"
                type="MaterialIcons"
                size={80}
                color={colors.background}
              />
            </View>
           { title&&<Text style={styles._title}>{title}</Text>}

            <Text style={styles._message}>{message}</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  _circle: {
    height: 150,
    width: 150,
    borderRadius: 76,
    backgroundColor: '#3170DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  _message: {
    fontFamily: fontFamily,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
    // marginTop: Size.lg,
  },
   _title: {
    fontFamily: fontFamily,
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: Size.lg,
  },
});

export default SuccessModal;
