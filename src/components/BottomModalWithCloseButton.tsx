import React, {ReactNode} from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  ViewStyle,
  ModalProps,
  TextStyle,
  Text,
  Pressable,
} from 'react-native';
import {fontFamily, Size, useTheme} from '../modules';
import Icon from './Icon';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface BottomModalProps extends ModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  modalStyle?: ViewStyle;
  backdropStyle?: ViewStyle;
  closeIconStyle?: ViewStyle;
  closeIconColor?: string;
}

const BottomModalWithCloseButton: React.FC<BottomModalProps> = ({
  show,
  onClose,
  children,
  title,
  titleStyle,
  containerStyle,
  modalStyle,
  backdropStyle,
  closeIconStyle,
  closeIconColor,
  ...rest
}) => {
  const colors = useTheme();

  return (
    <RNModal
   
      transparent
      visible={show}
      animationType="slide"
      onRequestClose={onClose}
      {...rest}>
        <SafeAreaProvider>
      <SafeAreaView style={styles.modalWrapper} edges={['bottom']}>
        <Pressable style={[styles.backdrop, backdropStyle]} onPress={onClose} />
        
        <View
          style={[
            styles.bottomContainer,
            {backgroundColor: colors.background},
            modalStyle,
          ]}>
          {/* Floating Close Button */}
          <View style={styles.closeIconWrapper}>
            <View style={[styles.closeButton, closeIconStyle]}>
              <Icon
                name="close"
                type="AntDesign"
                size={24}
                color={closeIconColor || colors.primary}
                onPress={onClose}
              />
            </View>
          </View>

          {/* Title */}
          {title ? (
            <Text
              style={[
                styles.title,
                {color: colors.black,fontFamily: 'SF-Pro-Text-Bold'},
                titleStyle,
                
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {title}
            </Text>
          ) : null}

          {/* Content */}
          <View style={[styles.contentContainer, containerStyle]}>
            {children}
          </View>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </RNModal>
  );
};

export default BottomModalWithCloseButton;

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomContainer: {
    borderTopLeftRadius: Size.radius * 2,
    borderTopRightRadius: Size.radius * 2,
    paddingTop: 12,
    paddingBottom: Size.padding,
    paddingHorizontal: Size.containerPadding,
    maxHeight:'80%'
  },
  closeIconWrapper: {
    position: 'absolute',
    top: -Size.lg * 3, // more top
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: '#fff',
    borderRadius: Size.lg * 2,
    padding: 8,
    elevation: 4,
  },
  title: {
    // textAlign: 'center',
    fontSize: Size.lg,
   
    // marginBottom: Size.padding,
  },
  contentContainer: {
    paddingBottom: Size.padding,
  },
});
