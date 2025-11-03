import {
  View,
  Text,
  ScrollView,
  StyleSheet,

  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, {useEffect, useState} from 'react';
import {Icon, Header, Loader, Button} from '../../components';
import {apiCall, Size, useTheme, fontFamily} from '../../modules';
import {useSelector} from '../../context';
import ThreeDotMenu from './ThreeDotMenu';
import moment from 'moment';
import OrderStatus from './components/OrderStatus';
import OrderInfoModal from './components/OrderInfoModal';
import {OrderRoutes} from '../../routes/Order';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {formatPeriod} from '../../Functions';

interface OrderPreviewProps extends OrderRoutes<'OrderPreview'> {}
const OrderPreview: React.FC<OrderPreviewProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {user} = useSelector(state => state.app);
  const {item} = route.params;
  console.log("item",item)
  const {t} = useTranslation();
  const [expandCard, setExpandCard] = useState({
    PaymentSummary: false,
    contactDetails: false,
    reschedulePolicy: false,
    cancellationPolicy: false,
    showMenu: false,
    orderInfo: false,
  });
  const [expandedItems, setExpandedItems] = useState<any>([]);
  const [orderDetails, setOrderDetails] = useState<{
    loading: boolean;
    data: orderDetails[];
    orderItem: orderDetails;
  }>({
    loading: false,
    data: [],
    orderItem: {} as orderDetails,
  });

  const [orderStatusData, setOrderStatusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    gerOrderDetails();
    getOrderStatus();
  }, []);

  const PaymentSummaryRotation = useDerivedValue(() =>
    expandCard.PaymentSummary
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );

  const ContactDetailsRotation = useDerivedValue(() =>
    expandCard.contactDetails
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );

  const ReschedulePolicyRotation = useDerivedValue(() =>
    expandCard.reschedulePolicy
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );

  const CancellationPolicyRotation = useDerivedValue(() =>
    expandCard.cancellationPolicy
      ? withTiming(270, {duration: 300})
      : withTiming(0, {duration: 300}),
  );

  const PaymentSummaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${PaymentSummaryRotation.value}deg`}],
  }));

  const contactDetailsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${ContactDetailsRotation.value}deg`}],
  }));

  const reschedulePolicyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${ReschedulePolicyRotation.value}deg`}],
  }));

  const cancellationPolicyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${CancellationPolicyRotation.value}deg`}],
  }));

  const gerOrderDetails = async () => {
    try {
      setOrderDetails({...orderDetails, loading: true});
      await apiCall
        .post(`api/orderDetails/getOrderDetails`, {
          CUSTOMER_ID: user?.ID,
          ORDER_ID: item.ID,
        })
        .then(res => {
          
          if (res.data.code == 200) {
            setOrderDetails({
              ...orderDetails,
              data: res.data.data,
              orderItem: res.data.data[0],
              loading: false,
            });
            setExpandedItems([res.data.data[0]?.ID]);
          } else {
            setOrderDetails({...orderDetails, loading: false});
            return null;
          }
        })
        .catch(err => {
          console.warn('here', err);
          setOrderDetails({...orderDetails, loading: false});
          return null;
        });
    } catch (error) {
      setOrderDetails({...orderDetails, loading: false});
      console.warn('error..', error);
    }
  };
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
  const getOrderStatus = async () => {
    try {
      await apiCall
        .post('api/technicianActionLogs/getorderLogsforCustomer', {
          pageIndex: 1,
          pageSize: 10,
          sortKey: 'DATE_TIME',
          sortValue: 'ASC',
          filter: {
            $and: [
              {
                ORDER_ID: {
                  $in: [item.ID],
                },
              },
              {
                LOG_TYPE: {
                  $in: ['Order'],
                },
              },
            ],
          },
          ORDER_ID: item.ID,
          IS_ORDER_OR_JOB: 'O',
        })
        .then(res => {
          // console.log("/////",res.data)
          if (res.data.code == 200) {
            setOrderStatusData(res.data.data);
          } else {
            return null;
          }
        })
        .catch(error => {
          console.warn('err..', error);
        });
    } catch (error) {
      console.warn('err11..', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: any) => {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter((item: any) => item !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  };
    const { territory, address} = useSelector(state => state.app);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'space-between',
      }} edges={['bottom', 'top']}>
      <View style={{flexDirection: 'row', backgroundColor: 'white'}}>
        <Header
          // label={t('orderPreview.orderDetails.title')}
          label={t('orderPreview.orderDetails.title')}

          onBack={() => navigation.goBack()}
        />
        {(item?.ORDER_STATUS == 'OP' || item?.ORDER_STATUS == 'OA') &&
          item.REFUND_STATUS !== 'P' && (
            <View style={{flex: 1}}>
              <View
                style={{
                  alignItems: 'flex-end',
                  marginTop: 25,
                  padding: Size.paddingX,
                }}>
                <Icon
                  name="dots-vertical"
                  type="MaterialCommunityIcons"
                  color="black"
                  size={23}
                  onPress={() => {
                    setExpandCard({
                      ...expandCard,
                      showMenu: !expandCard.showMenu,
                    });
                  }}
                />
              </View>
              {expandCard.showMenu && (
                <ThreeDotMenu
                 onRequestClose={() =>
                  setExpandCard({...expandCard, showMenu: false})
                }
                  isVisible={expandCard.showMenu}
                  isShowDownload={false}
                  isRasieTicket={false}
                  isShowReschedule={
                    item?.ORDER_STATUS == 'OP' &&
                    moment(item.ORDER_DATE_TIME).isBefore(
                      moment().add(6, 'hours'),
                    )
                      ? true
                      : false
                  }
                  isShowCancel={
                    item?.ORDER_STATUS == 'OP' || item?.ORDER_STATUS == 'OA'
                  }
                  rescheduleOnPress={() => {
                    // @ts-ignore
                    navigation.navigate('RescheduleOrder', {
                      services: orderDetails.data,
                    });
                    setExpandCard({...expandCard, showMenu: false});
                  }}
                  cancelOnPress={() => {
                    navigation.navigate('CancelOrder', {item});
                    setExpandCard({...expandCard, showMenu: false});
                  }}
                />
              )}
            </View>
          )}
      </View>
      <View style={styles._container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                gerOrderDetails();
                getOrderStatus();
              }}
              colors={['#2A3B8F']}
            />
          }>
          <View style={{gap: 6, marginTop: Size.paddingY}}>
            <OrderStatus orderDetails={item} orderStatus={orderStatusData} />
            {item.ORDER_STATUS == 'OR' ? (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={[styles._card, {backgroundColor: '#FFF5F5'}]}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
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
                  {item.REMARK ||
                    t('orderPreview.orderDetails.noRemarkProvided')}
                </Text>
              </Animated.View>
            ) : null}
            {item.ORDER_STATUS == 'OA' && item.ACCEPTANCE_REMARK ? (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={[styles._card]}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Icon
                    type="Ionicons"
                    name="checkmark-circle-outline"
                    size={24}
                  />
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
                  {item.ACCEPTANCE_REMARK}
                </Text>
              </Animated.View>
            ) : null}
            {item.CANCELLATION_REMARK ? (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={[styles._card, {backgroundColor: '#FFF5F5'}]}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
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
                  {item.CANCELLATION_REMARK ||
                    t(
                      'orderPreview.orderDetails.cancellationRejectedWithOutRemark',
                    )}
                </Text>
              </Animated.View>
            ) : null}
            <Animated.View
              layout={LinearTransition.stiffness(45).duration(300)}
              style={styles._card}>
              <View style={styles._orderContainer}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Icon
                    name="file-document-multiple-outline"
                    type="MaterialCommunityIcons"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles._detailsTitleTxt}>
                    {t('orderPreview.orderDetails.title')}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'black',
                        fontFamily: fontFamily,
                      }}>
                      {` (${t('orderPreview.orderDetails.jobCount')}:${
                        orderDetails.data.length
                      })`}
                    </Text>
                  </Text>
                </View>
              </View>
              <View
                style={{
                  gap: 23,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 20,
                }}>
                <Text
                  style={{
                    flex: 1,
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: 19.9,
                    color: '#333333',
                  }}>
                  {item.ORDER_NUMBER}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#E5E5E5',
                  width: '100%',
                  marginVertical: Size.xl,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  // marginTop: Size['2xl'],
                }}>
                <View style={styles.clockContainer}>
                  <Icon name="clock" type="Feather" size={20} color="orange" />
                </View>
                <Text style={styles.dateTime}>
                  {moment(item.ORDER_DATE_TIME).format(
                    'ddd, MMM D [|] hh:mm A',
                  )}
                </Text>
              </View>

              {orderDetails?.data?.map((item, index) => (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(300)}
                  key={index}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(item.ID)}
                    style={styles._jobContainer}>
                    <Text style={styles._jobTitleTxt}>
                      {`${t('multiJobs.orderDetails.job')} : ${index + 1}`}
                    </Text>
                    <View style={{paddingRight: 2}}>
                      <Icon
                        type="Feather"
                        name={
                          expandedItems.includes(item.ID)
                            ? 'chevron-up'
                            : 'chevron-right'
                        }
                        size={23}
                        color={'#636363'}
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedItems.includes(item.ID) && (
                    <Animated.View
                      entering={FadeInUp.stiffness(45).duration(300)}
                      exiting={FadeOutUp.stiffness(45)}
                      style={{
                        gap: 10,
                        marginTop: 15,
                        borderTopWidth: 0.8,
                        borderTopColor: '#E7E6E6',
                      }}>
                     {item?.ESTIMATED_TIME_IN_MIN&& <View style={styles._row}>
                        <Text style={styles._label}>
                          {user?.CUSTOMER_TYPE == 'I'
                            ? t('orderPreview.orderDetails.estimatedTime')
                            : t('serviceTiles.sla')}
                        </Text>
                        <Text style={styles._value}>
                          {item?.ESTIMATED_TIME_IN_MIN
                            ? `${item?.ESTIMATED_TIME_IN_MIN} ${t(
                                'orderPreview.orderDetails.minutes',
                              )}`
                            : t('orderPreview.orderDetails.notMentioned')}
                        </Text>
                      </View>}
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.orderDetails.device')}
                        </Text>
                        <Text style={styles._value}>{item.CATEGORY_NAME}</Text>
                      </View>
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.orderDetails.type')}
                        </Text>
                        <Text style={styles._value}>
                          {item.ORDER_SUB_CATEGORY_NAME}
                        </Text>
                      </View>
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.orderDetails.service')}
                        </Text>
                        <Text style={styles._value}>
                          {item.ORDER_SERVICE_NAME}
                        </Text>
                      </View>
                     
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.orderDetails.technicianVisit')}
                        </Text>
                        <Text
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          style={styles._value}>
                          {item?.EXPECTED_DATE_TIME
                            ? moment(item?.EXPECTED_DATE_TIME).format(
                                'ddd, MMM D [at] hh:mm A',
                              )
                            : t('orderPreview.orderDetails.notMentioned')}
                        </Text>
                      </View>
                      {item?.SCHEDULED_DATE_TIME && <View style={styles._row}>
                        <Text style={styles._label}>
                          {t(' orderPreview.orderDetails.scheduled')}
                        </Text>
                        <Text
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          style={styles._value}>
                          {item?.EXPECTED_DATE_TIME
                            ? moment(item?.SCHEDULED_DATE_TIME).format(
                                'ddd, MMM D [at] hh:mm A',
                              )
                            : t('orderPreview.orderDetails.notMentioned')}
                        </Text>
                      </View>}
                      {item.WARRANTY_ALLOWED && user?.CUSTOMER_TYPE=='I' && (
                        <View style={styles._row}>
                          <Text style={styles._label}>
                            {t('job.orderDetails.warranty')}
                          </Text>
                          <Text style={styles._value}>
                            {formatPeriod(item.WARRANTY_PERIOD)}
                          </Text>
                        </View>
                      )}
                      {item.GUARANTEE_ALLOWED && user?.CUSTOMER_TYPE=='I' && (
                        <View style={styles._row}>
                          <Text style={styles._label}>
                            {t('job.orderDetails.guarantee')}
                          </Text>
                          <Text style={styles._value}>
                            {formatPeriod(item.GUARANTEE_PERIOD)}
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </Animated.View>
              ))}
            </Animated.View>

            {user?.CUSTOMER_TYPE == 'I' && (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(300)}
                style={styles._card}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandCard({
                      ...expandCard,
                      PaymentSummary: !expandCard.PaymentSummary,
                    })
                  }>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Icon
                      name="rupee"
                      type="FontAwesome"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles._orderContainer}>
                      <Text style={styles._detailsTitleTxt}>
                        {t('orderPreview.paymentSummary.title')}
                      </Text>

                      <View style={{paddingRight: 13}}>
                        <Animated.View style={PaymentSummaryAnimatedStyle}>
                          <Icon
                            type="Feather"
                            name="chevron-right"
                            size={23}
                            color={'#636363'}
                          />
                        </Animated.View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                {expandCard.PaymentSummary && (
                  <Animated.View
                    entering={FadeInUp.stiffness(45).duration(300)}
                    exiting={FadeOutUp.stiffness(45)}
                    style={{gap: 10, marginTop: 15}}>
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('orderPreview.paymentSummary.basePrice')}
                      </Text>
                      <Text style={styles._value}>
                        {`₹ ${Number(item?.TOTAL_TAXABLE_AMOUNT).toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('orderPreview.paymentSummary.tax')}
                      </Text>
                      <Text style={styles._value}>
                         {`₹ ${Number(  item?.TAX_AMOUNT ?? 0).toLocaleString('en-IN')}`}
                        
                       </Text>
                    </View>
                    <View style={styles._row}>
                      <Text style={[styles._label]}>{`Discount`}</Text>
                      <Text style={[styles._value]}>{`₹ ${
                        item?.COUPON_AMOUNT ?? 0
                      }`}</Text>
                    </View>

                    {item.IS_EXPRESS == 1 && (
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.paymentSummary.expressService')}
                        </Text>
                        <Text style={styles._value}>
                          {`₹ ${Number(item.EXPRESS_DELIVERY_CHARGES).toLocaleString('en-IN')?? 0}`}
                        </Text>
                      </View>
                    )}
                    <View style={styles._row}>
                      <Text style={[styles._label]}>{`Status`}</Text>
                      <Text style={[styles._value]}>{`${
                        item?.PAYMENT_MODE == 'ONLINE' ? 'Paid' : 'Pending'
                      }`}</Text>
                      {/* <Text>{item?.PAYMENT_MODE}</Text> */}
                    </View>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: '#E5E5E5',
                        width: '100%',
                        // marginVertical: Size.xl,
                      }}
                    />
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('orderPreview.paymentSummary.total')}
                      </Text>
                      <Text style={styles._value}>{`₹ ${
                        item?.TOTAL_AMOUNT ?? 0
                      }`}</Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}
            <Animated.View
              layout={LinearTransition.stiffness(45).duration(300)}
              style={styles._card}>
              <TouchableOpacity
                onPress={() =>
                  setExpandCard({
                    ...expandCard,
                    contactDetails: !expandCard.contactDetails,
                  })
                }>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Icon
                    name="phone"
                    type="Feather"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles._orderContainer}>
                    <Text style={styles._detailsTitleTxt}>
                      {t('orderPreview.contactDetails.title')}
                    </Text>

                    <View style={{paddingRight: 22}}>
                      <Animated.View style={contactDetailsAnimatedStyle}>
                        <Icon
                          type="Feather"
                          name="chevron-right"
                          size={23}
                          color={'#636363'}
                        />
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {expandCard.contactDetails && (
                <Animated.View
                  entering={FadeInUp.stiffness(45).duration(300)}
                  exiting={FadeOutUp.stiffness(45)}
                  style={{gap: 10, marginTop: 15}}>
                  <View style={styles._row}>
                    <Text style={styles._label}>
                      {t('orderPreview.contactDetails.name')}:
                    </Text>
                    <Text style={styles._value}>
                      {/* @ts-ignore */}
                      {item.CUSTOMER_NAME}
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={styles._label}>
                      {t('orderPreview.contactDetails.mobile')}:
                    </Text>
                    <Text style={styles._value}>{item.MOBILE_NO}</Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={styles._label}>
                      {t('orderPreview.contactDetails.address')}:{' '}
                    </Text>
                    <Text style={[styles._value]} numberOfLines={2}>
                      {item.SERVICE_ADDRESS}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            {/* Reschedule policy card */}
           { user?.CUSTOMER_TYPE=='I' &&<Animated.View
              layout={LinearTransition.stiffness(45).duration(300)}
              style={styles._card}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setExpandCard({
                    ...expandCard,
                    reschedulePolicy: !expandCard.reschedulePolicy,
                  });
                }}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Icon
                    name="schedule"
                    type="MaterialIcons"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles._orderContainer}>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={styles._detailsTitleTxt}>
                        {t('orderPreview.policies.reschedule.title')}
                      </Text>
                    </View>

                    <View style={{paddingRight: 22}}>
                      <Animated.View style={reschedulePolicyAnimatedStyle}>
                        <Icon
                          type="Feather"
                          name="chevron-right"
                          size={23}
                          color={'#636363'}
                        />
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {expandCard.reschedulePolicy && (
                <Animated.View
                  entering={FadeInUp.stiffness(45).duration(300)}
                  exiting={FadeOutUp.stiffness(45)}
                  style={{gap: 10, marginTop: 15}}>
                  <Text style={[styles._label, {color: '#7a7a79', flex: 1}]}>
                    {t('orderPreview.policies.reschedule.description')}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>}

            {/* Cancellation Policy Card */}
          { user?.CUSTOMER_TYPE=="I"&& <Animated.View
              layout={LinearTransition.stiffness(45).duration(300)}
              style={[styles._card, {marginBottom: 5}]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setExpandCard({
                    ...expandCard,
                    cancellationPolicy: !expandCard.cancellationPolicy,
                  });
                }}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <Icon
                    name="file-cancel-outline"
                    type="MaterialCommunityIcons"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles._orderContainer}>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={styles._detailsTitleTxt}>
                        {t('orderPreview.policies.cancellation.title')}
                      </Text>
                    </View>
                    <View style={{paddingRight: 22}}>
                      <Animated.View style={cancellationPolicyAnimatedStyle}>
                        <Icon
                          type="Feather"
                          name="chevron-right"
                          size={23}
                          color={'#636363'}
                        />
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {expandCard.cancellationPolicy && (
                <Animated.View
                  entering={FadeInUp.stiffness(45).duration(300)}
                  exiting={FadeOutUp.stiffness(45)}
                  style={{gap: 10, marginTop: 15}}>
                  <Text style={[styles._label, {color: '#7a7a79', flex: 1}]}>
                    {t('orderPreview.policies.cancellation.description')}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>}
          </View>

          
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
          
            labelStyle={{fontSize: 14, fontWeight: '600', color: colors.white}}
            style={{
              backgroundColor: colors.buttonbackground,
              height: 48,
              borderRadius: 8,
              marginTop:8
            }}
          />
        </ScrollView>
      </View>

      {expandCard.orderInfo && (
        <OrderInfoModal
          visible={expandCard.orderInfo}
          onClose={() => {
            setExpandCard({
              ...expandCard,
              orderInfo: false,
            });
          }}
          estimateTime={45}
        />
      )}
      <Loader show={isLoading || orderDetails.loading} />
    </SafeAreaView>
  );
};

export default OrderPreview;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
  },
  _headerTxt: {
     fontFamily: fontFamily,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
  },
  _card: {
    marginTop: 5,
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
  },
  _orderContainer: {
    flexDirection: 'row',
    borderColor: '#fff',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  _detailsTitleTxt: {
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
    // letterSpacing: 0.6,
  },
  _label: {
    flex: 1,
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'left',
    color: '#636363',
    // letterSpacing: 0.2,
  },
  _value: {
    flex: 2,
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'right',
    color: 'black',
    // letterSpacing: 0.2,
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
  _jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Size['2xl'],
    // borderBottomWidth: 0.7,
    borderTopWidth: 0.8,
    // borderBottomColor: '#E7E6E6',
    borderTopColor: '#E7E6E6',
    paddingVertical: 5,
  },
  _jobTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
    // letterSpacing: 0.6,
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
  dateTime: {
    flex: 1,
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 19.9,
    color: '#0E0E0E',
  },
});
