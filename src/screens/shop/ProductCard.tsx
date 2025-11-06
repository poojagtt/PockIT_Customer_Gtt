import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { _defaultImage } from '../../assets';
import {
  Size,
  useTheme,
  apiCall,
  IMAGE_URL,
  fontFamily,
  useStorage,
  tokenStorage,
} from '../../modules';
import { Button } from '../../components';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Reducers, useDispatch, useSelector } from '../../context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from '../../components/Toast';

interface ProductCardProps {
  navigation: any;
  product: Product;
  onPress: () => void;
  goToCart: () => void;
  goToOrder: (cartID: number) => void;
  refresh: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  navigation,
  product,
  onPress,
  goToCart,
  goToOrder,
  refresh,
}) => {
  console.log('navigation', navigation);
  const colors = useTheme();
  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();
  const { products } = useSelector(state => state.cart);
  const app = useSelector(state => state.app);
  const { address } = useSelector(state => state.app);
  const isGuest = app.user?.ID == 0;
  const [isInCart, setIsInCart] = useState(product.IS_ALREADY_IN_CART == 1);
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      checkCart();
    }, [products]),
  );

  const checkCart = () => {
    const cartItem = products?.find(value => value.ID == product.ID);
    if (cartItem) {
      setIsInCart(true);
    } else {
      setIsInCart(false);
    }
  };

  const addToCart = () => {
    if (isInCart) {
      Toast(t('shop.cartList.alerts.itemExists'));
    } else {
      dispatch(
        Reducers.createCartInformation({
          QUANTITY: 1,
          SERVICE_ID: 0,
          BRAND_NAME: '',
          DESCRIPTION: '',
          MODEL_NUMBER: '',
          TYPE: 'P',
          INVENTORY_ID: product.ID,
          SERVICE_CATALOGUE_ID: 0,
          SERVICE_PHOTO_FILE: '',
          QUANTITY_PER_UNIT: product.QUANTITY_PER_UNIT,
          UNIT_ID: product.UNIT_ID,
          UNIT_NAME: product.UNIT_NAME,
        }),
      );
      setIsInCart(true);
      Toast(t('shop.cartList.alerts.itemAdded'));
    }
  };

  const buyNow = async () => {
    setLoader(true);
    try {
      const body = {
        SERVICE_ID: 0,
        QUANTITY: 1,
        INVENTORY_ID: product.ID,
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
        QUANTITY_PER_UNIT: product.QUANTITY_PER_UNIT,
        UNIT_ID: product.UNIT_ID,
        UNIT_NAME: product.UNIT_NAME,
      };
      const response = await apiCall.post(`api/cart/add`, body);
      if (response.data.code === 200) {
        goToOrder(response.data.data.CART_ID || 0);
      } else {
        Toast(response.data.message);
      }
    } catch (error) {
      console.error('Error in fetchLatestProducts:', error);
    } finally {
      setLoader(false);
    }
  };

  const onNoTerritoryFoundPress = () => {
    Alert.alert(
      t('serviceList.territoryNotServiced'),
      t('serviceList.territoryNotServicedMessage', {
        defaultValue:
          'We currently do not provide services in your selected territory. Please update your delivery address to a location where our services are available.',
      }),
      [
        {
          text: t('common.ok'),
          onPress: () => { },
        },
      ],
      {
        cancelable: true,
      },
    );
  };
  const addAddress = () => {
    console.log('addAddress');
    navigation.navigate('AddressBook', {
      cartId: { id: null, type: null },
    })
  };
  const onGuestPress = () => {
    Alert.alert(
      t('serviceList.guestTitle'),
      t('serviceList.guestMessage'),
      [
        {
          text: t('serviceList.cancel'),
          onPress: () => { },
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
        cancelable: true,
      },
    );
  };

  return (
    <Animated.View style={styles.cardContainer}>
      <TouchableOpacity
        onLongPress={() => { }}
        onPress={isGuest ? onGuestPress : onPress}
        style={{
          width: '100%',
          height: 243,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
        <Image
          source={
            product.INVENTORY_IMAGE
              ? {
                uri:
                  IMAGE_URL +
                  'InventoryImages/' +
                  product.INVENTORY_IMAGE 
                  // `?timestamp=${new Date().getTime()}`
                  ,
                cache: 'default',
              }
              : _defaultImage
          }
          resizeMode={'contain'}
          style={{ flex: 1, width: '100%', height: '100%' }}
        />
        {product.IS_REFURBISHED == 1 && (
          <Text
            style={{
              fontFamily: fontFamily,
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: colors.secondary,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 16,

              fontSize: 8,
              color: '#FFFFFFFF',
            }}>
            Refurbished
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={isGuest ? onGuestPress : onPress}
        style={{ gap: 4, width: '100%' }}>
        <Text
          style={{
            fontSize: Size.lg,
            fontWeight: '500',
            color: '#0E0E0E',
            fontFamily: fontFamily,
          }}>
          {product?.IS_HAVE_VARIANTS == 0
            ? product.ITEM_NAME
            : product.VARIANT_COMBINATION}
          {` (${t('shop.productDetails.quantity', {
            count: product.QUANTITY_PER_UNIT,
          })})`}
        </Text>

        <Text
          style={{
            fontSize: Size.sm,
            fontWeight: '500',
            color: '#0E0E0E',
            fontFamily: fontFamily,
          }}>
          {product.INVENTORY_CATEGORY_NAME}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {product.UNIT_STOCK > 0
            ? t('shop.product.inStock', { count: product.UNIT_STOCK })
            : t('shop.product.outOfStock')}
        </Text>
      </TouchableOpacity>
      <View
        style={{
          backgroundColor: '#CBCBCB',
          height: 1,
          width: '100%',
          borderRadius: 8,
        }}
      />
      <TouchableOpacity
        onPress={isGuest ? onGuestPress : onPress}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#316CEC',
            fontFamily: fontFamily,
          }}>
          ₹{' '}
          {product.DISCOUNT_ALLOWED === 1
            ? Number(product.DISCOUNTED_PRICE).toLocaleString('en-IN')
            : Number(product.SELLING_PRICE).toLocaleString('en-IN')}
        </Text>
        {product.DISCOUNT_ALLOWED === 1 && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#CBCBCB',
              textDecorationLine: 'line-through',
              fontFamily: fontFamily,
            }}>
            {`₹ ${Number(product.SELLING_PRICE).toLocaleString('en-IN')}`}
          </Text>
        )}
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
        }}>
        <Button
          label={
            isInCart ? t('shop.product.goToCart') : t('shop.product.addToCart')
          }
          onPress={
            isGuest
              ? onGuestPress
              :  !address ? addAddress
              : !address?.TERRITORY_ID
                ? onNoTerritoryFoundPress
                : isInCart
                  ? () => {
                    goToCart();
                  }
                  : addToCart
          }
          loading={loader}
          disabled={isInCart ? false : product.UNIT_STOCK <= 0}
          labelStyle={{
            fontSize: 14,
            fontWeight: '600',
            color: isInCart
              ? colors.primary2
              : product.UNIT_STOCK <= 0
                ? colors.disable
                : colors.primary2,
          }}
          style={{
            flex: 1,
            height: 40,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: isInCart
              ? colors.primary2
              : product.UNIT_STOCK <= 0
                ? colors.disable
                : colors.primary2,
          }}
        />
        <Button
          label={t('shop.product.buyNow')}
          onPress={
            isGuest
              ? onGuestPress
              :  !address ? addAddress
               : !address?.TERRITORY_ID
                ? onNoTerritoryFoundPress
                : buyNow
          }
          loading={loader}
          disabled={product.UNIT_STOCK <= 0}
          labelStyle={{
            fontSize: 14,
            fontWeight: '600',
            color: product.UNIT_STOCK <= 0 ? colors.white : colors.white,
          }}
          style={{
            flex: 1,
            height: 40,
            backgroundColor:
              product.UNIT_STOCK <= 0 ? colors.disable : colors.primary2,
          }}
        />
      </View>
    </Animated.View>
  );
};

export default ProductCard;

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
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#092B9C',
      },
    }),
  },
});
