import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {_defaultImage, _noProfile} from '../../assets';
import {
  IMAGE_URL,
  apiCall,
  useTheme,
  Size,
  BASE_URL,
  fontFamily,
  useStorage,
} from '../../modules';
import ProductCard from './ProductCard';
import FilterModal from './FilterModal';
import {Icon, EmptyList, Loader} from '../../components';
import {ShopRoutes} from '../../routes/Shops';
import Carousel from 'react-native-reanimated-carousel';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Reducers, useDispatch, useSelector} from '../../context';
import AddressPopUp from '../home/AddressPopUp';

interface ShopProps extends ShopRoutes<'ShopHome'> {}

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

const ShopHome: React.FC<ShopProps> = ({navigation}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [showLoadMore, setShowLoadMore] = useState(false);
  const dispatch = useDispatch();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState<boolean>(false);
  const [latestNotificationDate, setLatestNotificationDate] = useState<string | null>(null);

  const [filter, setFilter] = useState({
    isVisible: false,
    value: {filter: ' ', sortKey: '', sortValue: ''},
    label: '',
  });

  const [loader, setLoader] = useState<boolean>(false);
  const [carouselImage, setCarouselImage] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<any[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [addressPopUp, setAddressPopUp] = useState<boolean>(false);
  const {user, address} = useSelector(state => state.app);
  const [modal, setModal] = useState({
    isEnableService: false,
  });

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
      const response = await apiCall.post('banner/get', {
        filter: ` AND STATUS = 1 AND IS_FOR_SHOP = 1 AND BANNER_TYPE = 'M' AND BANNER_FOR = 'M' ${extrafilter}`,
        sortKey: 'SEQ_NO',
        sortValue: 'asc',
      });
      if (response.status === 200) {
        setCarouselImage(response.data.data.map((item: any) => item.IMAGE_URL));
      } else {
        Alert.alert(t('dashboard.failedBanner'));
      }
    } catch (error) {
      console.error('Error in fetchBannerData:', error);
    }
  };

  const fetchBrandData = async () => {
    try {
      const response = await apiCall.post('brand/get', {
        filter: ' AND IS_POPULAR = 1 AND STATUS = 1',
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

  const fetchLatestProducts = async () => {
    setLoader(true);
    try {
      const response = await apiCall.post('inventory/getForCart', {
        ...filter.value,
        filter:
          ' AND STATUS = 1 AND IS_HAVE_VARIANTS = 0 AND INVENTORY_TYPE IN ("B", "P") ',
        // pageIndex: 1,
        // pageSize: 10,
          sortKey:'ID',
        sortValue:'asc'
      });
      if (response.data.code === 200) {
        console.log('Latest Products Response:', response.data.data);

        const latest=response.data.data.filter((item:any)=>item.IS_REFURBISHED==0).slice(0, 10);
       setLatestProducts(latest);

        const refurbished=response.data.data.filter((item:any)=>item.IS_REFURBISHED==1).slice(0, 10);
        setRefurbished(refurbished)
        
      } else {
        Alert.alert(t('shop.productList.alerts.error'));
      }
    } catch (error) {
      console.error('Error in fetchLatestProducts:', error);
    } finally {
      setLoader(false);
    }
  };

  const fetchTopSelling = async () => {
    try {
      const response = await apiCall.post('app/getPopularInvenotry',{
        sortKey:'ID',
        sortValue:'asc'
      });
      if (response.status === 200) {
        setTopSelling(response.data.data);
      
      } else {
        Alert.alert(t('shop.popularBrands.error.fetch'));
      }
    } catch (error) {
      console.error('Error in fetchBrandData:', error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (address?.PINCODE_FOR == 'S') {
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
      Promise.all([
        fetchBannerData(),
        fetchBrandData(),
        fetchLatestProducts(),
        fetchTopSelling(),
      ]);

      // Check unread notifications on focus
      if (user?.ID) {
        checkUnreadNotifications();
      }
    }, []),
  );
  const [topSelling, setTopSelling] = useState<any[]>([]);
  const [refurbished, setRefurbished] = useState<any[]>([]);

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
    } catch (e) {
      // ignore
    }
  };


  const openFilter = () => setFilter(prev => ({...prev, isVisible: true}));
  const closeFilter = () => setFilter(prev => ({...prev, isVisible: false}));
  const clearFilter = () =>
    setFilter({
      isVisible: false,
      value: {
        filter: ' AND STATUS = 1 AND IS_HAVE_VARIANTS = 0',
        sortKey: '',
        sortValue: '',
      },
      label: '',
    });

  const handleScroll = (event: any) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    setShowLoadMore(isCloseToBottom);
  };
  const [carouselIndex, setCarouselIndex] = useState(0);
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingBottom: 10,
          gap: 20,
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          marginBottom: 10,
          borderColor: '#CBCBCB',
          marginTop: 8,
        }}>
        {address ? (
          <View style={{flexDirection: 'row', paddingLeft: 8, gap: 4, flex: 1}}>
            <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}>
              <Image
                source={
                  user?.PROFILE_PHOTO
                    ? {
                        uri:
                          `${BASE_URL}static/CustomerProfile/${user?.PROFILE_PHOTO}`,
                        cache: 'default',
                      }
                    : _noProfile
                }
                style={styles._profileImage}
              />
            </TouchableOpacity>
            <View style={{flex: 1, marginRight: 35}}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fontFamily,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 21.6,
                  color: '#0E0E0E',
                  opacity: 0.8,
                }}
                onPress={() => navigation.navigate('MainMenu')}>
                {user?.NAME}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  user?.ID != 0
                    ? navigation.navigate('AddressBook', {
                        cartId: {id: null, type: null},
                      })
                    : setAddressPopUp(true)
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
                    color: '#0E0E0E',
                    opacity: 0.4,
                  }}>
                  {address?.CITY_NAME}
                </Text>
                <Icon name="chevron-down" type="Ionicons" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{flexDirection: 'row', paddingLeft: 8, gap: 4, flex: 1}}>
          <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}>
            <Image
              source={
                user?.PROFILE_PHOTO
                  ? {
                      uri:
                        `${BASE_URL}static/CustomerProfile/${user?.PROFILE_PHOTO}`,
                      cache: 'default',
                    }
                  : _noProfile
              }
              style={styles._profileImage}
            />
          </TouchableOpacity>
          <View style={{flex: 1, marginRight: 35}}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fontFamily,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 21.6,
                color: '#0E0E0E',
                opacity: 0.8,
              }}
              onPress={() => navigation.navigate('MainMenu')}>
              {user?.NAME}
            </Text>
            <TouchableOpacity
              onPress={() =>
                user?.ID != 0
                  ? navigation.navigate('AddressBook', {
                      cartId: {id: null, type: null},
                    })
                  : setAddressPopUp(true)
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
                  color: '#0E0E0E',
                  opacity: 0.4,
                }}>
                Add Address
              </Text>
              {/* <Icon name="chevron-down" type="Ionicons" /> */}
            </TouchableOpacity>
          </View>
        </View>
          // <Text
          //   onPress={() =>
          //     // navigation.navigate('Home', {
          //     //   screen: 'AddressBook',
          //     //   params: {cartId: {id: null, type: null}},
          //     // })
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
        <View style={{flexDirection: 'row', gap: 10}}>
          <Icon
            name="search-outline"
            type="Ionicons"
            size={24}
            color="#0E0E0E"
            onPress={() => {
              navigation.navigate('Home', {screen: 'SearchPage'});
            }}
          />
          {user?.ID ? (
            <View>
              <Icon
                name="notifications-outline"
                type="Ionicons"
                size={24}
                color="#0E0E0E"
                onPress={() => {
                  const seenAt = latestNotificationDate || new Date().toISOString();
                  useStorage.set('LAST_NOTIFICATION_SEEN_AT', seenAt);
                  setHasUnreadNotifications(false);
                  navigation.navigate('Home', {screen: 'NotificationList'});
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        // contentContainerStyle={{gap: 10}}
        // stickyHeaderIndices={[2]}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchLatestProducts;
              fetchBannerData();
            }}
          />
        }>
        {/* {user?.ID != 0 && ( */}
        <View
          style={{
            // flex: 1,
            paddingHorizontal: 16,
            borderRadius: 16,
            // marginTop: 15,
            // marginBottom: 15,
          }}>
          {carouselImage.length === 1 ? (
            // 🔹 Render full-width single banner with proper borderRadius
            <View
              style={{
                width: Size.width - 30,
                height:  Platform.OS=='ios'?190:140,
                borderRadius: 16,
                overflow: 'hidden', // Ensures image is clipped to rounded corners
                alignSelf: 'center',
                borderWidth: 1,
                borderColor: '#CBCBCB',
              }}>
              <ImageWithFallback
                source={{
                  uri:
                    IMAGE_URL +
                    'BannerImages/' +
                    carouselImage[0] +
                    `?timestamp=${new Date().getTime()}`,
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
            <Carousel
              style={{
                alignSelf: 'center',
              }}
              mode="parallax"
              loop
              width={Size.width - 26}
              height={ Platform.OS=='ios'?190:170}
              autoPlay={true}
              autoPlayInterval={10000}
              data={carouselImage}
              scrollAnimationDuration={2000}
              onProgressChange={(_, absoluteProgress) => {
                setCarouselIndex(Math.round(absoluteProgress));
              }}
              modeConfig={{
                parallaxScrollingScale: 0.85, // More shrink for side images
                parallaxScrollingOffset: 70, // Increase offset for more peeking
              }}
              renderItem={({index, item}) => {
                return (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                    }}>
                    <ImageWithFallback
                      source={{uri: IMAGE_URL + 'BannerImages/' + item}}
                      fallbackSource={_defaultImage}
                      style={{
                        width: Size.width - 32,
                        height: '100%',
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
          )}
        </View>
        {/* )} */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 12,
            marginBottom: 8,
          }}>
          {carouselImage.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: carouselIndex === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: carouselIndex === idx ? '#F36631' : '#CBCBCB',
                opacity: carouselIndex === idx ? 1 : 0.5,
                transition: 'width 0.2s', // for web, ignored on native
              }}
            />
          ))}
        </View>

        {address?.PINCODE_FOR !== 'S' && (
          <View style={{marginHorizontal: 16}}>
            {/* top selling */}
            {topSelling?.length > 0 && (
              <View style={{marginBottom: 18}}>
                {/* Title */}
                <View style={{paddingBottom: 0}}>
                  <Text
                    style={{
                      marginBottom: 8,
                      fontFamily: fontFamily,
                      fontSize: 18,
                      flex: 1,
                      fontWeight: '500',
                      color: '#0E0E0E',
                      opacity: 0.8,
                    }}>
                    {t('dashboard.topSelling')}
                  </Text>
                </View>
                <FlatList
                  data={topSelling}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={false}
                  contentContainerStyle={{
                    paddingVertical: 2,
                    gap: 8,
                  }}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ProductDetails', {item});
                      }}
                      style={{
                        gap: 8,
                        width: 134,
                        height: 134,
                        borderWidth: 1,
                        padding: 15,
                        backgroundColor: colors.white,
                        borderColor: '#CBCBCB',
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                     {item.IS_REFURBISHED==1 && <Text
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 4,
                          backgroundColor: colors.secondary,
                          paddingHorizontal: 5,
                          paddingVertical:2,
                          borderRadius: 16,
                          fontFamily,
                          fontSize: 8,
                          color:'#FFFFFFFF'
                        }}>
                        Refurbished
                      </Text>}
                      <ImageWithFallback
                        style={{
                          width: 90,
                          height: 70,
                        }}
                        source={{
                          uri:
                            IMAGE_URL +
                            'InventoryImages/' +
                            item.INVENTORY_IMAGE +
                            `?timestamp=${new Date().getTime()}`,
                          cache: 'default',
                        }}
                        fallbackSource={_defaultImage}
                        resizeMode="contain"
                      />
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: fontFamily,
                          flex: 1,
                          fontSize: 13,
                          textAlign: 'center',
                          fontWeight: '500',
                          lineHeight: 20.25,
                          color: '#000000',
                          margin: -7,
                        }}>
                        {item.ITEM_NAME}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* popular brand */}
            <View style={{marginBottom: 10}}>
              {popularBrands.length > 0 ? (
                <View
                  style={{
                    paddingBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
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
                    {t('dashboard.popularBrands')}
                  </Text>
                  <Text
                    onPress={() => navigation.navigate('PopularBrands')}
                    style={{
                    fontFamily: fontFamily,
                      fontSize: 14,
                      fontWeight: '500',
                      // color: '#0E0E0E',
                      color: colors.primary2,
                      opacity: 0.8,
                    }}>
                    {t('dashboard.expandAll')}
                  </Text>
                </View>
              ) : null}

              {popularBrands?.length > 0 ? (
                <View
                  style={{
                    flex: 1,
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    gap: 12,
                  }}>
                  {popularBrands.map((item, index) => (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('ProductList', {BRAND: item})
                      }
                      key={`category_${item.ID}_${index}`}
                      style={{
                        width: (Size.width - 44) / 2,
                      }}>
                          
                      <View
                        style={{
                          padding: 10,
                          backgroundColor: 'white',
                          borderWidth: 1,
                          borderColor: '#CBCBCB',
                          borderRadius: 16,
                          shadowColor: '#000',
                          shadowOpacity: 0.1,
                          shadowOffset: {width: 0, height: 2},
                          shadowRadius: 6,
                          elevation: 2,
                        }}>
                        <Image
                          style={{
                            width: '100%',
                            height: 130,
                          }}
                          resizeMode="contain"
                          defaultSource={_defaultImage}
                          source={
                            item.BRAND_IMAGE
                              ? {
                                  uri:
                                    IMAGE_URL +
                                    'BrandImages/' +
                                    item.BRAND_IMAGE,
                                  cache: 'default',
                                }
                              : _defaultImage
                          }
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{alignItems: 'center', marginTop: 20}}>
                  <Text
                    style={{
                    fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#888888',
                    }}>
                    Popular Brands not found..!
                  </Text>
                </View>
              )}
            </View>

            {/* refurbished */}
            {refurbished?.length > 0 && (
              <View style={{marginTop: 18}}>
                {/* Title */}
                 <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.refurbished')}</Text>
            {refurbished?.length > 0 &&<Text
              onPress={() => {
                navigation.navigate('LatestAllProduct',{type:'R'});
              }}
              style={{
                 fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: '500',
                color: colors.primary2,
                opacity: 0.8,
              }}>
              {t('shop.home.latestAll')}
            </Text>}
          </View>

                <FlatList
                  data={refurbished}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={false}
                  contentContainerStyle={{
                    paddingVertical: 2,
                    gap: 8,
                  }}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ProductDetails', {item});
                      }}
                      style={{
                        gap: 8,
                        width: 134,
                        height: 134,
                        borderWidth: 1,
                        padding: 15,
                        backgroundColor: colors.white,
                        borderColor: '#CBCBCB',
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                    
                      <ImageWithFallback
                        style={{
                          width: 90,
                          height: 70,
                        }}
                        source={{
                          uri:
                            IMAGE_URL +
                            'InventoryImages/' +
                            item.INVENTORY_IMAGE +
                            `?timestamp=${new Date().getTime()}`,
                          cache: 'default',
                        }}
                        fallbackSource={_defaultImage}
                        resizeMode="contain"
                      />
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: fontFamily,
                          flex: 1,
                          fontSize: 13,
                          textAlign: 'center',
                          fontWeight: '500',
                          lineHeight: 20.25,
                          color: '#000000',
                          margin: -7,
                        }}>
                        {item.ITEM_NAME}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        )}

        <View style={{backgroundColor: colors.white, marginHorizontal: 16}}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('shop.home.latest')}</Text>
            {latestProducts?.length > 0 &&<Text
              onPress={() => {
                navigation.navigate('LatestAllProduct',{type:'L'});
              }}
              style={{
                 fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: '500',
                color: colors.primary2,
                opacity: 0.8,
              }}>
              {t('shop.home.latestAll')}
            </Text>}
          </View>

          {filter.label && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>{filter.label}</Text>
              <Icon
                onPress={clearFilter}
                name="close"
                type="AntDesign"
                size={24}
                color={colors.text}
              />
            </View>
          )}

          <FilterModal
            visible={filter.isVisible}
            onClose={closeFilter}
            onSelect={newFilter =>
              setFilter({
                isVisible: false,
                value: {...filter.value, ...newFilter.value},
                label: newFilter.label,
              })
            }
          />
        </View>
        <View
          style={{
            gap: 16,
            paddingBottom: 16,
            marginHorizontal: 16,
          }}>
          {latestProducts?.length > 0 ? (
            latestProducts?.map((item, index) => (
              <ProductCard
              navigation={navigation}
                key={`${item.ID}-${index}`}
                product={item}
                onPress={() => navigation.navigate('ProductDetails', {item})}
                goToCart={() => navigation.navigate('CartList')}
                goToOrder={(cartID: number) =>
                  navigation.navigate('PlaceOrder', {cartId: cartID})
                }
                refresh={() => fetchLatestProducts()}
              />
            ))
          ) : (
            <EmptyList
              title={t('shop.productList.empty')}
              message={t('shop.productList.empty')}
            />
          )}
        </View>
      </ScrollView>
      {addressPopUp ? (
        <AddressPopUp
          isEdit={address ? true : false}
          addressData={address ? (address as AddressInterface) : undefined}
          onClose={() => setAddressPopUp(false)}
          onSuccess={() => dispatch(Reducers.setSplash(true))}
          show={addressPopUp}
          type={null}
        />
      ) : null}

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
      <Loader show={loader} />
    </SafeAreaView>
  );
};

export default ShopHome;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 8,
    fontFamily: fontFamily,
    fontSize: 18,
    flex: 1,
    fontWeight: '500',
    color: '#0E0E0E',
  },
  exploreAll: {
    fontSize: Size.lg,
    fontWeight: '500',
    fontFamily: fontFamily,
    color: '#3170DE',
  },
  categoryCard: {
    height: 149,
    width: 342,
    borderWidth: 1,
    borderRadius: 24,
    borderColor: '#E7E6E6',
    // borderRadius: 24,
    // backgroundColor: '#ddd',
    // overflow: 'hidden',
  },
  categoryImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 24,
  },
  brandCard: {
    gap: 2,
    // height: 110,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F9',
    borderWidth: 0.5,
    padding: 12,
    borderRadius: 13,
    borderColor: '#CBCBCB',
  },
  brandLogoContainer: {
    flex: 1,
    width: 75,
    // width: '100%',
    // height: 130,
    aspectRatio: 0.8,
    // backgroundColor: '#ddd',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  brandName: {
    fontSize: Size.sm,
    fontWeight: '500',
    fontFamily: fontFamily,
    paddingTop: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: 18,
    fontFamily: fontFamily
  },
  _profileImage: {
    width: 42,
    height: 42,
    borderRadius: 95,
    borderWidth: 2.5,
    borderColor: '#FBA042',
  },
  modalContainer: {
    margin: 15,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
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
   fontFamily: fontFamily
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636363',
    textAlign: 'left',
    marginVertical: 4,
    marginBottom: 10,
   fontFamily: fontFamily
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
