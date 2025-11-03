import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,

} from 'react-native';
import {useDispatch} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {MenuRoutes} from '../../routes/Menu';
import {
  requestNotifications,
  checkNotifications,
} from 'react-native-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';

import {fontFamily, Size, useStorage} from '../../modules';
import {Icon} from '../../components';
import {useTranslation} from 'react-i18next';

interface NotificationProps extends MenuRoutes<'Notification'> {}

const Notification: React.FC<NotificationProps> = ({navigation}) => {
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const storedStatus = useStorage.getBoolean('NOTIFICATIONS_ENABLED') ?? true;
    setIsEnabled(storedStatus);

    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const {status} = await checkNotifications();
    const currentIsEnabled = status === 'granted';
    setIsEnabled(currentIsEnabled);
    useStorage.set('NOTIFICATIONS_ENABLED', currentIsEnabled);
  };

  const requestNotificationPermission = async () => {
    const {status} = await requestNotifications(['alert', 'sound', 'badge']);
    const permissionGranted = status === 'granted';
    setIsEnabled(permissionGranted);
    useStorage.set('NOTIFICATIONS_ENABLED', permissionGranted);
    if (!permissionGranted) {
      // Optionally, inform the user if permission was denied after request
      // Alert.alert(t('common.error'), t('menu.notification.alerts.permissionDenied')); // Need to add this key if needed
    }
  };

  const toggleSwitch = async () => {
    const newStatus = !isEnabled;

    if (newStatus) {
      await requestNotificationPermission();
    } else {
      Alert.alert(
        t('menu.notification.alerts.disabled.title'),
        t('menu.notification.alerts.disabled.message'),
      );
      setIsEnabled(false);
      useStorage.set('NOTIFICATIONS_ENABLED', false);
    }
  };

  return (
    <SafeAreaView style={styles._container}>
      <Icon
        type="MaterialIcons"
        name="keyboard-backspace"
        size={27}
        color={'#999999'}
        onPress={() => navigation.goBack()}
      />
      <Text style={styles._headingTxt}>{t('menu.notification.title')}</Text>
      <View style={styles._menuItem}>
        <Text style={styles._txt}>
          {t('menu.notification.labels.pockitNotification')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles._toggleContainer, isEnabled && styles._toggleActive]}
          onPress={toggleSwitch}>
          <View
            style={[
              styles._toggleCircle,
              isEnabled && styles._toggleCircleActive,
            ]}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
    backgroundColor: '#FFF',
  },
  _headingTxt: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size['2xl'],
    marginBottom: Size.lg,
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginTop: 20,
    marginHorizontal: 10,
  },
  _txt: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily,
    color: '#6D6D6D',
  },
  _toggleContainer: {
    width: 53,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#767577',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  _toggleActive: {
    backgroundColor: '#34C759',
  },
  _toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  _toggleCircleActive: {
    alignSelf: 'flex-end',
  },
});
