import {View, Text, Modal} from 'react-native';
import React from 'react';
import {fontFamily, GlobalStyle, Size, useTheme} from '../../../modules';
import {Icon} from '../../../components';
import {useTranslation} from 'react-i18next';

interface Props {
  visible: boolean;
  onClose: () => void;
  estimateTime: number;
}

const OrderInfoModal = ({visible, onClose, estimateTime}: Props) => {
  const colors = useTheme();
  const {t} = useTranslation();

  return (
    <Modal transparent visible={true} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}>
        <Text onPress={onClose} style={GlobalStyle.modalBackground} />
        <View
          style={{
            backgroundColor: colors.background,
            padding: Size.containerPadding,
            gap: 8,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}>
          <Icon
            name="close"
            type="Ionicons"
            color={colors.primary}
            size={23}
            onPress={onClose}
          />
          <View style={{gap: 3}}>
            <Text
              style={{
               fontFamily: fontFamily,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 30,
                textAlign: 'left',
                color: '#343434',
              }}>
              {t('orderPreview.orderInfo.estimatedTime', {
                time: estimateTime,
              })}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 400,
                textAlign: 'justify',
                letterSpacing: 0.6,
                color: '#333333',
              }}>
              {t('orderPreview.orderInfo.disclaimer')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OrderInfoModal;
