import React, {ReactNode, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {fontFamily, Permissions, useTheme, Size} from '../modules';
import Modal from './Modal';
import Icon from './Icon';
import ImageCropPicker, {
  Options,
  Image as CroppedImage,
} from 'react-native-image-crop-picker';
import {useTranslation} from 'react-i18next';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

type captureInterface = {
  fileUrl: string;
  fileName: string;
  fileType: string;
};
interface ImagePickerProps extends TouchableOpacityProps {
  onCapture: (data: captureInterface) => void;
  onPress?: () => void;
  isDelete?: boolean;
}
const ImagePicker: React.FC<ImagePickerProps> = ({
  onCapture,
  onPress,
  isDelete = false,
  ...rest
}) => {
  const {t} = useTranslation();
  const NAME_MAX_LENGTH = 20;
  const colors = useTheme();
  const ImageOptions: Options = {
    cropping: true,
    mediaType: 'photo',
    cropperTintColor: colors.primary,
    freeStyleCropEnabled: true,
    multiple: false,
    cropperActiveWidgetColor: colors.primary,
    cropperCancelColor: colors.primary,
    cropperChooseColor: colors.primary,
    cropperToolbarColor: colors.primary,
    cropperToolbarWidgetColor: colors.primary,
    cropperStatusBarColor: colors.primary,
    disableCropperColorSetters: true,
    maxFiles: 1,
    compressImageQuality: 0.5,
    showCropFrame: true,
    forceJpg: true,
  };
  const [modal, setModal] = useState({
    permission: false,
    options: false,
  });
  const onSelectImage = async () => {
    const data = await Permissions.checkCamera('camera');
    if (!data) {
      await Permissions.requestCamera();
    }
    setModal({...modal, options: true});
  };
  const onSuccess = (image: CroppedImage) => {
    let extension = image.path.substring(image.path.lastIndexOf('.'));
    let fileName =
      ('IMG_' + Date.now()).substring(0, NAME_MAX_LENGTH) + extension;
    onCapture({fileUrl: image.path, fileName: fileName, fileType: image.mime});
  };
  const onCameraPress = () => {
    ImageCropPicker.openCamera(ImageOptions)
      .then(onSuccess)
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setModal({...modal, options: false});
      });
  };
  const onImagePress = () => {
    ImageCropPicker.openPicker(ImageOptions)
      .then(onSuccess)
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setModal({...modal, options: false});
      });
  };
  return (
    // <SafeAreaProvider>
    //   <SafeAreaView>
    <TouchableOpacity
      onPress={onSelectImage}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
      }}
      {...rest}>
      {rest.children}
      <Modal
        show={modal.options}
        containerStyle={{margin: 15, borderRadius: 16}}
        style={{
          justifyContent: 'center',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onClose={() => setModal({...modal, options: false})}>
        <View>
          <Text
            style={{
              fontWeight: '500',
              fontSize: 20,
              fontFamily: fontFamily,
            }}>
            {t('imagePicker.selectPhoto')}
          </Text>
          {isDelete && (
            <View style={styles._deleteContainer}>
              <Icon
                type="AntDesign"
                name="delete"
                size={21}
                style={styles._deleteIcon}
                color={colors.error}
                onPress={() => {
                  onCapture({fileUrl: '', fileName: '', fileType: ''});
                  setModal({...modal, options: false});
                }}
              />
            </View>
          )}
        </View>
        <View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onCameraPress()}
            style={[styles.button, {borderColor: colors.primary}]}>
            <Icon name="camera-outline" type="Ionicons" size={20} />
            <Text style={styles.label}>{t('imagePicker.camera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress()}
            style={[styles.button, {borderColor: colors.primary}]}>
            <Icon name="images-outline" type="Ionicons" size={20} />
            <Text style={styles.label}>{t('imagePicker.gallery')}</Text>
          </TouchableOpacity>
          <View style={styles._closeContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles._close}
              onPress={() => setModal({...modal, options: false})}>
              <Text style={styles._closeTxt}>{t('imagePicker.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
    //   </SafeAreaView>
    // </SafeAreaProvider>
  );
};
export default ImagePicker;
const styles = StyleSheet.create({
  button: {
    // flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    // borderColor: '#000',
    // borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontFamily: fontFamily,
    fontWeight: '500',
    marginLeft: 10,
  },
  _closeContainer: {
    marginVertical: Size.containerPadding,
  },
  _close: {
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#3170DE',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  _closeTxt: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
    color: '#3170DE',
  },
  _deleteContainer: {
    position: 'absolute',
    top: 8,
    right: 10,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  _deleteIcon: {
    padding: 5,
  },
});
