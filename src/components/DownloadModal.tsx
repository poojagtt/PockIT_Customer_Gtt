import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Modal from './Modal';
import RNFS from 'react-native-fs';
import {
  checkMultiple,
  PERMISSIONS,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import FileView from 'react-native-file-viewer';
import {useTranslation} from 'react-i18next';
import { fontFamily } from '../modules';

interface DownloadModalProps {
  url: string;
  fileName: string;
  path?: string;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  url,
  fileName,
  path,
  onClose,
}) => {
  const {t} = useTranslation();
  const PATH =
    Platform.select({
      android: `${RNFS.DownloadDirectoryPath}/${fileName}`,
    }) || '';
  const [isExists, setExists] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    checkPermission().then(value => {
      checkFilePresent();
    });
  }, []);
  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version <= 29) {
        const granted = await checkMultiple([
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ]);
        if (
          granted[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] ===
            RESULTS.GRANTED &&
          granted[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.GRANTED
        ) {
          return true;
        } else {
          const granted = await requestMultiple([
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          ]);
          if (
            granted[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] ===
              RESULTS.GRANTED &&
            granted[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] ===
              RESULTS.GRANTED
          ) {
            return true;
          } else {
            return false;
          }
        }
      } else {
        return true;
      }
    }
  };
  const checkFilePresent = async () => {
    const isExists = await RNFS.exists(PATH);
    if (isExists) {
      setExists(true);
    } else {
      setExists(false);
    }
  };
  const onDownloadPress = async () => {
    setDownloading(true);
    try {
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        Alert.alert(
          t('downloadModal.permissionRequired'),
          t('downloadModal.storagePermission'),
          [
            {text: t('common.cancel'), onPress: () => onClose()},
            {
              text: t('common.goToSettings'),
              onPress: () => Linking.openSettings(),
            },
          ],
          {cancelable: false},
        );
        return;
      }
      const fileProcess = await RNFS.downloadFile({
        fromUrl: url,
        toFile: path ? path : PATH,
        background: true,
        connectionTimeout: 10000,
        progress(res) {},
      }).promise;
      if (fileProcess.statusCode == 200) {
        checkFilePresent();
      } else {
        Alert.alert(
          t('downloadModal.downloadFailed'),
          t('downloadModal.failedToDownload'),
          [
            {text: t('downloadModal.retry'), onPress: () => onDownloadPress()},
            {text: t('common.cancel'), onPress: () => onClose()},
          ],
          {cancelable: false},
        );
      }
    } catch (error) {
      console.warn('ERROR', error);
    } finally {
      setDownloading(false);
    }
  };
  const openFile = async () => {
    try {
      FileView.open(PATH);
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert(
        t('downloadModal.unableToOpenFile'),
        t('downloadModal.checkIfYouHaveAnApp'),
        [],
        {cancelable: false},
      );
    }
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      style={{borderRadius: 20}}
      containerStyle={{borderRadius: 20}}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{fileName}</Text>
        {isExists ? (
          <Text style={styles.url}>{t('downloadModal.fileAlreadyExists')}</Text>
        ) : (
          <Text style={styles.url}>
            {t('downloadModal.doYouWantToDownload')}
          </Text>
        )}
        {isExists ? (
          <TouchableOpacity
            style={[styles.button, downloading && styles.buttonDisabled]}
            onPress={openFile}
            disabled={downloading}>
            <Text style={styles.buttonText}>{t('downloadModal.openFile')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, downloading && styles.buttonDisabled]}
            onPress={onDownloadPress}
            disabled={downloading}>
            <Text style={styles.buttonText}>
              {downloading
                ? t('downloadModal.downloading')
                : t('downloadModal.download')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default DownloadModal;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    fontFamily: fontFamily,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    position: 'relative',
  },
  closeButton: {
    fontFamily: fontFamily,
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: fontFamily,
    color: '#666',
  },
  title: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  url: {
    fontFamily: fontFamily,
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    fontFamily: fontFamily,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
