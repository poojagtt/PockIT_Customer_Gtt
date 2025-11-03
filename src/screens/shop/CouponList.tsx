import React, {useCallback, useState, memo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
 
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {apiCall, fontFamily, useTheme} from '../../modules';
import Icon from '../../components/Icon';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {Header, LoadingIndicator} from '../../components';
import {useSelector} from '../../context';
import {EmptyList} from '../../components';
import {useTranslation} from 'react-i18next';

interface CouponItem {
  COUPON_CODE: string;
  COUPON_ID: number;
  COUPON_NAME: string;
  COUPON_VALUE: string;
  COUPON_VALUE_TYPE: 'P' | 'A';
  IS_APPLIED?: boolean;
}

interface CouponListProps {
  visible: boolean;
  cartID: number;
  onClose: () => void;
  onReload: () => void;
}

const CouponItem = memo(({item, onApply, colors}: any) => {
  const {t} = useTranslation();

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.couponCard}>
      <View style={styles.couponHeader}>
        <View style={styles.couponLeft}>
          {/* <View
            style={[
              styles.couponIconContainer,
              {backgroundColor: colors.primary + '10'},
            ]}>
            <Icon
              name="ticket-percent"
              type="MaterialCommunityIcons"
              size={24}
              color={colors.primary}
            />
          </View> */}
          <View style={styles.couponInfo}>
            <Text style={styles.couponTitle}>{item.COUPON_NAME}</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.couponCode}>{item.COUPON_CODE}</Text>
              {item.COUPON_VALUE && (
                <View
                  style={[
                    styles.discountBadge,
                    {backgroundColor: colors.primary + '15'},
                  ]}>
                  <Text style={[styles.discountText, {color: colors.primary}]}>
                    {item.COUPON_VALUE_TYPE === 'P'
                      ? t('shop.coupons.discount.percentOff', {
                          value: item.COUPON_VALUE,
                        })
                      : t('shop.coupons.discount.amountOff', {
                          value: item.COUPON_VALUE,
                        })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onApply(item.COUPON_CODE)}
          style={[
            styles.applyButton,
            {backgroundColor: colors.primary + '10'},
          ]}>
          <Text style={[styles.applyButtonText, {color: colors.primary}]}>
            {t('shop.coupons.buttons.apply')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const CouponList: React.FC<CouponListProps> = ({
  visible,
  cartID,
  onClose,
  onReload,
}) => {
  const {t} = useTranslation();
  const {user, address} = useSelector(state => state.app);
  const colors = useTheme();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponCode, setCouponCode] = useState('');

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall.post('api/cart/coupons/get', {
        CUSTOMER_ID: user?.ID,
        CART_ID: cartID,
        COUNTRY_ID: address?.COUNTRY_ID,
        TYPE: 'P',
        TERRITORY_ID: address?.TERRITORY_ID || null,
      });

      if (response.data.code === 200) {
        console.log('Fetched coupons:', response.data.data);
        setCoupons(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.ID, cartID, address?.COUNTRY_ID]);

  useEffect(() => {
    if (visible) fetchCoupons();
  }, [visible]);

  const handleApplyCoupon = useCallback(
    async (code: string) => {
      try {
        setLoading(true);
        await apiCall
          .post('api/cart/coupon/apply', {
            CUSTOMER_ID: user?.ID,
            CART_ID: cartID,
            COUPON_CODE: code,
            COUNTRY_ID: address?.COUNTRY_ID,
            TYPE: 'P',
          })
          .then(res => {
            if (res.data.code == 200) {
              onReload();
              Alert.alert(t('shop.coupons.alerts.success'));
            } else {
              Alert.alert(t('shop.coupons.alerts.invalid'), res.data.message);
            }
          });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [user?.ID, cartID, onReload],
  );

  const renderItem = useCallback(
    ({item}: {item: CouponItem}) => (
      <CouponItem item={item} onApply={handleApplyCoupon} colors={colors} />
    ),
    [handleApplyCoupon, colors],
  );

  const keyExtractor = useCallback(
    (item: CouponItem) => `coupon-${item.COUPON_ID}`,
    [],
  );

  const listEmptyComponent = useCallback(
    () => (
      <EmptyList
        title={t('shop.coupons.empty.title')}
        message={t('shop.coupons.empty.message')}
        icon={{
          name: 'ticket-percent',
          type: 'MaterialCommunityIcons',
          size: 32,
        }}
      />
    ),
    [t],
  );

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <Header label={t('shop.coupons.title')} onBack={onClose} />

        {coupons.length === 0 && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('shop.coupons.input.placeholder')}
              value={couponCode}
              onChangeText={setCouponCode}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.applyButton, {backgroundColor: colors.primary}]}
              onPress={() => handleApplyCoupon(couponCode)}>
              <Text style={styles.applyButtonText}>
                {t('shop.coupons.buttons.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <LoadingIndicator />
        ) : (
          <FlatList
            data={coupons}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={listEmptyComponent}
            contentContainerStyle={[
              styles.listContainer,
              !coupons.length && styles.emptyListContainer,
            ]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#b094f550',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#b094f550',
    marginLeft: 12,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#b094f550',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  couponIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: fontFamily
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  couponCode: {
    fontSize: 14,
    color: '#666',
   fontFamily: fontFamily
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
   fontFamily: fontFamily
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
   fontFamily: fontFamily,
    color: '#fff',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
    borderWidth: 1,
    margin: 16,
    borderColor: '#CBCBCB',
    borderRadius: 6,
  },
  input: {
    flex: 1,
    fontFamily:fontFamily,
    // height: 46,
    // borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});

export default memo(CouponList);
