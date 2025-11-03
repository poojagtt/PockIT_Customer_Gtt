import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, Header} from '../../components';
import {
  apiCall,
  fontFamily,
  IMAGE_URL,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {Reducers, useDispatch, useSelector} from '../../context';
import moment from 'moment';
import {_defaultImage, _noData} from '../../assets';
import {OrderRoutes} from '../../routes/Order';
import {useTranslation} from 'react-i18next';
import messaging from '@react-native-firebase/messaging';
import {useFocusEffect} from '@react-navigation/native';

type TabType = 'service' | 'product';

interface OrderListProps extends OrderRoutes<'OrderList'> {}

interface OrderState {
  loading: boolean;
  data: orderList[];
  error: string | null;
  pageIndex: number;
  hasMore: boolean;
  loadingMore: boolean;
}

const ITEMS_PER_PAGE = 10;

const OrderList: React.FC<OrderListProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {user} = useSelector(state => state.app);
  const {t} = useTranslation();

  // States
  const [activeTab, setActiveTab] = useState<TabType>(
    route.params?.currentTab || 'service',
  );
  const [orderState, setOrderState] = useState<OrderState>({
    loading: true,
    data: [],
    error: null,
    pageIndex: 1,
    hasMore: true,
    loadingMore: false,
  });
  const dispatch = useDispatch();

  // API Calls
  const fetchOrders = async (isLoadMore = false) => {
    if (!user?.ID) {
      Alert.alert(
        t('serviceList.guestTitle'),
        t('home.dashboard.guestMessage'),
        [
          {
            text: t('serviceList.cancel'),
            onPress: () => {
              navigation.goBack();
            },
          },
          {
            text: t('serviceList.login'),
            onPress: () => {
              useStorage.delete('user');
              tokenStorage.clearToken();
              dispatch(Reducers.setSplash(true));
            },
            isPreferred: true,
          },
        ],
        {
          cancelable: false,
        },
      );
    } else {
      try {
        if (isLoadMore) {
          setOrderState(prev => ({...prev, loadingMore: true}));
        } else {
          setOrderState(prev => ({...prev, loading: true, error: null}));
        }

        const endpoint =
          activeTab === 'service' ? 'api/order/get' : 'api/shopOrder/get';
        const filter =
          activeTab === 'service'
            ? ` AND CUSTOMER_ID = ${user?.ID}`
            : ` AND CUSTOMER_ID = ${user?.ID}`;

        const response = await apiCall.post(endpoint, {
          filter,
          pageIndex: isLoadMore ? orderState.pageIndex : 1,
          pageSize: ITEMS_PER_PAGE,
        });
        if (activeTab === 'service') {
          if (response.data.code === 200) {
            const newData = response.data.data;
            setOrderState(prev => ({
              ...prev,
              data: isLoadMore ? [...prev.data, ...newData] : newData,
              pageIndex: isLoadMore ? prev.pageIndex + 1 : 2,
              hasMore: newData.length === ITEMS_PER_PAGE,
              loading: false,
              loadingMore: false,
              error: null,
            }));
          } else {
            throw new Error(response.data.message);
          }
        } else {
          const newData = response.data.data;
          setOrderState(prev => ({
            ...prev,
            data: isLoadMore ? [...prev.data, ...newData] : newData,
            pageIndex: isLoadMore ? prev.pageIndex + 1 : 2,
            hasMore: newData.length === ITEMS_PER_PAGE,
            loading: false,
            loadingMore: false,
            error: null,
          }));
        }
      } catch (error) {
        setOrderState(prev => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: t(
            isLoadMore
              ? 'orderList.errors.loadMoreFailed'
              : 'orderList.errors.fetchFailed',
          ),
        }));
      }
    }
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchOrders();

      const unsubscribe = messaging().onMessage(async () => {
        fetchOrders();
      });

      return unsubscribe;
    }, [activeTab]),
  );

  // Handlers
  const handleLoadMore = () => {
    if (!orderState.loadingMore && orderState.hasMore && !orderState.loading) {
      fetchOrders(true);
    }
  };

  const handleRefresh = () => {
    setOrderState(prev => ({...prev, pageIndex: 1, hasMore: true}));
    fetchOrders();
  };

  const renderStatus = (item: orderList) => {
    if (
      activeTab == 'service' &&
      (item.ORDER_STATUS == 'OP' || item.ORDER_STATUS == 'OA') &&
      item.REFUND_STATUS == 'P'
    ) {
      return 'Cancel Requested';
    }
    if (activeTab == 'product' && item.IS_CANCELATION_REQUESTED == 1) {
      return 'Cancel Requested';
    }
    return item.ORDER_STATUS_NAME;
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setOrderState(prev => ({
      ...prev,
      loading: true,
      data: [],
      error: null,
      pageIndex: 1,
      hasMore: true,
    }));
  };

  // Render Functions
  const renderOrderItem = ({item}: {item: orderList}) => (
    <TouchableOpacity
      onLongPress={() => {}}
      onPress={() => {
        if (activeTab === 'service') {
          item.ORDER_STATUS === 'OP' ||
          item.ORDER_STATUS === 'OA' ||
          item.ORDER_STATUS === 'OR' ||
          item.ORDER_STATUS === 'CA'
            ? navigation.navigate('OrderPreview', {item})
            : navigation.navigate('MultiJobs', {item});
          item.SERVICE_ADDRESS;
          item.CUSTOMER_NAME;
          item.MOBILE_NO;
        } else {
          // console.log('!!!!item', item);
          navigation.navigate('OrderOverview', {
            orderId: item.ID || 0,
            OrderDataDetails: item,
          });
        }
      }}
      style={styles.orderCard}>
      {item.IS_EXPRESS === 1 && (
        <Text style={[styles.tag, {backgroundColor: colors.primary}]}>
          {t('orderList.express')}
        </Text>
      )}

      <View style={styles.orderHeader}>
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
            {height: 40, width: 40, borderRadius: 20}

            // styles.thumbnail,
            // active.ID === item.ID && {
            //   borderColor: '#0E0E0E',
            //   borderWidth: 1,
            // },
          }
        />
        <Text style={styles.orderNumber}>
          {t('orderList.orderID')}: {item.ORDER_NUMBER}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>{t('orderList.status')}</Text>
        <Text style={styles.statusValue}>{renderStatus(item)}</Text>
      </View>
      {item.CANCELLATION_REMARK && item.ORDER_STATUS !== 'OR' ? (
        <Text
          style={[styles.timeText, {color: colors.error}]}
          numberOfLines={2}>
          {t('orderList.cancellationRejected', {
            reason: item.CANCELLATION_REMARK,
          })}
        </Text>
      ) : null}
      {item.ORDER_STATUS == 'OR' ? (
        item.REMARK || item.REJECTION_REMARK ? (
          <Text
            style={[
              styles.timeText,
              {
                color: colors.error,
                fontFamily: fontFamily,
              },
            ]}
            numberOfLines={2}>
            Order rejected because: {item.REMARK || item.REJECTION_REMARK}
          </Text>
        ) : (
          <Text style={styles.timeText} numberOfLines={2}>
            {t('order.orderList.rejectReason')}
          </Text>
        )
      ) : null}
      {(item.ORDER_STATUS == 'OA' || item.ORDER_STATUS == 'OK') &&
      item.ACCEPTANCE_REMARK ? (
        <Text
          style={[
            styles.timeText,
            {
              color: colors.primary,
            },
          ]}
          numberOfLines={2}>
          Order acceptance remark: {item.ACCEPTANCE_REMARK}
        </Text>
      ) : null}
      <View style={styles.timeContainer}>
        <View style={styles.clockIcon}>
          <Icon name="clock" type="Feather" size={20} color="#F36631" />
        </View>
        <Text style={styles.timeText}>
          {moment(item.ORDER_DATE_TIME).format('ddd, MMM D  |  hh:mm A')}
        </Text>
      </View>

      {item.ORDER_STATUS === 'CA' && (
        <Text style={[styles.tag, {backgroundColor: colors.error}]}>
          {t('orderList.cancelled')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image source={_noData} style={styles.emptyImage} />
      <Text style={styles.emptyText}>{t('orderList.noOrders')}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!orderState.loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Main Render
  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['bottom', 'top']}>
      <View style={{backgroundColor: 'white'}}>
        <Text
          style={{
            alignItems: 'center',
            fontSize: Size.xl,
            paddingTop: Size.containerPadding,
            paddingLeft: Size.containerPadding,
            paddingBottom: Size.padding,
            color: colors.black,
            fontFamily: fontFamily,
            fontWeight: '500',
          }}>
          {t('orderList.title')}
        </Text>
        {/* <Header label={t('cart.title')} onBack={() => navigation.goBack()} /> */}
      </View>
      {/* <Header label={t('orderList.title')} onBack={() => navigation.goBack()} /> */}
      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TabSwitcher value={activeTab} onChange={handleTabChange} />
        </View>
        {orderState.loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {orderState.error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{orderState.error}</Text>
              </View>
            ) : (
              <FlatList
                removeClippedSubviews={false}
                data={orderState.data}
                renderItem={renderOrderItem}
                keyExtractor={(item, index) => `${item.ID}-${index}`}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={handleRefresh}
                  />
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// TabSwitcher Component
interface TabSwitcherProps {
  value: TabType;
  onChange: (value: TabType) => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = React.memo(
  ({value, onChange}) => {
    const colors = useTheme();
    const {t} = useTranslation();

    return (
      <View style={[styles.tabSwitcher, {borderColor: colors.primary}]}>
        {(['service', 'product'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            activeOpacity={1}
            style={[
              styles.tab,
              {
                // borderTopLeftRadius: tab === 'service' ? 8 : 0,
                // borderBottomLeftRadius: tab === 'service' ? 8 : 0,
                // borderTopRightRadius: tab === 'product' ? 8 : 0,
                // borderBottomRightRadius: tab === 'product' ? 8 : 0,
                backgroundColor: value === tab ? colors.primary : 'white',
              },
            ]}
            onPress={() => onChange(tab)}>
            <Text
              style={[
                styles.tabText,
                {
                  color: value === tab ? colors.white : '#1D1B20',
                  fontFamily: fontFamily,
                },
              ]}>
              {t(`orderList.tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    marginHorizontal: Size.containerPadding,
    marginBottom: 16,
  },
  listContainer: {
    gap: Size.lg,
    paddingHorizontal: Size.containerPadding,
    paddingBottom: Size.containerPadding,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Size.containerPadding,
  },
  errorText: {
    fontFamily: fontFamily,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyImage: {
    height: 150,
    width: 150,
  },
  emptyText: {
    fontFamily: fontFamily,
    fontSize: 16,
    color: '#666666',
    marginTop: Size.lg,
  },
  footerLoader: {
    paddingVertical: Size.lg,
    alignItems: 'center',
  },
  orderCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7E6E6',
    marginVertical: Size.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  statusValue: {
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: '400',
    color: '#2A3B8F',
    backgroundColor: '#F4F7F9',
    paddingHorizontal: 13,
    paddingVertical: 2,
    borderRadius: Size.base,
    textAlign: 'center',
    opacity: 0.8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 12,
  },
  clockIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: '#0E0E0E',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 20,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily,
    alignSelf: 'flex-end',
    textAlign: 'center',
    margin: -5,
  },
  tabSwitcher: {
    borderWidth: 1,
    borderRadius: 4,
    height: 39,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    // backgroundColor: 'white',
  },
  tab: {
    width: '50%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontFamily: fontFamily,
    fontWeight: '500',
    fontSize: 16,
  },
  activeTabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    zIndex: 0,
  },
});

export default OrderList;
