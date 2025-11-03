import moment, {Moment} from 'moment';
import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Button, Header, Icon, TextInput} from '../../components';
import ProgressBar from '../../components/ProgressBar';
import {useSelector} from '../../context';
import {apiCall, fontFamily, useTheme} from '../../modules';
import {CartRoutes} from '../../routes/Cart';
import {HomeRoutes} from '../../routes/Home';
import Toast from '../../components/Toast';

const ExpressServiceLogo = require('../../assets/images/Express_Service.png');
type SlotSelectionProps =
  | HomeRoutes<'SlotSelection'>
  | CartRoutes<'SlotSelection'>;
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
          backgroundColor: colors.primary2,
          borderColor: colors.primary2,
        },
        isDisabled && styles.dateButtonDisabled,
      ]}>
      <Text style={[styles.dateDay, {color: date === item ? '#fff' : '#666'}]}>
        {moment(item).format('ddd')}
      </Text>
      <Text style={[styles.dateNum, {color: date === item ? '#fff' : '#333'}]}>
        {moment(item).format('DD')}
      </Text>
    </TouchableOpacity>
  ),
);
// Add these with other state declarations
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
          marginBottom: 5,
          color: '#636363',
          fontSize: 14,
          fontWeight: '500',
          fontFamily: fontFamily
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
const SlotSelection: React.FC<SlotSelectionProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {user, territory, address} = useSelector(state => state.app);
  const flatListRef = useRef<FlatList>(null);
  const {services, cartId} = route.params;
  const [loading, setLoading] = useState<boolean>(false);
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [showError, setShowError] = useState(false);
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
  const [holidays, setHolidays] = useState<string[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<number[]>([]);
  const {t} = useTranslation();

  // console.log('\n\n\n\nterritory', territory);
  const timeSlotAvailability = () => {
    if (!territory) {
      return {};
    }

    return slot.reduce((acc, item) => {
      const slotStart: Moment = moment(item.startTime, 'HH:mm:ss');
      const slotEnd: Moment = moment(item.endTime, 'HH:mm:ss');
      const startTimeArray = [
        ...services.map(time =>
          moment(
            time.SERVICE_START_TIME ? time.SERVICE_START_TIME : '00:00:01',
            'HH:mm:ss',
          ),
        ),
        moment(territory.START_TIME, 'HH:mm:ss'),
      ];
      const endTimeArray = [
        ...services.map(time =>
          moment(
            time.SERVICE_END_TIME ? time.SERVICE_END_TIME : '23:59:59',
            'HH:mm:ss',
          ),
        ),
        moment(territory.END_TIME, 'HH:mm:ss'),
      ];
      if (moment(date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        const maxPreparationMinutes = services.reduce((maxTime, service) => {
          const totalMinutes =
            service.PREPARATION_HOURS * 60 + service.PREPARATION_MINUTE;
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
  };
  const isTimeSlotAvailable = (startTime: string, endTime: string) => {
    // If selected date is holiday or weekly off, no slots are available
    if (isHolidayDate(date) || isWeeklyOffDate(date)) {
      return false;
    }
    return timeSlotAvailability()[`${startTime}-${endTime}`] ?? false;
  };
  const renderDateItem = ({item}: {item: string}) => (
    <DateItem
      item={item}
      date={date}
      onSelect={item => {
        setDate(item);
        setTime(null);
      }}
      colors={colors}
      isDisabled={isPastDate(item) || isHolidayDate(item) || isWeeklyOffDate(item)}
    />
  );
  const getItemLayout = (_: any, index: number) => ({
    length: 72,
    offset: 72 * index,
    index,
  });
  const monthDates = () => {
    const dates: string[] = [];
    const currentDate = moment();
    for (let i = 0; i < 30; i++) {
      dates.push(currentDate.clone().add(i, 'days').format('YYYY-MM-DD'));
    }
    return dates;
  };


   const getHolidays = async () => {
  try {
    if (!territory?.ID) {
      return;
    }
    const response = await apiCall
      .post('api/territoryHolidayMapping/get', {
        filter: `AND TERRITORY_ID = ${territory.ID} AND IS_HOLIDAY = 1 AND STATUS = 1`,
      })
      .then(res => {
        if (res.data.data) {
           console.log('Holiday Data:', res.data.data);
          // Store holiday dates as YYYY-MM-DD
          const holidayDates = res.data.data
            .filter((item: any) => item.DATE)
            .map((item: any) => moment(item.DATE).format('YYYY-MM-DD'));
          setHolidays(holidayDates);

          // Store weekly offs (accept names or numbers 0-6, short or full names, case-insensitive)
          if (res.data.data[0]?.WEEKLY_OFFS) {
            const nameToIdx: Record<string, number> = {
              sunday: 0,
              sun: 0,
              monday: 1,
              mon: 1,
              tuesday: 2,
              tue: 2,
              tues: 2,
              wednesday: 3,
              wed: 3,
              thursday: 4,
              thu: 4,
              thurs: 4,
              friday: 5,
              fri: 5,
              saturday: 6,
              sat: 6,
            };
            const weeklyOffDays: number[] = String(res.data.data[0].WEEKLY_OFFS)
              .split(',')
              .map((p: string) => p.trim())
              .map((p: string) => {
                const n = Number(p);
                if (!isNaN(n)) return n;
                const key = p.toLowerCase();
                return nameToIdx[key] ?? -1;
              })
              .filter((n: number) => n >= 0 && n <= 6);
            setWeeklyOffs(weeklyOffDays);
          }
          
          return res.data.data[0];
        }
        return Promise.reject(res.data.message);
      });
  } catch (error) {
    console.warn(error);
  }
};


console.log('holidays', holidays);
console.log('weeklyOffs', weeklyOffs);

  const isPastDate = (d: string) => moment().format('YYYY-MM-DD') > d;
  const isHolidayDate = (d: string) => holidays.includes(d);
  const isWeeklyOffDate = (d: string) => weeklyOffs.includes(moment(d).day());
  const findNextValidDate = (current: string) => {
    const dates = monthDates();
    const startIndex = dates.indexOf(current) + 1;
    for (let i = startIndex; i < dates.length; i++) {
      const d = dates[i];
      if (!isPastDate(d) && !isHolidayDate(d) && !isWeeklyOffDate(d)) {
        return d;
      }
    }
    return null;
  };
  const getTimeSlots = async () => {
    try {
      const response = await apiCall
        .post('api/cart/slots/get', {
          CUSTOMER_ID: user?.ID,
          TERRITORY_ID: territory?.ID,
        })
        .then(res => {
          console.log('res', res.data);
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
      Alert.alert(
        t('slotSelection.errors.errorTitle'),
        t('slotSelection.errors.fetchSlots'),
      );
    }
  };

  const getExpectedTimeOnSlotAndDate = (
    startTime: Moment,
    endTime: Moment,
    selectedDate: Moment,
  ): Moment | null => {
    if (!territory) {
      return null;
    }

    const slotStart: Moment = moment(startTime, 'HH:mm:ss');
    const slotEnd: Moment = moment(endTime, 'HH:mm:ss');
    const startTimeArray = [
      ...services.map(time =>
        moment(
          time.SERVICE_START_TIME ? time.SERVICE_START_TIME : '00:00:01',
          'HH:mm:ss',
        ),
      ),
      moment(territory.START_TIME, 'HH:mm:ss'),
      slotStart,
    ];
    const endTimeArray = [
      ...services.map(time =>
        moment(
          time.SERVICE_END_TIME ? time.SERVICE_END_TIME : '23:59:59',
          'HH:mm:ss',
        ),
      ),
      moment(territory.END_TIME, 'HH:mm:ss'),
    ];

    if (
      moment(selectedDate).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')
    ) {
      const maxPreparationMinutes = services.reduce((maxTime, service) => {
        const totalMinutes =
          service.PREPARATION_HOURS * 60 + service.PREPARATION_MINUTE;
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
      Toast(t('slotSelection.errors.selectTime'));
      return null;
    }
  };
  const handleSubmit = async () => {
    if (!time) {
      setShowError(true);
      Toast(t('slotSelection.errors.selectTimeFirst'));
      return;
    }

    setLoading(true);

    try {
      const EXPECTED_DATE_TIME = getExpectedTimeOnSlotAndDate(
        moment(time?.startTime, 'HH:mm:ss'),
        moment(time?.endTime, 'HH:mm:ss'),
        moment(date),
      );

      if (!date) {
        Alert.alert(
          t('slotSelection.errors.errorTitle'),
          t('slotSelection.errors.selectDate'),
        );
        return;
      }

      if (!cartId) {
        Alert.alert(
          t('slotSelection.errors.errorTitle'),
          t('slotSelection.errors.cartNotFound'),
        );
        return;
      }

      if (!EXPECTED_DATE_TIME) {
        Alert.alert(
          t('slotSelection.errors.errorTitle'),
          t('slotSelection.errors.selectProperSlot'),
        );
        return;
      }

      EXPECTED_DATE_TIME.add(
        10 - (moment(EXPECTED_DATE_TIME).minutes() % 10),
        'minutes',
      );

      const payload = {
        SCHEDULE_DATE: moment(date).format('YYYY-MM-DD'),
        SCHEDULE_START_TIME: moment(time?.startTime, 'HH:mm:ss').format(
          'HH:mm:ss',
        ),
        SCHEDULE_END_TIME: moment(time?.endTime, 'HH:mm:ss').format('HH:mm:ss'),
        EXPECTED_DATE_TIME:
          moment(date).format('YYYY-MM-DD') +
          ' ' +
          moment(EXPECTED_DATE_TIME).format('HH:mm:ss'),
        IS_EXPRESS: isExpress ? 1 : 0,
        REMARK: remark,
        CART_ID: cartId,
      };

      await apiCall.post(`api/cart/updateDetails`, payload);

      // @ts-ignore
      navigation.navigate('Overview', {cartId});
    } catch (error) {
      console.warn(error);
      Toast(t('slotSelection.errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getHolidays();
    getTimeSlots();
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);
  const handleNextDate = () => {
    const next = findNextValidDate(date);
    if (next) {
      setDate(next);
      setTime(null);
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
       <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       keyboardVerticalOffset={30}
    >
      <View style={{flex: 1}}>
        <Header
          label={t('slotSelection.title')}
          onBack={() => navigation.goBack()}
        />
        <ProgressBar width={'100%'} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.description, {color: '#0E0E0E'}]}>
            {t('slotSelection.description')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.container}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('AddressBook', {
                cartId: {
                  id: cartId,
                  type: 'S',
                },
              });
            }}>
            <View style={styles.contents}>
              <View style={styles.row}>
                <Icon
                  name="home"
                  size={20}
                  color={colors.primary}
                  type="Feather"
                  onPress={() => navigation.goBack()}
                />
              </View>
              <View style={{marginLeft: 15, flex: 1}}>
                <Text style={styles.title} numberOfLines={1}>
                  {address?.ADDRESS_LINE_1}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {address?.ADDRESS_LINE_2},{address?.CITY_NAME},
                  {address?.PINCODE}
                </Text>
              </View>
            </View>
            <View style={styles.iconContainer}>
              <Icon
                name="chevron-forward"
                type="Ionicons"
                size={24}
                color="#999"
              />
            </View>
          </TouchableOpacity>
          {services.some(value => value.IS_EXPRESS) &&
            territory?.IS_EXPRESS_SERVICE_AVAILABLE == 1 && (
              <View style={styles.card}>
                <View>
                  <Image
                    source={ExpressServiceLogo}
                    style={{width: '40%', height: 25}}
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: 0.1,
                    color: '#555',
                    // marginVertical: 10,
                  }}>
                  {`${t(
                    'slotSelection.expressService.description',
                  )} ${services.reduce(
                    (total, service) =>
                      total +
                      Number(
                        service.EXPRESS_CHARGES ? service.EXPRESS_CHARGES : 0,
                      ),
                    0,
                  )} ${t('slotSelection.expressService.currency')}`}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.expressButton,
                    isExpress && {
                      borderColor: colors.primary2,
                      backgroundColor: colors.primary2,
                    },
                  ]}
                  onPress={() => setExpress(!isExpress)}>
                  <Text
                    style={[
                      styles.expressButtonText,
                      {color: isExpress ? '#FFFFFF' : colors.primary2},
                    ]}>
                    {isExpress
                      ? t('slotSelection.expressService.removeExpress')
                      : t('slotSelection.expressService.useExpress')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              paddingVertical: 10,
              gap: 12,
              borderColor: '#E0E0E0',
              backgroundColor: '#FFF',
              marginHorizontal: 16,
              elevation: 2,
            }}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: '#333'}]}>
                {t('slotSelection.selectDate')}
              </Text>
              <TouchableOpacity
                onPress={handleNextDate}
                disabled={!findNextValidDate(date)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.background,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}>
                <Text style={{fontSize: 16, color: '#333', flex: 1,textAlign: 'center',fontFamily: fontFamily}}>
                  {moment(date).format('ddd, MMMM D, YYYY')}
                </Text>
               
                 
                  <Icon
                    name="chevron-forward"
                    type="Ionicons"
                    size={20}
                    color="black"
                  />
               
              </TouchableOpacity>
              <FlatList
                ref={flatListRef}
                horizontal
                removeClippedSubviews={false}
                showsHorizontalScrollIndicator={false}
                data={monthDates()}
                renderItem={renderDateItem}
                keyExtractor={(item: string) => item}
                getItemLayout={getItemLayout}
                initialNumToRender={7}
                maxToRenderPerBatch={10}
                windowSize={5}
              />
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: '#333'}]}>
                {t('slotSelection.selectTimeSlot')}
              </Text>
              <View style={styles.timeSlotGrid}>
                {slot.map((item, index) => (
                  <TimeSlotItem
                    key={index}
                    item={item}
                    isSelected={time?.name === item.name}
                    onSelect={() => {
                      setTime(item);
                    }}
                    isAvailable={isTimeSlotAvailable(
                      item.startTime,
                      item.endTime,
                    )}
                    colors={colors}
                  />
                ))}
              </View>
              {slot.every(
                item => !isTimeSlotAvailable(item.startTime, item.endTime),
              ) ? (
                <Text
                  style={{
                    color: colors.error,
                    marginTop: -6,
                    marginBottom: 10,
                    lineHeight: 20,
                    letterSpacing: 0.4,
                    fontSize: 11,
                    fontFamily: fontFamily
                  }}>
                  {t('slotSelection.errors.noTimeSlotAvailable')}
                </Text>
              ) : null}
              {showError && !time && (
                <Text
                  style={{
                    color: colors.error,
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
              <Text style={[styles.remarkTitle, {color: '#333'}]}>
                {t('slotSelection.remark')}
              </Text>
              <TextInput
                style={{backgroundColor: 'white'}}
                placeholder={t('slotSelection.remarkPlaceholder')}
                value={remark}
                placeholderTextColor="#D2D2D2"
                onChangeText={text => setRemark(text)}
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleSubmit}
            label={t('slotSelection.confirm')}
            loading={loading}
            disabled={loading} // Only disable if loading
          />
        </View>
      </View>
      </KeyboardAvoidingView>
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
    gap: 8,
    flexGrow: 1,
  },
  description: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 24,

    marginHorizontal: 16,
    marginTop: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    elevation: 2,
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
    letterSpacing: 0.1,
  },
  dateButton: {
    padding: 12,
    width: 72,
    height: 70,
    borderWidth: 1,
    borderColor: '#66A6FF-',
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dateDay: {
   fontFamily: fontFamily,
    fontSize: 14,
    marginBottom: 4,
  },
  dateNum: {
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  timeSlotDisabled: {
    backgroundColor: '#e5e5e5',
    borderColor: '#E0E0E0',
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
  },
  remarkTitle: {
fontFamily: fontFamily,    fontSize: 16,
    fontWeight: '600',
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
    margin: 16,
  },
  expressButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#3170DE',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '500',
    fontSize: 16,
    fontFamily: fontFamily
  },
  container: {
    backgroundColor: '#FDFDFD',
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    elevation: 5,
    marginHorizontal: 16,
    flex: 1,
  },

  contents: {
    flex: 1,
    borderRadius: 8,
    flexDirection: 'row',
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
   fontFamily: fontFamily,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#636363',
    fontWeight: '400',
   fontFamily: fontFamily
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
});
export default React.memo(SlotSelection);
