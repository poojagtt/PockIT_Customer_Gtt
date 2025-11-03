import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  BackHandler,
  FlatList,

  KeyboardAvoidingView,

  Platform,

  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {useSelector} from '../../../context';
import {CartRoutes} from '../../../routes/Cart';
import {Button, Icon, TextInput, Header, Loader} from '../../../components';
import {HomeRoutes} from '../../../routes/Home';
import {OrderRoutes} from '../../../routes/Order';
import moment, {Moment} from 'moment';
import {useTranslation} from 'react-i18next';
import {t} from 'i18next';
import Toast from '../../../components/Toast';

type SlotsInterface = {
  SLOT1_END_TIME: string;
  SLOT1_START_TIME: string;
  SLOT2_END_TIME: string;
  SLOT2_START_TIME: string;
  SLOT3_END_TIME: string;
  SLOT3_START_TIME: string;
};

type RescheduleDatetimeProps = OrderRoutes<'SelectDateTime'>;

// Create a memoized date item component
const DateItem = React.memo(
  ({
    item,
    date,
    onSelect,
    colors,
    isDisabled,
  }: {
    item: string;
    date: string;
    onSelect: (date: string) => void;
    colors: any;
    isDisabled: boolean;
  }) => (
    <TouchableOpacity
      disabled={isDisabled}
      onPress={() => onSelect(item)}
      style={[
        styles.dateButton,
        date === item && {
          backgroundColor: colors.buttonbackground,
          borderColor: colors.primary,
        },
        isDisabled && styles.dateButtonDisabled,
      ]}>
      <Text
        style={[styles.dateDay, {color: date === item ? '#fff' : '#636363'}]}>
        {moment(item).format('ddd')}
      </Text>
      <Text style={[styles.dateNum, {color: date === item ? '#fff' : 'black'}]}>
        {moment(item).format('DD')}
      </Text>
    </TouchableOpacity>
  ),
);

// Create a memoized time slot item component
const TimeSlotItem = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    isAvailable,
    colors,
  }: {
    item: {
      name: string;
      startTime: string;
      endTime: string;
    };
    isSelected: boolean;
    onSelect: () => void;
    isAvailable: boolean;
    colors: any;
  }) => (
    <View style={{flex: 1}}>
      <Text
        style={{
          fontFamily: fontFamily,
          marginBottom: 5,
          color: '#636363',
          fontSize: 14,
          fontWeight: 500,
        }}>
        {item.name}
      </Text>
      <TouchableOpacity
        disabled={!isAvailable}
        style={[
          styles.timeSlot,
          isSelected && {
            backgroundColor: colors.buttonbackground,
            borderColor: colors.primary,
          },
          !isAvailable && styles.timeSlotDisabled,
        ]}
        onPress={onSelect}>
        <Text
          style={[
            styles.timeSlotTime,
            {color: isSelected ? '#fff' : '#636363',fontFamily: fontFamily},
          ]}>
          {moment(item.startTime, 'HH:mm:ss').format('h:mm a')}
          {'\n'} - {'\n'}
          {moment(item.endTime, 'HH:mm:ss').format('h:mm a')}
        </Text>
      </TouchableOpacity>
    </View>
  ),
);

const RescheduleDatetime: React.FC<RescheduleDatetimeProps> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const {user, territory} = useSelector(state => state.app);
  const flatListRef = useRef<FlatList>(null);
  const { services, selectedReasons , comment} = route.params;
  const [loading, setLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState(false);
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [time, setTime] = useState<{
    name: 'Morning' | 'Afternoon' | 'Evening';
    startTime: string;
    endTime: string;
  } | null>(null);

  const [slot, setSlot] = useState<
    {
      name: 'Morning' | 'Afternoon' | 'Evening';
      startTime: string;
      endTime: string;
    }[]
  >([]);
  const [remark, setRemark] = useState<string>('');
  const [isExpress, setExpress] = useState<boolean>(false);

  // Memoize the time slot availability calculations
  const timeSlotAvailability = useMemo(() => {
    if (!territory) {
      return {};
    }

    return slot.reduce((acc, item) => {
      const slotStart: Moment = moment(item.startTime, 'HH:mm:ss');
      const slotEnd: Moment = moment(item.endTime, 'HH:mm:ss');
      const startTimeArray = [
        ...services.map(time =>
          moment(time.START_TIME ? time.START_TIME : '00:00:01', 'HH:mm:ss'),
        ),
        moment(territory.START_TIME, 'HH:mm:ss'),
      ];
      const endTimeArray = [
        ...services.map(time =>
          moment(time.END_TIME ? time.END_TIME : '23:59:59', 'HH:mm:ss'),
        ),
        moment(territory.END_TIME, 'HH:mm:ss'),
      ];
      if (moment(date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        const maxPreparationMinutes = services.reduce((maxTime, service) => {
          const totalMinutes =
            service.PREPARATION_HOURS * 60 + service.PREPARATION_MINUTES;
          return Math.max(maxTime, totalMinutes);
        }, 0);
        startTimeArray.push(moment().add(maxPreparationMinutes, 'minutes'));
      }
      const serviceStart: Moment = moment.max(startTimeArray);
      const serviceEnd: Moment = moment.min(endTimeArray);
      const isServiceStartWithinSlot =
        serviceStart.isSameOrAfter(slotStart) && serviceStart.isBefore(slotEnd);
      const isServiceEndWithinSlot =
        serviceEnd.isSameOrAfter(slotStart) && serviceEnd.isBefore(slotEnd);
      const isSlotFullyWithinService =
        slotStart.isSameOrAfter(serviceStart) &&
        slotEnd.isSameOrBefore(serviceEnd);
      acc[`${item.startTime}-${item.endTime}`] =
        serviceEnd.diff(serviceStart) >= 0 &&
        (isServiceStartWithinSlot ||
          isServiceEndWithinSlot ||
          isSlotFullyWithinService);
      return acc;
    }, {} as Record<string, boolean>);
  }, [date, slot, territory, services]);

  // Create a helper function to check availability (not a hook)
  const isTimeSlotAvailable = useCallback(
    (startTime: string, endTime: string) => {
      return timeSlotAvailability[`${startTime}-${endTime}`] ?? false;
    },
    [timeSlotAvailability],
  );

  const monthDates = useMemo(() => {
    const dates: string[] = [];
    const currentDate = moment();
    for (let i = 0; i < 30; i++) {
      dates.push(currentDate.clone().add(i, 'days').format('YYYY-MM-DD'));
    }
    return dates;
  }, []);

  const getTimeSlots = useCallback(async () => {
    try {
      const response = await apiCall
        .post('api/cart/slots/get', {
          CUSTOMER_ID: user?.ID,
          TERRITORY_ID: territory?.ID,
        })
        .then(res => {
          if (res.data.data) {
            return res.data.data[0];
          }
          return Promise.reject(res.data.message);
        });

      setSlot([
        {
          name: 'Morning',
          startTime: response.SLOT1_START_TIME,
          endTime: response.SLOT1_END_TIME,
        },
        {
          name: 'Afternoon',
          startTime: response.SLOT2_START_TIME,
          endTime: response.SLOT2_END_TIME,
        },
        {
          name: 'Evening',
          startTime: response.SLOT3_START_TIME,
          endTime: response.SLOT3_END_TIME,
        },
      ]);
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'Unable to fetch time slots');
    }
  }, [user?.ID, territory?.ID]);
  const getExpectedTimeOnSlotAndDate: (
    startTime: Moment,
    endTime: Moment,
    selectedDate: Moment,
  ) => Moment | null = (
    startTime: Moment,
    endTime: Moment,
    selectedDate: Moment,
  ) => {
    if (!territory) {
      return null;
    }

    const slotStart: Moment = moment(startTime, 'HH:mm:ss');
    const slotEnd: Moment = moment(endTime, 'HH:mm:ss');
    // const maxPreparationTime = moment.max()
    const startTimeArray = [
      ...services.map(time =>
        moment(time.START_TIME ? time.START_TIME : '00:00:01', 'HH:mm:ss'),
      ),
      moment(territory.START_TIME, 'HH:mm:ss'),
    ];
    const endTimeArray = [
      ...services.map(time =>
        moment(time.END_TIME ? time.END_TIME : '23:59:59', 'HH:mm:ss'),
      ),
      moment(territory.END_TIME, 'HH:mm:ss'),
    ];

    if (
      moment(selectedDate).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')
    ) {
      const maxPreparationMinutes = services.reduce((maxTime, service) => {
        const totalMinutes =
          service.PREPARATION_HOURS * 60 + service.PREPARATION_MINUTES;
        return Math.max(maxTime, totalMinutes);
      }, 0);
      startTimeArray.push(moment().add(maxPreparationMinutes, 'minutes'));
    }

    let serviceStart: Moment = moment.max(startTimeArray);
    let serviceEnd: Moment = moment.min(endTimeArray);
    const isServiceStartWithinSlot =
      serviceStart.isSameOrAfter(slotStart) && serviceStart.isBefore(slotEnd);
    const isServiceEndWithinSlot =
      serviceEnd.isSameOrAfter(slotStart) && serviceEnd.isBefore(slotEnd);
    const isSlotFullyWithinService =
      slotStart.isSameOrAfter(serviceStart) &&
      slotEnd.isSameOrBefore(serviceEnd);

    if (
      isServiceStartWithinSlot ||
      isServiceEndWithinSlot ||
      isSlotFullyWithinService
    ) {
      return moment.max(startTimeArray);
    } else {
      Toast('Unable to select time');
      return null;
    }
  };
  const handleSubmit = useCallback(async () => {
    if (!time) {
      setShowError(true);
      Toast(
        t('slotSelection.errors.selectTimeFirst'),
      );
      return;
    }
    try {
      const EXPECTED_DATE_TIME = getExpectedTimeOnSlotAndDate(
        moment(time?.startTime, 'HH:mm:ss'),
        moment(time?.endTime, 'HH:mm:ss'),
        moment(date),
      );
      if (!time) {
        return Promise.reject('Please select time');
      }
      if (!date) {
        return Promise.reject('Please select date');
      }

      if (!EXPECTED_DATE_TIME) {
        return Promise.reject('Please select proper time slot');
      }
      EXPECTED_DATE_TIME.add(
        10 - (moment(EXPECTED_DATE_TIME).minutes() % 10),
        'minutes',
      );
      const payload = {
        SCHEDULE_DATE: moment(date).format('YYYY-MM-DD'),
        REMARK: remark,
        IS_UPDATED_BY_CUSTOMER: 1,
        ORDER_STATUS: 'OS',
        ID: services[0].ORDER_ID,
        EXPECTED_DATE_TIME:
          moment(date).format('YYYY-MM-DD') +
          ' ' +
          moment(time?.startTime, 'HH:mm:ss').format(`HH:mm:ss`),
        RESCHEDULE_REQUEST_REASON: selectedReasons
        .map((item: CancelReason) => item.REASON)
        .join(', '),
        RESCHEDULE_REQUEST_REMARK: comment,
      };
      apiCall
        .patch(`api/order/orderUpdateStatus`, payload)
        .then(res => {
          if (res.status == 200) {
            // @ts-ignore
            // navigation.navigate('Overview', {cartId});
            navigation.popToTop();
            setLoading(false);
          } else {
            setLoading(false);
          }
        })
        .catch(error => {
          console.warn(error);
          setLoading(false);
        });
    } catch (error) {
      console.warn(error);
      Toast('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [
    time,
    date,
    isExpress,
    remark,
    // cartId,
    user?.ID,
    navigation,
    selectedReasons,
  ]);
  const renderDateItem = useCallback(
    ({item}: {item: string}) => (
      <DateItem
        item={item}
        date={date}
        onSelect={item => {
          setDate(item);
          setTime(null);
        }}
        colors={colors}
        isDisabled={moment().format('YYYY-MM-DD') > item}
      />
    ),
    [date, colors],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 72, // width of date item
      offset: 72 * index,
      index,
    }),
    [],
  );

  useEffect(() => {
    getTimeSlots();

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [getTimeSlots, navigation]);

  return (
    
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <Header label="Select Date and Time" onBack={() => navigation.goBack()} />
        
      <View style={{flex: 1, gap: 16}}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* <Text style={[styles.description, { color: '#666' }]}>
            Please select a date and time for the technician's visit.
          </Text> */}

          {/* {services.some(value => value.IS_EXPRESS) &&
            territory?.IS_EXPRESS_SERVICE_AVAILABLE == 1 && (
              <View style={styles.card}>
                <View style={styles.expressHeader}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                    }}
                  />
                  <Text style={[styles.expressTitle, {color: '#333'}]}>
                    Express service
                  </Text>
                </View>
                <Text style={[styles.expressDescription, {color: '#666'}]}>
                  Same day service with express checkout option
                </Text>
                <TouchableOpacity
                  style={[
                    styles.expressButton,
                    isExpress && styles.expressButtonActive,
                  ]}
                  onPress={() => setExpress(!isExpress)}>
                  <Text
                    style={[
                      styles.expressButtonText,
                      {color: isExpress ? '#fff' : '#555'},
                    ]}>
                    {isExpress
                      ? 'Remove Express Service'
                      : 'Use Express Service'}
                  </Text>
                </TouchableOpacity>
              </View>
            )} */}
             <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 25}
              >
          {services.some(value => value.IS_EXPRESS) &&
            territory?.IS_EXPRESS_SERVICE_AVAILABLE == 1 && (
              <View style={styles.card}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <View
                    style={{
                      width: 15,
                      height: 15,
                      backgroundColor: colors.primary,
                      borderRadius: 15,
                    }}
                  />
                  <Text
                    style={{
                     fontFamily: fontFamily,
                      letterSpacing: 0.68,
                      textAlign: 'left',
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                    }}>
                    Express service
                  </Text>
                </View>
                <Text
                  style={{
                   fontFamily: fontFamily,
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: 0.1,
                    color: '#555',
                    marginVertical: 10,
                  }}>
                  {`Same day service with our express checkout option with additional service charge of ${services.reduce(
                    (total, service) =>
                      total +
                      Number(
                        service.EXPRESS_DELIVERY_CHARGES
                          ? service.EXPRESS_DELIVERY_CHARGES
                          : 0,
                      ),
                    0,
                  )} INR`}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.expressButton,
                    isExpress && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => setExpress(!isExpress)}>
                  <Text
                    style={[
                      styles.expressButtonText,
                      {color: isExpress ? '#fff' : '#555',fontFamily: fontFamily},
                    ]}>
                    {isExpress
                      ? 'Remove Express Service'
                      : 'Use Express Service'}
                  </Text>
                </TouchableOpacity>
              </View>
              // <View style={styles.card}>
              //   <View style={styles.expressHeader}>
              //     <View
              //       style={{
              //         width: 12,
              //         height: 12,
              //         backgroundColor: colors.primary,
              //         borderRadius: 6,
              //       }}
              //     />
              //     <Text style={[styles.expressTitle, {color: '#333'}]}>
              //       Express service
              //     </Text>
              //   </View>
              //   <Text style={[styles.expressDescription, {color: '#666'}]}>
              //     Same day service with express checkout option
              //   </Text>
              //   <TouchableOpacity
              //     style={[
              //       styles.expressButton,
              //       isExpress && styles.expressButtonActive,
              //     ]}
              //     onPress={() => setExpress(!isExpress)}>
              //     <Text
              //       style={[
              //         styles.expressButtonText,
              //         {color: isExpress ? '#fff' : '#555'},
              //       ]}>
              //       {isExpress
              //         ? 'Remove Express Service'
              //         : 'Use Express Service'}
              //     </Text>
              //   </TouchableOpacity>
              // </View>
            )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: 'black',fontFamily: fontFamily}]}>
              Select a date
            </Text>
            <FlatList
              ref={flatListRef}
              horizontal
              removeClippedSubviews={false}
              showsHorizontalScrollIndicator={false}
              data={monthDates}
              renderItem={renderDateItem}
              keyExtractor={useCallback((item: string) => item, [])}
              getItemLayout={getItemLayout}
              initialNumToRender={7}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: 'black',fontFamily: fontFamily}]}>
              Select a time slot
            </Text>
            <View style={styles.timeSlotGrid}>
              {slot.map((item, index) => (
                <TimeSlotItem
                  key={index}
                  item={item}
                  isSelected={time?.name === item.name}
                  onSelect={() => setTime(item)}
                  isAvailable={isTimeSlotAvailable(
                    item.startTime,
                    item.endTime,
                  )}
                  colors={colors}
                />
              ))}
            </View>
            {showError && !time && (
              <Text
                style={{
                  color: colors.error,
                  //textAlign: 'center',
                  // marginTop: Size.containerPadding,
                  marginTop: -6,
                  marginBottom: 10,
                  lineHeight: 20,
                  letterSpacing: 0.4,
                  fontSize: 11,
                  fontFamily: fontFamily
                }}>
                {t('slotSelection.errors.selectTimeFirst')}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={[styles.remarkTitle]}>Remark</Text>
            <TextInput
              placeholder="Add remark (optional)"
              value={remark}
              placeholderTextColor="#D2D2D2"
              onChangeText={text => setRemark(text)}
              style={styles.textContainer}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              onPress={handleSubmit}
              label={t('slotSelection.confirm')}
              loading={loading}
              disabled={loading} // Only disable if loading
            />
          </View>
           </KeyboardAvoidingView>
        </ScrollView>
      </View>
      <Loader show={loading} />
     
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  headerTitle: {
     fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.68,
  },
  content: {
    gap: 24,
    paddingBottom: 24,
  },
  description: {
     fontFamily: fontFamily,
    fontSize: 16,
    lineHeight: 24,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    borderColor: '#E7E6E6',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    // elevation: 1,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: { width: 0, height: 2 },
    // shadowRadius: 6,
  },
  expressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expressTitle: {
     fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
  },
  expressDescription: {
     fontFamily: fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
     fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    // letterSpacing: 0.1,
  },
  dateButton: {
    padding: 8,
    width: 72,
    borderWidth: 1,
    borderColor: '#707070',
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 8,
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  dateButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dateDay: {
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 500,
    // marginBottom: 2,
  },
  dateNum: {
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 500,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    minWidth: '30%',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#707070',
    alignItems: 'center',
    // paddingBottom: 10,
    gap: 8,
  },
  timeSlotDisabled: {
    backgroundColor: '#e5e5e5',
    borderColor: '#707070',
  },
  timeSlotName: {
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSlotTime: {
   fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '500',
  },
  remarkTitle: {
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
   
  },
  remarkInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
   fontFamily: fontFamily,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginHorizontal: 16,
    backgroundColor: '#3170DE',
    borderRadius: 8,
  },
  expressButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  expressButtonActive: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  expressButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textContainer: {
    borderColor: '#CBCBCB',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: 'white',
  },
});

export default React.memo(RescheduleDatetime);
