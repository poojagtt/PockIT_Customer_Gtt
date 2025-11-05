import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import React, {useEffect, useState} from 'react';
import ThreeDotMenu from './ThreeDotMenu';
import {useSelector} from '../../context';
import {apiCall, fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {Icon, Header, Loader} from '../../components';
import JobStatus from './components/JobStatus';
import moment from 'moment';
import TechnicianDetails from './components/TechnicianDetails';
import RateUs from './components/RateUs';
// @ts-ignore
import StarRating from 'react-native-star-rating-widget';
import PartDetails from './components/PartDetails';
import OrderInfoModal from './components/OrderInfoModal';
import {OrderRoutes} from '../../routes/Order';
import {useTranslation} from 'react-i18next';
import Animated, {LinearTransition} from 'react-native-reanimated';
import {formatPeriod} from '../../Functions';
import {AppLogo} from '../../assets';
interface JobDetailsProps extends OrderRoutes<'JobDetails'> {}
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
const Duration = 300;
const JobDetails: React.FC<JobDetailsProps> = ({navigation, route}) => {
  const {user, address} = useSelector(state => state.app);
  const colors = useTheme();
  const {t} = useTranslation();
  const {jobItem} = route.params;
  const [loader, setLoader] = useState(false);
  const [expandCard, setExpandCard] = useState({
    showMenu: false,
    orderInfo: false,
    part: true,
  });
  // console.log('job details jobItem;', JSON.stringify(item, null, 2));
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
  const [jobStatusData, setJobStatusData] = useState([]);
  // @ts-ignore
  // const [jobItem, setJobItem] = useState<orderDetails>({});
  useEffect(() => {
    // jobItemDetails();
    getJobStatus();
    gerJobDetails();
  }, []);

  // const jobItemDetails = async () => {
  //   setLoader(true);
  //   try {
  //     const res = await apiCall.post(`api/orderDetails/getOrderDetails`, {
  //       CUSTOMER_ID: user?.ID,
  //       ORDER_ID: item.ORDER_ID,
  //       JOB_CARD_ID: item.JOB_CARD_ID,
  //     });
  //     if (res.data.code === 200) {
  //       console.log('first', res.data.data[0]);
  //       setJobItem(res.data.data[0]);
  //       setLoader(false);
  //     } else {
  //       setLoader(false);
  //       throw new Error('Failed to fetch order details');
  //     }
  //   } catch (error) {
  //     setLoader(false);
  //     console.log('err...', error);
  //   }
  // };
  const gerJobDetails = async () => {
    setLoader(true);
    try {
      setJobDetails({...jobDetails, loading: true});
      await apiCall
        .post(`api/jobcard/getjobDetailsWithFeedback`, {
          CUSTOMER_ID: user?.ID,
          ORDER_ID: jobItem.ORDER_ID,
          JOB_CARD_ID: jobItem.JOB_CARD_ID,
          sortKey: 'ID',
          sortValue: 'DESC',
        })
        .then(res => {
          if (res.data.code == 200) {
            
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

  const getJobStatus = () => {
    setLoader(true);
    try {
      apiCall
        .post('api/technicianActionLogs/getorderLogsforCustomer', {
          pageIndex: 1,
          pageSize: 10,
          sortKey: 'DATE_TIME',
          sortValue: 'ASC',
          filter: {
            $and: [
              {
                ORDER_ID: {
                  $in: [jobItem.ORDER_ID],
                },
              },
              {
                JOB_CARD_ID: {
                  $in: [jobItem.JOB_CARD_ID],
                },
              },
              {
                LOG_TYPE: {
                  $in: ['Job'],
                },
              },
            ],
          },
          ORDER_ID: jobItem.ORDER_ID,
          JOB_CARD_ID: jobItem.JOB_CARD_ID,
          IS_ORDER_OR_JOB: 'J',
        })
        .then(res => {
          if (res.data.code == 200) {
            setJobStatusData(res.data.data);
          }
        })
        .catch(error => {
          console.warn('err..', error);
        })
        .finally(() => {
          setLoader(false);
        });
    } catch (error) {
      console.warn('err11..', error);
      setLoader(false);
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{flexDirection: 'row', backgroundColor: 'white'}}>
        <Header
          label={t('jobDetails.title')}
          onBack={() => navigation.goBack()}
        />
        {!loader && address?.TERRITORY_ID && jobItem.JOB_STATUS == 'CO' && (
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
                isRasieTicket={true}
                raiseticketOnPress={() => {
                  navigation.navigate('Orderticket', {
                    jobItem: jobItem,
                    orderId: jobItem.ORDER_ID,
                    type: 'J',
                  });
                  setExpandCard({...expandCard, showMenu: false});
                }}
                isShowReschedule={false}
                isShowCancel={false}
              />
            )}
          </View>
        )}
      </View>
      {!loader && (
        <View style={styles._container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  getJobStatus();
                  gerJobDetails();
                }}
                colors={['#2A3B8F']}
              />
            }>
            <View style={{gap: 6, marginTop: Size.paddingY}}>
              {/* job status */}
              <JobStatus jobDetails={jobItem} jobStatus={jobStatusData} />

              {/* technician details */}
              {jobDetails.techData.ID ? (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(Duration)}>
                  <TechnicianDetails
                    jobItem={jobItem}
                    techData={jobDetails.techData}
                    onMessageClick={() => {
                      navigation.navigate('ChatScreen', {jobItem});
                    }}
                  />
                </Animated.View>
              ) : null}

              {/* part payment request */}
              {jobDetails.isPaymentReq ? (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(Duration)}
                  style={styles._card}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('PaymentSummary', {
                        jobItem,
                        pendingPaymentsData: jobDetails.pendingPaymentsData,
                        onSuccess: () => {
                          navigation.goBack();
                          gerJobDetails();
                        },
                      });
                    }}
                    activeOpacity={0.8}>
                    <Text style={styles._detailsTitleTxt}>
                      {t('jobDetails.partPayment.title')}
                    </Text>
                    <View style={{marginTop: 6}}>
                      <Text
                        style={[styles._label, {color: '#7a7a79', flex: 1}]}>
                        {t('jobDetails.partPayment.description')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ) : null}

              {/* part  request */}
              {jobDetails.isPartAdd && user?.CUSTOMER_TYPE == 'I' ? (
                <Animated.View
                  layout={LinearTransition.stiffness(45).duration(Duration)}
                  style={styles._card}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('PartDetailsList', {
                        jobItem,

                        onSuccess: () => {
                          navigation.goBack();
                          gerJobDetails();
                        },
                      });
                    }}
                    activeOpacity={0.8}>
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <Icon
                        type="Feather"
                        name="box"
                        size={22}
                        color="#2A3B8F"
                      />
                      <Text style={styles._detailsTitleTxt}>
                        {t('jobDetails.partDetails.title')}
                      </Text>
                    </View>
                    <View style={{}}>
                      <Text
                        style={[
                          styles._label,
                          {flex: 1, fontFamily: fontFamily},
                        ]}>
                        {t('jobDetails.partDetails.description')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ) : null}

              {/* rate us */}
              {jobItem.JOB_STATUS == 'CO' &&
                (jobDetails.feedbackData.service_feedback ? (
                  <Animated.View
                    layout={LinearTransition.stiffness(45).duration(Duration)}
                    style={[styles._card, {gap: Size.md}]}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <Icon
                        name="star"
                        type="EvilIcons"
                        color="#2A3B8F"
                        size={26}
                      />
                      <Text style={styles._detailsTitleTxt}>
                        {t('jobDetails.feedback.title')}
                      </Text>
                    </View>
                    <View style={{gap: 10, marginTop: 5}}>
                      <View style={{}}>
                        <Text style={[styles._label]}>
                          {t('jobDetails.feedback.serviceRating')}:
                        </Text>
                        <StarRating
                          rating={jobDetails.feedbackData.service_feedback}
                          onChange={(e: any) => {}}
                          starSize={30}
                          enableHalfStar={false}
                          starStyle={{marginHorizontal: -0.5}}
                        />
                      </View>
                      <View style={{}}>
                        <Text style={[styles._label]}>
                          {t('jobDetails.feedback.technicianRating')}:
                        </Text>
                        <StarRating
                          rating={jobDetails.feedbackData.technician_feedback}
                          onChange={(e: any) => {}}
                          starSize={30}
                          enableHalfStar={false}
                          starStyle={{marginHorizontal: -0.5}}
                        />
                      </View>
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View
                    layout={LinearTransition.stiffness(45).duration(Duration)}>
                    <RateUs
                      jobDetails={jobItem}
                      techData={jobDetails.techData}
                      onSuccess={() => {
                        gerJobDetails();
                      }}
                    />
                  </Animated.View>
                ))}

              {!jobDetails.isPartAdd &&
                jobDetails.partData.length > 0 &&
                user?.CUSTOMER_TYPE == 'I' && (
                  <PartDetails partData={jobDetails.partData} />
                )}

              {/*  details */}
              <Animated.View
                layout={LinearTransition.stiffness(45).duration(Duration)}
                style={[styles._card, {marginBottom: 5}]}>
                <View style={styles._orderContainer}>
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
                      style={{height: 40, width: 40}}
                      defaultSource={AppLogo}
                      source={
                        jobItem.SERVICE_IMAGE
                          ? {
                              uri: IMAGE_URL + 'Item/' + jobItem.SERVICE_IMAGE,
                              cache: 'default',
                            }
                          : AppLogo
                      }></Image>
                    <Text
                      style={[
                        styles._detailsTitleTxt,
                        {flexWrap: 'wrap', maxWidth: '80%'},
                      ]}>
                      {jobItem.ORDER_SERVICE_NAME}
                    </Text>
                  </View>

                  <Icon
                    type="Feather"
                    name={'info'}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={{
                    marginLeft: 46,
                    fontSize: 12,
                    fontWeight: 400,
                    fontFamily: fontFamily,
                  }}>{`${t('jobDetails.jobNumber')} : ${
                  jobItem.JOB_CARD_NO
                }`}</Text>
                {/* <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {}}
                style={styles._jobContainer}>
                <Text style={styles._jobTitleTxt}>{`${t(
                  'jobDetails.jobNumber',
                )} : ${jobItem.JOB_CARD_NO}`}</Text>
              </TouchableOpacity> */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // gap: 10,
                    marginTop: 10,
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
                    <Icon
                      type="Feather"
                      name="clock"
                      size={18}
                      color="orange"
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 14,
                      fontWeight: 400,
                      marginLeft: 10,
                      textAlign: 'left',
                      color: 'black',
                    }}>
                    {jobItem?.SCHEDULED_DATE_TIME
                      ? moment(jobItem?.SCHEDULED_DATE_TIME).format(
                          `ddd, MMM D [at] `,
                        ) +
                        moment(jobItem.JOB_START_TIME, 'HH:mm:ss').format(
                          'hh:mm A',
                        )
                      : t('jobDetails.details.notMentioned')}
                  </Text>
                </View>

                <View style={{gap: 10, marginTop: 15}}>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>
                      {t('jobDetails.details.estimatedTime')}:
                    </Text>
                    <Text style={[styles._value]}>
                      {jobItem?.ESTIMATED_TIME_IN_MIN
                        ? `${jobItem?.ESTIMATED_TIME_IN_MIN} ${t(
                            'jobDetails.details.minutes',
                          )}`
                        : t('jobDetails.details.notMentioned')}
                    </Text>
                  </View>

                  <View style={styles._row}>
                    <Text style={[styles._label]}>
                      {t('jobDetails.details.device')}:
                    </Text>
                    <Text style={[styles._value]}>{jobItem.CATEGORY_NAME}</Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>
                      {t('jobDetails.details.type')}:
                    </Text>
                    <Text style={[styles._value]}>
                      {jobItem.ORDER_SUB_CATEGORY_NAME}
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>
                      {t('jobDetails.details.service')}:
                    </Text>
                    <Text style={[styles._value]}>
                      {jobItem.ORDER_SERVICE_NAME}
                    </Text>
                  </View>
                  <View style={styles._row}>
                    <Text style={[styles._label]}>
                      {t('jobDetails.details.technicianVisit')}:
                    </Text>
                    <Text
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      style={[styles._value]}>
                      {jobItem?.SCHEDULED_DATE_TIME
                        ? moment(jobItem?.SCHEDULED_DATE_TIME).format(
                            `ddd, MMM D [at] `,
                          ) +
                          moment(jobItem.JOB_START_TIME, 'HH:mm:ss').format(
                            'hh:mm A',
                          )
                        : t('jobDetails.details.notMentioned')}
                    </Text>
                  </View>
                  {jobItem.WARRANTY_ALLOWED && user?.CUSTOMER_TYPE == 'I' && (
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('job.orderDetails.warranty')}
                      </Text>
                      <Text style={styles._value}>
                        {formatPeriod(jobItem.WARRANTY_PERIOD)}
                      </Text>
                    </View>
                  )}
                  {jobItem.GUARANTEE_ALLOWED && user?.CUSTOMER_TYPE == 'I' && (
                    <View style={styles._row}>
                      <Text style={styles._label}>
                        {t('job.orderDetails.guarantee')}
                      </Text>
                      <Text style={styles._value}>
                        {formatPeriod(jobItem.GUARANTEE_PERIOD)}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      )}

      {expandCard.orderInfo && (
        <OrderInfoModal
          visible={true}
          onClose={() => {
            setExpandCard({
              ...expandCard,
              orderInfo: false,
            });
          }}
          estimateTime={jobItem.ESTIMATED_TIME_IN_MIN}
        />
      )}

      <Loader show={loader} />
    </SafeAreaView>
  );
};
export default JobDetails;
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
    // letterSpacing: 0.6,
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
  },
  _jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Size['2xl'],
    borderBottomWidth: 0.8,
    borderTopWidth: 0.8,
    borderBottomColor: '#E7E6E6',
    borderTopColor: '#E7E6E6',
    paddingVertical: 5,
  },
  _jobTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
  },
  _label: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'left',
    color: '#636363',
    marginBottom: 10,
  },
  _value: {
    flex: 2,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'right',
    color: 'black',
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
});
