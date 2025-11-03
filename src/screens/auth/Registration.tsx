import messaging from '@react-native-firebase/messaging';
import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Modal,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {AppLogo} from '../../assets';
import {Button, CountryCodeSelector, Icon, TextInput} from '../../components';
import {Reducers, useDispatch} from '../../context';
import {getCountryCode} from '../../Functions';
import {
  apiCall,
  fontFamily,
  isValidEmail,
  isValidMobile,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {
  isValidFullName,
  isValidName,
  isValidShortCode,
} from '../../modules/validations';
import {AuthRoutes} from '../../routes/Auth';
import OtpModal from './OtpModal';
import SuccessModal from '../../components/SuccessModal';
import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';
import TermsAndConditionsModal from '../../components/TermsAndConditionsModal';
import PrivacyPolicy from '../../components/PrivacyPolicy';
import {CustomRadioButton} from '../../components/CustomRadioButton';
import {set} from '@react-native-firebase/database';

const PockItEnggColorlogo = require('../../assets/images/PokitItengineerscolor.png');

interface RegistrationProps extends AuthRoutes<'Registration'> {}
interface createPayload {
  NAME: string;
  EMAIL?: string;
  MOBILE: string;
}

const Registration: React.FC<RegistrationProps> = ({navigation, route}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const countryCodes = getCountryCode();
  const [showRegistrationSuccessModal, setShowRegistrationSuccessModal] =
    useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    mobile: '',
    errorName: '',
    errorEmail: '',
    errorMobile: '',
    error: '',
  });
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    contactPersonName: '',
    email: '',
    mobile: '',
    panNo: '',
    gstNo: '',
    shortCode: '',

    errorName: '',
    errorContactPersonName: '',
    errorEmail: '',
    errorMobile: '',
    errorPanNo: '',
    errorShortCode: '',
    error: '',
  });
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState({
    value: '',
    error: false,
    errorMessage: '',
    show: false,
  });
  const [timer, setTimer] = useState(0);
  const [type, setType] = useState<'I' | 'B'>('I');
  const [selectedCountry, setSelectedCountry] = useState({
    label: '+91 (India)',
    value: '+91',
  });
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [openReactivateModal, setOpenReactivateModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);

  const getFieldErrors = () => {
    if (type == 'I') {
      if (!submitted) {
        return {name: false, email: false, mobile: false};
      }
      const {name, email, mobile} = userInfo;
      const allEmpty = !name && !email && !mobile;
      const errors = {
        name: false,
        email: false,
        mobile: false,
      };

      if (allEmpty) {
        errors.name = errors.email = errors.mobile = true;
      } else {
        if (!name) errors.name = true;
        if (!email) errors.email = true;
        if (!mobile) errors.mobile = true;
      }
      return errors;
    } else {
      if (!submitted) {
        return {
          name: false,
          contactPersonName: false,
          mobile: false,
          email: false,
          panNo: false,
          gstNo: false,
          shortCode: false,
        };
      }
      const {name, email, mobile, panNo, gstNo, contactPersonName, shortCode} =
        businessInfo;
      const allEmpty =
        !name &&
        !email &&
        !mobile &&
        !panNo &&
        !gstNo &&
        !contactPersonName &&
        !shortCode;
      const errors = {
        name: false,
        email: false,
        mobile: false,
        panNo: false,
        gstNo: false,
        contactPersonName: false,
        shortCode: false,
      };

      if (allEmpty) {
        // mark all fields when everything is empty
        errors.name =
          errors.email =
          errors.mobile =
          errors.panNo =
          errors.gstNo =
          errors.contactPersonName =
          errors.shortCode =
            true;
      } else {
        if (!name) errors.name = true;
        if (!shortCode) errors.shortCode = true;
        if (!email) errors.email = true;
        if (!mobile) errors.mobile = true;
        if (!panNo) errors.panNo = true;

        if (!contactPersonName) errors.contactPersonName = true;
      }
      return errors;
    }
  };

  const [submitted, setSubmitted] = useState(false);
  const fieldErrors = getFieldErrors();
  const onCreateUser = async () => {
    setLoading(true);
    const CLOUD_ID = await messaging().getToken();

    // choose validation based on type
    const validator = type === 'B' ? checkValidationB2B : checkValidation;

    validator()
      .then(body => {
        // clear appropriate error state
        if (type === 'B') {
          setBusinessInfo({
            ...businessInfo,
            errorName: '',
            error: '',
            errorEmail: '',
            errorMobile: '',
            errorPanNo: '',
            errorContactPersonName: '',
          });
        } else {
          setUserInfo({
            ...userInfo,
            errorName: '',
            error: '',
            errorEmail: '',
            errorMobile: '',
          });
        }

        const payloadCommon = {
          TYPE: 'M',
          TYPE_VALUE: type === 'B' ? businessInfo.mobile : userInfo.mobile,
          OTP: otp.value,
          IS_NEW_CUSTOMER: 1,
          USER_ID: 0,
          // CUSTOMER_NAME: body.NAME,
          CUSTOMER_EMAIL_ID: body.EMAIL,
          CUSTOMER_MOBILE_NO: body.MOBILE,
          CUSTOMER_CATEGORY_ID: 1,
          IS_SPECIAL_CATALOGUE: false,
          ACCOUNT_STATUS: true,
          CLOUD_ID: CLOUD_ID,
          W_CLOUD_ID: CLOUD_ID,
          COUNTRY_CODE: selectedCountry.value,
        };

        const payload = {
          ...payloadCommon,
          CUSTOMER_TYPE: type === 'B' ? 'B' : 'I',
          SHORT_CODE: type === 'B' ? businessInfo.shortCode : null,
          COMPANY_NAME: type === 'B' ? businessInfo.name : null,
          CUSTOMER_NAME:
            type === 'B' ? businessInfo.contactPersonName : body.NAME,
          PAN_NO: type === 'B' ? businessInfo.panNo : null,
          GST_NO: type === 'B' ? businessInfo.gstNo : null,
        };

        apiCall
          .post(`customer/verifyOTP`, payload)
          .then(res => {
            if (res.data.UserData) {
              setLoading(false);
              let user = res.data.UserData[0];
              let token = res.data.token;
              const topic = res.data.UserData[0]?.SUBSCRIBED_CHANNELS;
              useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(topic));
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
                  await messaging()
                    .subscribeToTopic(item.CHANNEL_NAME)
                    .then(() => {});
                });
              }
              // if(type=='B')
              // {
              //   setShowRegistrationSuccessModal(true);
              //  }
              // else
              // {
              dispatch(Reducers.setSplash(true));

              // }
            } else {
              setLoading(false);
              if (type === 'B') {
                setBusinessInfo({
                  ...businessInfo,
                  errorName: '',
                  error: res.data.message,
                  errorEmail: '',
                  errorMobile: '',
                });
              } else {
                setUserInfo({
                  ...userInfo,
                  errorName: '',
                  error: res.data.message,
                  errorEmail: '',
                  errorMobile: '',
                });
              }
            }
          })
          .catch(err => {
            setLoading(false);
            const message = err
              ? err.message
                ? err.message
                : 'Something went wrong'
              : 'Something went wrong';

            if (type === 'B') {
              setBusinessInfo({
                ...businessInfo,
                errorName: '',
                error: message,
                errorEmail: '',
                errorMobile: '',
                errorPanNo: '',
                errorContactPersonName: '',
              });
            } else {
              setUserInfo({
                ...userInfo,
                errorName: '',
                error: message,
                errorEmail: '',
                errorMobile: '',
              });
            }
            console.warn(err);
          });
      })
      .catch(error => {
        setLoading(false);
        // route error to correct state based on type
        if (type === 'B') {
          if (
            error.code === 'name' ||
            error.code === 'contactPerson' ||
            error.code === 'pan' ||
            error.code === 'email' ||
            error.code === 'mobile' ||
            error.code === 'all'
          ) {
            setBusinessInfo({
              ...businessInfo,
              errorName:
                error.code === 'name' ? error.message : businessInfo.errorName,
              errorContactPersonName:
                error.code === 'contactPerson'
                  ? error.message
                  : businessInfo.errorContactPersonName,
              errorEmail:
                error.code === 'email'
                  ? error.message
                  : businessInfo.errorEmail,
              errorMobile:
                error.code === 'mobile'
                  ? error.message
                  : businessInfo.errorMobile,
              errorPanNo:
                error.code === 'pan' ? error.message : businessInfo.errorPanNo,
              error: error.code === 'all' ? error.message : businessInfo.error,
            });
          } else {
            setBusinessInfo({
              ...businessInfo,
              error: error.message,
            });
          }
        } else {
          if (error.code == 'user') {
            setUserInfo({
              ...userInfo,
              errorName: error.message,
              error: '',
              errorEmail: '',
              errorMobile: '',
            });
          } else if (error.code == 'mobile') {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: '',
              errorEmail: '',
              errorMobile: error.message,
            });
          } else if (error.code == 'email') {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: '',
              errorEmail: error.message,
              errorMobile: '',
            });
          } else {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: error.message,
              errorEmail: '',
              errorMobile: '',
            });
          }
        }
      });
  };

  useEffect(() => {
    let timerId: any;
    if (showRegistrationSuccessModal) {
      timerId = setTimeout(() => setShowRegistrationSuccessModal(false), 5000);
    }
    return () => clearTimeout(timerId);
  }, [showRegistrationSuccessModal]);
  // function checkValidation(): Promise<createPayload> {
  //   return new Promise((resolve, reject) => {
  //     if (!userInfo.name) {
  //       reject({
  //         code: 'user',
  //         message: t('registration.validationErrors.nameRequired'),
  //       });
  //     } else if (userInfo.name && userInfo.name.trim() == '') {
  //       reject({
  //         code: 'user',
  //         message: t('registration.validationErrors.nameEmpty'),
  //       });
  //     } else if (!userInfo.email) {
  //       reject({
  //         code: 'email',
  //         message: t('registration.validationErrors.emailRequired'),
  //       });
  //     } else if (userInfo.email && !isValidEmail(userInfo.email)) {
  //       reject({
  //         code: 'email',
  //         message: t('registration.validationErrors.emailInvalid'),
  //       });
  //     } else if (!userInfo.mobile) {
  //       reject({
  //         code: 'mobile',
  //         message: t('registration.validationErrors.mobileRequired'),
  //       });
  //     } else if (userInfo.mobile && !isValidMobile(userInfo.mobile)) {
  //       reject({
  //         code: 'mobile',
  //         message: t('registration.validationErrors.mobileInvalid'),
  //       });
  //     } else {
  //       resolve({
  //         NAME: userInfo.name,
  //         EMAIL: userInfo.email,
  //         MOBILE: userInfo.mobile,
  //       });
  //     }
  //   });
  // }

  function checkValidation(): Promise<createPayload> {
    return new Promise((resolve, reject) => {
      if (
        (!userInfo.name || userInfo.name.trim() === '') &&
        (!userInfo.email || userInfo.email.trim() === '') &&
        (!userInfo.mobile || userInfo.mobile.trim() === '')
      ) {
        reject({
          code: 'all',
          message: 'Please fill all required fields',
        });
      } else if (!userInfo.name) {
        reject({
          code: 'user',
          message: t('registration.validationErrors.nameRequired'),
        });
      } else if (userInfo.name && userInfo.name.trim() === '') {
        reject({
          code: 'user',
          message: t('registration.validationErrors.nameEmpty'),
        });
      } else if (!userInfo.email) {
        reject({
          code: 'email',
          message: t('registration.validationErrors.emailRequired'),
        });
      } else if (userInfo.email && !isValidEmail(userInfo.email)) {
        reject({
          code: 'email',
          message: t('registration.validationErrors.emailInvalid'),
        });
      } else if (!userInfo.mobile) {
        reject({
          code: 'mobile',
          message: t('registration.validationErrors.mobileRequired'),
        });
      } else if (userInfo.mobile && !isValidMobile(userInfo.mobile)) {
        reject({
          code: 'mobile',
          message: t('registration.validationErrors.mobileInvalid'),
        });
      } else if (!termsAccepted) {
        reject({
          code: 'all',
          message: t('registration.validationErrors.termsCondition'),
        });
        return;
      } else {
        resolve({
          NAME: userInfo.name,
          EMAIL: userInfo.email,
          MOBILE: userInfo.mobile,
        });
      }
    });
  }
  const isValidPAN = (pan: string) => {
    if (!pan) return false;
    const p = pan.trim().toUpperCase();
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(p);
  };

  const isValidGST = (gst: string) => {
    if (!gst) return false;
    const g = gst.trim().toUpperCase();
    // GSTIN valid pattern: 2 digits (state) + 10 char PAN + 1 entity code + 1 Z + 1 checksum
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g);
  };

  function checkValidationB2B(): Promise<createPayload> {
    return new Promise((resolve, reject) => {
      if (
        (!businessInfo.name || businessInfo.name.trim() === '') &&
        (!businessInfo.email || businessInfo.email.trim() === '') &&
        (!businessInfo.mobile || businessInfo.mobile.trim() === '') &&
        (!businessInfo.contactPersonName ||
          businessInfo.contactPersonName.trim() === '') &&
        (!businessInfo.panNo || businessInfo.panNo.trim() === '')
      ) {
        reject({
          code: 'all',
          message: 'Please fill all required fields',
        });
      } else if (!businessInfo.name) {
        reject({
          code: 'name',
          message: 'please enter organization name',
        });
      } else if (businessInfo.name && businessInfo.name.trim() === '') {
        reject({
          code: 'name',
          message: t('registration.validationErrors.nameEmpty'),
        });
      } else if (!businessInfo.contactPersonName) {
        reject({
          code: 'contactPerson',
          message: 'please enter contact person name',
        });
      } else if (!businessInfo.email) {
        reject({
          code: 'email',
          message: 'please enter email',
        });
      } else if (businessInfo.email && !isValidEmail(businessInfo.email)) {
        reject({
          code: 'email',
          message: t('registration.validationErrors.emailInvalid'),
        });
      } else if (!businessInfo.mobile) {
        reject({
          code: 'mobile',
          message: t('registration.validationErrors.mobileRequired'),
        });
      } else if (businessInfo.mobile && !isValidMobile(businessInfo.mobile)) {
        reject({
          code: 'mobile',
          message: t('registration.validationErrors.mobileInvalid'),
        });
      } else if (!businessInfo.panNo) {
        reject({
          code: 'pan',
          message: 'please enter PAN number',
        });
      } else if (!isValidPAN(businessInfo.panNo)) {
        reject({
          code: 'pan',
          message: 'Please enter valid PAN number',
        });
      } else if (businessInfo.gstNo && !isValidGST(businessInfo.gstNo)) {
        // GST is optional in UI; if provided, validate format
        reject({
          code: 'gst',
          message: 'Please enter valid GST number',
        });
      } else if (!termsAccepted) {
        reject({
          code: 'all',
          message: t('registration.validationErrors.termsCondition'),
        });
        return;
      } else {
        resolve({
          NAME: businessInfo.name,
          EMAIL: businessInfo.email,
          MOBILE: businessInfo.mobile,
        });
      }
    });
  }
  //   function checkValidation(): Promise<createPayload> {
  //   return new Promise((resolve, reject) => {
  //     const errors: Record<string, string> = {};

  //     if (!userInfo.name) {
  //       errors.name = t('registration.validationErrors.nameRequired');
  //     } else if (userInfo.name.trim() === '') {
  //       errors.name = t('registration.validationErrors.nameEmpty');
  //     }

  //     if (!userInfo.email) {
  //       errors.email = t('registration.validationErrors.emailRequired');
  //     } else if (!isValidEmail(userInfo.email)) {
  //       errors.email = t('registration.validationErrors.emailInvalid');
  //     }

  //     if (!userInfo.mobile) {
  //       errors.mobile = t('registration.validationErrors.mobileRequired');
  //     } else if (!isValidMobile(userInfo.mobile)) {
  //       errors.mobile = t('registration.validationErrors.mobileInvalid');
  //     }

  //     if (Object.keys(errors).length > 0) {
  //       reject(errors); // Reject with all field-specific errors
  //     } else {
  //       resolve({
  //         NAME: userInfo.name.trim(),
  //         EMAIL: userInfo.email.trim(),
  //         MOBILE: userInfo.mobile.trim(),
  //       });
  //     }
  //   });
  // }

  const timeOutCallback = useCallback(
    () => setTimer(currTimer => currTimer - 1),
    [],
  );
  useEffect(() => {
    timer > 0 && setTimeout(timeOutCallback, 1000);
  }, [timer, timeOutCallback]);
  const onRegistrationClick = () => {
    setSubmitted(true);
    setLoading(true);
    checkValidation()
      .then(body => {
        setUserInfo({
          ...userInfo,
          errorName: '',
          error: '',
          errorEmail: '',
          errorMobile: '',
        });
        apiCall
          .post(`customer/registerOtp`, {
            TYPE_VALUE: userInfo.mobile,
            COUNTRY_CODE: selectedCountry.value,
            TYPE: 'M',
            EMAIL_ID: body.EMAIL,
            MOBILE_NO: body.MOBILE,
            CUSTOMER_CATEGORY_ID: 1,
            CUSTOMER_TYPE: 'I',
          })
          .then(res => {
            if (res.status == 200 && res.data.code == 200) {
              console.log('res.data.data', res.data.data);
              setTimer(30);
              setOtp({...otp, show: true});
            }
            if (res.status == 200 && res.data.code == 300) {
              setUserInfo({
                ...userInfo,
                errorName: '',
                error: res.data.message,
                // error:
                //   'Oops! It looks like your account is currently deactivated. You can reach out to our support team to get it reactivated, or simply try registering with another mobile number.',
                errorEmail: '',
                errorMobile: '',
              });
            } else if (res.data.code == 301) {
              setOpenReactivateModal(true);
            }
          })
          .catch(err => {
            console.warn(err);
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(error => {
        if (error.code == 'user') {
          setUserInfo({
            ...userInfo,
            errorName: error.message,
            error: '',
            errorEmail: '',
            errorMobile: '',
          });
        } else if (error.code == 'mobile') {
          setUserInfo({
            ...userInfo,
            errorName: '',
            error: '',
            errorEmail: '',
            errorMobile: error.message,
          });
        } else if (error.code == 'email') {
          setUserInfo({
            ...userInfo,
            errorName: '',
            error: '',
            errorEmail: error.message,
            errorMobile: '',
          });
        } else {
          setUserInfo({
            ...userInfo,
            errorName: '',
            error: error.message,
            errorEmail: '',
            errorMobile: '',
          });
        }
        setLoading(false);
      });
  };

  const onRegistrationClickB2B = () => {
    setSubmitted(true);
    setLoading(true);
    checkValidationB2B()
      .then(body => {
        setBusinessInfo({
          ...businessInfo,
          errorName: '',
          error: '',
          errorEmail: '',
          errorMobile: '',
          errorPanNo: '',
          errorContactPersonName: '',
          errorShortCode: '',
        });
        console.log('body', 'here');
        apiCall
          .post(`customer/registerOtp`, {
            TYPE_VALUE: businessInfo.mobile, // use business mobile
            COUNTRY_CODE: selectedCountry.value,
            TYPE: 'M',
            EMAIL_ID: body.EMAIL,
            MOBILE_NO: body.MOBILE,
            CUSTOMER_CATEGORY_ID: 1,
            CUSTOMER_TYPE: 'B',
          })
          .then(res => {
            console.log('register res', res);
            if (res.status == 200 && res.data.code == 200) {
              setTimer(30);
              setOtp({...otp, show: true});
            }
            if (res.status == 200 && res.data.code == 300) {
              setBusinessInfo({
                ...businessInfo,
                errorName: '',
                error: res.data.message,
                errorEmail: '',
                errorMobile: '',
                errorPanNo: '',
                errorContactPersonName: '',
                errorShortCode: '',
              });
            } else if (res.data.code == 301) {
              setOpenReactivateModal(true);
            }
          })
          .catch(err => {
            console.warn(err);
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(error => {
        // map validation errors returned by checkValidationB2B
        if (error.code === 'name') {
          setBusinessInfo(prev => ({...prev, errorName: error.message}));
        } else if (error.code === 'contactPerson') {
          setBusinessInfo(prev => ({
            ...prev,
            errorContactPersonName: error.message,
          }));
        } else if (error.code === 'email') {
          setBusinessInfo(prev => ({...prev, errorEmail: error.message}));
        } else if (error.code === 'mobile') {
          setBusinessInfo(prev => ({...prev, errorMobile: error.message}));
        } else if (error.code === 'pan') {
          setBusinessInfo(prev => ({...prev, errorPanNo: error.message}));
        } else if (error.code === 'all') {
          setBusinessInfo(prev => ({...prev, error: error.message}));
        } else {
          setBusinessInfo(prev => ({...prev, error: error.message}));
        }
        setLoading(false);
      });
  };
  const onModalClose = () => {
    setOtp({...otp, show: false});
  };
  const onResend = () => {
    const validator = type === 'B' ? checkValidationB2B : checkValidation;
    validator()
      .then(body => {
        if (type === 'B') {
          setBusinessInfo({
            ...businessInfo,
            errorName: '',
            error: '',
            errorEmail: '',
            errorMobile: '',
            errorPanNo: '',
            errorContactPersonName: '',
          });
        } else {
          setUserInfo({
            ...userInfo,
            errorName: '',
            error: '',
            errorEmail: '',
            errorMobile: '',
          });
        }

        apiCall
          .post(`customer/registerOtp`, {
            TYPE_VALUE: type === 'B' ? businessInfo.mobile : userInfo.mobile,
            COUNTRY_CODE: selectedCountry.value,
            TYPE: 'M',
            EMAIL_ID: body.EMAIL,
            MOBILE_NO: body.MOBILE,
            CUSTOMER_TYPE: type === 'B' ? 'B' : 'I',
          })
          .then(res => {
            if (res.status == 200 && res.data.code == 200) {
              setTimer(30);
              setOtp({...otp, show: true, value: ''});
            }
            if (res.status == 200 && res.data.code == 300) {
              if (type === 'B') {
                setBusinessInfo({
                  ...businessInfo,
                  errorName: '',
                  error: res.data.message,
                  errorEmail: '',
                  errorMobile: '',
                });
              } else {
                setUserInfo({
                  ...userInfo,
                  errorName: '',
                  error: res.data.message,
                  errorEmail: '',
                  errorMobile: '',
                });
              }
            }
          })
          .catch(err => {
            console.warn(err);
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(error => {
        if (type === 'B') {
          // handle B2B validation errors
          if (error.code === 'name') {
            setBusinessInfo(prev => ({...prev, errorName: error.message}));
          } else if (error.code === 'contactPerson') {
            setBusinessInfo(prev => ({
              ...prev,
              errorContactPersonName: error.message,
            }));
          } else if (error.code === 'email') {
            setBusinessInfo(prev => ({...prev, errorEmail: error.message}));
          } else if (error.code === 'mobile') {
            setBusinessInfo(prev => ({...prev, errorMobile: error.message}));
          } else if (error.code === 'pan') {
            setBusinessInfo(prev => ({...prev, errorPanNo: error.message}));
          } else {
            setBusinessInfo(prev => ({...prev, error: error.message}));
          }
        } else {
          if (error.code == 'user') {
            setUserInfo({
              ...userInfo,
              errorName: error.message,
              error: '',
              errorEmail: '',
              errorMobile: '',
            });
          } else if (error.code == 'mobile') {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: '',
              errorEmail: '',
              errorMobile: error.message,
            });
          } else if (error.code == 'email') {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: '',
              errorEmail: error.message,
              errorMobile: '',
            });
          } else {
            setUserInfo({
              ...userInfo,
              errorName: '',
              error: error.message,
              errorEmail: '',
              errorMobile: '',
            });
          }
        }
        setLoading(false);
      });
  };

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

  const generateShortCodeFromName = (orgName: string): string => {
  const cleanName = orgName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  let shortCode = cleanName.substring(0, 4);
  while (shortCode.length < 4) {
    shortCode += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 36)
    );
  }
  
  for (let i = 0; i < 4; i++) {
    shortCode += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 36)
    );
  }
  
  return shortCode;
};

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            style={{
              flex: 1,
              // gap: Platform.OS == 'ios' ? 50 : 0,
              justifyContent: 'flex-end',
            }}>
            <View style={{alignItems: 'center', gap: 12}}>
              <Image
                source={AppLogo}
                style={{width: 67, height: 60}}
                resizeMode={'contain'}
              />
              <Image
                source={PockItEnggColorlogo}
                style={{width: '30%'}}
                resizeMode={'contain'}
              />

              <View style={{paddingHorizontal: 16, gap: 16}}>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontWeight: '400',
                    fontSize: 24,
                    lineHeight: 28.64,
                    letterSpacing: 0,
                    textAlign: 'center',
                    color: colors.primary,
                  }}>
                  {t('registration.welcome')}
                </Text>

                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontWeight: 400,
                    fontSize: 24,
                    lineHeight: 28.64,
                    letterSpacing: 0,
                    textAlign: 'center',
                    color: '#1C1C28',
                  }}>
                  {t('registration.registerTitle')}
                </Text>
              </View>
            </View>
            {/* <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 16,
                justifyContent: 'space-evenly',
                
              }}>
              <CustomRadioButton
                label="Home User"
                value="Home User"
                selected={type === 'I'}
                onPress={() => {
                  setType('I');
                  setSubmitted(false);
                }}
              />
              <CustomRadioButton
                label="Business User"
                value="Business User"
                selected={type === 'B'}
                onPress={() => {
                  setSubmitted(false);
                  setType('B');
                }}
              />
            </View> */}

            {type == 'I' ? (
              <View style={{gap: 10, padding: 16, marginTop: 0}}>
                <TextInput
                  imp={true}
                  label={t('registration.nameLabel')}
                  placeholder={t('registration.namePlaceholder')}
                  value={userInfo.name}
                  keyboardType="default"
                  onChangeText={(text: string) => {
                    if (isValidFullName(text)) {
                      setUserInfo({
                        ...userInfo,
                        errorName: '',
                        name: text,
                      });
                    } else {
                      setUserInfo({
                        ...userInfo,
                        errorName: t('registration.nameError'),
                        name: text,
                      });
                    }
                  }}
                  error={fieldErrors.name || !!userInfo.errorName}
                  errorMessage={
                    userInfo.errorName ||
                    (fieldErrors.name
                      ? t('registration.validationErrors.nameRequired')
                      : '')
                  }
                />
                <TextInput
                  imp={true}
                  label={t('registration.emailLabel')}
                  placeholder={t('registration.emailPlaceholder')}
                  value={userInfo.email}
                  keyboardType="email-address"
                  placeholderTextColor={`#D2D2D2`}
                  onChangeText={(text: string) =>
                    setUserInfo({
                      ...userInfo,
                      errorEmail: '',
                      email: text,
                    })
                  }
                  error={fieldErrors.email || !!userInfo.errorEmail}
                  errorMessage={
                    userInfo.errorEmail ||
                    (fieldErrors.email
                      ? t('registration.validationErrors.emailRequired')
                      : '')
                  }
                />

                <TextInput
                  imp={true}
                  leftChild={
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowCountrySelector(true)}
                      style={{
                        width: 70,
                        height: 45,
                        borderRightWidth: 1,
                        borderColor: userInfo.errorMobile
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
                          fontFamily: fontFamily,
                          fontSize: 16,
                        }}>
                        {selectedCountry.value}
                      </Text>
                    </TouchableOpacity>
                  }
                  label={t('registration.mobileLabel')}
                  placeholder={t('registration.mobilePlaceholder')}
                  value={userInfo.mobile}
                  maxLength={10}
                  keyboardType="number-pad"
                  onChangeText={(text: string) =>
                    setUserInfo({
                      ...userInfo,
                      errorMobile: '',
                      mobile: text,
                    })
                  }
                  error={fieldErrors.mobile || !!userInfo.errorMobile}
                  errorMessage={
                    userInfo.errorMobile ||
                    (fieldErrors.mobile
                      ? t('registration.validationErrors.mobileRequired')
                      : '')
                  }
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.disable,
                    fontFamily: fontFamily,
                  }}>
                  Note: Please enter a WhatsApp-registered number.
                </Text>
                <View
                  style={{
                    paddingHorizontal: 16,
                    alignContent: 'center',
                    justifyContent: 'center',
                  }}></View>

                <CountryCodeSelector
                  visible={showCountrySelector}
                  onClose={() => setShowCountrySelector(false)}
                  onSelect={(item: {label: string; value: string}) => {
                    setSelectedCountry({
                      ...selectedCountry,
                      label: item.label,
                      value: item.value,
                    });
                  }}
                  data={countryCodes}
                  selectedCountry={selectedCountry}
                />

                {userInfo.error && (
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      color: colors.error,
                      textAlign: 'center',
                      lineHeight: 20,
                      letterSpacing: 0.4,
                      fontSize: 11,
                      marginTop: -6,
                    }}>
                    {'' + userInfo.error}
                  </Text>
                )}
              </View>
            ) : (
              <ScrollView style={{padding: 16, }}>
                <View style={{gap: 10}}>
                  <TextInput
                    imp={true}
                    label="Organization Name"
                    placeholder="Enter Organization Name"
                    value={businessInfo.name}
                    keyboardType="default"
                    onChangeText={(text: string) => {
                      if (isValidFullName(text)) {
                              const generatedShortCode = generateShortCodeFromName(text);

                        setBusinessInfo({
                          ...businessInfo,
                          errorName: '',
                          name: text,
                           shortCode: generatedShortCode,
        errorShortCode: '',
                        });
                      } else {
                        setBusinessInfo({
                          ...businessInfo,
                          errorName: t('registration.nameError'),
                          name: text,
                        });
                      }
                    }}
                    error={fieldErrors.name || !!businessInfo.errorName} // changed
                    errorMessage={
                      businessInfo.errorName ||
                      (fieldErrors.name
                        ? t('registration.validationErrors.nameRequired')
                        : '')
                    }
                  />
                  {/* <TextInput
                    maxLength={8}
                    imp={true}
                    label="short code"
                    placeholder="Enter short code"
                    value={businessInfo.shortCode}
                    keyboardType="default"
                    onChangeText={(text: string) => {
                      const spaceRemoved = text.replace(/\s/g, '');
                      if (isValidShortCode(spaceRemoved)) {
                        setBusinessInfo({
                          ...businessInfo,
                          errorName: '',
                          shortCode: spaceRemoved,
                        });
                      } else {
                        setBusinessInfo({
                          ...businessInfo,
                          errorShortCode: 'Please enter valid short code',
                          shortCode: spaceRemoved,
                        });
                      }
                    }}
                    error={
                      fieldErrors.shortCode || !!businessInfo.errorShortCode
                    } // changed
                    errorMessage={
                      businessInfo.errorShortCode ||
                      (fieldErrors.shortCode ? 'Please enter short code' : '')
                    }
                  /> */}

                  <TextInput
                    imp={true}
                    label="Contact Person Name"
                    placeholder="Enter Contact Person Name"
                    value={businessInfo.contactPersonName}
                    keyboardType="default"
                    placeholderTextColor={`#D2D2D2`}
                    onChangeText={(text: string) =>
                      setBusinessInfo({
                        ...businessInfo,
                        errorContactPersonName: '',
                        contactPersonName: text,
                      })
                    }
                    error={
                      fieldErrors.contactPersonName ||
                      !!businessInfo.errorContactPersonName
                    }
                    errorMessage={
                      businessInfo.errorContactPersonName ||
                      (fieldErrors.contactPersonName
                        ? 'Please enter contact person name'
                        : '')
                    }
                  />

                  <TextInput
                    imp={true}
                    label="Email"
                    placeholder="Enter Email"
                    value={businessInfo.email}
                    keyboardType="email-address"
                    onChangeText={(text: string) =>
                      setBusinessInfo({
                        ...businessInfo,
                        errorEmail: '',
                        email: text,
                      })
                    }
                    error={fieldErrors.email || !!businessInfo.errorEmail}
                    errorMessage={
                      businessInfo.errorEmail ||
                      (fieldErrors.email
                        ? t('registration.validationErrors.emailRequired')
                        : '')
                    }
                  />

                  <TextInput
                    imp={true}
                    leftChild={
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowCountrySelector(true)}
                        style={{
                          width: 70,
                          height: 45,
                          borderRightWidth: 1,
                          borderColor: businessInfo.errorMobile
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
                            fontFamily: fontFamily,
                            fontSize: 16,
                          }}>
                          {selectedCountry.value}
                        </Text>
                      </TouchableOpacity>
                    }
                    label={t('registration.mobileLabel')}
                    placeholder={t('registration.mobilePlaceholder')}
                    value={businessInfo.mobile}
                    maxLength={10}
                    keyboardType="number-pad"
                    onChangeText={(text: string) =>
                      setBusinessInfo({
                        ...businessInfo,
                        errorMobile: '',
                        mobile: text,
                      })
                    }
                    error={fieldErrors.mobile || !!businessInfo.errorMobile}
                    errorMessage={
                      businessInfo.errorMobile ||
                      (fieldErrors.mobile
                        ? t('registration.validationErrors.mobileRequired')
                        : '')
                    }
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.disable,
                      fontFamily: fontFamily,
                    }}>
                    Note: Please enter a WhatsApp-registered number.
                  </Text>

                  <CountryCodeSelector
                    visible={showCountrySelector}
                    onClose={() => setShowCountrySelector(false)}
                    onSelect={(item: {label: string; value: string}) => {
                      setSelectedCountry({
                        ...selectedCountry,
                        label: item.label,
                        value: item.value,
                      });
                    }}
                    data={countryCodes}
                    selectedCountry={selectedCountry}
                  />

                  <View style={{flexDirection: 'row', flex: 1}}>
                    <View style={{flex: 1}}>
                      <TextInput
                      maxLength={10}
                        imp={true}
                        label="PAN Number"
                        placeholder="Enter PAN Number"
                        value={businessInfo.panNo}
                        keyboardType="default"
                        placeholderTextColor={`#D2D2D2`}
                        onChangeText={(text: string) => {
                          const up = text.toUpperCase();
                          setBusinessInfo({
                            ...businessInfo,
                            // clear pan error only if valid
                            errorPanNo: isValidPAN(up)
                              ? ''
                              : businessInfo.errorPanNo
                              ? businessInfo.errorPanNo
                              : '',
                            panNo: up,
                          });
                        }}
                        error={fieldErrors.panNo || !!businessInfo.errorPanNo}
                        errorMessage={
                          businessInfo.errorPanNo ||
                          (fieldErrors.panNo ? 'Please enter PAN number' : '')
                        }
                      />
                    </View>
                    <View style={{width: 12}} />
                    <View style={{flex: 1}}>
                      <TextInput
                        imp={false}
                        label="GST Number"
                        placeholder="Enter GST Number"
                        value={businessInfo.gstNo}
                        keyboardType="default"
                        placeholderTextColor={`#D2D2D2`}
                        onChangeText={(text: string) => {
                          const up = text.toUpperCase();
                          setBusinessInfo({
                            ...businessInfo,
                            gstNo: up,
                            // set GST error immediately if user types an invalid-looking GST (optional)
                            ...(up.length >= 15
                              ? {
                                  errorGstNo: isValidGST(up)
                                    ? ''
                                    : 'Please enter valid GST number',
                                }
                              : {}),
                          });
                        }}
                        error={fieldErrors.gstNo}
                        errorMessage={
                          fieldErrors.gstNo
                            ? t('registration.validationErrors.gstNoRequired')
                            : ''
                        }
                      />
                    </View>
                  </View>
                </View>
                {businessInfo.error && (
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      color: colors.error,
                      textAlign: 'center',
                      lineHeight: 20,
                      letterSpacing: 0.4,
                      fontSize: 11,
                      marginTop: 8,
                      // marginTop: -6,
                    }}>
                    {'' + businessInfo.error}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={{marginHorizontal: 16}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                  marginTop: 10,
                }}>
                <TouchableOpacity
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: termsAccepted ? colors.primary2 : '#999',
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: termsAccepted
                      ? colors.primary2
                      : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  {termsAccepted && (
                    <Icon
                      type="AntDesign"
                      name="check"
                      size={14}
                      color="#fff"
                    />
                  )}
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    fontFamily: fontFamily,
                    lineHeight: 18,
                    marginLeft: 5,
                  }}>
                  I have read and agree to the{' '}
                  <Text
                    onPress={() => setShowTermsModal(true)}
                    style={{
                      fontFamily: fontFamily,
                      color: colors.primary2,
                      textDecorationLine: 'underline',
                    }}>
                    Terms and Conditions
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      color: colors.text,
                    }}>
                    {' '}
                    and{' '}
                  </Text>
                  <Text
                    onPress={() => setPrivacyModal(true)}
                    style={{
                      fontFamily: fontFamily,
                      color: colors.primary2,
                      textDecorationLine: 'underline',
                    }}>
                    Privacy Policy{' '}
                  </Text>
                  of PockIT Engineers
                </Text>
              </View>
              <Button
                style={{
                  backgroundColor: colors.primary2,
                }}
                // style={{
                //   backgroundColor: termsAccepted
                //     ? colors.primary2
                //     : '#A0A0A0',
                // }}
                label={t('registration.registerButton')}
                loading={loading}
                // disable={!termsAccepted}
                onPress={
                  type === 'B' ? onRegistrationClickB2B : onRegistrationClick
                }
              />
              <View style={{gap: 24}}>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontWeight: '400',
                    fontSize: 15,
                    lineHeight: 19.53,
                    letterSpacing: 0.5,
                    textAlign: 'center',
                    color: '#525252',
                    marginBottom: 14,
                    marginTop: 12,
                  }}>
                  {t('registration.haveAccount')}
                  <Text
                    onPress={() => navigation.replace('Login')}
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 15,
                      fontWeight: '400',
                      lineHeight: 17.9,
                      letterSpacing: 0.5,
                      textAlign: 'center',
                      color: colors.primary2,
                    }}>
                    {t('registration.login')}
                  </Text>
                </Text>
              </View>

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
                  marginBottom: 16,
                }}>
                {t('login.continueGuest')}
              </Text>
            </View>
            {/* otp Modal */}
            <OtpModal
              error={type === 'B' ? businessInfo.error : userInfo.error}
              visible={otp.show}
              loading={loading}
              onBack={onModalClose}
              value={otp.value}
              onChange={text =>
                setOtp({
                  ...otp,
                  value: text,
                })
              }
              onResend={onResend}
              onSuccess={onCreateUser}
              sendTo={`${selectedCountry.value} ${
                type === 'B' ? businessInfo.mobile : userInfo.mobile
              }`}
            />
            <Modal visible={loading} transparent />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomModalWithCloseButton
        onClose={() => setOpenReactivateModal(false)}
        visible={openReactivateModal}
        show={openReactivateModal}>
        <View style={{}}>
          <View
            style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
            <Icon type="AntDesign" name="warning" size={24} color="#000" />

            <Text
              style={{
                fontSize: Size.xl,
                fontWeight: 'bold',
                marginLeft: 12,
                fontFamily: fontFamily,
              }}>
              Account Deactivated
            </Text>
          </View>
          <Text
            style={{
              marginTop: 16,
              fontSize: Size.md,
              fontWeight: '500',
              fontFamily: fontFamily,
              color: '#0E0E0E',
              textAlign: 'center',
            }}>
            Oops! It looks like your account is currently deactivated. You can
            reach out to our support team to get it reactivated, or simply try
            registering with another mobile number.
          </Text>

          <View style={{marginTop: 30}}>
            <Button label="Contact Support" onPress={handleCustomerSupport} />
            <Button
              outlined
              style={{marginTop: 12}}
              label="Try Another Number"
              onPress={() => {
                if (type === 'B') {
                  setBusinessInfo(prev => ({...prev, mobile: ''}));
                } else {
                  setUserInfo(prev => ({...prev, mobile: ''}));
                }
                setOpenReactivateModal(false);
              }}
            />
          </View>
        </View>
      </BottomModalWithCloseButton>

      <TermsAndConditionsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyPolicy
        visible={privacyModal}
        onClose={() => setPrivacyModal(false)}
      />
      <SuccessModal
        visible={showRegistrationSuccessModal}
        title="You’ve registered successfully."
        message={'Your account will be activated after admin approval'}
      />
      {/* <Modal visible={true} transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Registration Successful</Text>
            <Text style={{ marginBottom: 12 }}>Your account has been created successfully!</Text>
            <Button label="OK" onPress={() => setShowRegistrationSuccessModal(false)} />
          </View>
        </View>
      </Modal> */}
    </SafeAreaView>
  );
};
export default Registration;
