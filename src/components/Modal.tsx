import React, {ReactNode} from 'react';
import {
  View,
  StyleSheet,
  Modal as ModalComponent,
  ModalProps,
  ViewStyle,
  Text,
  TextStyle,
} from 'react-native';
import {fontFamily, Size, useTheme} from '../modules';
import Icon from './Icon';

interface ModalsProps extends ModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: ViewStyle;
  title?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  modalStyle?: ViewStyle;
}
const Modal: React.FC<ModalsProps> = ({
  show,
  onClose,
  style,
  children,
  containerStyle,
  title,
  titleStyle,
  modalStyle,
  ...Props
}) => {
  const colors = useTheme();
  return (
    <ModalComponent
      visible={show}
      onRequestClose={() => onClose()}
      transparent
      style={[{flex: 1}, modalStyle]}
      {...Props}>
      <View style={[styles._modalContainer, style]}>
        <Text style={styles._backdrop} onPress={() => onClose()} />
        <View
          style={[
            styles._container,
            {backgroundColor: colors.background},
            containerStyle,
          ]}>
          {title ? (
            <View style={[styles._titleContainer]}>
              <Text
                style={[styles._title, {color: colors.primary}, titleStyle]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {title}
              </Text>
              <Icon name="close" type="AntDesign" onPress={() => onClose()} />
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </ModalComponent>
  );
};
export default Modal;
const styles = StyleSheet.create({
  _modalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  _backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    fontFamily: fontFamily
  },
  _container: {
    padding: Size.containerPadding,
    // borderRadius: Size.radius,
    margin: Size.radius,
  },
  _title: {
    flex: 1,
    fontSize: Size.lg,
   
    textTransform: 'capitalize',
    fontFamily: fontFamily
  },
  _titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Size.padding,
  },
});