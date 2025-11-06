import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeRoutes } from '../../routes/Home';
import {
  apiCall,
  IMAGE_URL,
  Size,
  useTheme,
  BASE_URL,
  fontFamily,
  useStorage,
} from '../../modules';
import Carousel from 'react-native-reanimated-carousel';
import { Reducers, useDispatch, useSelector } from '../../context';
import { useFocusEffect } from '@react-navigation/native';
import AddressPopUp from './AddressPopUp';
import { Button, Icon } from '../../components';
import { _background, _defaultImage, _noProfile } from '../../assets';
import { useTranslation } from 'react-i18next';
import { BackHandler } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Animated, {
  Extrapolation,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import Toast from '../../components/Toast';

const ImageWithFallback = ({
  source,
  fallbackSource,
  style,
  resizeMode,
}: any) => {
  const [imgSource, setImgSource] = useState(source);
  return (
    <Image
      source={imgSource}
      style={style}
      resizeMode={resizeMode}
      onError={() => setImgSource(fallbackSource)}
    />
  );
};

interface DashboardProps extends HomeRoutes<'Dashboard'> { }

interface ProgressBarPaginationProps {
  index: number;
  length: number;
  barWidth?: number;
  barHeight?: number;
  backgroundColor?: string;
  progressColor?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const { user, address, allAddress, territory } = useSelector(
    state => state.app,
  );
  const { cart } = useSelector(state => state.cart);
  const [loading, setLoading] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(true);
  const [addressPopUp, setAddressPopUp] = useState<boolean>(false);
  const [b2bAddressPopUp, setB2bAddressPopUp] = useState<boolean>(false);
  const [topServices, setTopServices] = useState<ServicesInterface[]>([]);
  const [carouselImage, setCarouselImage] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<any[]>([]);
  const [topSelling, setTopSelling] = useState<any[]>([]);
  const [category, setCategory] = useState<TerritoryWiseCategoryInterface[]>(
    [],
  );
  const [NonServiceCategory, setNonServiceCategory] = useState<
    TerritoryWiseCategoryInterface[]
  >([]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [modal, setModal] = useState({
    isEnableService: false,
  });
  const { t } = useTranslation();
  const PAGE_SIZE = 6;
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState<boolean>(false);
  const [latestNotificationDate, setLatestNotificationDate] = useState<string | null>(null);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      address?.TERRITORY_ID
        ? getTerritoryWiseCategory(nextPage, true)
        : fetchNonServiceCategories();
    }
  };

  async function getTerritoryWiseCategory(
    page: number = 1,
    isLoadMore: boolean = false,
  ): Promise<void> {
    if (!address) {
      return;
    }
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    const list: TerritoryWiseCategoryInterface[] | null = await apiCall
      .post(`order/getCategories`, {
        TERRITORY_ID: address.TERRITORY_ID,
        CUSTOMER_ID: user ? user.ID : 0,
        pageIndex: page,
        pageSize: PAGE_SIZE,
      })
      .then(res => {
        if (res.data.code == 200) {
          const data: TerritoryWiseCategoryInterface[] = res.data.data?.map(
            (item: {
              DESCRIPTION: string;
              ICON: string;
              children: {
                key: number;
                title: string;
                DESCRIPTION: string;
                ICON: string;
                BANNER_IMAGE: string;
              }[];
              disabled: boolean;
              key: number;
              title: string;
            }) => ({
              ID: item.key,
              NAME: item.title,
              DESCRIPTION: item.DESCRIPTION,
              ICON: item.ICON,
              subCategories: item.children.map(i => ({
                ID: i.key,
                NAME: i.title,
                DESCRIPTION: i.DESCRIPTION,
                IMAGE: i.ICON,
                BANNER_IMAGE: i.BANNER_IMAGE,
              })),
            }),
          );
          return data;
        } else {
          return null;
        }
      })
      .catch(err => {
        // console.warn('here', err);
        return null;
      });
    setCategory(list ? list : []);
    setLoading(false);
  }

  const fetchNonServiceCategories = async () => {
    try {
      const response = await apiCall.post('serviceCategory/get', {
        filter: ' AND STATUS=1',
        sortKey: 'SEQ_NO',
        sortValue: 'asc'
      });
      if (response.data.code === 200) {
        setNonServiceCategory(response.data.data);
      } else {
        Toast('No categories found');
      }
    } catch (error) {
    } finally {
      setLoader(false);
    }
  };
  async function getTerritoryWiseTopServices(): Promise<void> {
    const service = await apiCall
      .get(
        `app/getPoppulerServices/${user?.CUSTOMER_TYPE == 'B' ? 'B' : 'I'}/${user?.CUSTOMER_TYPE == 'B' ? user.ID : address?.TERRITORY_ID
        }`,
      )
      .then(res => {
        return res.data.data;
      })
      .catch(err => {
        return [];
      });

    const topService: ServicesInterface[] = service.map(
      (item: topServiceInterface) => {
        const element = cart
          ? cart.find(value => value.SERVICE_ID == item.ID)
          : null;
        return {
          IS_PARENT: item.IS_PARENT,
          QTY: Number(item.QTY),
          TOTAL_PRICE: element ? Number(element.TOTAL_PRICE) : 0,
          PRICE: Number(
            user?.CUSTOMER_TYPE == 'B' ? item.B2B_PRICE : item.B2C_PRICE,
          ),
          QUANTITY: element ? element.QUANTITY : 0,
          SERVICE_IMAGE: item.SERVICE_IMAGE,
          PREPARATION_HOURS: item.PREPARATION_HOURS,
          PREPARATION_MINUTE: item.PREPARATION_MINUTES,
          SERVICE_NAME: item.NAME,
          SERVICE_DESCRIPTION: item.DESCRIPTION,
          SERVICE_START_TIME: item.START_TIME,
          SERVICE_END_TIME: item.END_TIME,
          SERVICE_ID: item.ID,
          CART_ID: element ? element.CART_ID : 0,
          CART_ITEM_ID: element ? element.CART_ITEM_ID : 0,
          EXPRESS_CHARGES: item.EXPRESS_COST,
          CESS: item.CESS,
          CGST: item.CGST,
          IGST: item.IGST,
          SGST: item.SGST,
          IS_EXPRESS: item.IS_EXPRESS,
          MAX_QTY: Number(item.MAX_QTY),
          CATEGORY_ID: item.CATEGORY_ID,
          CATEGORY_NAME: item.CATEGORY_NAME,
          SUB_CATEGORY_ID: item.SUB_CATEGORY_ID,
          SUB_CATEGORY_NAME: item.SUB_CATEGORY_NAME,
          SERVICE_PARENT_ID: item.PARENT_ID,
          SERVICE_PARENT_NAME: item.SERVICE_NAME,
        };
      },
    );
    setTopServices(topService);
  }
  const fetchBannerData = async () => {
    let extrafilter;
    if (user?.CUSTOMER_TYPE == 'B') {
      extrafilter = "AND ( CUSTOMER_TYPE='BB' OR CUSTOMER_TYPE='BO')";
    } else if (user?.CUSTOMER_TYPE == 'I') {
      extrafilter = "AND (CUSTOMER_TYPE='BC' OR CUSTOMER_TYPE='BO')";
    } else {
      extrafilter = "AND CUSTOMER_TYPE='BO'";
    }
    try {
      const response = await apiCall
        .post('banner/get', {
          filter: ` AND STATUS = 1 AND IS_FOR_SHOP = 0 AND BANNER_TYPE = 'M' AND BANNER_FOR = 'M' ${extrafilter}`,
          sortKey: 'SEQ_NO',
          sortValue: 'asc',
        })
        .then(res => res.data);
      if (response.code == 200) {
        setCarouselImage(response.data.map((item: any) => item.IMAGE_URL));
      } else {
        Alert.alert(t('dashboard.failedBanner'));
      }
    } catch (error) {
      console.error('Error in fetchBannerData:', error);
    }
  };

  useEffect(() => {
    checkApplicationPermission();
  }, []);
  // async function checkApplicationPermission() {
  //   const authorizationStatus = await messaging().requestPermission();

  //   if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
  //     console.log('User has notification permissions enabled.');
  //   } else if (authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {
  //     console.log('User has provisional notification permissions.');
  //   } else {
  //     console.log('User has notification permissions disabled');
  //   }
  // }

  async function checkApplicationPermission() {
    const authorizationStatus = await messaging().requestPermission();
    if (
      authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      // 👇 Required for iOS to receive remote notifications
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      const fcmToken = await messaging().getToken();
    } else {
      console.log('User has notification permissions disabled');
    }
  }
  useEffect(() => {
    if (!addressPopUp) {
      // if (!address && user?.CUSTOMER_TYPE == 'I') {
      //   setAddressPopUp(true);
      //   setLoader(false);
      // } else 
      if (!address && user?.CUSTOMER_TYPE == 'B') {
        setAddressPopUp(true);
        setLoader(false);
      } else {
        setLoader(false);
      }
    }
  }, []);
  console.log('first',address)
  useFocusEffect(
    useCallback(() => {
      if (address?.PINCODE_FOR == 'I') {
        setModal({
          ...modal,
          isEnableService: true,
        });
      } else {
        setModal({
          ...modal,
          isEnableService: false,
        });
      }
      address?.TERRITORY_ID
        ? getTerritoryWiseCategory()
        : fetchNonServiceCategories();
      address?.TERRITORY_ID
        ? getTerritoryWiseTopServices()
        : setTopServices([]);
      fetchBannerData();

      // Check notifications unread status whenever dashboard gains focus
      if (user?.ID) {
        checkUnreadNotifications();
      }

    }, [address, navigation]),
  );
  const PaginationDots = ({ index, length }: { index: number; length: number }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 8,
      }}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={{
            width: index === i ? 24 : 8,
            height: 8,
            borderRadius: 4,
            marginHorizontal: 4,
            backgroundColor: index === i ? '#F36631' : '#CBCBCB',
            opacity: index === i ? 1 : 0.5,
          }}
        />
      ))}
    </View>
  );

  const ProgressBarPagination: React.FC<ProgressBarPaginationProps> = ({
    index,
    length,
    barWidth = 60,
    barHeight = 8,
    backgroundColor = '#FFF',
    progressColor = '#F36631',
  }) => {
    const progress = (index + 1) / length;
    return (
      <View
        style={{
          width: barWidth,
          height: barHeight,
          borderRadius: barHeight / 2,
          backgroundColor,
          overflow: 'hidden',
          alignSelf: 'center',
          marginTop: 12,

          // marginBottom: 8,
          borderWidth: 1,
          borderColor: '#CBCBCB',
        }}>
        <View
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: barHeight / 2,
          }}
        />
      </View>
    );
  };
  const fetchBrandData = async () => {
    try {
      const response = await apiCall.post('brand/get', {
        filter: ' AND IS_POPULAR = 1 AND STATUS = 1 ',
        pageIndex: 1,
        pageSize: 4,
        sortKey: 'SEQUENCE_NO',
        sortValue: 'asc',
      });
      if (response.status === 200) {
        setPopularBrands(response.data.data);
      } else {
        Alert.alert(t('shop.popularBrands.error.fetch'));
      }
    } catch (error) {
      console.error('Error in fetchBrandData:', error);
    }
  };
  const fetchTopSelling = async () => {
    try {
      const response = await apiCall.post('app/getPopularInvenotry');
      if (response.status === 200) {
        setTopSelling(response.data.data);
      } else {
        Alert.alert(t('shop.popularBrands.error.fetch'));
      }
    } catch (error) {
      console.error('Error in fetchBrandData:', error);
    }
  };
  // const renderValues: TerritoryWiseCategoryInterface[] = useMemo(() => {
  //   return category
  //     ? category.length > 6
  //       ? category.slice(0, 6)
  //       : category
  //     : [];
  // }, [category]);
  const renderValues: TerritoryWiseCategoryInterface[] = useMemo(() => {
    return category;
  }, [category]);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const onProgressChange = (index: number) => {
    progress.value = index;
    setIndex(index);
  };

  useEffect(() => {
    subscribeToChatChannel();
  }, []);

  const subscribeToChatChannel = async () => {
    const subscribedChannelsStr =
      useStorage.getString('SUBSCRIBED_CHANNELS') || '[]';

    let channelNamesToExclude: string[] = [];

    try {
      const parsedChannels = JSON.parse(subscribedChannelsStr);
      channelNamesToExclude = parsedChannels.map((ch: any) => ch.CHANNEL_NAME);
      console.log('Already subscribed channels:', channelNamesToExclude);
    } catch (err) {
      console.log('Error parsing SUBSCRIBED_CHANNELS:', err);
    }

    try {
      const res = await apiCall.post(`api/channelSubscribedUsers/get`, {
        filter: {
          $and: [
            {
              USER_ID: user?.ID,
            },

            {
              STATUS: true,
            },

            {
              TYPE: 'C',
            },

            {
              CHANNEL_NAME: {
                $nin: channelNamesToExclude,
              },
            },
          ],
        },
      });
      if (res.status === 200) {
        const newChannels = res.data.data;
        console.log('New channels to subscribe:', newChannels);

        for (const channel of newChannels) {
          const topicName = channel.CHANNEL_NAME;
          try {
            await messaging().subscribeToTopic(topicName);
            console.log(`Subscribed to topic: ${topicName}`);
          } catch (subscribeErr) {
            console.log(
              `Failed to subscribe to topic ${topicName}:`,
              subscribeErr,
            );
          }
        }

        const updatedChannels = [
          ...JSON.parse(subscribedChannelsStr),
          ...newChannels,
        ];
        useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(updatedChannels));
      }
    } catch (error) {
      console.log('API call or subscription error:', error);
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      const storedChannels = useStorage.getString('SUBSCRIBED_CHANNELS');
      let channelNames = '';
      if (storedChannels) {
        try {
          const parsedChannels = JSON.parse(storedChannels);
          channelNames = parsedChannels
            .map((item: { CHANNEL_NAME: string }) => `'${item.CHANNEL_NAME}'`)
            .join(', ');
        } catch (e) {
          channelNames = '';
        }
      }

      const baseFilter = `AND ((TYPE='C' AND MEMBER_ID=${user?.ID})${channelNames ? ` OR (TOPIC_NAME IN (${channelNames}))` : ''})`;
      const res = await apiCall.post('api/notification/get', {
        filter: baseFilter,
        pageIndex: 1,
        pageSize: 1,
      });
      if (res.status === 200) {
        const first = (res.data?.data || [])[0];
        const latestDate: string | null = first?.CREATED_MODIFIED_DATE || null;
        setLatestNotificationDate(latestDate);
        const lastSeen = useStorage.getString('LAST_NOTIFICATION_SEEN_AT');
        if (latestDate && lastSeen) {
          setHasUnreadNotifications(new Date(latestDate).getTime() > new Date(lastSeen).getTime());
        } else if (latestDate && !lastSeen) {
          setHasUnreadNotifications(true);
        } else {
          setHasUnreadNotifications(false);
        }
      }
    } catch (err) {
      // fail silently
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loader ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size={'large'} />
        </View>
      ) : (
        <ImageBackground
          source={require('../../assets/images/background.png')}
          resizeMode="cover"
          style={{ paddingHorizontal: 16, gap: 8, flex: 1 }}>
          <View>
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 10,
                gap: 20,
                justifyContent: 'space-between',
                alignItems: 'center',
                // borderBottomWidth: 0.5,
                marginBottom: 10,
                borderColor: '#b0c4de',
              }}>
              {address ? (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingLeft: 8,
                    gap: 4,
                    flex: 1,
                  }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('MainMenu')}>
                    <Image
                      source={
                        user?.PROFILE_PHOTO
                          ? {
                            uri: `${BASE_URL}static/CustomerProfile/${user?.PROFILE_PHOTO}`,
                            cache: 'default',
                          }
                          : _noProfile
                      }
                      style={styles._profileImage}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginRight: 35 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 21.6,
                        color: colors.white,
                        opacity: 0.8,
                      }}
                      onPress={() => {
                        navigation.navigate('MainMenu');
                      }}>
                      {user?.CUSTOMER_TYPE == 'B'
                        ? user?.COMPANY_NAME
                        : user?.NAME}
                    </Text>
                    <TouchableOpacity
                      onPress={
                        user?.ID != 0
                          ? () =>
                            navigation.navigate('AddressBook', {
                              cartId: { id: null, type: null },
                            })
                          : () => setAddressPopUp(true)
                      }
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        alignItems: 'center',
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: 21.6,
                          color: colors.white,
                          opacity: 0.4,
                        }}>
                        {address?.CITY_NAME}
                      </Text>
                      <Icon
                        name="chevron-down"
                        type="Ionicons"
                        color="#CBCBCB"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingLeft: 8,
                    gap: 4,
                    flex: 1,
                  }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('MainMenu')}>
                    <Image
                      source={
                        user?.PROFILE_PHOTO
                          ? {
                            uri: `${BASE_URL}static/CustomerProfile/${user?.PROFILE_PHOTO}`,
                            cache: 'default',
                          }
                          : _noProfile
                      }
                      style={styles._profileImage}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginRight: 35 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 21.6,
                        color: colors.white,
                        opacity: 0.8,
                      }}
                      onPress={() => {
                        navigation.navigate('MainMenu');
                      }}>
                      {user?.CUSTOMER_TYPE == 'B'
                        ? user?.COMPANY_NAME
                        : user?.NAME}
                    </Text>
                    <TouchableOpacity
                      onPress={
                        user?.ID != 0
                          ? () =>
                            navigation.navigate('AddressBook', {
                              cartId: { id: null, type: null },
                            })
                          : () => setAddressPopUp(true)
                      }
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        alignItems: 'center',
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: 21.6,
                          color: colors.white,
                          opacity: 0.4,
                        }}>
                        Add address
                      </Text>
                      {/* <Icon
                      name="chevron-down"
                      type="Ionicons"
                      color="#CBCBCB"
                    /> */}
                    </TouchableOpacity>
                  </View>
                </View>
                // <Text
                //   onPress={() =>
                //     navigation.navigate('AddressBook', {
                //       cartId: {id: null, type: null},
                //     })
                //   }
                //   style={{

                //     padding: 8,
                //     borderWidth: 1,
                //     borderRadius: 8,
                //     borderColor: '#737373',
                //     fontFamily: fontFamily,
                //     fontSize: 14,
                //     fontWeight: 500,
                //     lineHeight: 18.9,
                //     color: '#0B0B0B',
                //   }}>
                //   {t('dashboard.selectDeliveryLocation')}
                // </Text>
              )}



              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Icon
                  name="search-outline"
                  type="Ionicons"
                  size={24}
                  color={colors.white}
                  onPress={() => {
                    navigation.navigate('SearchPage');
                  }}
                />
                {user?.ID != 0 ? (
                  <View>
                    <Icon
                      name="notifications-outline"
                      type="Ionicons"
                      size={24}
                      color={colors.white}
                      onPress={() => {
                        // mark as seen immediately
                        const seenAt = latestNotificationDate || new Date().toISOString();
                        useStorage.set('LAST_NOTIFICATION_SEEN_AT', seenAt);
                        setHasUnreadNotifications(false);
                        navigation.navigate('NotificationList');
                      }}
                    />
                    {hasUnreadNotifications ? (
                      <View
                        style={{
                          position: 'absolute',
                          right: -1,
                          top: -1,
                          width: 8,
                          height: 8,
                          backgroundColor: '#E74C3C',
                          borderRadius: 4,
                        }}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#fff',
                height: 0.5,
                marginHorizontal: -16,
                marginTop: -8,
              }}></View>
          </View>
          <ScrollView
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  address?.TERRITORY_ID
                    ? getTerritoryWiseCategory()
                    : fetchNonServiceCategories();
                  address?.TERRITORY_ID
                    ? getTerritoryWiseTopServices()
                    : fetchNonServiceCategories();
                  user?.ID != 0 &&

                    fetchBannerData();
                }}
              />
            }
            showsVerticalScrollIndicator={false}>
            <View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: fontFamily,
                  fontWeight: '400',
                  fontSize: 22,
                  color: colors.white,
                  marginBottom: 8,
                }}>
                Hey there!{'\n'}Let's fix your tech issues.
              </Text>
            </View>

            {topServices.length > 0 ? (
              <View>
                {/* Title */}
                <View style={{ paddingBottom: 10, marginTop: 12 }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 18,
                      fontWeight: '500',
                      lineHeight: 21.48,
                      color: colors.white,
                    }}>
                    {t('dashboard.popularServices')}
                  </Text>
                </View>

                {/* List of Popular Services */}
                <FlatList
                  data={topServices}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={false}
                  contentContainerStyle={{
                    paddingVertical: 2,
                    gap: 8,
                  }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        console.log(IMAGE_URL + 'Item/' + item.SERVICE_IMAGE);

                        navigation.navigate('ServiceDetails', {
                          service: item,
                          path: [],
                        });
                      }}
                      style={{
                        gap: 8,
                        width: 130,
                        height: 130,
                        borderWidth: 1,
                        // padding: 15,
                        backgroundColor: colors.white,

                        paddingBottom: 12,
                        paddingHorizontal: 4,
                        paddingTop: 4,
                        borderColor: '#CBCBCB',
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <ImageWithFallback
                        style={{
                          //  backgroundColor:'red',
                          width: '100%',
                          height: '75%',
                          // marginTop: -10,
                        }}
                        source={{
                          uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE,
                          cache: 'default',
                        }}
                        fallbackSource={_defaultImage}
                        resizeMode="contain"
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fontFamily,
                          flex: 1,
                          fontSize: 11,
                          alignItems: 'flex-start',
                          textAlign: 'center',
                          fontWeight: '500',
                          lineHeight: 20.25,
                          color: '#000000',

                          // margin: -7,
                          // marginTop: -36,
                          paddingHorizontal: 6,
                        }}>
                        {item.SERVICE_NAME}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}></View>
            )}

            {/* {user?.ID != 0 && (
              <View
                style={{
                  // flex: 1,
                  paddingHorizontal: 0,
                  borderRadius: 16,
                  // marginTop: 8,
                  // marginBottom: 15,scr
                }}>
                <Carousel
                style={{
        alignSelf: 'center', // Center the carousel
      }}
      //  panGestureHandlerProps={{
      //   activeOffsetX: [-10, 10], // Optional: tweak for better swipe
      // }}
       mode="parallax"
                  loop={carouselImage.length > 1}
  autoPlay={carouselImage.length > 1}
                  width={Size.width-14}
                  height={180}
                
                  autoPlayInterval={3000}
                  data={carouselImage}
                          onProgressChange={(_, absoluteProgress) => {
      setCarouselIndex(Math.round(absoluteProgress));
    }}

                  scrollAnimationDuration={2000}
                  renderItem={({index, item}) => {
                    return (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                        }}>
                        <ImageWithFallback
                          source={{
                            uri:
                              IMAGE_URL +
                              'BannerImages/' +
                              item +
                              `?timestamp=${new Date().getTime()}`,
                            cache: 'default',
                          }}
                          fallbackSource={_defaultImage}
                          style={{
                            width: Size.width - 14,
                            height: 180,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: '#CBCBCB',
                          }}
                          resizeMode="cover"
                        />
                     
                      </View>
                    );
                  }}

                />

  

  <ProgressBarPagination index={carouselIndex} length={carouselImage.length} />
              </View>
              
            )} */}

            {carouselImage.length > 0 && (
              <View
                style={{
                  marginTop: 12,
                  marginBottom: 8,
                }}>
                {carouselImage.length === 1 ? (
                  // 🔹 Render full-width single banner with proper borderRadius
                  <View
                    style={{
                      width: Size.width - 30,
                      height: Platform.OS == 'ios' ? 190 : 170,
                      borderRadius: 16,
                      overflow: 'hidden', // Ensures image is clipped to rounded corners
                      alignSelf: 'center',
                      borderWidth: 1,
                      borderColor: '#CBCBCB',
                    }}>
                    <ImageWithFallback
                      source={{
                        uri: IMAGE_URL + 'BannerImages/' + carouselImage[0],
                        cache: 'default',
                      }}
                      fallbackSource={_defaultImage}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  // 🔹 Render carousel with visible next/previous banners
                  <Carousel
                    style={{
                      alignSelf: 'center',
                    }}
                    mode="parallax"
                    autoPlay={true}
                    loop={true}
                    width={Size.width - 40}
                    height={Platform.OS == 'ios' ? 180 : 170}
                    autoPlayInterval={10000}
                    data={carouselImage}
                    onProgressChange={(_, absoluteProgress) => {
                      setCarouselIndex(Math.round(absoluteProgress));
                    }}
                    scrollAnimationDuration={2000}
                    modeConfig={{
                      parallaxScrollingScale: 0.85, // More shrink for side images
                      parallaxScrollingOffset: 70, // Increase offset for more peeking
                    }}
                    renderItem={({ index, item }) => (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                          borderRadius: 16,
                          overflow: 'hidden',
                          marginHorizontal: 8,
                        }}>
                        <ImageWithFallback
                          source={{
                            uri: IMAGE_URL + 'BannerImages/' + item,
                            cache: 'default',
                          }}
                          fallbackSource={_defaultImage}
                          style={{
                            width: Size.width - 55,
                            height: Platform.OS == 'ios' ? 180 : 160,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: '#CBCBCB',
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  />
                )}

                {/* 🔹 Pagination */}
                {carouselImage.length >= 1 && (
                  <ProgressBarPagination
                    index={carouselIndex}
                    length={carouselImage.length}
                  />
                )}
              </View>
            )}

            {/* category */}
            <View style={{ marginTop: 16, marginBottom: 10 }}>
              {/* <PaginationDots index={index} length={carouselImage.length} /> */}

              {renderValues.length > 0 && address?.TERRITORY_ID ? (
                <View
                  style={{
                    paddingBottom: 10,
                    flexDirection: 'row',
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 18,
                      flex: 1,
                      fontWeight: '500',
                      color: '#0E0E0E',
                      opacity: 0.8,
                    }}>
                    {t('dashboard.serviceCategories')}
                  </Text>
                  {/* <Text
                    onPress={() =>
                      navigation.push('Category', {item: category})
                    }
                    style={{
                       fontFamily: fontFamily,
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#0E0E0E',
                      opacity: 0.8,
                    }}>
                    {t('dashboard.expandAll')}
                  </Text> */}
                </View>
              ) : null}

              {renderValues.length > 0 && address?.TERRITORY_ID ? (
                <FlatList
                  data={renderValues}
                  keyExtractor={(item, index) => `category_${item.ID}_${index}`}
                  numColumns={3}
                  columnWrapperStyle={{
                    justifyContent: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                  }}
                  contentContainerStyle={{}}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SubCategory', { item })}
                      style={{ width: (Size.width - 60) / 3 }}>
                      <View
                        style={{
                          padding: 2,
                          height: (Size.width - 60) / 3,
                          backgroundColor: 'white',
                          borderWidth: 1,
                          borderColor: '#CBCBCB',
                          borderRadius: 20,
                          shadowColor: '#000',
                          shadowOpacity: 0.1,
                          shadowOffset: { width: 0, height: 2 },
                          shadowRadius: 6,
                          elevation: 2,
                        }}>
                        <Image
                          style={{ width: '100%', height: '70%' }}
                          resizeMode="contain"
                          defaultSource={_defaultImage}
                          source={
                            item.ICON
                              ? {
                                uri: IMAGE_URL + 'Category/' + item.ICON,
                                cache: 'default',
                              }
                              : _defaultImage
                          }
                        />
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontSize: 14,
                            textAlign: 'center',
                            fontWeight: '500',
                            color: '#0E0E0E',
                            // marginTop: -20,
                            marginBottom: 6,
                            marginHorizontal: 8,
                          }}
                          numberOfLines={1}>
                          {item.NAME}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  onEndReached={() => {
                    console.log('Reached end!');
                    handleLoadMore(); // Call your function here
                  }}
                  onEndReachedThreshold={0.1}
                />
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    marginTop: address?.TERRITORY_ID ? 20 : 0,
                  }}>
                  {address?.TERRITORY_ID ? (
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        fontSize: 16,
                        fontWeight: '500',
                        color: '#888888',
                      }}>
                      Service Categories not found..!
                    </Text>
                  ) : (
                    <View>
                      <View
                        style={{
                          paddingBottom: 10,
                          flexDirection: 'row',
                        }}>
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontSize: 18,
                            flex: 1,
                            fontWeight: '500',
                            color: '#0E0E0E',
                            opacity: 0.8,
                          }}>
                          {t('dashboard.serviceCategories')}
                        </Text>
                      </View>

                      <FlatList
                        data={NonServiceCategory}
                        keyExtractor={(item, index) =>
                          `category_${item.ID}_${index}`
                        }
                        numColumns={3}
                        columnWrapperStyle={{
                          justifyContent: 'flex-start',
                          gap: 12,
                          marginBottom: 12,
                        }}
                        contentContainerStyle={{}}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => {
                              // if(address){
                              navigation.navigate('SubCategories', { item })
                              // }
                              //  else {
                              //   Toast("Please add an address to continue");
                              //   setAddressPopUp(true)
                              // }
                            }}
                            style={{ width: (Size.width - 60) / 3 }}>
                            <View
                              style={{
                                height: (Size.width - 60) / 3,
                                backgroundColor: 'white',
                                padding: 4,
                                borderWidth: 1,
                                borderColor: '#CBCBCB',
                                borderRadius: 20,

                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowOffset: { width: 0, height: 2 },
                                shadowRadius: 6,
                                elevation: 2,
                              }}>
                              <Image
                                style={{
                                  width: '100%',
                                  height: '70%',
                                }}
                                resizeMode="contain"
                                defaultSource={_defaultImage}
                                source={
                                  item.ICON
                                    ? {
                                      uri:
                                        IMAGE_URL + 'Category/' + item.ICON,
                                      cache: 'default',
                                    }
                                    : _defaultImage
                                }
                              />
                              <Text
                                style={{
                                  fontFamily: fontFamily,
                                  fontSize: 14,
                                  textAlign: 'center',
                                  fontWeight: '500',
                                  color: '#0E0E0E',

                                  marginBottom: 6,
                                  paddingHorizontal: 8,
                                }}
                                numberOfLines={1}>
                                {item.NAME}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        onEndReached={() => {
                          console.log('Reached end!');
                          handleLoadMore(); // Call your function here
                        }}
                        onEndReachedThreshold={0.1}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </ImageBackground>
      )}
      {addressPopUp ? (
        <AddressPopUp
          isEdit={address ? true : false}
          addressData={address ? (address as AddressInterface) : undefined}
          onClose={() => {
            user?.CUSTOMER_TYPE == 'B' && BackHandler.exitApp()
            setAddressPopUp(false)
          }}
          onSuccess={() => dispatch(Reducers.setSplash(true))}
          show={addressPopUp}
          type={null}
        />
      ) : null}
      <Modal
        transparent={true}
        visible={b2bAddressPopUp}
        onRequestClose={() => BackHandler.exitApp()}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('home.dashboard.noAddress')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('home.dashboard.noAddressSubtitle')}
            </Text>
          </View>
        </View>
      </Modal>
      {modal.isEnableService && (
        <View style={styles.overlayContainer}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('home.dashboard.enableService')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('home.dashboard.enableServiceSubtitle')}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
export default Dashboard;

const styles = StyleSheet.create({
  headerContainer: {},
  categoryTitle: {
    fontSize: Size.xl,
    textAlign: 'center',
  },
  categoryDesc: {
    fontSize: Size.lg,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#F4BB41',
  },
  _profileImage: {
    width: 42,
    height: 42,
    borderRadius: 95,
    borderWidth: 2.5,
    borderColor: '#FBA042',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    margin: 15,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#0E0E0E',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636363',
    textAlign: 'left',
    marginVertical: 4,
    marginBottom: 10,
    fontFamily: fontFamily,
  },
  overlayContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
