import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Reducers, useDispatch, useSelector} from '../../context';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall, BASE_URL} from '../../modules/services';
import {_noProfile, AppLogo} from '../../assets';
import {SVG} from '../../assets';

import {
  fontFamily,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {Button, Header, Icon} from '../../components';
import {useTranslation} from 'react-i18next';
import AddressPopUp from '../home/AddressPopUp';
import messaging from '@react-native-firebase/messaging';
import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';
import Toast from '../../components/Toast';
import DeviceInfo from 'react-native-device-info';

interface MenuProps extends MenuRoutes<'MainMenu'> {
  navigation: any;
}
const Menu: React.FC<MenuProps> = ({navigation}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const {user, address} = useSelector(state => state.app);
  const [loading, setLoading] = useState<boolean>(false);
  const [addressModal, setAddressModal] = useState<boolean>(false);
  const [openDeleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const ID = user?.ID;
  const [loader, setLoader] = useState({
    profile: false,
  });
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/customer/get', {
          filter: ` AND ID = ${ID} `,
        })
        .then(res => res.data);

      if (response.code === 200) {
        const userData = response.data[0];
        if (userData) {
          dispatch(Reducers.setUser(userData));
        }
      } else {
        Alert.alert(t('common.error'), t('mainMenu.errors.fetchFailed'));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(t('common.error'), t('mainMenu.errors.fetchUserDataError'));
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    user?.ID != 0
      ? {
          id: '1',
          icon: (
            <SVG.location_away fill={colors.primary} width={20} height={18} />
          ),
          label: t('menu.addressBook.title'),
          onPress: () =>
            navigation.navigate('AddressBook', {
              cartId: {id: null, type: null},
            }),
        }
      : {
          id: '1',
          icon: (
            <SVG.location_away fill={colors.primary} width={20} height={18} />
          ),
          label: t('mainMenu.menuItems.updateAddress'),
          onPress: () => setAddressModal(true),
        },
    user?.ID != 0
      ? {
          id: '3',
          icon: <SVG.settings fill={colors.primary} width={20} height={18} />,
          label: t('menu.settings.title'),
          onPress: () => navigation.navigate('Settings'),
        }
      : null,
    {
      id: '5',
      icon: (
        <Icon
          type="Feather"
          name="briefcase"
          size={20}
          color={colors.primary}
        />
      ),
      label: t('menu.helpSupport.title'),
      onPress: () => navigation.navigate('HelpAndSupport'),
    },
    {
      id: '7',
      icon: (
        <Image
          source={AppLogo}
          style={{width: 20, height: 18, resizeMode: 'contain'}}
        />
      ),
      label: t('menu.about.title'),
      onPress: () => navigation.navigate('About'),
    },
    user?.ID != 0
      ? {
          id: '8',
          icon: (
            <Icon
              type="Feather"
              name="trash-2"
              size={20}
              color={colors.primary}
            />
          ),
          label: t('menu.delete.title'),
          onPress: () => setDeleteModal(true),
        }
      : null,
  ];

  const handleLogout = async () => {
    try {
      if (user?.ID === 0) {
        useStorage.clearAll();
        tokenStorage.clearToken();
        dispatch(Reducers.setSplash(true));
        return;
      }
      const data = await apiCall.post('api/customer/logout', {
        USER_ID: user?.ID,
      });
      if (data.data.code === 200) {
        const subscribedChannels = JSON.parse(
          useStorage.getString('SUBSCRIBED_CHANNELS') || '[]',
        );
        const chatTopic = useStorage.getString('CHAT_TOPIC_TECH');
        if (chatTopic) {
          await messaging()
            .unsubscribeFromTopic(chatTopic)
            .then(value => {})
            .catch(value => {
              console.warn('err in unsubscribe of all_mem', value);
            });
        }
        subscribedChannels.map(async (item: any) => {
          await messaging()
            .unsubscribeFromTopic(item.CHANNEL_NAME)
            .then(value => {})
            .catch(value => {
              console.warn('err in unsubscribe of all_mem', value);
            });
        });
        useStorage.clearAll();
        tokenStorage.clearToken();
        dispatch(Reducers.setSplash(true));
      }
    } catch (error) {
      console.warn('error...', error);
    }
  };
  const handleDeactivateAccount = async () => {
    setDeleteLoader(true);
    try {
      // console.log('User data:', user); // Debug
      const res = await apiCall.post(`api/customer/deleteProfile`, {
        CUSTOMER_ID: user?.ID,
        NAME: user?.NAME,
        MOBILE_NO: user?.MOBILE_NO,
      });

      if (res.data && res.data.code === 200) {
        setDeleteLoader(false);
        Toast('Profile deactivated successfully');
        const subscribedChannels = JSON.parse(
          useStorage.getString('SUBSCRIBED_CHANNELS') || '[]',
        );
        const chatTopic = useStorage.getString('CHAT_TOPIC_TECH');
        if (chatTopic) {
          await messaging()
            .unsubscribeFromTopic(chatTopic)
            .then(value => {})
            .catch(value => {
              console.warn('err in unsubscribe of all_mem', value);
            });
        }
        subscribedChannels.map(async (item: any) => {
          await messaging()
            .unsubscribeFromTopic(item.CHANNEL_NAME)
            .then(value => {})
            .catch(value => {
              console.warn('err in unsubscribe of all_mem', value);
            });
        });
        useStorage.clearAll();
        tokenStorage.clearToken();
        dispatch(Reducers.setSplash(true));
      } else {
        setDeleteLoader(false);
        console.error('Failed to deactivate profile:', res.data);
      }
    } catch (error: any) {
      setDeleteLoader(false);

      console.error('Failed Deactivating Profile', error);
    }
  };
  const appVersion = DeviceInfo.getVersion();

  const handleCustomerSupport = async () => {

    const email = 'itsupport@pockitengineers.com';
    const subject = 'Permanent Account Deletion Request';
    const body =
      'Hello,\n\nI would like to permanently delete my account. Please guide me.\n\nThanks.';
    const mailtoURL = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoURL);

      if (supported) {
        await Linking.openURL(mailtoURL);
      } else {
        Alert.alert(
          'No Email App Found',
          'Please ensure you have a mail app set up on your device.',
        );
      }
    } catch (error) {
      console.error('Error opening mail app:', error);
      Alert.alert('Error', 'Failed to open the mail app.');
    }
  };
  return (
    <SafeAreaView style={styles._container}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View>
          <Header
            label={t('menu.profile.title')}
            onBack={() => navigation.goBack()}
          />
        </View>

        {/* profile */}
        {user?.ID != 0 ? (
          <TouchableOpacity
            style={styles._profileSection}
            onPress={() => navigation.navigate('Profile')}>
            <View style={{flexDirection: 'row', flex: 1}}>
              <View style={styles._profileImageContainer}>
                <Image
                  source={
                    user?.PROFILE_PHOTO
                      ? {
                          uri: `${BASE_URL}static/CustomerProfile/${
                            user?.PROFILE_PHOTO
                          }?timestamp=${new Date().getTime()}`,
                        }
                      : _noProfile
                  }
                  style={styles._profileImage}
                />
              </View>

              <View style={{flex: 1}}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View>
                    {user?.CUSTOMER_TYPE == 'B' ? (
                      <>
                        <Text style={styles._companyName} numberOfLines={1}>
                          {user?.COMPANY_NAME}
                        </Text>
                        <Text style={styles._userName} numberOfLines={1}>
                          {user?.NAME}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles._name} numberOfLines={1}>
                        {user?.NAME}
                      </Text>
                    )}

                    <View>
                      <Text style={styles._contact} numberOfLines={1}>
                        <Text style={{color: '#636363'}}>
                          {t('menu.profile.labels.mobile')}:{' '}
                        </Text>
                        {user?.MOBILE_NO}
                      </Text>
                    </View>

                    <Text
                      style={styles._contact}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      <Text style={{color: '#636363',fontFamily: fontFamily}}>
                        {t('menu.profile.labels.email')}:{' '}
                      </Text>
                      {user?.EMAIL}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View>
              <Icon
                type="Entypo"
                name="chevron-small-right"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles._profileSection}>
            <View style={{flexDirection: 'row', flex: 1}}>
              <View style={styles._profileImageContainer}>
                <Image source={_noProfile} style={styles._profileImage} />
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}>
                <Text style={styles._name} numberOfLines={1}>
                  {user?.NAME}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text
          style={{
            color: colors.disable,
            textAlign: 'center',
            marginVertical:8,
            fontFamily: fontFamily
          }}>
          Version {appVersion}
        </Text>
        {/* line */}
        <View style={styles._divider} />

        <View style={{gap: 12, marginHorizontal: Size.containerPadding}}>
          {menuItems.map(item => {
            if (item) {
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={item.id}
                  style={styles._menuItem}
                  onPress={item.onPress}>
                  <View style={styles._menuLeft}>
                    {item.icon}
                    <Text style={styles._txt}>{item.label}</Text>
                  </View>
                  <Icon
                    type="Entypo"
                    name="chevron-small-right"
                    size={18}
                    color={'#8F90A6'}
                  />
                </TouchableOpacity>
              );
            }
          })}
        </View>
      </ScrollView>

      <View style={styles._logoutContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles._logout}
          onPress={handleLogout}>
          <Text style={styles._logoutTxt}>
            {user?.ID == 0 ? 'Login' : t('menu.mainMenu.profile.logout')}
          </Text>
        </TouchableOpacity>
      </View>
      {addressModal ? (
        <AddressPopUp
          onClose={() => {
            setAddressModal(false);
          }}
          onSuccess={() => {
            setAddressModal(false);
          }}
          show={addressModal}
          addressData={address as AddressInterface}
          isEdit={true}
          type={null}
        />
      ) : null}

      <BottomModalWithCloseButton
        // title="Delete Account"
        onClose={() => setDeleteModal(false)}
        visible={openDeleteModal}
        show={openDeleteModal}>
        <View style={{}}>
          <View
            style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
            <Icon type="AntDesign" name="warning" size={24} color="#000" />

            <Text
              style={{fontSize: Size.xl, marginLeft: 12,fontFamily: fontFamily}}>
              {t('menu.delete.title')}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 10,
              fontSize: Size.md,
              fontWeight: '500',
              fontFamily: fontFamily,
              color: '#0E0E0E',
              textAlign: 'center',
            }}>
            Your account will be deactivated. We will retain your data in case
            you wish to reactivate it later. For any queries, please contact
            support.
          </Text>

          <View style={{marginTop: 30}}>
            <Button
              loading={deleteLoader}
              style={{backgroundColor: 'red'}}
              label="Yes, Deactivate"
              onPress={handleDeactivateAccount}></Button>

            <Button
              outlined
              style={{marginTop: 12}}
              label="Cancel"
              onPress={() => setDeleteModal(false)}></Button>
          </View>

          <TouchableOpacity onPress={handleCustomerSupport}>
            {/* optional */}
            <Text
              style={{
                fontFamily: fontFamily,
                marginTop: 24,
                fontSize: Size.sm,
                color: '#007AFF',
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}>
              Contact customer support
            </Text>
          </TouchableOpacity>
        </View>
      </BottomModalWithCloseButton>
    </SafeAreaView>
  );
};

export default Menu;
const styles = StyleSheet.create({
  _container: {
    flex: 1,
    backgroundColor: '#F6F8FF',
    // paddingVertical: Size.containerPadding,
  },
  _profileSection: {
    alignItems: 'center',
    // marginBottom: 20,
    flexDirection: 'row',
    borderRadius: 16,
    padding: 8,
    elevation: 8,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    marginHorizontal: Size.containerPadding,
    marginTop: 8,
  },
  _profileImageContainer: {
    width: 85,
    height: 85,
    borderRadius: 100,
    justifyContent: 'center',
  },
  _profileImage: {
    width: 80,
    height: 80,
    borderRadius: 95,
    borderWidth: 4,
    borderColor: '#FBA042',
  },
  _userName: {
    fontSize: 17,
    fontWeight: 'normal',
    paddingVertical: 0,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  _name: {
    fontSize: 16,
     fontFamily: 'SF-Pro-Text-Bold',
    color: '#1C1C28',
  },
  _companyName: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 21.6,
    paddingVertical: 0,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  _contact: {
    fontSize: 15,
    fontWeight: 400,
    fontFamily: fontFamily,
    color: '#0E0E0E',
    flexWrap: 'wrap',
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    padding: 12,
    borderColor: '#CBCBCB',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  _menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  _txt: {
    fontWeight: '500',
    fontSize: Size.lg,
    fontFamily: fontFamily,
    color: '#0E0E0E',
  },
  _modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  _modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  _modalTitle: {
    paddingBottom: 20,
    fontSize: Size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  _closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  _optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  _option: {
    alignItems: 'center',
  },
  _optionCircle: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'lightgray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  _optionText: {
    marginTop: 5,
    fontSize: 14,
  },
  _headingTxt: {
    fontSize: Size.xl,
    fontWeight: 500,
    fontFamily: fontFamily,
    color: '#0E0E0E',
    marginBottom: 8,
    marginHorizontal: Size.containerPadding,
  },
  _logoutContainer: {
    // paddingHorizontal: 8,
    marginHorizontal: Size.containerPadding,
    marginBottom: 10,
  },
  _divider: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#E7E6E6',
    marginBottom: 20,
  },
  _logout: {
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#3170DE',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  _logoutTxt: {
    fontSize: Size.lg,
    fontWeight: '500',
    fontFamily: fontFamily,
    color: '#3170DE',
  },
});
