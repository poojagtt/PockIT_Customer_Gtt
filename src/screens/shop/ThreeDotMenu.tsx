import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Icon } from '../../components';
import { fontFamily, Size } from '../../modules';
import { useTranslation } from 'react-i18next';

const ThreeDotMenu = ({
  isVisible,
  isInvoice,
  isWarranty,
  isReschedule,
  isCancel,
  isRasieTicket,
  invoiceOnPress,
  warrantyOnPress,
  rescheduleOnPress,
  cancelOnPress,
  raiseticketOnPress,
   onRequestClose,
}: {
  isVisible: boolean;
  isInvoice: boolean;
  isWarranty: boolean;
  isReschedule: boolean;
  isCancel: boolean,
  isRasieTicket: boolean,
  invoiceOnPress?: () => void;
  warrantyOnPress?: () => void;
  rescheduleOnPress?: () => void;
  cancelOnPress?: () => void;
  raiseticketOnPress?: () => void;
  onRequestClose: () => void;
}) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  useEffect(() => {
    if (isVisible) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [isVisible]);

  const openMenu = () => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const opacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

  return (
     <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: SCREEN_HEIGHT,
            width: SCREEN_WIDTH,
            zIndex: 21,
          }}>
          
          {/* Detect outside touch */}
          <TouchableWithoutFeedback onPress={onRequestClose}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
    <Animated.View
      style={[
        styles.menuContainer,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}>
      {isInvoice && (
        <TouchableOpacity
          onPress={()=>{
            () => {
              invoiceOnPress?.();
              onRequestClose();
            }
          }}
          activeOpacity={0.8}
          style={styles.menuItem}>
          <Text style={styles.menuText}>{t('shop.menu.downloadInvoice')}</Text>
        </TouchableOpacity>
      )}
      {isWarranty && (
        <TouchableOpacity
          onPress={()=>{
            warrantyOnPress?.();
              onRequestClose();
          }}
          activeOpacity={0.8}
          style={styles.menuItem}>
          <Text style={styles.menuText}>{t('shop.menu.downloadWarranty')}</Text>
        </TouchableOpacity>
      )}
      {/* {isReschedule && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={rescheduleOnPress}
          style={styles.menuItem}>
          <Text style={styles.menuText}>Reschedule</Text>
        </TouchableOpacity>
      )} */}
      {isCancel && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            ()=>{
            cancelOnPress?.();
              onRequestClose();
          
          }}
          style={styles.menuItem}>
          <Icon
            type="AntDesign"
            name="closecircleo"
            size={18}
            color={'#2A3B8F'}
            style={styles.icon}
          />
          <Text style={styles.menuText}>{t('shop.menu.cancel')}</Text>
        </TouchableOpacity>
      )}
      {isRasieTicket && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            ()=>{
            raiseticketOnPress?.();
              onRequestClose();
          }
          }
          style={styles.menuItem}>
          <Icon
            type="Ionicons"
            name="ticket-outline"
            size={18}
            color={'#2A3B8F'}
            style={styles.icon}
          />
          <Text style={styles.menuText}>{t('orderPreview.menu.ticket')}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
    </View>
  );
};

export default ThreeDotMenu;

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    right: 15,
    top: 65,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBCBCB',
    elevation: 7,
    borderRadius: 5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    zIndex: 22,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#343434',
    marginRight: Size['2xl'],
  },
  icon: {
    marginBottom: 2,
    marginHorizontal: 2,
  },
});
