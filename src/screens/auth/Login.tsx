import { getMessaging, getToken } from '@react-native-firebase/messaging';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '../../assets';
import { Button, CountryCodeSelector, TextInput } from '../../components';
import { Reducers, useDispatch } from '../../context';
import { getCountryCode } from '../../Functions';
import { apiCall, isValidEmail, isValidMobile, useStorage } from '../../modules';
import { tokenStorage } from '../../modules/hooks';
import { fontFamily, Size, useTheme } from '../../modules/themes';
import { AuthRoutes } from '../../routes/Auth';
import OtpModal from './OtpModal';
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';
import Toast from '../../components/Toast';
import { CustomRadioButton } from '../../components/CustomRadioButton';

const messagings = getMessaging();
//Images Logo
const PockItEnggColorlogo = require('../../assets/images/PokitItengineerscolor.png');

interface LoginProps extends AuthRoutes<'Login'> { }
interface inputInterface {
  value: string;
  error: boolean;
  errorMessage: string;
  show?: boolean;
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const countryCodes = getCountryCode();
  const [mobile, setMobile] = useState<inputInterface>({
    value: '',
    error: false,
    errorMessage: '',
  });
  const [otp, setOtp] = useState({
    value: '',
    error: false,
    errorMessage: '',
    show: false,
    userId: '',
    userName: '',
  });
  const [error, setError] = useState({
    value: false,
    errorMessage: '',
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    label: '+91 (India)',
    value: '+91',
  });
  const [type, setType] = useState<'I' | 'B'>('I');

  const left = require('../../assets/images/left.png');
  const right = require('../../assets/images/right.png');
  const PockitLogocolor = require('../../assets/images/PokitItengineerscolor.png');
  const appVersion = DeviceInfo.getVersion();

  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const timeOutCallback = useCallback(
    () => setTimer(currTimer => currTimer - 1),
    [],
  );
  useEffect(() => {
    timer > 0 && setTimeout(timeOutCallback, 1000);
  }, [timer, timeOutCallback]);

  // useEffect(() => {
  //   const setupFCMMessaging = async () => {
  //     try {
  //       // Request permissions (iOS only)
  //       if (Platform.OS === 'ios') {
  //         const authStatus = await messaging().requestPermission();
  //         const enabled =
  //           authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //           authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  //         console.log('iOS Permission status:', authStatus);

  //         if (!enabled) {
  //           Toast("Notification permission not granted");
  //           // Alert.alert('Notification permission not granted');
  //           return;
  //         }
  //       }

  //       // Get FCM token
  //       const token = await messaging().getToken();
  //       console.log('📲 FCM Token:', token);

  //       // Listen for new tokens (optional)
  //       messaging().onTokenRefresh(newToken => {
  //         console.log('🔄 FCM Token refreshed:', newToken);
  //       });

  //       // Foreground message handler
  //       const unsubscribe = messaging().onMessage(async remoteMessage => {
  //         console.log('📩 Foreground message received:', remoteMessage);
  //       });

  //       return unsubscribe;
  //     } catch (error) {
  //       console.error('❌ Error in FCM setup:', error);
  //     }
  //   };

  //   setupFCMMessaging();
  // }, []);
  const onVerify = async () => {
    setLoading(true);
    let isValid: boolean = mobileValidation();
    if (!isValid) {
      setLoading(false);
      return;
    }
    apiCall
      .post('customer/sendOTP', {
        TYPE_VALUE: mobile.value,
        COUNTRY_CODE: selectedCountry.value,
        TYPE: showDropdown ? 'M' : 'E',
        CUSTOMER_TYPE: type,
      })
      .then(res => {

        if (res.data.code == 200) {
          setError({
            value: false,
            errorMessage: '',
          });
          setOtp({
            ...otp,
            userId: res.data.USER_ID,
            userName: res.data.USER_NAME,
            show: true,
          });
        } else {
          setError({
            value: true,
            errorMessage: res.data.message,
          });
        }
      })
      .catch(function (error) {
        console.log('error.....', error);
        if (error.response) {
          setError({ value: true, errorMessage: error.response.data.message });
          return;
        } else if (error.request) {
          setError({
            value: true,
            errorMessage: `Unable to check the connection`,
          });
        } else {
          setError({ value: true, errorMessage: error.message });
          return;
        }
      })
      .finally(() => setLoading(false));
  };
  const onOTPVerify = async () => {
    if (otp.value.length < 4) {
      setError({ value: true, errorMessage: 'Please enter otp' });
      return;
    }
    setLoading(true);
    await messaging();
    const CLOUD_ID = await getToken(messagings);
    apiCall
      .post('customer/verifyOTP', {
        TYPE: showDropdown ? 'M' : 'E',
        TYPE_VALUE: mobile.value,
        OTP: otp.value,
        USER_ID: otp.userId,
        CUSTOMER_NAME: otp.userName,
        CUSTOMER_CATEGORY_ID: 1,
        CLOUD_ID: CLOUD_ID,
         CUSTOMER_TYPE: type,
      })
      .then(res => {


        if (res.data.UserData) {
          let user = res.data.UserData[0];
          let token = res.data.token;
          const topic = res.data.UserData[0]?.SUBSCRIBED_CHANNELS;
          useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(topic));
          setError({ value: false, errorMessage: '' });
          setOtp({
            ...otp,
            error: false,
            errorMessage: '',
            show: false,
            value: '',
          });
          tokenStorage.setToken(token);
          useStorage.set(`user`, user.USER_ID);
          if (topic) {
            topic.map(async (item: any) => {
              await messagings.subscribeToTopic(item.CHANNEL_NAME).then(() => {
              });
            });
          }
          dispatch(Reducers.setSplash(true));
        } else {
          setError({ value: true, errorMessage: res.data.message });
        }
      })
      .catch(function (error) {
        if (error.response) {
          setError({ value: true, errorMessage: error.response.data.message });
          return;
        } else if (error.request) {
          setError({
            value: true,
            errorMessage: t('splash.systemError'),
          });
          return;
        } else {
          setError({ value: true, errorMessage: error.message });
          return;
        }
      })
      .finally(() => setLoading(false));
  };
  const mobileValidation: () => boolean = () => {
    if (mobile.value.length == 0) {
      setMobile({
        ...mobile,
        error: true,
        errorMessage: t('login.emailMobileError'),
      });
      return false;
    }
    if (showDropdown) {
      if (mobile.value.length != 10) {
        setMobile({
          ...mobile,
          error: true,
          errorMessage: t('login.mobileError'),
        });
        return false;
      }
      if (!isValidMobile(mobile.value)) {
        setMobile({
          ...mobile,
          error: true,
          errorMessage: t('login.mobileError'),
        });
        return false;
      }
    } else if (!isValidEmail(mobile.value)) {
      setMobile({
        ...mobile,
        error: true,
        errorMessage: t('login.emailError'),
      });
      return false;
    }
    return true;
  };
  const onModalClose = () => {
    setOtp({ ...otp, show: false });
  };
  const onResendOTP = () => {
    apiCall
      .post('customer/sendOTP', {
        TYPE_VALUE: mobile.value,
        COUNTRY_CODE: selectedCountry.value,
        TYPE: showDropdown ? 'M' : 'E',
         CUSTOMER_TYPE: type,
      })
      .then(res => {
        if (res.data.code == 200) {
          setTimer(30);
          setError({
            value: false,
            errorMessage: '',
          });
          setOtp({
            ...otp,
            userId: res.data.USER_ID,
            userName: res.data.USER_NAME,
            show: true,
          });
        } else {
          setError({
            value: true,
            errorMessage: res.data.message,
          });
        }
      })
      .catch(function (error) {
        if (error.response) {
          setError({ value: true, errorMessage: error.response.data.message });
          return;
        } else if (error.request) {
          setError({ value: true, errorMessage: error.request.data.message });

          return;
        } else {
          setError({ value: true, errorMessage: error.message });
          return;
        }
      })
      .finally(() => setLoading(false));
  };
  const handleTextInputChange = (text: string) => {
    setMobile({
      ...mobile,
      value: text,
      error: false,
      errorMessage: '',
    });
    const isAllNumbers = /^\d+$/.test(text);
    if (text.length >= 5 && text.length <= 10 && isAllNumbers) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider
      style={{
        flex: 1,
        backgroundColor: colors.white,
      }}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}>
          <Image
            source={left}
            style={{
              position: 'absolute',
              left: -Size.containerPadding,
              top: '50%',
              transform: [{ translateY: '-50%' }],
              // width: '50%',
              height: '100%',
              resizeMode: 'contain',
            }}
          />
          <Image
            source={right}
            style={{
              position: 'absolute',
              right: -Size.containerPadding,
              top: '16%',
              transform: [{ translateY: '-50%' }],
              height: '100%',
              resizeMode: 'contain',
            }}
          />
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 16,
                justifyContent: 'space-between',
              }}
              keyboardShouldPersistTaps="handled">
              {/* Top section */}
              <View
                style={{
                  alignItems: 'center',
                  marginTop: keyboardVisible ? 20 : 60,
                }}>
                <Image
                  source={AppLogo}
                  style={{ width: 80, height: 80 }}
                  resizeMode="contain"
                />
                <Image
                  source={PockitLogocolor}
                  style={{ width: 138, height: 40 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontFamily: fontFamily, fontWeight: '400',
                    fontSize: 20,
                    lineHeight: 28.64,
                    textAlign: 'center',
                    color: colors.primary,
                  }}>
                  Welcome to PockIT!
                </Text>
                <Text
                  style={{
                    fontFamily: fontFamily, fontWeight: '500',
                    fontSize: 24,
                    lineHeight: 28.64,
                    textAlign: 'center',
                    color: '#1C1C28',
                    marginTop: 20,
                    marginBottom: 20,
                  }}>
                  Login
                </Text>
                {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' }}>
                  <CustomRadioButton
                    label='Home User'
                    value="Home User"
                    selected={type === 'I'}

                    onPress={() => {

                      setType('I');
                    }}
                  />
                  <View style={{width: 16}}></View>
                  <CustomRadioButton
                    label='Business User'
                    value="Business User"
                    selected={type === 'B'}
                    onPress={() => {
                      setType('B');
                    }}
                  />
                </View> */}
              </View>

              {error.value && (
                <Text
                  style={{
                    color: colors.error,
                    textAlign: 'center',
                    marginBottom: 10,
                    fontFamily: fontFamily
                  }}>
                  {error.errorMessage}
                </Text>
              )}


              {/* Bottom section */}
              <View>
                <View style={{ marginBottom: keyboardVisible ? 16 : 16 }}>
                  <TextInput
                    leftChild={
                      showDropdown ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowCountrySelector(true)}
                          style={{
                            width: 80,
                            borderRightWidth: 1,
                            borderColor: mobile.error
                              ? colors.error
                              : '#CBCBCB',
                            borderTopWidth: 0,
                            borderLeftWidth: 0,
                            borderBottomWidth: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 8,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            backgroundColor: 'transparent',
                          }}>
                          <Text
                            style={{
                              color: colors.text,
                              fontFamily: fontFamily, fontSize: 16,
                            }}>
                            {selectedCountry.value}
                          </Text>
                        </TouchableOpacity>
                      ) : undefined
                    }
                    placeholder={
                      !mobile.value || mobile.value.length < 3
                        ? 'Enter Email or Mobile Number'
                        : 'Mobile Number'
                    }
                    value={mobile.value}
                    keyboardType="email-address"
                    placeholderTextColor="#D2D2D2"
                    onChangeText={handleTextInputChange}
                    error={mobile.error}
                    errorMessage={mobile.errorMessage}
                    maxLength={showDropdown ? 10 : undefined}
                  />
                  <CountryCodeSelector
                    visible={showCountrySelector}
                    onClose={() => setShowCountrySelector(false)}
                    onSelect={(item: { label: string; value: string }) => {
                      setSelectedCountry({
                        ...selectedCountry,
                        label: item.label,
                        value: item.value,
                      });
                    }}
                    data={countryCodes}
                    selectedCountry={selectedCountry}
                  />
                  {mobile.value.length >= 10 && (
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        color: '#757575',
                        fontSize: 11,
                        fontWeight: '400',
                        textAlign: 'center',
                        marginTop: 5,
                      }}>
                      You will receive an OTP on your above {showDropdown ? 'WhatsApp number' : 'email address'} for verification.

                    </Text>
                  )}
                </View>

                <View style={{ marginBottom: keyboardVisible ? 20 : 10 }}>
                  <Button label="Login" onPress={onVerify} loading={loading} />
                </View>
                <View style={{ gap: 20 }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: '600',
                      fontSize: 15,
                      lineHeight: 19.53,
                      letterSpacing: 0.5,
                      textAlign: 'center',
                      color: '#525252',
                    }}>
                    {t('login.noAccount')}
                    <Text
                      onPress={() => navigation.replace('Registration')}
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 16,
                        fontWeight: '400',
                        lineHeight: 17.9,
                        letterSpacing: 0,
                        textAlign: 'center',
                        color: colors.primary2,
                      }}>
                      {t('login.register')}
                    </Text>
                  </Text>

                  <Text
                    onPress={() => {
                      useStorage.set(`user`, 0);
                      dispatch(Reducers.setSplash(true));
                    }}
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: '400',
                      fontSize: 16,
                      lineHeight: 19.53,
                      letterSpacing: 0,
                      textAlign: 'center',
                      color: colors.primary2,
                    }}>
                    {t('login.continueGuest')}
                  </Text>
                </View>
                {/* <Text
                  style={{
                    color: colors.primary2,
                    textAlign: 'center',
                    marginVertical: 5,
                  }}>
                  v {appVersion}
                </Text> */}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>

        <OtpModal
          value={otp.value}
          error={error.errorMessage}
          loading={loading}
          onBack={onModalClose}
          onChange={text => setOtp({ ...otp, value: text })}
          onResend={onResendOTP}
          onSuccess={onOTPVerify}
          sendTo={
            showDropdown
              ? `${selectedCountry.value} ${mobile.value}`
              : mobile.value
          }
          visible={otp.show}
        />

        <Modal transparent visible={loading} />
      </KeyboardAvoidingView>

    </SafeAreaProvider>
  );
};
export default Login;
