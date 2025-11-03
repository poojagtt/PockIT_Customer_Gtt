import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, Button, EmptyList, Loader, Header} from '../../components';
import {useTheme, apiCall, fontFamily} from '../../modules';
import {_defaultImage} from '../../assets';
import CartProductCard from './CartProductCard';
import {ShopRoutes} from '../../routes/Shops';
import CouponList from './CouponList';
import SuccessModal from '../../components/SuccessModal';
import {useSelector, useDispatch, Reducers} from '../../context';
import {RadioButton} from 'react-native-paper';
// @ts-ignore
import RazorpayCheckout, {RazorpayCheckoutOptions} from 'react-native-razorpay';
import {RAZOR_PAY_KEY} from '../../modules/services';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import {resetAndNavigate} from '../../utils';
import {useFocusEffect} from '@react-navigation/native';
import Toast from '../../components/Toast';
import { CustomRadioButton } from '../../components/CustomRadioButton';
import Animated, { LinearTransition } from 'react-native-reanimated';

interface PlaceOrderProps extends ShopRoutes<'PlaceOrder'> {}

const PlaceOrder: React.FC<PlaceOrderProps> = ({navigation, route}) => {
  const {cartId} = route.params || {};
  const colors = useTheme();
  const dispatch = useDispatch();
  const [loader, setLoader] = useState(false);
  const {user} = useSelector(state => state.app);
  const [cartSummary, setCartSummary] = useState<cartInfoInterface>();
  const [cartList, setCartList] = useState<CartProduct[]>([]);
  const [isCouponsVisible, setIsCouponsVisible] = useState(false);
  // const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');

  const [successModal, setSuccessModal] = useState({
    visible: false,
    message: '',
  });
  const {t} = useTranslation();

  const getCartInformation = async () => {
    setLoader(true);
    try {
      const response = await apiCall.post('api/cart/getDetails', {
        CART_ID: cartId,
      });

      if (response.data.code == 200) {
        setCartSummary(response.data.data.CART_INFO[0]);
        setCartList(response.data.data.CART_DETAILS);
      } else {
        Toast(response.data.message);
      }
    } catch (error) {
      console.error('Error in fetchLatestProducts:', error);
    } finally {
      setLoader(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getCartInformation();
    }, []),
  );

  const handleIncrease = (productId: number) => {
    setCartList(prev =>
      prev.map(item => {
        if (item.ID === productId) {
          return {...item, QUANTITY: item.QUANTITY + 1};
        }
        return item;
      }),
    );
  };

  const handleDecrease = (productId: number) => {
    setCartList(prev =>
      prev.map(item => {
        if (item.ID === productId && item.QUANTITY > 1) {
          return {...item, QUANTITY: item.QUANTITY - 1};
        }
        return item;
      }),
    );
  };

  const ProceedToPay = async () => {
    try {
      setLoader(true);
      const payload = {
        CART_ID: cartId,
        PAYMENT_METHOD: paymentMethod == 'Cash On Delivery' ? 'COD' : 'ONLINE',
        CUSTOMER_ID: user?.ID,
        ADDRESS_ID: cartSummary?.ADDRESS_ID,
        TERRITORYID: cartSummary?.TERRITORY_ID,
        TYPE: 'P',
      };
      const response = await apiCall.post('api/cart/order/create', payload);

      if (response.data.code == 200) {
        setSuccessModal({
          visible: true,
          message: t('placeOrder.orderSuccess'),
        });
        setTimeout(() => {
          setSuccessModal({
            visible: false,
            message: '',
          });
          // @ts-ignore
          resetAndNavigate(navigation, 'Order', 'OrderList');
          dispatch(Reducers.getCartInformation());
        }, 2000);
      } else {
        return Promise.reject(response.data.message);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setLoader(false);
    }
  };

  const options: RazorpayCheckoutOptions = {
    description: t('overview.payment.description'),
    currency: 'INR',
    key: RAZOR_PAY_KEY,
    // amount: Math.round(1 * 100).toString(),
    amount: Math.round(Number(cartSummary?.TOTAL_AMOUNT) * 100).toString(),
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
      JOB_CARD_ID: null,
      PAYMENT_FOR: 'S',
      amount: Math.round(Number(cartSummary?.TOTAL_AMOUNT) * 100).toString(),
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
                Number(cartSummary?.TOTAL_AMOUNT) * 100,
              ).toString(),
              name: 'PockIT',
              order_id: res.data.data.id,
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
    setLoader(true);
    try {
      const response: any = await RazorpayCheckout.open(options);
      if (response && response.razorpay_payment_id) {
        await updatePaymentStatus(response, 200);
        await ProceedToPay();
      } else {
        console.error('Payment Incomplete');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      let errorMessage = t('paymentSummary.payment.errors.cancelled');
      Alert.alert(errorMessage);
      if (error.description == 'Post payment parsing error') {
        await updatePaymentStatus(error, 300);
      }
    } finally {
      setLoader(false);
    }
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
        PAYMENT_FOR: 'S',
        PAYMENT_MODE: 'O',
        PAYMENT_TYPE: 'O',
        TRANSACTION_DATE: moment().format('YYYY-MM-DD'),
        TRANSACTION_ID: data.razorpay_payment_id,
        TRANSACTION_STATUS: 'Success',
        TRANSACTION_AMOUNT: cartSummary?.TOTAL_AMOUNT,
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

  const renderFooter = () => (
    <View style={{gap: 8}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.onBack,
            fontFamily: fontFamily,
          }}>
          {t('placeOrder.items')} ({cartSummary?.TOTAL_QUANTITY}):
        </Text>
        <Text style={{fontSize: 16, fontWeight: '400', color: colors.text,fontFamily: fontFamily}}>
          ₹{Number(cartSummary?.TOTAL_TAXABLE_AMOUNT).toLocaleString('en-IN')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.onBack,
            fontFamily: fontFamily,
          }}>
          {t('placeOrder.delivery')}:{' '}
        </Text>
        <Text style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
          ₹{Number(cartSummary?.EXPECTED_DELIVERY_CHARGES).toLocaleString('en-IN')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.onBack,
            fontFamily: fontFamily,
          }}>
          {t('placeOrder.discount')}:{' '}
        </Text>
        <Text style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
          - ₹{Number(cartSummary?.COUPON_AMOUNT).toLocaleString('en-IN')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.disable,
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.onBack,
            fontFamily: fontFamily,
          }}>
          {t('placeOrder.total')}:{' '}
        </Text>
        <Text style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
          ₹{Number(cartSummary?.TOTAL_AMOUNT).toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white, gap: 8}}>
      <View>
        <Header
          label={t('placeOrder.title')}
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              getCartInformation();
            }}
          />
        }
        contentContainerStyle={{
          gap: 16,
          marginHorizontal: 16,
          paddingBottom: 16,
        }}>
        <View style={[styles.cardContainer]}>
          <View style={{gap: 16}}>
            {cartList.length > 0 ? (
              <>
                {cartList.map(item => (
                  <CartProductCard
                    key={item.ID.toString()}
                    product={item}
                    onIncrease={() => handleIncrease(item.ID)}
                    onDecrease={() => handleDecrease(item.ID)}
                  />
                ))}
                {renderFooter()}
              </>
            ) : !loader ? (
              <EmptyList />
            ) : null}
          </View>
        </View>

        <View style={{gap: 8}}>
          <Text
            style={{fontSize: 16, fontWeight: '500', fontFamily: fontFamily}}>
            {t('placeOrder.deliveryTo')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              // console.log('cartId', cartId)
              navigation.navigate('AddressBook', {
                cartId: {
                  id: cartId,
                  type: 'P',
                },
              })
            }
            style={styles.addressContainer}>
            <View style={{flex:1,flexDirection: 'row',  justifyContent:'space-between',alignItems:'center'}}>
             <View style={{flexDirection: 'row', justifyContent:'space-between'}}>
               <Icon
                name={cartSummary?.ADDRESS_TYPE == 'H' ? 'home' : cartSummary?.ADDRESS_TYPE=='W'?'work-outline': 'location'}
                type={cartSummary?.ADDRESS_TYPE == 'H' ? 'AntDesign':cartSummary?.ADDRESS_TYPE=='W'?'MaterialIcons' : 'EvilIcons'}
                size={24}
                color={colors.text}
              />
              <View>
                <Text style={{fontSize: 16, fontWeight: '500',fontFamily: fontFamily}}>
                  {cartSummary?.ADDRESS_TYPE == 'H'
                    ? t('placeOrder.home'):cartSummary?.ADDRESS_TYPE=='W'?
                     t('placeOrder.office'):'Other'}
                </Text>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                  <Text
                  style={{
                    maxWidth:'80%',
                    fontSize: 14,
                    fontWeight: '400',
                    fontFamily: fontFamily,
                    color: colors.onBack,
                  }}>
                  {cartSummary?.ADDRESS_LINE_1},{cartSummary?.CITY_NAME}
                </Text>
                
                </View>
              </View>

             </View>
              <View>
                 <Icon
              onPress={() =>
                navigation.navigate('AddressBook', {
                  cartId: {
                    id: cartId,
                    type: 'P',
                  },
                })
              }
              name="chevron-right"
              type="MaterialCommunityIcons"
              size={24}
              color="#636363"
            />

              </View>
              
            </View>
             
          
          </TouchableOpacity>
          
        </View>

        {user?.CUSTOMER_TYPE == 'I' && <View style={styles.cardContainer}>
          <TouchableOpacity
            onPress={() => setIsCouponsVisible(!isCouponsVisible)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            {/* <Icon
              name="ticket-percent"
              type="MaterialCommunityIcons"
              size={24}
              color={colors.primary}
            /> */}
            <Text
              style={{
                flex: 1,
               fontFamily: fontFamily,
                letterSpacing: 0.68,
                textAlign: 'left',
                fontSize: 16,
                fontWeight: '500',
                lineHeight: 20,
                color: colors.text,
              }}>
              {t('placeOrder.couponsAndOffers')}
            </Text>
          </TouchableOpacity>
          {cartSummary?.COUPON_CODE ? (
            <View style={styles.appliedCouponContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  width: '80%',
                }}>
                {/* <Text style={styles.couponCode}>
                                                  {cartSummary.COUPON_NAME}
                                                </Text> */}
                <Text style={styles.couponCode}>{cartSummary.COUPON_CODE}</Text>
                <Text style={styles.discountText}>
                  {`₹${parseInt(cartSummary.COUPON_AMOUNT).toLocaleString('en-IN')} OFF`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={async () => {
                  setLoader(true);
                  try {
                    await apiCall.post('api/cart/coupon/remove', {
                      CART_ID: cartId,
                      CUSTOMER_ID: user?.ID,
                      TYPE: 'P',
                      COUPON_CODE: cartSummary.COUPON_CODE,
                    });
                    getCartInformation();
                  } catch (error) {
                    console.error('Error removing coupon:', error);
                  } finally {
                    setLoader(false);
                  }
                }}>
                <Text style={styles.removeButtonText}>
                  {t('shop.cart.remove')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsCouponsVisible(true)}
              style={styles.viewCouponsButton}>
              <Text style={styles.viewCouponsText}>
                {t('placeOrder.viewAllCoupons')}
              </Text>
              <Icon
                name="chevron-right"
                type="MaterialCommunityIcons"
                size={24}
                color="#636363"
              />
            </TouchableOpacity>
          )}
        </View>}

      



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
        
                          
                        </Animated.View>
        {/* <View style={{ marginTop: 8, gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }}>Get it by</Text>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, }}>
                        {deliveryDates.map((date, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                    paddingVertical: 12,
                                    borderBottomWidth: index === deliveryDates.length - 1 ? 0 : 1,
                                    borderBottomColor: '#F5F5F5'
                                }}
                                onPress={() => setSelectedDate(index)}
                            >
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    borderWidth: 2,
                                    borderColor: selectedDate === index ? colors.primary : '#666',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <View style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: selectedDate === index ? colors.primary : 'transparent'
                                    }} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>{date.DATE}</Text>
                                    <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                                        {date.CHARGE ? `₹ ${date.CHARGE} One day delivery at Rs. 79 per service.` : 'FREE delivery'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View> */}
      </ScrollView>
      <View style={{paddingBottom: 16, marginHorizontal: 16}}>
        <Button
          label={t('placeOrder.placeOrder')}
          onPress={() => {
            paymentMethod == 'Cash On Delivery'
              ? ProceedToPay()
              : createTransaction();
          }}
          loading={loader}
          labelStyle={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.white,
            fontFamily: fontFamily,
          }}
          style={{backgroundColor: colors.primary2, height: 52}}
        />
      </View>
      <CouponList
        cartID={cartId}
        visible={isCouponsVisible}
        onClose={() => setIsCouponsVisible(false)}
        onReload={() => {
          getCartInformation();
          setIsCouponsVisible(false);
        }}
      />
      <SuccessModal
        visible={successModal.visible}
        message={successModal.message}
      />
      <Loader show={loader} />
    </SafeAreaView>
  );
};

export default PlaceOrder;

const styles = StyleSheet.create({
  _subText: {
    flex: 1,
   fontFamily: fontFamily,
    // letterSpacing: 0.68,
    textAlign: 'left',
    fontSize: 16,
    lineHeight: 20,
    color: `#333333`,
  },
  _card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    borderColor: '#b094f550',
    shadowColor: '#00000000',
    shadowOffset: {height: 2, width: 0},
    shadowOpacity: 10,
    shadowRadius: 12,
    elevation: 12,
    marginTop: 8,
  },
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#092B9C',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#092B9C',
      },
    }),
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
  removeButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: fontFamily
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
    fontFamily: fontFamily
  },
  viewCouponsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 15,
    // borderWidth: 1,
    width: '100%',
    // borderTopColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#092B9C',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#092B9C',
      },
    }),
  },
  viewCouponsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 500,
    fontFamily: fontFamily
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginTop: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
     fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '500',
  },
  productItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: 18,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // minHeight: 337,
    // width: '100%',
    //maxWidth: 358,
    // gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    // padding: 16,
    // borderWidth: 0.5,
    borderColor: '#ddd',
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#092B9C',
    //     shadowOffset: {width: 0, height: 0},
    //     shadowOpacity: 0.15,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //     shadowColor: '#092B9C',
    //   },
    // }),
  },
});
