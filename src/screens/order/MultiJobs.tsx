import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from '../../context';
import {
  apiCall,
  fontFamily,
  IMAGE_URL,
  Permissions,
  Size,
  useTheme,
} from '../../modules';
import FileViewer from 'react-native-file-viewer';

import { Icon, Header, Loader, Button } from '../../components';
import moment from 'moment';
import OrderStatus from './components/OrderStatus';
import OrderInfoModal from './components/OrderInfoModal';
import { OrderRoutes } from '../../routes/Order';
import { useTranslation } from 'react-i18next';
import ThreeDotMenu from './ThreeDotMenu';
import DownloadProgressModal from '../../components/DownloadProgressModal';
import RNFS from 'react-native-fs';

import { formatPeriod, OrderFileName } from '../../Functions';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { _defaultImage } from '../../assets';
import { useFocusEffect } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import { get } from '@react-native-firebase/database';

interface MultiJobProps extends OrderRoutes<'MultiJobs'> { }
interface ExpandCardState {
  showMenu: boolean;
  PaymentSummary: boolean;
  contactDetails: boolean;
  reschedulePolicy: boolean;
  cancellationPolicy: boolean;
  orderInfo: boolean;
}
const MultiJobs: React.FC<MultiJobProps> = ({ navigation, route }) => {
  const { user } = useSelector(state => state.app);
  const colors = useTheme();
  const { t } = useTranslation();
  const { item } = route.params;
  const [loader, setLoader] = useState(true);
  const [expandCard, setExpandCard] = useState<ExpandCardState>({
    showMenu: false,
    PaymentSummary: false,
    contactDetails: false,
    reschedulePolicy: false,
    cancellationPolicy: false,
    orderInfo: false,
  });
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [orderDetails, setOrderDetails] = useState<{
    loading: boolean;
    data: orderDetails[];
    orderItem: orderDetails | null;
  }>({
    loading: false,
    data: [],
    orderItem: null,
  });
  interface jobDetailsProps {
  loading: boolean;
  feedbackData: {
    service_feedback: number;
    technician_feedback: number;
    service_comment: string;
    technician_comment: string;
  };
  techData: {
    AVERAGE_REVIEW: string;
    CUSTOMER_STATUS: string;
    ID: number;
    JOB_CARD_STATUS: string;
    NAME: string;
    TECHNICIAN_STATUS: string;
    TRACK_STATUS: string;
    job_count: number;
  };
  isPartAdd: boolean;
  isPaymentReq: boolean;
  pendingPaymentsData: PaymentRecord;
  partData: partListDetail[];
}
console.log("1",item);
   const [jobDetails, setJobDetails] = useState<jobDetailsProps>({
      loading: false,
      // @ts-ignore
      feedbackData: {},
      // @ts-ignore
      techData: {},
      isPartAdd: false,
      isPaymentReq: false,
      // @ts-ignore
      pendingPaymentsData: {},
      partData: [],
    });
  const [orderStatusData, setOrderStatusData] = useState<orderJobStatus[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{
    show: boolean;
    progress: number;
    error: boolean;
    errorMessage: string;
  }>({
    show: false,
    progress: -1,
    error: false,
    errorMessage: '',
  });
  const Duration = 300;
  useEffect(() => {
    gerOrderDetails();
    getOrderStatus();
  }, []);
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getOrderStatus();
      gerOrderDetails(); 
    });
  
  }, []);
//  useFocusEffect(
//   useCallback(() => {
//     const unsubscribe = messaging().onMessage(async remoteMessage => {
//       getOrderStatus();
//       gerOrderDetails(); 
//     });

//     // cleanup when screen is unfocused
//     // return () => {
//     //   unsubscribe();
//     // };
//   }, [])
// );
  const gerOrderDetails = async () => {
    setLoader(true);
    try {
      setOrderDetails(prev => ({ ...prev, loading: true }));
      const res = await apiCall.post(`api/orderDetails/getOrderDetails`, {
        CUSTOMER_ID: user?.ID,
        ORDER_ID: item.ID,
      });
      if (res.data.code === 200) {
        const data = res.data.data.filter(
          (item: orderDetails) => item.JOB_CARD_NO,
        );

        setOrderDetails({
          loading: false,
          data,
          orderItem: res.data.data[0] || null,
        });
        console.log("order details",res.data.data[0])
        if (res.data.data[0]?.ID) {
          setExpandedItems([res.data.data[0].ID]);
        }
                  gerJobDetails(res.data.data.length>0?res.data.data[0]:{});

      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (error) {
      console.warn('Error fetching order details:', error);
      setOrderDetails(prev => ({ ...prev, loading: false }));
      Alert.alert(
        t('multiJobs.error.title'),
        t('multiJobs.error.fetchFailed'),
        [{ text: t('common.ok') }],
      );
    } finally {
      setLoader(false);
    }
  };
  const getOrderStatus = async () => {
    setLoader(true);
    try {
      const res = await apiCall.post(
        'api/technicianActionLogs/getorderLogsforCustomer',
        {
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
        },
      );
      if (res.data.code === 200) {
        setOrderStatusData(res.data.data);
      } else {
        throw new Error('Failed to fetch order status');
      }
    } catch (error) {
      console.warn('Error fetching order status:', error);
      Alert.alert(
        t('multiJobs.error.title'),
        t('multiJobs.error.statusFetchFailed'),
        [{ text: t('common.ok') }],
      );
    } finally {
      setLoader(false);
    }
  };

  const checkIfAlreadyExists = async (path: string) => {
    let isAlreadyExists = await RNFS.exists(path);
    return isAlreadyExists;
  };
  const rotation = {
    PaymentSummary: useDerivedValue(() =>
      expandCard.PaymentSummary
        ? withTiming(270, { duration: Duration })
        : withTiming(0, { duration: Duration }),
    ),
    contactDetails: useDerivedValue(() =>
      expandCard.contactDetails
        ? withTiming(270, { duration: Duration })
        : withTiming(0, { duration: Duration }),
    ),
    reschedulePolicy: useDerivedValue(() =>
      expandCard.reschedulePolicy
        ? withTiming(270, { duration: Duration })
        : withTiming(0, { duration: Duration }),
    ),
    cancellationPolicy: useDerivedValue(() =>
      expandCard.cancellationPolicy
        ? withTiming(270, { duration: Duration })
        : withTiming(0, { duration: Duration }),
    ),
  };
  
  const gerJobDetails = async (data:any) => {
    // console.log("2",orderDetails.data)
    setLoader(true);
    try {
      setJobDetails({...jobDetails, loading: true});
      await apiCall
        .post(`api/jobcard/getjobDetailsWithFeedback`, {
          CUSTOMER_ID: user?.ID,
          ORDER_ID: data.ORDER_ID,
          JOB_CARD_ID: data.JOB_CARD_ID,
          sortKey: 'ID',
          sortValue: 'DESC',
        })
        .then(res => {
          if (res.data.code == 200) {
            console.log('\n\n\njob details%%%%%', res.data);
            setJobDetails({
              ...jobDetails,
              feedbackData: res.data.feedbackData[0]
                ? res.data.feedbackData[0]
                : {},
              techData: res.data.techData[0] ? res.data.techData[0] : {},
              isPartAdd: res.data.inventoryReq == 1 ? true : false,
              isPaymentReq: res.data.pendingPayment == 1 ? true : false,
              pendingPaymentsData: res.data.pendingPayments[0]
                ? res.data.pendingPayments[0]
                : {},
              partData: res.data.jobData,
              loading: false,
            });
          } else {
            return null;
          }
        })
        .catch(err => {
          console.warn('here', err);
          return null;
        });
    } catch (error) {
      setJobDetails({...jobDetails, loading: false});
      console.warn('error..', error);
    } finally {
      setLoader(false);
    }
  };
  const animatedStyles = {
    PaymentSummary: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.PaymentSummary.value}deg` }],
    })),
    contactDetails: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.contactDetails.value}deg` }],
    })),
    reschedulePolicy: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.reschedulePolicy.value}deg` }],
    })),
    cancellationPolicy: useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.cancellationPolicy.value}deg` }],
    })),
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    // For Android 13+, permissions are not required for writing to Downloads via MediaStore
    if (Platform.Version < 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const downloadInvoice = async () => {
    try {
      setDownloadProgress({
        show: true,
        progress: 0,
        error: false,
        errorMessage: '',
      });

      const res = await apiCall.post(`api/invoice/get`, {
        filter: ` AND ORDER_ID = ${item.ID} AND CUSTOMER_ID = ${user?.ID} AND TYPE = 'O' `,
      });

      if (res.data.code !== 200 || !res.data.data[0]) {
        throw new Error('Invoice not found');
      }

      const sanitizedFileName = OrderFileName(item.ORDER_NUMBER).replace(
        /[^a-zA-Z0-9.\-_]/g,
        '_',
      );
      const invoiceUrl = IMAGE_URL + 'Invoices/' + res.data.data[0].INVOICE_URL;

      let downloadDest = '';

      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Denied',
            'Cannot download file without storage permission.',
          );
          return;
        }
        downloadDest = `${RNFS.DownloadDirectoryPath}/${sanitizedFileName}`;
      } else {
        downloadDest = `${RNFS.DocumentDirectoryPath}/${sanitizedFileName}`;
      }

      const download = RNFS.downloadFile({
        fromUrl: invoiceUrl,
        toFile: downloadDest,
        background: true,
        progress: res => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(prev => ({
            ...prev,
            progress: Math.round(progressPercent),
          }));
        },
        begin: res => console.log('Download started', res),
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to:\n${downloadDest}`, [
          {
            text: 'Open File',
            onPress: async () => {
              try {
                await FileViewer.open(downloadDest, { showOpenWithDialog: true });
              } catch (err) {
                Alert.alert(
                  'Error',
                  'Cannot open file. No suitable app found.',
                );
                console.error('File open error:', err);
              }
            },
          },
          { text: 'OK' },
        ]);

        // Alert.alert('Success', `Invoice downloaded to:\n${downloadDest}`);
      } else {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }

      setDownloadProgress({
        show: false,
        progress: 100,
        error: false,
        errorMessage: '',
      });
    } catch (error) {
      console.warn('Download Error:', error);
      setDownloadProgress({
        show: false,
        progress: 0,
        error: true,
        errorMessage: 'Download failed',
      });
      Alert.alert('Error', 'Download failed. Please try again.');
    }
  };

  const onDownloadInvoice = async () => {
    try {
      setExpandCard(prev => ({ ...prev, showMenu: false }));
      setDownloadProgress(prev => ({ ...prev, show: true, progress: -1 }));
      const permission = await requestStoragePermission();
      if (!permission) {
        throw new Error(t('multiJobs.error.permissionMismatch'));
      }
      const path = `${RNFS.DownloadDirectoryPath}/${OrderFileName(
        item.ORDER_NUMBER,
      )}`;
      const isAlreadyExists = await checkIfAlreadyExists(path);
      if (isAlreadyExists) {
        setTimeout(() => {
          Alert.alert(
            t('multiJobs.error.invoiceAlreadyExists'),
            t('multiJobs.error.invoiceAlreadyExistsMessage'),
            [
              {
                text: t('multiJobs.error.replace'),
                onPress: downloadInvoice,
                style: 'default',
              },
              {
                text: t('multiJobs.error.cancel'),
                onPress: () => {
                  setDownloadProgress(prev => ({ ...prev, show: false }));
                },
                style: 'cancel',
              },
            ],
            { cancelable: false },
          );
        }, 100);
      } else {
        await downloadInvoice();
      }
    } catch (error) {
      console.warn('Download Error:', error);
      setDownloadProgress({
        show: false,
        progress: 0,
        error: true,
        errorMessage:
          error instanceof Error
            ? error.message
            : t('multiJobs.error.unknownError'),
      });
      Alert.alert(
        t('multiJobs.error.title'),
        error instanceof Error
          ? error.message
          : t('multiJobs.error.unknownError'),
        [{ text: t('common.ok') }],
      );
    }
  };
  const toggleExpand = (id: number) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };
  const { territory, address } = useSelector(state => state.app);
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', backgroundColor: 'white' }}>
        <Header label={item.ORDER_NUMBER} onBack={() => navigation.goBack()} />
        {item.ORDER_STATUS == 'CO' && user?.CUSTOMER_TYPE == 'I' && (
          <View style={{ flex: 1 }}>
            <View
              style={{
                alignItems: 'flex-end',
                marginTop: 25,
                padding: Size.paddingX,
              }}>
              <Icon
                name="dots-vertical"
                type="MaterialCommunityIcons"
                color="#1C1B1F"
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
                  setExpandCard({ ...expandCard, showMenu: false })
                }
                isRasieTicket={false}
                isVisible={expandCard.showMenu}
                isShowDownload={item.ORDER_STATUS == 'CO'}
                isShowReschedule={false}
                isShowCancel={false}
                downloadOnPress={() => {
                  onDownloadInvoice();
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
          <View style={{ gap: 6, marginTop: Size.paddingY }}>
            <OrderStatus orderDetails={item} orderStatus={orderStatusData} />
            {/*  details */}
            <Animated.View
              layout={LinearTransition.stiffness(45).duration(Duration)}
              style={styles._card}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                {/* <Icon
                  name="file-document-multiple-outline"
                  type="MaterialCommunityIcons"
                  size={20}
                  color={colors.primary}
                /> */}
                <Image
                  source={
                    item?.SERVICE_IMAGE
                      ? {
                        uri: IMAGE_URL + 'Item/' + item?.SERVICE_IMAGE,
                        cache: 'default',
                      }
                      : _defaultImage
                  }
                  style={
                    { height: 30, width: 30, borderRadius: 15 }

                    // styles.thumbnail,
                    // active.ID === item.ID && {
                    //   borderColor: '#0E0E0E',
                    //   borderWidth: 1,
                    // },
                  }
                />
                <Text style={styles._detailsTitleTxt}>
                  {t('multiJobs.orderDetails.title')}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'black',
                      fontFamily: fontFamily,
                    }}>{` (${t('multiJobs.orderDetails.jobCount')}:${orderDetails.data.length
                      })`}</Text>
                </Text>
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
              {loader ? (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#2A3B8F" />
                </View>
              ) : (
                orderDetails.data?.map((item, index) => {
                  const formattedTime = moment(
                    item?.JOB_START_TIME,
                    'HH:mm:ss',
                  ).format('hh:mm A');

                  return (
                    <Animated.View
                      layout={LinearTransition.stiffness(45).duration(Duration)}
                      key={index}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleExpand(item.ID)}
                        style={styles._jobContainer}>
                        <Text style={styles._jobTitleTxt}>{`${t(
                          'multiJobs.orderDetails.job',
                        )} : ${index + 1} `}</Text>
                        <View>
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
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            navigation.navigate('JobDetails', { jobItem: item });
                          }}
                          style={{ gap: 10, padding: 12, borderRadius: 8, borderWidth: 0.8, borderColor: '#E7E6E6', elevation: 3, backgroundColor: colors.background, marginBottom: 10 }}>
                          <Animated.View
                            entering={FadeInUp.stiffness(45).duration(Duration)}
                            exiting={FadeOutUp.stiffness(45)}
                            style={{
                              gap: 10,
                              // marginTop: 15,
                              // borderTopWidth: 0.8,
                              // borderTopColor: '#E7E6E6',
                            }}>
                            <View style={styles._row}>
                              <Text style={[styles._label]}>
                                {user?.CUSTOMER_TYPE == 'I'
                                  ? t('multiJobs.orderDetails.estimatedTime')
                                  : t('serviceTiles.sla')}
                              </Text>
                              <Text style={[styles._value]}>
                                {item?.ESTIMATED_TIME_IN_MIN
                                  ? `${item?.ESTIMATED_TIME_IN_MIN} ${t(
                                    'multiJobs.orderDetails.minutes',
                                  )}`
                                  : t('multiJobs.orderDetails.notMentioned')}
                              </Text>
                            </View>
                            <View style={styles._row}>
                              <Text style={[styles._label]}>
                                {t('multiJobs.orderDetails.device')}
                              </Text>
                              <Text style={[styles._value]}>
                                {item.CATEGORY_NAME}
                              </Text>
                            </View>
                            <View style={styles._row}>
                              <Text style={[styles._label]}>
                                {t('multiJobs.orderDetails.type')}
                              </Text>
                              <Text style={[styles._value]}>
                                {item.ORDER_SUB_CATEGORY_NAME}
                              </Text>
                            </View>
                            <View style={styles._row}>
                              <Text style={[styles._label]}>
                                {t('multiJobs.orderDetails.service')}
                              </Text>
                              <Text style={[styles._value]}>
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
                            {item.SCHEDULED_DATE_TIME && (
                              <View style={styles._row}>
                                <Text style={[styles._label]}>
                                  {t('multiJobs.orderDetails.technicianVisit')}
                                </Text>
                                <Text
                                  numberOfLines={2}
                                  adjustsFontSizeToFit
                                  style={[styles._value]}>
                                  {item?.SCHEDULED_DATE_TIME
                                    ? `${moment(
                                      item?.SCHEDULED_DATE_TIME,
                                    ).format(
                                      'ddd, MMM D [at] ',
                                    )} ${formattedTime}`
                                    : t('multiJobs.orderDetails.notMentioned')}
                                </Text>
                              </View>
                            )}
                            {item.WARRANTY_ALLOWED &&
                              user?.CUSTOMER_TYPE == 'I' && (
                                <View style={styles._row}>
                                  <Text style={styles._label}>
                                    {t('job.orderDetails.warranty')}
                                  </Text>
                                  <Text style={styles._value}>
                                    {formatPeriod(item.WARRANTY_PERIOD)}
                                  </Text>
                                </View>
                              )}
                            {item.GUARANTEE_ALLOWED &&
                              user?.CUSTOMER_TYPE == 'I' && (
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

                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            {jobDetails.isPartAdd && user?.CUSTOMER_TYPE == 'I' &&<View style={{ flex: 1 }}>
                              <Button style={{ padding:0 }} label='Part Approval' onPress={() => {
                                 navigation.navigate('PartDetailsList', {
                        jobItem: item,
                          onSuccess: () => {
                          navigation.goBack();
                          getOrderStatus();
                          gerOrderDetails();
                        },

                       
                      });
                               }}></Button>
                            </View>}
                            {jobDetails.isPartAdd && user?.CUSTOMER_TYPE == 'I' &&<View style={{ width: 10 }}></View>}
                           { jobDetails.techData.ID && <View style={{ flex: 1 }}>
                              <Button  style={{ padding:0 }} outlined label='Talk to Technician' onPress={() => {  navigation.navigate('ChatScreen', {jobItem:item});}}></Button>

                            </View>}
                          </View>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  );
                })
              )}
            </Animated.View>

            {/* payment summary */}
            {user?.CUSTOMER_TYPE == 'I' && (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(Duration)}
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

                      <View style={{ paddingRight: 13 }}>
                        <Animated.View style={animatedStyles.PaymentSummary}>
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
                    entering={FadeInUp.stiffness(45).duration(Duration)}
                    exiting={FadeOutUp.stiffness(45)}
                    style={{ gap: 10, marginTop: 15 }}>
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('orderPreview.paymentSummary.basePrice')}
                      </Text>
                      <Text style={styles._value}>
                        {`₹ ${Number(item?.TOTAL_TAXABLE_AMOUNT).toLocaleString(
                          'en-IN',
                        )}`}
                      </Text>
                    </View>
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('orderPreview.paymentSummary.tax')}
                      </Text>
                      <Text style={styles._value}>
                        {`₹ ${Number(item?.TAX_AMOUNT ?? 0).toLocaleString(
                          'en-IN',
                        )}`}
                      </Text>
                    </View>
                    <View style={styles._row}>
                      <Text style={[styles._label]}>{`Discount`}</Text>
                      <Text style={[styles._value]}>
                        {`₹ ${Number(item?.DISCOUNT_AMOUNT ?? 0).toLocaleString(
                          'en-IN',
                        )}`}
                      </Text>
                    </View>

                    {item.IS_EXPRESS == 1 && (
                      <View style={styles._row}>
                        <Text style={styles._label}>
                          {t('orderPreview.paymentSummary.expressService')}
                        </Text>
                        <Text style={styles._value}>
                          {`₹ ${Number(
                            item.EXPRESS_DELIVERY_CHARGES,
                          ).toLocaleString('en-IN') ?? 0
                            }`}
                        </Text>
                      </View>
                    )}
                    <View style={styles._row}>
                      <Text style={[styles._label]}>{`Status`}</Text>
                      <Text style={[styles._value]}>{`${item?.PAYMENT_MODE == 'ONLINE' ? 'Paid' : 'Pending'
                        }`}</Text>
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
                      <Text style={styles._value}>
                        {`₹ ${Number(item?.TOTAL_AMOUNT ?? 0).toLocaleString(
                          'en-IN',
                        )}`}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* Contact Details Card */}
            <Animated.View
              layout={LinearTransition.stiffness(45).duration(Duration)}
              style={styles._card}>
              <TouchableOpacity
                onPress={() =>
                  setExpandCard({
                    ...expandCard,
                    contactDetails: !expandCard.contactDetails,
                  })
                }>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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

                    <View style={{ paddingRight: 22 }}>
                      <Animated.View style={animatedStyles.contactDetails}>
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
                  entering={FadeInUp.stiffness(45).duration(Duration)}
                  exiting={FadeOutUp.stiffness(45)}
                  style={{ gap: 10, marginTop: 15 }}>
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
                    <Text style={[styles._value]}>{item.SERVICE_ADDRESS}</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            {/*reschedule policy card */}
            {user?.CUSTOMER_TYPE == 'I' && (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(Duration)}
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
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Icon
                      name="schedule"
                      type="MaterialIcons"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles._orderContainer}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles._detailsTitleTxt}>
                          {t('orderPreview.policies.reschedule.title')}
                        </Text>
                      </View>

                      <View style={{ paddingRight: 22 }}>
                        <Animated.View style={animatedStyles.reschedulePolicy}>
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
                    entering={FadeInUp.stiffness(45).duration(Duration)}
                    exiting={FadeOutUp.stiffness(45)}
                    style={{ gap: 10, marginTop: 15 }}>
                    <Text style={[styles._label, { color: '#7a7a79', flex: 1 }]}>
                      {t('orderPreview.policies.reschedule.description')}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* Cancellation Policy Card */}
            {user?.CUSTOMER_TYPE == 'I' && (
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(Duration)}
                style={[styles._card, { marginBottom: 5 }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setExpandCard({
                      ...expandCard,
                      cancellationPolicy: !expandCard.cancellationPolicy,
                    });
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Icon
                      name="file-cancel-outline"
                      type="MaterialCommunityIcons"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles._orderContainer}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={styles._detailsTitleTxt}>
                          {t('orderPreview.policies.cancellation.title')}
                        </Text>
                      </View>
                      <View style={{ paddingRight: 22 }}>
                        <Animated.View
                          style={animatedStyles.cancellationPolicy}>
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
                    entering={FadeInUp.stiffness(45).duration(Duration)}
                    exiting={FadeOutUp.stiffness(45)}
                    style={{ gap: 10, marginTop: 15 }}>
                    <Text style={[styles._label, { color: '#7a7a79', flex: 1 }]}>
                      {t('orderPreview.policies.cancellation.description')}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            )}
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
            labelStyle={{ fontSize: 14, fontWeight: '600', color: colors.white }}
            style={{
              backgroundColor: colors.buttonbackground,
              height: 48,
              borderRadius: 8,
              marginTop: 8,
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
          estimateTime={60}
        />
      )}
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <DownloadProgressModal
          visible={downloadProgress.show}
          progress={downloadProgress.progress}
          onClose={() => {
            setDownloadProgress({
              ...downloadProgress,
              show: false,
              progress: 0,
              error: false,
              errorMessage: '',
            });
          }}
        />
      </View>
      <Loader show={loader} />
    </SafeAreaView>
  );
};

export default MultiJobs;
const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
  },
  _headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
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
    shadowOffset: { width: 0, height: 2 },
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
  _jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Size['2xl'],
    // borderBottomWidth: 0.7,
    borderTopWidth: 0.8,
    borderBottomColor: '#E7E6E6',
    borderTopColor: '#E7E6E6',
    paddingVertical: 5,
  },
  _jobTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: '#0E0E0E',
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
    // alignItems: 'center',
    marginRight: 1,
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
