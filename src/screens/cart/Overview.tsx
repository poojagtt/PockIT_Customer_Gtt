import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {apiCall, fontFamily, useTheme} from '../../modules';
import {Header, Icon, LoadingIndicator} from '../../components';
import {RadioButton} from 'react-native-paper';
import {Reducers, useDispatch, useSelector} from '../../context';
import {CartRoutes} from '../../routes/Cart';
import {_styles} from '../../modules/stylesheet';
import {resetAndNavigate} from '../../utils';
import {HomeRoutes} from '../../routes/Home';
import CouponList from './CouponList';

import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

//Images
const AddShoppingCart = require('../../assets/images/Add_Shopping_cart.png');
const cancellationPolicy = require('../../assets/images/Cancellation_Policy.png');
const ExpressServiceIcon = require('../../assets/images/ExpressServicelogo.png');
import {_defaultImage} from '../../assets';

// @ts-ignore
import RazorpayCheckout, {RazorpayCheckoutOptions} from 'react-native-razorpay';
import {IMAGE_URL, RAZOR_PAY_KEY} from '../../modules/services';
import moment from 'moment';
import {useTranslation} from 'react-i18next';
import ProgressBar from '../../components/ProgressBar';
import SuccessModal from '../../components/SuccessModal';
import {CustomRadioButton} from '../../components/CustomRadioButton';
import Toast from '../../components/Toast';

type OverviewProps = HomeRoutes<'Overview'> | CartRoutes<'Overview'>;

const CartOverview: React.FC<OverviewProps> = ({navigation, route}) => {
  const {cartId} = route.params as {
    cartId: number;
  };
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const [loading, setLoading] = useState(false);
  const [isContactDetailsVisible, setIsContactDetailsVisible] = useState(false);
  const [isCouponsVisible, setIsCouponsVisible] = useState(false);
  const [isCancellationPolicyVisible, setIsCancellationPolicyVisible] =
    useState(false);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);
  const [cartDetails, setCartDetails] = useState<cartInterface[]>([]);
  const [cartInfo, setCartInfo] = useState<cartInfoInterface>();
  const [paymentMethod, setPaymentMethod] = useState(user?.CUSTOMER_TYPE == 'I'?'Online Payment':'Cash On Delivery');
  const {t} = useTranslation();

  // arrow rotation animation
  const contactDetailsVisible = useDerivedValue(() =>
    isContactDetailsVisible
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );
  const contactDetailsVisibleStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${contactDetailsVisible.value}deg`}],
  }));
 
  const PolicyVisible = useDerivedValue(() =>
    isCancellationPolicyVisible
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );
  const isCancellationPolicyVisibleStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${PolicyVisible.value}deg`}],
  }));

  const getCartInformation = async () => {
    try {
      setLoading(true);
      const res = await apiCall
        .post('api/cart/getDetails', {CART_ID: cartId})
        .then(res => {
          if (res.data.code == 200) {
            setCartInfo(res.data.data.CART_INFO[0]);
            setCartDetails(res.data.data.CART_DETAILS);
            setLoading(false);
          } else {
            return Promise.reject(res.data.message);
          }
        });
    } catch (error) {
      console.warn(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    getCartInformation();
  }, []);
  const dispatch = useDispatch();

  const ProceedToPay = () => {
    try {
      setLoading(true);
      const payload = {
        CART_ID: cartId,
        PAYMENT_METHOD: paymentMethod == 'Cash On Delivery' ? 'COD' : 'ONLINE',
        CUSTOMER_ID: user?.ID,
        ADDRESS_ID: cartInfo?.ADDRESS_ID,
        TERRITORYID: cartInfo?.TERRITORY_ID,
        TYPE: 'S',
      };
      apiCall.post('api/cart/order/create', payload).then(res => {
      
        if (res.data.code == 200) {
          // @ts-ignore
          resetAndNavigate(navigation, 'Order', 'OrderList');
          dispatch(Reducers.getCartInformation());
          // dispatch(
          //   Reducers.deleteCartItem({
          //     SERVICE_ID: cartId,
          //   }),
          // );
        } else {
          return Promise.reject(res.data.message);
        }
      });
    } catch (error) {
      console.warn(error);
      setLoading(false);
    }
  };

  const options: RazorpayCheckoutOptions = {
    description: t('overview.payment.description'),
    currency: 'INR',
    key: RAZOR_PAY_KEY,
    // amount: Math.round(1 * 100).toString(),
    amount: Math.round(Number(cartInfo?.TOTAL_AMOUNT) * 100).toString(),
    name: 'PockIT',
    prefill: {
      name: user?.NAME,
      email: user?.EMAIL,
      contact: user?.MOBILE_NO,
    },
    theme: {color: colors.primary},
    retry: {enabled: true},
    send_sms_hash: true,
    method: {
      netbanking: true,
      card: true,
      upi: true,
      // wallet: true,
    },
  };
  const createTransaction = () => {

    const payload = {
      CART_ID: cartId,
      ORDER_ID: 0,
      CUSTOMER_ID: user?.ID,
      JOB_CARD_ID: 0,
      PAYMENT_FOR: 'O',
      amount: Math.round(Number(cartInfo?.TOTAL_AMOUNT) * 100).toString(),
    };

    try {
      apiCall
        .post('api/paymentGatewayTransactions/createOrder', payload)

        .then(res => {
          if (res.data.code == 200 && res.data.data.amount) {
            const options: RazorpayCheckoutOptions = {
              description: t('overview.payment.description'),
              currency: 'INR',
              key: RAZOR_PAY_KEY,
              // amount: Math.round(1 * 100).toString(),
              amount: Math.round(
                Number(cartInfo?.TOTAL_AMOUNT) * 100,
              ).toString(),
              order_id: res.data.data.id,
              name: 'PockIT',
              prefill: {
                name: user?.NAME,
                email: user?.EMAIL,
                contact: user?.MOBILE_NO,
              },
              theme: {color: colors.primary},
              retry: {enabled: true},
              send_sms_hash: true,
              method: {
                netbanking: true,
                card: true,
                upi: true,
                // wallet: true,
              },
            };
            handlePayment(options);
          } else {
            Toast('Something went wrong! Plesae try again later');
          }
        });
    } catch (error: any) {
      Toast(error.message);
    }
  };
  const handlePayment = async (options: any) => {
    try {
      const response: any = await RazorpayCheckout.open(options);
      if (response && response.razorpay_payment_id) {
        updatePaymentStatus(response, 200);
        ProceedToPay();
      } else {
        console.warn(
          'Payment Incomplete',
          'Payment did not complete successfully.',
        );
      }
    } catch (error: any) {
      console.warn('Payment error:', error);
      let errorMessage = t('paymentSummary.payment.errors.cancelled');
      Alert.alert(errorMessage);
      if (error.description == 'Post payment parsing error') {
        updatePaymentStatus(error, 300);
      }
    } finally {
    }
  };
  const timeFormat = (h: number, m: number) => {
    let hours = ('00' + h).slice(-2);
    let minute = ('00' + m).slice(-2);
    return hours + '.' + minute + ' hours';
  };
  const updatePaymentStatus = async (data: any, code: number) => {
    try {
      const body = {
        CART_ID: cartId,
        ORDER_ID: null,
        CUSTOMER_ID: user?.ID,
        JOB_CARD_ID: null,
        TECHNICIAN_ID: null,
        VENDOR_ID: null,
        MOBILE_NUMBER: user?.MOBILE_NO,
        PAYMENT_FOR: 'O',
        PAYMENT_MODE: 'O',
        PAYMENT_TYPE: 'O',
        TRANSACTION_DATE: moment().format('YYYY-MM-DD'),
        TRANSACTION_ID: data.razorpay_payment_id,
        TRANSACTION_STATUS: 'Success',
        TRANSACTION_AMOUNT: cartInfo?.TOTAL_AMOUNT,
        PAYLOAD: options,
        RESPONSE_DATA: data,
        RESPONSE_CODE: code,
        MERCHENT_ID: RAZOR_PAY_KEY,
        RESPONSE_MESSAGE:
          code == 200 ? 'Transaction success' : 'Transaction failed',
        CLIENT_ID: 1,
      };

      const response = await apiCall.post(
        'api/invoicepaymentdetails/addPaymentTransactions',
        body,
      );
      if (response.data.code == 200) {
      }
    } catch (error) {
      console.warn(
        'API Error',
        'An error occurred while updating payment status.',
      );
    }
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
        {loading ? (
          <View style={{flex: 1}} />
        ) : (
          // <LoadingIndicator />
          <View style={{flex: 1}}>
            {/* <View style={{paddingHorizontal: 16, paddingTop: 16, gap: 6}}>
            <Icon
              name="keyboard-backspace"
              type="MaterialCommunityIcons"
              size={24}
              color={'#999999'}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles._headerText}>{t('overview.title')}</Text>
          </View> */}

            <View>
              <Header
                label={t('overview.title')}
                onBack={() => navigation.goBack()}
              />
            </View>

            <ProgressBar width={'100%'} />

            <ScrollView contentContainerStyle={{gap: 12, marginTop: 15}}>
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={styles.detailcard}>
                {/* Order Header */}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      width: '50%',
                    }}>
                    <Feather name="archive" size={20} color={colors.primary} />
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        letterSpacing: 0.68,
                        textAlign: 'left',
                        fontSize: 16,
                        fontWeight: '500',
                        // lineHeight: 20,
                        color: '#0E0E0E',
                        flexShrink: 1,
                      }}>
                      {t('cart.OverView.Orderdetails')}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 86,
                      height: 28,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 8,
                      backgroundColor: '#F4F7F9',
                    }}>
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 14,
                        color: colors.primary,
                        fontWeight: '600',
                        lineHeight: 20,
                      }}>
                      {t('cart.OverView.Services')} {cartDetails.length}
                    </Text>
                  </View>
                </View>

                <Divider />

                {/*
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal:16
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#6C6C6C',
                     fontFamily: fontFamily,
                    letterSpacing: 0,
                  }}>
                  Order ID:
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '400',
                    color: 'Black',
                     fontFamily: fontFamily,
                  }}>
                  #OD1235
                </Text>
              </View> */}

                {/* List of Services */}
                <View style={{gap: 8, marginVertical: 8}}>
                  {cartDetails.map((item, index) => (
                    <Animated.View
                      layout={LinearTransition.stiffness(45).duration(300)}
                      key={index.toString()}
                      style={[styles._card, {marginHorizontal: 0}]}>
                      {/* Service Info */}
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 16,
                          alignItems: 'center',
                        }}>
                        <Image
                          style={{height: 60, width: 60, borderRadius: 30}}
                          resizeMode="contain"
                          defaultSource={_defaultImage}
                          source={
                            item.SERVICE_IMAGE
                              ? {
                                  uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE,
                                  cache: 'default',
                                }
                              : _defaultImage
                          }
                        />
                        <View
                          style={{flex: 1, justifyContent: 'space-between'}}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '500',
fontFamily: fontFamily,                              lineHeight: 18,
                              flexWrap: 'wrap',
                            }}>
                            {item.SERVICE_NAME}
                          </Text>
                          {/* <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '400',
                             fontFamily: fontFamily,
                            lineHeight: 14,
                            marginTop: 4,
                          }}>
                          Order ID: {item.SERVICE_ID}
                        </Text> */}
                        </View>

                        {/* Express Service Icon */}
                        {cartInfo &&
                        cartInfo.IS_EXPRESS == 1 &&
                        item.IS_EXPRESS == 1 ? (
                          <Image
                            source={ExpressServiceIcon}
                            style={{
                              width: 100,
                              height: 25,
                              borderTopLeftRadius: 8,
                              borderBottomLeftRadius: 8,
                              resizeMode: 'contain',
                              marginRight: -20,
                              //  backgroundColor:'red'
                            }}
                          />
                        ) : null}
                      </View>

                      {/* Divider */}
                      <View
                        style={{
                          backgroundColor: '#E7E6E6',
                          width: '100%',
                          height: 1,
                        }}
                      />

                      {/* Timer Section */}
                      {/* <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          height: 40,
                        }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 25,
                            // backgroundColor: '#FFF6E5',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: '#CBCBCB',
                            borderWidth: 1,
                          }}>
                          <Feather name="clock" size={18} color="orange" />
                        </View>
                        <Text style={{fontSize: 14, color: '#333'}}>
                          {t('cart.OverView.PreparationTime')}{' '}
                          {timeFormat(
                            item.PREPARATION_HOURS || 0,
                            item.PREPARATION_MINUTES || 0,
                          )}
                        </Text>
                      </View>
                      <Divider /> */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingHorizontal: 10,
                        }}>
                        <Text
                          style={{
                            flex: 1,
                           fontFamily: fontFamily,
                            letterSpacing: 0.68,
                            textAlign: 'left',
                            fontSize: 16,
                            fontWeight: '500',
                            lineHeight: 20,
                            color: colors.primary,
                          }}>
                          Details
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsPolicyVisible(!isPolicyVisible)}>
                          <Feather
                            name={
                              isPolicyVisible ? 'chevron-up' : 'chevron-right'
                            }
                            size={23}
                            color="#636363"
                          />
                        </TouchableOpacity>
                      </View>
                      <Divider />

                      {/* Show/Hide Content */}
                      {isPolicyVisible && (
                        <View
                          style={{
                            paddingVertical: 8,
                            gap: 5,
                            paddingHorizontal: 10,
                          }}>
                          {/* Device */}
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 14,
                                textAlign: 'left',
                                color: '#6C6C6C',
                                fontWeight: '500',
                                fontFamily: fontFamily
                              }}>
                              {t('overview.orderDetails.device')}:
                            </Text>
                            <Text
                              style={{
                                fontFamily: fontFamily,
                                flex: 1,
                                fontSize: 14,
                                color: '#000',
                                textAlign: 'right',
                                fontWeight: '400',
                              }}>
                              {item.CATEGORY_NAME}
                            </Text>
                          </View>
                          {/* popular services  */}
                          {/* Type */}
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}>
                            <Text
                              style={{
                                fontFamily: fontFamily,
                                flex: 2,
                                fontSize: 14,
                                textAlign: 'left',
                                color: '#6C6C6C',
                                fontWeight: '500',
                              }}>
                              {t('overview.orderDetails.type')}:
                            </Text>
                            <Text
                              style={{
                                fontFamily: fontFamily,
                                flex: 2,
                                textAlign: 'right',
                                fontSize: 14,
                                color: '#000',
                                fontWeight: '400',
                              }}>
                              {item.SUB_CATEGORY_NAME}
                            </Text>
                          </View>

                          {/* Service */}
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}>
                            <Text
                              style={{
                                fontFamily: fontFamily,
                                flex: 1,
                                fontSize: 14,
                                color: '#6C6C6C',
                                textAlign: 'left',
                                fontWeight: '500',
                              }}>
                              {t('overview.orderDetails.service')}:
                            </Text>
                            <Text
                              style={{
                                fontFamily: fontFamily,
                                flex: 3,
                                fontSize: 14,
                                textAlign: 'right',
                                color: '#000',
                                fontWeight: '400',
                              }}>
                              {item.SERVICE_NAME}
                            </Text>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Payment Summery details */}
              {user?.CUSTOMER_TYPE == 'I' && (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(300)}
                  style={styles._card}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <Icon
                      name={'currency-rupee'}
                      type="MaterialIcons"
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        flex: 1,
                       fontFamily: fontFamily,
                        letterSpacing: 0.68,
                        textAlign: 'left',
                        fontSize: 16,
                        fontWeight: '500',
                        // lineHeight: 20,
                        color: colors.text,
                      }}>
                      {t('overview.paymentSummary.title')}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', gap: 10}}>
                    <Text style={styles._subText}>
                      {t('overview.paymentSummary.basePrice')}:{' '}
                    </Text>
                    <Text style={styles._text}>
                      {`₹ ${Number(cartInfo?.TOTAL_TAXABLE_AMOUNT).toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                  {cartInfo && cartInfo.IS_EXPRESS == 1 ? (
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <Text style={styles._subText}>
                        {t('overview.paymentSummary.expressService')}:{' '}
                      </Text>
                      <Text style={styles._text}>
                         {`₹ ${Number(cartInfo?.EXPRESS_CHARGES).toLocaleString('en-IN')}`}
                        
                      </Text>
                    </View>
                  ) : null}
                  <View style={{flexDirection: 'row', gap: 10}}>
                    <Text style={styles._subText}>
                      {t('overview.paymentSummary.tax')}:{' '}
                    </Text>
                    <Text
                      style={styles._text}>{`₹ ${Number(cartInfo?.TAX_AMOUNT).toLocaleString('en-IN')}`}</Text>
                  </View>
                  <View>
                    {cartInfo?.COUPON_CODE ? (
                      <View style={{flexDirection: 'row', gap: 10}}>
                        <Text style={styles._subText}>
                          {t('overview.paymentSummary.discount')}:{' '}
                        </Text>
                        <Text style={styles._text}>
                        
                          -  {`₹ ${Number(cartInfo?.DISCOUNT_AMOUNT).toLocaleString('en-IN')}`}
                         
                        </Text>
                      </View>
                    ) : null}

                    <View style={[_styles.separator]} />
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <Text style={styles._subText}>
                        {t('overview.paymentSummary.total')}:{' '}
                      </Text>
                      <Text
                        style={
                          styles._text
                        }>{`₹ ${Number(cartInfo?.TOTAL_AMOUNT).toLocaleString('en-IN')}`}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: 20,
                        marginHorizontal: 16,
                        marginTop: 25,
                      }}>
                      {/* Add shopping Cart Button */}
                      {/* <TouchableOpacity>
               <Image source={AddShoppingCart} style={{width:50,height:50,resizeMode:'contain'}}/>
               </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  paymentMethod == 'Cash On Delivery'
                    ? ProceedToPay()
                    : handlePayment();
                }}
                style={{
                  height:50,
                  flexDirection: 'row',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: colors.primary2,
                  borderWidth: 1,
                  borderColor: '#666666',
                }}>
                <Text
                  style={{
                     fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#ffffff',
                    opacity: 1,
                  }}>
                  {t('overview.payment.title')}
                </Text>
              </TouchableOpacity> */}
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Contact Details  */}
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={styles._card}>
                <TouchableOpacity
                  onPress={() =>
                    setIsContactDetailsVisible(!isContactDetailsVisible)
                  }>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <Icon
                      name={'call-outline'}
                      type="Ionicons"
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        flex: 1,
                       fontFamily: fontFamily,
                        letterSpacing: 0.68,
                        textAlign: 'left',
                        fontSize: 16,
                        fontWeight: '500',
                        // lineHeight: 20,
                        color: colors.text,
                      }}>
                      {t('overview.contactDetails.title')}
                    </Text>
                    <Icon
                      type="Feather"
                      name={
                        isContactDetailsVisible ? 'chevron-up' : 'chevron-right'
                      }
                      size={23}
                      color={'#636363'}
                    />
                    {/* <Animated.View style={contactDetailsVisibleStyle}>
                    <Icon
                      type="Feather"
                      name="chevron-right"
                      size={23}
                      color={'#636363'}
                    />
                  </Animated.View> */}
                  </View>
                </TouchableOpacity>
                {isContactDetailsVisible && (
                  <View style={{marginTop: 10, gap: 8}}>
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <Text style={styles._subText}>
                        {t('overview.contactDetails.mobileNumber')}:{' '}
                      </Text>
                      <Text style={styles._text}>{cartInfo?.MOBILE_NO}</Text>
                    </View>
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <Text style={styles._subText}>
                        {t('overview.contactDetails.name')}:{' '}
                      </Text>
                      <Text style={styles._text}>
                        {cartInfo?.CONTACT_PERSON_NAME}
                      </Text>
                    </View>
                    <View style={{flexDirection: 'row', gap: 10}}>
                      <Text style={styles._subText}>
                        {t('overview.contactDetails.address')}:{' '}
                      </Text>
                      <Text style={styles._text}>
                        {cartInfo?.ADDRESS_LINE_1}, {cartInfo?.ADDRESS_LINE_2}
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>

            { user?.CUSTOMER_TYPE == 'I' && <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={styles._card}>
                <TouchableOpacity
                  onPress={() => {
                    cartInfo?.COUPON_CODE
                      ? null
                      : setIsCouponsVisible(!isCouponsVisible);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <Icon
                    name="ticket-percent"
                    type="MaterialCommunityIcons"
                    size={25}
                    color={colors.primary}
                  />

                  <Text
                    style={{
                      flex: 1,
                     fontFamily: fontFamily,
                      letterSpacing: 0.68,
                      textAlign: 'left',
                      fontSize: 16,
                      fontWeight: '500',
                      // lineHeight: 20,
                      color: colors.text,
                    }}>
                    {t('overview.coupons.title')}
                  </Text>
                </TouchableOpacity>
                {cartInfo?.COUPON_CODE ? (
                  <View style={styles.appliedCouponContainer}>
                    <View>
                      {/* <Text style={styles.couponCode}>{cartInfo.COUPON_NAME}</Text> */}
                      <Text style={styles.couponCode}>
                        {cartInfo.COUPON_CODE}
                      </Text>
                      <Text style={styles.discountText}>
                        {`₹${parseInt(cartInfo.COUPON_AMOUNT).toLocaleString('en-IN')} OFF`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={async () => {
                        setLoading(true);
                        try {
                          await apiCall
                            .post('api/cart/coupon/remove', {
                              CART_ID: cartId,
                              CUSTOMER_ID: user?.ID,
                              TYPE: 'S',
                              COUPON_CODE: cartInfo.COUPON_CODE,
                            })
                            .then(res => {});
                          getCartInformation();
                        } catch (error) {
                          Alert.alert(t('overview.coupons.errorRemoving'));
                        }
                      }}>
                      <Text style={styles.removeButtonText}>
                        {t('overview.coupons.remove')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setIsCouponsVisible(true);
                    }}
                    style={styles.viewCouponsButton}>
                    <Text style={styles.viewCouponsText}>
                      {t('overview.coupons.viewAll')}
                    </Text>
                    <Feather name="chevron-right" size={23} color="#636363" />
                  </TouchableOpacity>
                )}
              </Animated.View>}

             { user?.CUSTOMER_TYPE == 'I' &&<Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={styles._card}>
                <TouchableOpacity
                  onPress={() =>
                    setIsCancellationPolicyVisible(!isCancellationPolicyVisible)
                  }>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      // gap: 8,
                    }}>
                    <Image
                      source={cancellationPolicy}
                      style={{
                        marginLeft: -10,
                        width: 50,
                        height: 20,
                        resizeMode: 'contain',
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: fontFamily,
                        letterSpacing: 0.68,
                        textAlign: 'left',
                        fontSize: 16,
                        fontWeight: '500',
                        // lineHeight: 20,
                        color: colors.text,
                      }}>
                      {t('overview.cancellationPolicy.title')}
                    </Text>
                    <Icon
                      type="Feather"
                      name={
                        isCancellationPolicyVisible
                          ? 'chevron-up'
                          : 'chevron-right'
                      }
                      size={23}
                      color={'#636363'}
                    />

                    {/* <Animated.View style={isCancellationPolicyVisibleStyle}>
                    <Icon
                      type="Feather"
                      name="chevron-right"
                      size={23}
                      color={'#636363'}
                    />
                  </Animated.View> */}
                  </View>
                </TouchableOpacity>

                {isCancellationPolicyVisible && (
                  <View style={{marginTop: 10}}>
                    <Text
                      style={{
                        fontSize: 14,
                      fontFamily: fontFamily,
                        fontWeight: '400',
                        lineHeight: 18,
                      }}>
                      {t('overview.cancellationPolicy.description')}
                    </Text>
                  </View>
                )}
              </Animated.View>}

              {/* payment Mode Modal Box */}
              {user?.CUSTOMER_TYPE == 'I' && (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(300)}
                  style={styles._card}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <Icon
                      name={'currency-rupee'}
                      type="MaterialIcons"
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        flex: 1,
                       fontFamily: fontFamily,
                        letterSpacing: 0.68,
                        textAlign: 'left',
                        fontSize: 16,
                       
                        // lineHeight: 20,
                        color: colors.text,
                      }}>
                      {t('overview.paymentMode.title')}
                    </Text>
                  </View>

                  <View style={{marginTop: 10}}>
                    <CustomRadioButton
                      label={t('overview.paymentMode.onlinePayment')}
                      value="Online Payment"
                      selected={paymentMethod === 'Online Payment'}
                      onPress={() => setPaymentMethod('Online Payment')}
                    />
                    <CustomRadioButton
                      label={t('overview.paymentMode.cashOnDelivery')}
                      value="Cash On Delivery"
                      selected={paymentMethod === 'Cash On Delivery'}
                      onPress={() => setPaymentMethod('Cash On Delivery')}
                    />
                  </View>

                  {/* <View
                  style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <RadioButton
                  
                    value={'Cash On Delivery'}
                    status={
                      paymentMethod == 'Cash On Delivery'
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() => setPaymentMethod('Cash On Delivery')}
                    color={colors.primary}
                    uncheckedColor='red'
                    
                  />
                  <Text style={styles._subText}>
                    {t('overview.paymentMode.cashOnDelivery')}
                  </Text>
                </View> */}
                  {/* <View
                  style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <RadioButton
                    value={'Online Payment'}
                    status={
                      paymentMethod == 'Online Payment'
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() => setPaymentMethod('Online Payment')}
                    color={colors.primary}
                  />
                  <Text style={styles._subText}>
                    {t('overview.paymentMode.onlinePayment')}
                  </Text>
                </View> */}
                </Animated.View>
              )}

              {/* Proceed To Pay Button */}
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginHorizontal: 16,
                  marginBottom: 20,
                }}>
                <TouchableOpacity
                  onPress={() => {
                    paymentMethod == 'Cash On Delivery'
                      ? ProceedToPay()
                      : createTransaction();
                  }}
                  style={{
                    height: 48,
                    flexDirection: 'row',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: colors.primary2,
                  }}>
                  <Text
                    style={{
                     fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: 400,
                      color: 'white',
                      opacity: 0.8,
                    }}>
                    {user?.CUSTOMER_TYPE == 'I' &&
                    paymentMethod == 'Online Payment'
                      ? t('overview.payment.title')
                      : t('overview.payment.title1')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </View>
        )}

        {isCouponsVisible && (
          <CouponList
            cartID={cartId}
            visible={isCouponsVisible}
            onClose={() => setIsCouponsVisible(false)}
            onReload={() => {
              getCartInformation();
              setIsCouponsVisible(false);
            }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export const Divider = () => (
  <View
    style={{
      backgroundColor: '#E7E6E6',
      width: '100%',
      height: 1,
    }}
  />
);

export default CartOverview;

const styles = StyleSheet.create({
  _headerText: {
     fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    // lineHeight: Size.lg,
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _container: {
    flex: 1,
  },
  detailcard: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    // gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 16,
    borderColor: '#b094f550',
    elevation: 2,
    // shadowColor: '#000',
    shadowOffset: {width: 1, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  _card: {
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    padding: 20,
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: 'white',
    // backgroundColor: 'red',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 1, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  _orderContainer: {
    flexDirection: 'row',
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  _icon: {
    margin: 10,
    marginTop: 20,
  },
  _value: {
    flex: 2,
     fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'right',
    color: '#000000',
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
  _text: {
    flex: 2,
   fontFamily: fontFamily,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '400',
    color: `#0E0E0E`,
  },
  _subText: {
    flex: 1,
    fontFamily: fontFamily,
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '400',
    color: `#636363`,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  couponCode: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  discountText: {
    fontFamily: fontFamily,
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  removeButtonText: {
    fontFamily: fontFamily,
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  viewCouponsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewCouponsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily
  },
  clockContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailbox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailtext: {
    fontSize: 14,
    color: '#6C6C6C',
     fontFamily: fontFamily,
    fontWeight: '500',
  },
});
