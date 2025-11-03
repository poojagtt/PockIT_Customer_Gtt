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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {apiCall, fontFamily, useTheme} from '../../modules';
import Icon from '../../components/Icon';
import Animated, {FadeInDown} from 'react-native-reanimated';
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
                      ? t('cart.coupons.discount.percentOff', {
                          value: item.COUPON_VALUE,
                        })
                      : t('cart.coupons.discount.amountOff', {
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
            {t('cart.coupons.buttons.apply')}
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
  const {user, address} = useSelector(state => state.app);
  const colors = useTheme();
  const {t} = useTranslation();
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
        TYPE: 'S',
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
            COUNTRY_ID: address?.COUNTRY_ID,
            COUPON_CODE: code,
            TYPE: 'S',
          })
          .then(res => {
            if (res.data.code == 200) {
              onReload();
            } else {
              Alert.alert(res.data.message);
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
        title={t('cart.coupons.empty.title')}
        message={t('cart.coupons.empty.message')}
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
     <SafeAreaProvider>
       <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={24}
            color={'#999999'}
            onPress={onClose}
          />
          <Text style={styles.headerText}>{t('cart.coupons.title')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View>
          
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.input}
                  
                  placeholder={t('cart.coupons.input.placeholder')}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={() => handleApplyCoupon(couponCode)}>
                  <Text style={styles.applyButtonText}>
                    {t('cart.coupons.buttons.apply')}
                  </Text>
                </TouchableOpacity>
              </View>
            
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
          </View>
        )}
      </SafeAreaView>
     </SafeAreaProvider>
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
    // fontWeight: '700',
    color: '#000',
    fontFamily: 'SF-Pro-Text-Bold'
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
fontFamily: fontFamily,  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  couponCode: {
    fontSize: 14,
    color: '#666',
fontFamily: fontFamily  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
fontFamily: fontFamily  },
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
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    fontFamily:fontFamily,
    flex: 1,
    height: 46,
    borderWidth: 1,
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
