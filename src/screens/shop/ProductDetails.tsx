import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Loader, MathJax } from '../../components';
import { ShopRoutes } from '../../routes/Shops';
import {
  Size,
  useTheme,
  apiCall,
  IMAGE_URL,
  fontFamily,
  useStorage,
  tokenStorage,
} from '../../modules';
import { _defaultImage, _safe } from '../../assets';
import { Button } from '../../components';
import { SVG } from '../../assets';
import { Reducers, useDispatch, useSelector } from '../../context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import ImageView from 'react-native-image-viewing';
import Toast from '../../components/Toast';

interface ProductDetailsProps extends ShopRoutes<'ProductDetails'> { }
interface ProductGallery {
  ID: number;
  IMAGE_URL: string;
}
interface productUnit {
  ARCHIVE_FLAG: string;
  CATEGORY: string | null;
  CATEGORY_ID: string | null;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  ID: number;
  ITEM_ID: number;
  ITEM_NAME: string;
  QUANTITY: null;
  QUANTITY_PER_UNIT: number;
  RATIO_RATE: null;
  READ_ONLY: 'N';
  UNIT_ID: number;
  UNIT_NAME: string;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ navigation, route }) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { products } = useSelector(state => state.cart);
  const app = useSelector(state => state.app);
  const { item } = route.params || {};
  const [active, setActive] = useState<ProductGallery>({
    ID: 1,
    IMAGE_URL: '',
  });
  const [loader, setLoader] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [units, setUnits] = useState<productUnit[]>([]);
  const [images, setImages] = useState<ProductGallery[]>([]);
  const [itemUnit, setItemUnit] = useState<productUnit>({
    UNIT_ID: item.UNIT_ID,
    UNIT_NAME: item.UNIT_NAME,
    QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
    ARCHIVE_FLAG: 'N',
    CATEGORY: null,
    CATEGORY_ID: null,
    CLIENT_ID: 0,
    CREATED_MODIFIED_DATE: '',
    ID: 0,
    ITEM_ID: 0,
    ITEM_NAME: '',
    QUANTITY: null,
    RATIO_RATE: null,
    READ_ONLY: 'N',
  });
  const [currentStock, setCurrentStock] = useState(item.CURRENT_STOCK);
  const [openModal, setOpenModal] = useState({
    imageView: false,
  });

  const formatPeriod = (days: number) => {
    if (days <= 0) return '';

    const years = Math.floor(days / 365);
    const remainingDaysAfterYears = days % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const remainingDays = remainingDaysAfterYears % 30;

    if (years > 0) {
      const yearText = `${years} ${years === 1 ? 'year' : 'years'}`;
      if (months === 0 && remainingDays === 0) {
        return yearText;
      }
      if (months === 0) {
        return `${yearText} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'
          }`;
      }
      if (remainingDays === 0) {
        return `${yearText} ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return `${yearText} ${months} ${months === 1 ? 'month' : 'months'
        } ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
    }

    if (months === 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else {
      const monthText = `${months} ${months === 1 ? 'month' : 'months'}`;
      if (remainingDays === 0) {
        return monthText;
      }
      return `${monthText} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'
        }`;
    }
  };

  const fetchStockByUnit = async (unitId: number) => {
    setLoader(true);
    try {
      const response = await apiCall.post(
        'api/inventoryReports/getStocksforWeb',
        {
          ITEM_ID: item.ID,
          UNIT_ID: unitId,
        },
      );
      if (response.data.code === 200 && response.data.data.length > 0) {
        const updatedStock = response.data.data[0].CURRENT_STOCK;
        setCurrentStock(updatedStock);
      }
    } catch (error) {
      console.error('Error in fetchStockByUnit:', error);
      Toast(t('shop.productDetails.alerts.stockError'));
    } finally {
      setLoader(false);
    }
  };

  const fetchImages = useCallback(async () => {
    setLoader(true);
    try {
      const response = await apiCall.post('api/inventoryImageMapping/get', {
        filter: ' AND STATUS = 1 AND INVENTORY_ID = ' + item.ID,
      });
      if (response.status === 200) {
        setImages(response.data.data);
        setActive(response.data.data[0]);
      } else {
        Alert.alert(t('shop.popularBrands.error.fetch'));
      }
    } catch (error) {
      console.log('Error in fetchImages:', error);
    } finally {
      setLoader(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkCart();
      fetchImages();
      if (!user || user.ID == 0) {
        Alert.alert(
          t('serviceList.guestTitle'),
          t('home.dashboard.guestMessage'),
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
        return;
      } else {
        getUnits();
      }
    }, [products]),
  );
  const { user, address, territory } = useSelector(state => state.app);

  const getUnits = async () => {
    await apiCall
      .post('api/inventoryUnitMapping/get', {
        filter: ` AND ITEM_ID = ${item.ID}`,
      })
      .then(res => {
        if (res.data.code == 200) {
          setUnits(res.data.data);
        } else {
          Alert.alert(t('shop.productDetails.error.fetch'));
        }
      })
      .catch(error => {
        console.error('Error in getUnits:', error);
      });
  };

  const checkCart = () => {
    const cartItem = products?.find(value => value.ID == item.ID);
    if (cartItem) {
      setIsInCart(true);
      setQuantity(cartItem.QUANTITY || 0);
    } else {
      setIsInCart(false);
      setQuantity(1);
    }
  };

  const addToCart = () => {
    if (isInCart) {
      navigation.navigate('Cart', { screen: 'CartList' })
      // Toast(t('shop.productDetails.alerts.alreadyInCart'));
    } else {
      dispatch(
        Reducers.createCartInformation({
          QUANTITY: quantity,
          SERVICE_ID: 0,
          BRAND_NAME: '',
          DESCRIPTION: '',
          MODEL_NUMBER: '',
          TYPE: 'P',
          INVENTORY_ID: item.ID,
          SERVICE_CATALOGUE_ID: 0,
          SERVICE_PHOTO_FILE: '',
          QUANTITY_PER_UNIT: itemUnit.QUANTITY_PER_UNIT,
          UNIT_ID: itemUnit.UNIT_ID,
          UNIT_NAME: itemUnit.UNIT_NAME,
        }),
      );
      // setIsInCart(true);
      Toast(t('shop.productDetails.alerts.addedToCart'));
    }
    // navigation.navigate('CartList');
  };

  const addAddress = () => {
    navigation.navigate('AddressBook', {
      cartId: { id: null, type: null },
    })
  };

  const handleIncrease = () => {
    setLoader(true);
    try {
      if (currentStock > quantity) {
        if (isInCart) {
          let count = quantity + 1;
          dispatch(
            Reducers.updateProductItem({
              QUANTITY: count,
              INVENTORY_ID: item.ID,
            }),
          );
          setQuantity(count);
        } else {
          addToCart();
        }
      } else {
        Toast(
          t('shop.productDetails.alerts.stockLimit', {
            count: currentStock,
          }),
        );
      }
    } catch (error) {
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };

  const handleDecrease = () => {
    setLoader(true);
    try {
      if (isInCart) {
        if (quantity > 1) {
          let count = quantity - 1;
          dispatch(
            Reducers.updateProductItem({
              QUANTITY: count,
              INVENTORY_ID: item.ID,
            }),
          );
          setQuantity(count);
        } else {
          dispatch(
            Reducers.deleteProductItem({
              INVENTORY_ID: item.ID,
            }),
          );
          setIsInCart(false);
          setQuantity(1);
        }
      }
    } catch (error) {
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };

  const goToCart = () => {
    navigation.navigate('CartList');
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

  const buyNow = async () => {
    setLoader(true);
    try {
      const body = {
        SERVICE_ID: 0,
        QUANTITY: 1,
        QUANTITY_UNIT: item.UNIT_ID,
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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="keyboard-backspace"
          type="MaterialCommunityIcons"
          size={23}
          color={colors.onBack}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        style={{ paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              checkCart();
              fetchImages();
            }}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          {item.IS_REFURBISHED == 1 && (
            <Text
              style={{
                position: 'absolute',
                top: 0,
                right: 4,
                backgroundColor: colors.secondary,
                paddingHorizontal: 5,
                paddingVertical: 2,
                borderRadius: 16,
                fontFamily,
                fontSize: 8,
                color: '#FFFFFFFF',

              }}>
              Refurbished
            </Text>
          )}
          <Text style={[styles.title, { marginTop: 12 }]}>
            {item?.IS_HAVE_VARIANTS == 0
              ? item.ITEM_NAME
              : item.VARIANT_COMBINATION}
          </Text>
          <Text
            style={{ fontSize: 12, fontWeight: '400', fontFamily: fontFamily }}>
            {item?.INVENTORY_CATEGORY_NAME}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#636363',
              marginBottom: 8,
              fontFamily: fontFamily,
            }}>
            {currentStock > 0
              ? t('shop.productDetails.stock.inStock', {
                count: currentStock,
              })
              : t('shop.productDetails.stock.outOfStock')}
          </Text>
        </View>
        <View
          style={{
            gap: 0,
          }}>
          <View
            style={{
              width: Size.width - 60,
              height: Size.width - 190,
              borderRadius: 8,
              overflow: 'hidden',

              alignSelf: 'center'
            }}>
            <Image
              source={
                active?.IMAGE_URL
                  ? {
                    uri:
                      IMAGE_URL +
                      'InventoryImages/' +
                      active?.IMAGE_URL +
                      `?timestamp=${new Date().getTime()}`,
                    cache: 'default',
                  }
                  :
                  _defaultImage
              }
              resizeMode="contain"
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
              }}
            />
          </View>
          <View style={styles.thumbnailContainer}>
            <FlatList
              horizontal
              removeClippedSubviews={false}
              data={images}
              keyExtractor={item => item.ID.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onLongPress={() => { }}
                  style={styles.thumbnailWrapper}
                  key={item.ID}
                  onPress={() => setActive(item)}>
                  <Image
                    source={
                      item?.IMAGE_URL
                        ? {
                          uri:
                            IMAGE_URL +
                            'InventoryImages/' +
                            item?.IMAGE_URL +
                            `?timestamp=${new Date().getTime()}`,
                          cache: 'default',
                        }
                        : _defaultImage
                    }
                    style={[
                      styles.thumbnail,
                      active.ID === item.ID && {
                        borderColor: '#0E0E0E',
                        borderWidth: 1,
                      },
                    ]}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.text, fontFamily: fontFamily }}>
                  {t('shop.productDetails.imageComingSoon')}
                </Text>
              }
            />
          </View>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.divider} />
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              ₹{' '}
              {item.DISCOUNT_ALLOWED === 1
                ? Number(item.DISCOUNTED_PRICE).toLocaleString('en-IN')
                : Number(item.SELLING_PRICE).toLocaleString('en-IN')}
            </Text>
            {item.DISCOUNT_ALLOWED === 1 && (
              <Text style={styles.originalPrice}>
                ₹ {Number(item.SELLING_PRICE).toLocaleString('en-IN')}
              </Text>
            )}
            {item.DISCOUNT_ALLOWED === 1 && (
              <Text style={styles.savedPrice}>
                {`(Saved ₹ ${(
                  Number(item.SELLING_PRICE) - Number(item.DISCOUNTED_PRICE)
                ).toLocaleString('en-IN')})`}
              </Text>
            )}
          </View>
          <Text style={styles.taxInfo}>{t('shop.productDetails.taxInfo')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={[styles.colorSection, { flexDirection: 'row' }]}>
          {item.WARRANTY_ALLOWED == 1 && (
            <View
              style={{
                alignItems: 'center',
                flex: 1,
                gap: 4,
              }}>
              <View style={styles.colorButton}>
                <SVG.Warranty fill={colors.primary} width={30} height={30} />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: '#0E0E0E',
                  textAlign: 'center',
                  fontFamily: fontFamily,
                }}>
                {item.WARRANTY_ALLOWED
                  ? `${formatPeriod(item.WARRANTY_PERIOD)} ${t(
                    'shop.productDetails.warranty.days',
                  )}`
                  : t('shop.productDetails.warranty.none')}
              </Text>
            </View>
          )}

          {item.GUARANTEE_ALLOWED == 1 && (
            <View
              style={{
                alignItems: 'center',
                flex: 1,
                gap: 4,
              }}>
              <View style={styles.colorButton}>
                {/* <SVG.Replacement fill={colors.primary2} width={30} height={30} /> */}
                <Image source={_safe} style={{ width: 30, height: 30 }} />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: '#0E0E0E',
                  textAlign: 'center',
                  fontFamily: fontFamily,
                }}>
                {item.GUARANTEE_PERIOD
                  ? `${formatPeriod(item.GUARANTEE_PERIOD)} ${t(
                    'shop.productDetails.guarantee.days',
                  )}`
                  : t('shop.productDetails.guarantee.none')}
              </Text>
            </View>
          )}

          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
              gap: 4,
            }}>
            <View style={styles.colorButton}>
              <SVG.Delivery fill={colors.primary} width={30} height={30} />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '400',
                color: '#0E0E0E',
                textAlign: 'center',
                fontFamily: fontFamily,
              }}>
              {t('shop.productDetails.delivery.title') +
                '\n' +
                t('shop.productDetails.delivery.days', {
                  days: item.EXPECTED_DELIVERY_IN_DAYS,
                })}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {currentStock > 0 && (
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>
              {t('shop.productDetails.quantity', {
                count: item.QUANTITY_PER_UNIT,
              })}
            </Text>
            <View style={styles.quantityControls}>
              {currentStock > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={
                      !address?.TERRITORY_ID
                        ? onNoTerritoryFoundPress
                        : handleDecrease
                    }>
                    <Icon
                      name="minus"
                      type="Entypo"
                      color={colors.text}
                      size={20}
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={
                      !address?.TERRITORY_ID
                        ? onNoTerritoryFoundPress
                        : handleIncrease
                    }>
                    <Icon
                      name="plus"
                      type="Entypo"
                      color={colors.text}
                      size={20}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.divider} />
        {/* {currentStock > 0 && (
          <View
            style={{
              paddingVertical: 12,
            }}>
            <Text style={styles.quantityLabel}>
              {t('shop.productDetails.unit')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 6,
                gap: 8,
              }}>
              {units.map((unit, index) => (
                <TouchableOpacity
                  onPress={async () => {
                    setItemUnit(unit);
                    await fetchStockByUnit(unit.UNIT_ID);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    borderWidth: itemUnit.UNIT_ID == unit.UNIT_ID ? 2 : 1,
                    borderColor:
                      itemUnit.UNIT_ID == unit.UNIT_ID
                        ? colors.primary
                        : colors.disable,
                  }}
                  key={`${unit.ID}_${index}`}>
                  <Text style={{fontSize: 14, fontWeight: '500'}}>
                    {unit.UNIT_NAME + ':' + unit.QUANTITY_PER_UNIT}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )} */}
        {/* <View style={styles.divider} /> */}

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>
            {t('shop.productDetails.description')}:
          </Text>
          <View style={styles.descriptionRow}>
            <Text style={[styles.descriptionLabel, { color: colors.heading }]}>
              {t('shop.productDetails.brand')}:
            </Text>
            <Text style={styles.descriptionValue}>
              {item?.BRAND_NAME || ''}
            </Text>
          </View>
          <Text style={[styles.descriptionLabel, { color: colors.heading }]}>
            {t('shop.productDetails.details')}:
          </Text>
          <View style={{ paddingVertical: 5 }}>
            {item?.DESCRIPTION ? (
              <MathJax text={item.DESCRIPTION} />
            ) : (
              <Text style={styles.descriptionValue}>-</Text>
            )}
          </View>
          {item.INVENTORY_DETAILS_IMAGE && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ width: '100%' }}
              onPress={() => {
                setOpenModal({ ...openModal, imageView: true });
              }}>
              <Image
                source={{
                  uri:
                    IMAGE_URL +
                    'InventoryDetailsImage/' +
                    item.INVENTORY_DETAILS_IMAGE,
                }}
                style={{ width: '100%', aspectRatio: 1 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isInCart ? 'Go To Cart' : t('shop.product.addToCart')}
          onPress={
            app.user?.ID == 0
              ? onGuestPress
              :  !address ? addAddress
              : !address?.TERRITORY_ID
              ? onNoTerritoryFoundPress
              :
              addToCart
          }
          loading={loader}
          disabled={currentStock <= 0}
          labelStyle={{
            ...styles.buttonLabel,
            color: currentStock <= 0 ? colors.disable : colors.primary2,
          }}
          style={{
            ...styles.button,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: currentStock <= 0 ? colors.disable : colors.primary2,
          }}
        />
        <Button
          label={t('shop.product.buyNow')}
          onPress={
            //  ()=>{
            //   console.log('app.user?.ID', app.user?.ID);
            //   console.log('address?.TERRITORY_ID', address?.TERRITORY_ID);
            //   console.log('address', address?address:'no address');
            app.user?.ID == 0
              ? onGuestPress
              : !address ? addAddress
               :
                  !address?.TERRITORY_ID
                    ? onNoTerritoryFoundPress
                    : buyNow
            //  }
          }
          loading={loader}
          disabled={currentStock <= 0}
          labelStyle={{
            ...styles.buttonLabel,
            color: currentStock <= 0 ? colors.white : colors.white,
          }}
          style={{
            ...styles.button,
            backgroundColor:
              currentStock <= 0 ? colors.disable : colors.primary2,
          }}
        />
      </View>
      <Loader show={loader} />
      {openModal.imageView && (
        <ImageView
          images={[
            {
              uri:
                IMAGE_URL +
                'InventoryDetailsImage/' +
                item.INVENTORY_DETAILS_IMAGE,
            },
          ]}
          imageIndex={0}
          visible={openModal.imageView}
          onRequestClose={() => {
            setOpenModal({ ...openModal, imageView: false });
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    gap: 16,
    backgroundColor: '#fff',
  },
  header: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  titleContainer: {
    gap: 8,
  },
  title: {
    fontSize: Size.xl,
    fontWeight: '400',
    fontFamily: fontFamily,

    // marginTop:-10

  },
  description: {
    fontSize: 16,
    fontWeight: '500',
  },
  imageSection: {
    gap: 8,
  },
  imageContainer: {
    width: '100%',
    height: 196,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mainImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  thumbnailList: {
    gap: 8,
  },
  thumbnailWrapper: {
    height: 75,
    width: 75,
  },
  thumbnail: {
    width: 75,
    height: 75,
    // borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  priceSection: {
    gap: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#E7E6E6',
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: Size.xl,
    fontWeight: '500',
    fontFamily: fontFamily,
    color: '#2A3B8F',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
    fontFamily: fontFamily,
  },
  savedPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#343434',
    fontFamily: fontFamily,
    marginTop: -12,
  },
  taxInfo: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
    fontFamily: fontFamily,
    paddingBottom: 10,
    marginTop: 5,
  },
  colorSection: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 10,
    justifyContent: 'space-around',
  },
  colorButton: {
    height: 60,
    width: 60,
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: '#F2F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#F2F7FF',
    flexDirection: 'row',
  },
  quantitySection: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  quantityLabel: {
    fontSize: Size.lg,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 15,
  },
  quantityButton: {
    padding: 4,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#0E0E0E',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '500',
    // borderRadius: 6,
    // borderWidth: 1,
    // borderColor: '#000',
    // height: 28,
    // width: 28,
    textAlign: 'center',
    // lineHeight: 28,
    color: '#0E0E0E',
    fontFamily: fontFamily,
  },
  descriptionSection: {
    gap: 6,
    paddingVertical: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  descriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  descriptionValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
