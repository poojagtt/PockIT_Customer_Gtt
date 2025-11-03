import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, Loader, EmptyList} from '../../components';
import {useTheme, apiCall, IMAGE_URL, fontFamily, Size} from '../../modules';
import {_defaultImage} from '../../assets';
import Button from '../../components/Button';
import {ShopRoutes} from '../../routes/Shops';
import {Reducers, useDispatch, useSelector} from '../../context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Toast from '../../components/Toast';
import {useNavigation} from '@react-navigation/native';

interface CartListProps extends ShopRoutes<'CartList'> {}
const CartList: React.FC<CartListProps> = ({navigation, route}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {products, cartSummery} = useSelector(state => state.cart);
  const {t} = useTranslation();
  const [loader, setLoader] = useState(false);
  // const [cartData, setCartData] = useState<CartProduct[]>([]);
  const app = useSelector(state => state.app);
  const buyNow = async (item: CartProduct) => {
    setLoader(true);
    try {
      const body = {
        SERVICE_ID: 0,
        QUANTITY: item.QUANTITY,
        INVENTORY_ID: item.ID,
        TYPE: 'P',
        SERVICE_CATALOGUE_ID: 0,
        BRAND_NAME: '',
        MODEL_NUMBER: '',
        SERVICE_PHOTO_FILE: '',
        DESCRIPTION: '',
        IS_TEMP_CART: 1,
        CUSTOMER_ID: app.user?.ID,
        ADDRESS_ID: app.address?.ID,
        TERITORY_ID: app.territory?.ID,
        STATE_ID: app.address?.STATE_ID,
        QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
        UNIT_ID: item.UNIT_ID,
        UNIT_NAME: item.UNIT_NAME,
      };
      const response = await apiCall.post(`api/cart/add`, body);
      if (response.data.code === 200) {
        navigation.navigate('PlaceOrder', {
          cartId: response.data.data.CART_ID || 0,
        });
      } else {
        Toast(response.data.message);
      }
    } catch (error) {
      console.error('Error in fetchLatestProducts:', error);
    } finally {
      setLoader(false);
    }
  };
  const handleDecrease = (id: number) => {
    setLoader(true);
    try {
      const product = products.find(value => value.ID === id);

      if (!product) {
        setLoader(false);
        return;
      }

      if (product.QUANTITY > 1) {
        const count = product.QUANTITY - 1;
        dispatch(
          Reducers.updateProductItem({
            QUANTITY: count,
            INVENTORY_ID: id,
          }),
        );

        setCartData(prev =>
          prev.map(item =>
            item.ID === id ? {...item, QUANTITY: count} : item,
          ),
        );
      } else {
        dispatch(
          Reducers.deleteProductItem({
            INVENTORY_ID: id,
          }),
        );
        setCartData(prev => prev.filter(item => item.ID !== id));
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
    } finally {
      setLoader(false);
    }
  };
  const handleIncrease = (id: number) => {
    setLoader(true);
    try {
      const product = products.find(value => value.ID === id);

      if (!product) {
        setLoader(false);
        return;
      }

      if (product.CURRENT_STOCK > product.QUANTITY) {
        const count = product.QUANTITY + 1;
        dispatch(
          Reducers.updateProductItem({
            QUANTITY: count,
            INVENTORY_ID: id,
          }),
        );

        setCartData(prev =>
          prev.map(item =>
            item.ID === id ? {...item, QUANTITY: count} : item,
          ),
        );
      }
    } catch (error) {
      console.error('Error increasing quantity:', error);
    } finally {
      setLoader(false);
    }
  };
  // useFocusEffect(
  //   useCallback(() => {
  //     if (products) {
  //       setCartData(products);
  //     }
  //   }, [products]),
  // );
  const handleNext = () => {
    setLoader(true);
    if (products.length === 0) {
      Toast(t('shop.cart.alerts.empty'));
    } else {
      navigation.navigate('PlaceOrder', {cartId: products[0].CART_ID});
      setLoader(false);
    }
  };
  const renderFooter = () => {
    if (products.length > 0)
      return (
        <View style={{gap: 8}}>
          <View style={[styles.cardContainer, {minHeight: 108}]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}>
              <Text
                style={{fontSize: 16, color: colors.text,fontFamily: fontFamily}}>
                {t('shop.cart.items')}:
              </Text>
              <Text
                style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
                {cartSummery?.TOTAL_QUANTITY}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}>
              <Text
                style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
                {t('shop.cart.deliveryCharges')}:
              </Text>
              <Text
                style={{fontFamily: fontFamily,fontSize: 16, fontWeight: '500', color: colors.text}}>
                {t('shop.cart.currency')}{` ${Number(cartSummery?.EXPECTED_DELIVERY_CHARGES).toLocaleString('en-IN')}`}

               
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}>
              <Text
                style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
                {t('shop.cart.total')}:
              </Text>
              <Text
                style={{fontSize: 16, fontWeight: '500', color: colors.text,fontFamily: fontFamily}}>
                             

                {t('shop.cart.currency')}{` ${Number(cartSummery?.TOTAL_AMOUNT).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 16,
              width: '100%',
            }}>
            <Button
              label={'Checkout'}
              onPress={handleNext}
              loading={loader}
              disabled={products.length === 0}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: products.length === 0 ? colors.white : colors.white,
              }}
              style={{
                flex: 1,
                backgroundColor:
                  products.length === 0 ? colors.disable : colors.primary2,
                height: 52,
              }}
            />
          </View>
        </View>
      );
    else return null;
  };
  const removeItem = (id: number) => {
    dispatch(
      Reducers.deleteProductItem({
        INVENTORY_ID: id,
      }),
    );
    // setCartData(prev => prev.filter(item => item.ID !== id));
  };

  const EmptyCart = () => {
    const navigation = useNavigation<any>();
    const colors = useTheme();

    return (
      <View style={[styles.emptyContainer,{backgroundColor:colors.background}]}>
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: colors.primary2 + '15'},
          ]}>
          <Icon
            name="cart-outline"
            type="Ionicons"
            size={66}
            color={colors.secondary}
          />
        </View>
        <Text style={[styles.emptyTitle, {color: colors.text}]}>
          {t('shop.cart.emptyTitle')}
        </Text>
        <Text style={[styles.emptySubtitle, {color: colors.primary2}]}>
          {t('shop.cart.emptySubtitle')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, gap: 8, backgroundColor: colors.white}}>
   

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
                {t('shop.cart.title')}
              </Text>
              {/* <Header label={t('cart.title')} onBack={() => navigation.goBack()} /> */}
            </View>
      <FlatList
        data={products}
        keyExtractor={item => item?.ID?.toString()}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[
          {gap: 16, marginHorizontal: 16},
          products.length === 0 && {flex: 1},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loader}
            onRefresh={() => {
              setLoader(true);
              dispatch(Reducers.getCartInformation()).finally(() =>
                setLoader(false),
              );
            }}
          />
        }
        renderItem={({item}) => (
          <View style={styles.cardContainer}>
            <View
              style={{
                width: '100%',
                height: 243,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
              <Image
                source={
                  item.INVENTORY_IMAGE
                    ? {
                        uri:
                          IMAGE_URL +
                          'InventoryImages/' +
                          item.INVENTORY_IMAGE,
                        cache: 'default',
                      }
                    : _defaultImage
                }
                resizeMode={'cover'}
                style={{flex: 1, width: '100%', height: '100%'}}
              />
            </View>
            <TouchableOpacity style={{gap: 4, width: '100%'}}>
              <Text style={{fontSize: 16,fontFamily: fontFamily}}>
                {item.IS_HAVE_VARIANTS === 0
                  ? item.ITEM_NAME
                  : item.VARIANT_COMBINATION}
                {t('shop.cart.itemsCount', {count: item.QUANTITY_PER_UNIT})}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                borderRadius: 8,
              }}>
              <Text
                style={{fontFamily:fontFamily,fontSize: 16, color: colors.text}}>
                {t('shop.cart.quantity')}
              </Text>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <TouchableOpacity onPress={() => handleDecrease(item.ID)}>
                  <Icon
                    name="minus"
                    type="Entypo"
                    color={colors.text}
                    size={20}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.black,
                    height: 28,
                    width: 28,
                    textAlign: 'center',
                    lineHeight: 28,
                    fontFamily: fontFamily
                  }}>
                  {item.QUANTITY}
                </Text>
                <TouchableOpacity onPress={() => handleIncrease(item.ID)}>
                  <Icon
                    name="plus"
                    type="Entypo"
                    color={colors.text}
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                backgroundColor: '#F5F5F5',
                height: 1,
                width: '100%',
                borderRadius: 8,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}>
              <Text
                style={{fontSize: 16, color: colors.text,fontFamily: fontFamily}}>
                {t('shop.cart.priceLabel')}
              </Text>
              <Text
                style={{fontSize: 16,  color: colors.text,fontFamily: fontFamily}}>
                {t('shop.cart.currency')}
                {item.DISCOUNT_ALLOWED === 1
                           
                  ?  ` ${Number(item.DISCOUNTED_PRICE).toLocaleString('en-IN')}`
                  :   ` ${Number(item.SELLING_PRICE).toLocaleString('en-IN')}`}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 8,
                width: '100%',
              }}>
              <Button
                label={t('shop.cart.remove')}
                onPress={() => {
                  removeItem(item.ID);
                }}
                loading={loader}
                labelStyle={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.primary,
                }}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              />
              <Button
                label={t('shop.cart.buyNow')}
                onPress={() => {
                  buyNow(item);
                }}
                loading={loader}
                labelStyle={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.white,
                }}
                style={{flex: 1, backgroundColor: colors.primary2, height: 40}}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={loader ? null : <EmptyCart />}
        ListFooterComponent={renderFooter}
      />
      <Loader show={loader} />
    </SafeAreaView>
  );
};
export default CartList;
const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // minHeight: 337,
    width: '100%',
    //maxWidth: 358,
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#092B9C',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#092B9C',
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 24,
    marginTop:-200,
    margin:-12
    
    // minHeight: Dimensions.get('window').height * 0.6,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 23,
   
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'SF-Pro-Text-Bold'
  },
  emptySubtitle: {
    fontFamily: fontFamily,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
