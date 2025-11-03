import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
 
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {fontFamily, Size, useTheme, useStorage} from '../../modules';
import {MenuRoutes} from '../../routes/Menu';
import {Header, Icon} from '../../components';
import {
  requestNotifications,
  checkNotifications,
} from 'react-native-permissions';
import {apiCall} from '../../modules/services';
import {useTranslation} from 'react-i18next';

interface SettingsProps extends MenuRoutes<'Settings'> {}
const Settings: React.FC<SettingsProps> = ({navigation}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [Language, setLanguage] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    loadNotificationStatus();
    fetchLanguage();
  }, []);

  const loadNotificationStatus = async () => {
    const storedStatus = await useStorage.getBoolean('NOTIFICATIONS_ENABLED');
    
    setIsEnabled(storedStatus === null || storedStatus === undefined || storedStatus);
  };

  const requestNotificationPermission = async () => {
    const {status} = await requestNotifications(['alert', 'sound', 'badge']);
    if (status === 'granted') {
      setIsEnabled(true);
      await useStorage.set('NOTIFICATIONS_ENABLED', true);
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
      await useStorage.set('NOTIFICATIONS_ENABLED', false);
    }
  };

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  const fetchLanguage = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/language/get', {
          sortKey: 'ID',
          sortValue: 'asc',
          CUSTOMER_ID: 3,
        })
        .then(res => res.data);
      if (response.code === 200) {
        setLanguage(response.data);
      } else {
        Alert.alert(t('menu.language.alerts.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      Alert.alert(t('menu.language.alerts.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles._container}>
      <View>
        <Header
          label={t('menu.settings.title')}
          onBack={() => navigation.goBack()}
        />
      </View>
   <View style={styles._Languagecard}>
        <Text style={styles._LanguageTitle}>
          {t('menu.settings.language.sectionTitle')}
        </Text>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#696969"
            style={styles._loaderContainer}
          />
        ) : (
          <FlatList
            data={Language}
            removeClippedSubviews={false}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({item, index}) => {
              return (
                <View style={styles._menuItem}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSelectLanguage(item.NAME)}
                    style={styles._menuRadioItem}>
                    <View style={styles._menuLeft}>
                      <View
                        style={[
                          styles._circle,
                          selectedLanguage === item.NAME &&
                            styles._circleSelected,
                        ]}>
                        {selectedLanguage === item.NAME && (
                          <View style={styles._innerCircle} />
                        )}
                      </View>
                      <Text style={styles._txt}>{item.NAME}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
      <View style={styles._Notificationcard}>
        <Text style={styles._NotificationTitle}>
          {t('menu.settings.notifications.title')}
        </Text>
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
      </View>

   
    </SafeAreaView>
  );
};
export default Settings;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    // padding: Size.containerPadding,
    backgroundColor: '#F6F8FF',
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginHorizontal: 18,
  },
  _menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  _txt: {
    fontSize: Size.lg,
    fontWeight: 600,
    fontFamily: fontFamily,
    color: '#3E3E3E',
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
    backgroundColor: '#F36631',
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
  _NotificationTitle: {
    fontSize: Size.lg,
    color: '#0E0E0E',
    fontWeight: '500',
    paddingLeft: 8,
    fontFamily: fontFamily
  },
  _Notificationcard: {
    borderWidth: 0.5,
    padding: 8,
    backgroundColor: '#FDFDFD',
    borderColor: '#CBCBCB',
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 5,
    margin: 15,
  },
  _circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#092B9C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  _circleSelected: {
    backgroundColor: '#FFF',
  },
  _innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#F36631',
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  _menuRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  _LanguageTitle: {
    fontSize: Size.lg,
    color: '#0E0E0E',
    fontWeight: '500',
    paddingLeft: 8,
    marginBottom: 14,
    fontFamily: fontFamily
  },
  _Languagecard: {
    borderWidth: 0.5,
    padding: 8,
    backgroundColor: '#FDFDFD',
    borderColor: '#CBCBCB',
    borderRadius: 16,
    marginTop: 12,
    marginHorizontal: 15,
    // flex: 1,
  },
});
