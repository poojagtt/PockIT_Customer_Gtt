import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, EmptyList, Button, Loader, Header} from '../../components';
import {apiCall, useTheme, Size, fontFamily} from '../../modules';
import {ShopRoutes} from '../../routes/Shops';
import OrderStatus from './OrderStatus';
import CartProductCard from './CartProductCard';
import ThreeDotMenu from './ThreeDotMenu';
import {useSelector} from '../../context';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import Animated, {LinearTransition} from 'react-native-reanimated';
import Toast from '../../components/Toast';
import {SVG} from '../../assets';

interface OrderOverviewProps extends ShopRoutes<'OrderOverview'> {}

interface OrderStatus {
  status: string;
  date: string;
  completed: boolean;
}

interface OrderData {
  summaryData: {
    GROSS_AMOUNT: number;
    DISCOUNT_CHARGES: number;
    NET_AMOUNT: number;
    DELIVERY_CHARGES: number;
  };
  orderData: orderList;
  addressData: any;
  detailsData: Array<any>;
}

const Duration = 300;

const OrderOverview: React.FC<OrderOverviewProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {orderId, OrderDataDetails} = route.params || {};
  const {user, territory, address} = useSelector(state => state.app);

  const {t} = useTranslation();
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
  });
  let isVisible = true;
  const [loader, setLoader] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderLogs, setOrderLogs] = useState<Array<any>>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const formatDateTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return '';
    const date = moment(dateTime);
    return date.format('ddd, MMMM D hh:mm A, YYYY');
  };

  const fetchOrderData = async () => {
    setLoader(true);
    try {
      const response = await apiCall.get(
        `api/shopOrder/${orderId}/orderDetails`,
        {},
      );

      if (response.status === 200) {
        setOrderData({
          summaryData: response.data.summaryData[0],
          orderData: response.data.orderData[0],
          addressData: response.data.addressData[0],
          detailsData: response.data.detailsData,
        });
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error in fetch Order Data:', error);
      setError('Failed to fetch order details');
    } finally {
      setLoader(false);
    }
  };

  const [trackLoading, setTrackLoading] = useState(false);
  const submitteFeedback = async () => {
    setLoader(true);
    try {
      const payload = {
        ORDER_ID: orderId,
        CUSTOMER_ID: user?.ID,
        INVENTORY_ID: orderData?.detailsData.map(item => item.INVENTORY_ID),
        RATING: feedback.rating,
        COMMENTS: feedback.comment,
        FEEDBACK_DATE_TIME: new Date().toISOString(),
        CLIENT_ID: 1,
      };

      const response = await apiCall.post(
        'api/customerProductFeedback/addFeedback',
        payload,
      );
      if (response.status === 200) {
        setFeedback({rating: 0, comment: ''});
        Alert.alert(
          t('common.success'),
          t('shop.orderOverview.alerts.success'),
        );
        await fetchFeedback();
      } else {
        Alert.alert(t('common.error'), t('shop.orderOverview.alerts.error'));
      }
    } catch (error) {
      console.error('Error in submit Feedback:', error);
      Alert.alert(t('common.error'), t('shop.orderOverview.alerts.error'));
    } finally {
      setLoader(false);
    }
  };
  const trackOrderGet = async () => {
    setTrackLoading(true);
    try {
      const response = await apiCall.get(
        `api/shopOrder/${orderData?.orderData.AWB_CODE}/trackThroughAwbCode`,
        {},
      );

      if (response.data) {
        setTrackLoading(false);
        if (response.data.DATA.tracking_data.track_url) {
          Linking.openURL(response.data.DATA.tracking_data.track_url);
        } else {
          Alert.alert('Error', 'Tracking URL not found.');
        }
      }
    } catch (error) {
      console.error('Error in track order:', error);
    }
  };

  // const trackManualGet = async () => {
  //   if (orderData?.orderData.MANUAL_COURIER_URL) {
  //     Linking.openURL(orderData?.orderData.MANUAL_COURIER_URL);
  //   } else {
  //     Toast('Invalid URL');
  //   }
  // };
  const trackManualGet = async () => {
    const rawUrl = orderData?.orderData?.MANUAL_COURIER_URL;
    if (typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
      let url = rawUrl.trim();
      // Ensure the URL has a protocol
      const hasProtocol = /^https?:\/\//i.test(url);
      const finalUrl = hasProtocol ? url : `https://${url}`;
      try {
        const supported = await Linking.canOpenURL(finalUrl);
        if (supported) {
          Linking.openURL(finalUrl);
        } else {
          Toast('Invalid or unsupported URL');
        }
      } catch (error) {
        Toast('Failed to open the URL');
      }
    } else {
      Toast('Invalid URL');
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await apiCall.post('api/customerProductFeedback/get', {
        filter: ` AND ORDER_ID = ${orderId}`,
      });

      if (response.status === 200 && response.data.data.length > 0) {
        const data = response.data.data[0];
        setFeedback({rating: data.RATING, comment: data.COMMENTS});
        setFeedbackData(data);
      }
    } catch (error) {
      console.error('Error in fetch Feedback:', error);
      setError('Failed to fetch feedback');
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await apiCall.post('api/shopOrderActionLog/get', {
        filter: {ORDER_ID: orderId},
      });

      if (response.status === 200) {
        setOrderLogs(response.data.data);
      }
    } catch (error) {
      console.error('Error in fetch Logs:', error);
      setError('Failed to fetch order logs');
    }
  };

  useEffect(() => {
    fetchOrderData();
    fetchFeedback(), fetchLogs();
  }, [orderId]);

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
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.orderOverview.items')} (
          {orderData?.orderData?.ITEM_COUNT || 0}):
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          {t('shop.cart.currency')}

          {`${
            Number(orderData?.summaryData?.GROSS_AMOUNT).toLocaleString(
              'en-IN',
            ) || '0'
          }`}
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
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.orderOverview.delivery')}:{' '}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          {t('shop.cart.currency')}
          {` ${Number(orderData?.summaryData?.DELIVERY_CHARGES).toLocaleString(
            'en-IN',
          )}`}
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
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.orderOverview.discount')}:{' '}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          - {t('shop.cart.currency')}
          {orderData?.summaryData?.DISCOUNT_CHARGES?.toLocaleString('en-IN') ||
            '0'}
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
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.orderOverview.paymentStatus')}:{' '}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          {orderData?.orderData?.PAYMENT_STATUS == 'D' ? 'Paid' : 'Pending'}
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
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.orderOverview.total')}:{' '}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          {t('shop.cart.currency')}

          {`${
            Number(orderData?.summaryData?.NET_AMOUNT).toLocaleString(
              'en-IN',
            ) || '0'
          }`}
        </Text>
      </View>
    </View>
  );

  const renderStarRating = (rating: number) => {
    return (
      <View style={{flexDirection: 'row', gap: 8}}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            disabled={!!feedbackData}
            key={star}
            onPress={() => setFeedback({...feedback, rating: star})}>
            <Icon
              name={star <= rating ? 'star' : 'star-outline'}
              type="Ionicons"
              size={24}
              color={star <= rating ? '#FFD700' : '#666'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView
        style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: colors.error, fontFamily: fontFamily}}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  const handleCustomerSupport = async () => {
    const email = 'itsupport@pockitengineers.com';
    const mailtoURL = `mailto:${email}?`;

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
  const isCancel =
    orderData?.orderData?.ORDER_STATUS === 'OP' &&
    orderData?.orderData?.IS_CANCELATION_REQUESTED == 0;

  const isRasieTicket =
    address?.TERRITORY_ID && OrderDataDetails?.ORDER_STATUS === 'OS';

  const shouldShowThreeDotMenu =
    (isCancel || isRasieTicket) &&
    orderData?.orderData?.IS_CANCELATION_REQUESTED == 0;

  return (
    <SafeAreaView
      style={{flex: 1, gap: 16, backgroundColor: colors.background}}>
      <View style={{flexDirection: 'row', backgroundColor: 'white'}}>
        <Header
          label={t('shop.orderOverview.title')}
          onBack={() => navigation.goBack()}
        />

        {/* {
          <View style={{ flex: 1 }}>
            <View
              style={{
                alignItems: 'flex-end',
                marginTop: 30,
                padding: Size.paddingX,
              }}>
              <Icon
                name="dots-vertical"
                type="MaterialCommunityIcons"
                color="#1C1B1F"
                onPress={() => setShowMenu(!showMenu)}
              />
            </View>
            {showMenu &&
              orderData?.orderData?.IS_CANCELATION_REQUESTED == 0 && (
                // <ThreeDotMenu
                //   isVisible={showMenu}
                //   isInvoice={false}
                //   isWarranty={false}
                //   isReschedule={true}
                //   isCancel={true}
                //   cancelOnPress={() => {
                //     navigation.navigate('CancelOrderS', {
                //       item: orderData?.orderData,
                //     });
                //     setShowMenu(false);
                //   }}
                // />

                <ThreeDotMenu
                  onRequestClose={() => setShowMenu(false)}
                  isRasieTicket={
                    address?.TERRITORY_ID &&
                      OrderDataDetails.ORDER_STATUS == 'OS'
                      ? true
                      : false
                  }
                  isVisible={showMenu}
                  isInvoice={false}
                  isWarranty={false}
                  isReschedule={true}
                  isCancel={
                    orderData?.orderData?.ORDER_STATUS === 'OP' &&
                      orderData?.orderData?.IS_CANCELATION_REQUESTED == 0
                      ? true
                      : false
                  }
                  cancelOnPress={() => {
                    navigation.navigate('CancelOrderS', {
                      item: orderData?.orderData,
                    });
                    setShowMenu(false);
                  }}
                  raiseticketOnPress={() => {
                    // @ts-ignore
                    navigation.navigate('Orderticket', {
                      jobItem: orderData,
                      orderId,
                      type: 'S',
                    });
                  }}
                />
              )}
          </View>
        } */}

        {shouldShowThreeDotMenu && (
          <View style={{flex: 1}}>
            <View
              style={{
                alignItems: 'flex-end',
                marginTop: 30,
                padding: Size.paddingX,
              }}>
              <Icon
                name="dots-vertical"
                type="MaterialCommunityIcons"
                color="#1C1B1F"
                onPress={() => setShowMenu(!showMenu)}
              />
            </View>

            {showMenu && (
              <ThreeDotMenu
                isReschedule={true}
                onRequestClose={() => setShowMenu(false)}
                isRasieTicket={!!isRasieTicket}
                isVisible={showMenu}
                isInvoice={false}
                isWarranty={false}
                isCancel={!!isCancel}
                cancelOnPress={() => {
                  navigation.navigate('CancelOrderS', {
                    item: orderData?.orderData,
                  });
                  setShowMenu(false);
                }}
                raiseticketOnPress={() => {
                  navigation.navigate('Orderticket', {
                    jobItem: orderData,
                    orderId,
                    type: 'S',
                  });
                }}
              />
            )}
          </View>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchOrderData();
              fetchFeedback(), fetchLogs();
            }}
          />
        }
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 8,
          marginHorizontal: 16,
        }}>
        {
          //@ts-ignore
          orderData?.orderData && (
            <OrderStatus
              orderDetails={orderData?.orderData}
              orderStatus={orderLogs}
            />
          )
        }
        {['OS', 'DO'].includes(orderData?.orderData.ORDER_STATUS ?? '') &&
          orderData?.orderData.MANUAL_COURIER_URL &&
          orderData?.orderData.IS_SHIP_ORDER != 1 && (
            <View
              style={{
                padding: Size.containerPadding,
                borderWidth: 0.5,
                borderColor: '#CBCBCB',
                borderRadius: 16,
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: {width: 0, height: 2},
                shadowRadius: 6,
                elevation: 2,
              }}>
              <TouchableOpacity
                onPress={() => {
                  orderData?.orderData.IS_SHIP_ORDER == 1
                    ? trackOrderGet()
                    : trackManualGet();
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: colors.primary2,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}>
                <Text style={{flex: 1, color: 'white', fontFamily: fontFamily}}>
                  Track Order
                </Text>
                <SVG.track width={24} height={24} />
              </TouchableOpacity>
            </View>
          )}

        {orderData?.orderData?.ORDER_STATUS == 'OR' ? (
          <Animated.View
            layout={LinearTransition.stiffness(45).duration(300)}
            style={[styles.card, {backgroundColor: '#FFF5F5'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon
                name="close-circle"
                type="MaterialCommunityIcons"
                size={24}
                color={colors.error}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.error,
                  fontFamily: fontFamily,
                }}>
                {t('orderPreview.orderDetails.orderRejected')}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: '#666666',
                fontFamily: fontFamily,
                lineHeight: 20,
              }}>
              {orderData?.orderData?.REJECTION_REMARK ||
                t('orderPreview.orderDetails.noRemarkProvided')}
            </Text>
          </Animated.View>
        ) : null}

        {orderData?.orderData?.ACCEPTANCE_REMARK ? (
          <Animated.View
            layout={LinearTransition.stiffness(45).duration(300)}
            style={[styles.card]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon type="Ionicons" name="checkmark-circle-outline" size={24} />
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'black',
                }}>
                {t('orderPreview.orderDetails.orderAccepted')}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: '#666666',
                fontFamily: fontFamily,
                lineHeight: 20,
              }}>
              {orderData?.orderData?.ACCEPTANCE_REMARK}
            </Text>
          </Animated.View>
        ) : null}

        {orderData?.orderData?.CANCELLATION_REMARK ? (
          <Animated.View
            layout={LinearTransition.stiffness(45).duration(300)}
            style={[styles.card, {backgroundColor: '#FFF5F5'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Icon
                name="close-circle"
                type="MaterialCommunityIcons"
                size={24}
                color={colors.error}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.error,
                  fontFamily: fontFamily,
                }}>
                {t('orderPreview.orderDetails.cancellationRejected')}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: '#666666',
                fontFamily: fontFamily,
                lineHeight: 20,
              }}>
              {orderData?.orderData?.CANCELLATION_REMARK ||
                t(
                  'orderPreview.orderDetails.cancellationRejectedWithOutRemark',
                )}
            </Text>
          </Animated.View>
        ) : null}

        {
          //@ts-ignore
          orderData?.orderData?.ORDER_STATUS == 'OS' && (
            <Animated.View
              layout={LinearTransition.stiffness(45).duration(Duration)}
              style={styles.card}>
              <Text
                style={{
                  fontSize: 16,
                  // fontWeight: '700',
                  color: colors.text,
                  fontFamily: 'SF-Pro-Text-Bold',
                }}>
                {t('shop.orderOverview.rating.title')}
              </Text>
              <View style={{gap: 8}}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: colors.text,
                    fontFamily: fontFamily,
                  }}>
                  {t('shop.orderOverview.rating.question')}
                </Text>
                {renderStarRating(feedback.rating)}
              </View>
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('shop.orderOverview.rating.placeholder')}
                multiline
                numberOfLines={4}
                value={feedback.comment}
                editable={!feedbackData}
                onChangeText={text => setFeedback({...feedback, comment: text})}
                placeholderTextColor={'#ccc'}
              />
              {!feedbackData && (
                <Button
                  label={t('shop.orderOverview.rating.submit')}
                  onPress={submitteFeedback}
                  loading={loader}
                  labelStyle={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.primary,
                  }}
                  style={{
                    backgroundColor: colors.white,
                    height: 48,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                />
              )}
            </Animated.View>
          )
        }
        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.cardContainer}>
          <View style={{gap: 16}}>
            {loader ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{marginTop: 15}}
              />
            ) : (
              <>
                {
                  // @ts-ignore
                  orderData?.detailsData?.length > 0 ? (
                    <>
                      {
                        // @ts-ignore
                        orderData.detailsData.map(item => (
                          <CartProductCard
                            showWarrantyDownload={
                              orderData?.orderData.ORDER_STATUS == 'OS' &&
                              orderData?.detailsData[0].WARRANTY_ALLOWED
                                ? true
                                : false
                            }
                            key={item?.ID?.toString()}
                            product={item}
                            onIncrease={() => {}}
                            onDecrease={() => {}}
                          />
                        ))
                      }
                      {renderFooter()}
                    </>
                  ) : (
                    <EmptyList />
                  )
                }
              </>
            )}
          </View>
        </Animated.View>
        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={{gap: 8}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: 'black',
              fontFamily: fontFamily,
            }}>
            {t('shop.orderOverview.deliveryTo')}
          </Text>
          <View style={styles.card}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon
                name={
                  orderData?.addressData?.TYPE == 'H' ? 'home' : 'work-outline'
                }
                type={
                  orderData?.addressData?.TYPE == 'H'
                    ? 'AntDesign'
                    : 'MaterialIcons'
                }
                size={23}
                color={colors.primary}
              />
              <View style={{flex: 1, paddingRight: 16}}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: 'black',
                    fontFamily: fontFamily,
                  }}>
                  {orderData?.addressData?.TYPE == 'H'
                    ? t('shop.orderOverview.home')
                    : t('shop.orderOverview.office')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: '#636363',
                    fontFamily: fontFamily,
                  }}>
                  {orderData?.addressData?.ADDRESS_LINE_1},
                  {orderData?.addressData?.ADDRESS_LINE_2},
                  {orderData?.addressData?.TERRITORY_NAME}
                </Text>
              </View>
            </View>
            <Text
              style={{fontSize: 14, fontWeight: '500', fontFamily: fontFamily}}>
              {t('shop.orderOverview.deliveryBy')}:{' '}
              {formatDateTime(orderData?.orderData?.ESTIMATED_DATE_TIME)}
            </Text>
          </View>
        </Animated.View>
        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}>
          <Button
            label={t('shop.orderOverview.contactUs')}
            onPress={() => {
              if (territory?.ID) {
                handleCustomerSupport();
                // Linking.openURL(
                //   `tel:${territory.SUPPORT_COUNTRY_CODE}${territory?.SUPPORT_CONTACT_NUMBER}`,
                // );
              } else {
                Alert.alert(
                  t('shop.orderOverview.errors.territoryNotFound'),
                  t('shop.orderOverview.errors.unableToGetTerritory'),
                );
              }
            }}
            loading={loader}
            labelStyle={{fontSize: 14, fontWeight: '600', color: colors.white}}
            style={{
              backgroundColor: colors.buttonbackground,
              height: 48,
              borderRadius: 8,
            }}
          />
        </Animated.View>
      </ScrollView>

      <Loader show={loader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: fontFamily,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
        shadowColor: '#000',
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 337,
    width: '100%',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
      },
    }),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: fontFamily,
  },
});

export default OrderOverview;
