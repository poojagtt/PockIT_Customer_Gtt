import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {Reducers, useDispatch, useSelector} from '../../context';
import {
  Size,
  tokenStorage,
  useStorage,
  useTheme,
  fontFamily,
} from '../../modules';
import {CartRoutes} from '../../routes/Cart';
import {Header, Icon, AddressCard} from '../../components';
import {_noData} from '../../assets';
import {useTranslation} from 'react-i18next';
import {resetAndNavigate} from '../../utils';
import CartItem from './CartItem';

interface CartListProps extends CartRoutes<'CartList'> {}

const CartList: React.FC<CartListProps> = ({navigation}) => {
  const dispatch = useDispatch();
  const {
    loading,
    cart: cartData,
    cartSummery,
  } = useSelector(state => state.cart);
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const {t} = useTranslation();
  const cart: ServicesInterface[] = cartData ? cartData : [];
  useFocusEffect(
    useCallback(() => {
      dispatch(Reducers.getCartInformation());
    }, []),
  );
  const handleGuestUserAlert = () => {
    Alert.alert(
      t('cart.guestUser.title'),
      t('cart.guestUser.message'),
      [
        {text: t('cart.guestUser.cancel'), onPress: () => {}},
        {
          text: t('cart.guestUser.login'),
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#F6F8FF'}}>
      <View style={{backgroundColor:'white'}}> 
        <Text style={{  
                  alignItems: 'center',
                  fontSize: Size.xl,
                  paddingTop:Size.containerPadding,
                  paddingLeft:Size.containerPadding,
                  paddingBottom:Size.padding,
                  color: colors.black,
                  fontFamily: fontFamily,
                  fontWeight: '500',}}>{t('cart.title')}</Text>
        {/* <Header label={t('cart.title')} onBack={() => navigation.goBack()} /> */}
      </View>

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
      ) : (
        <View style={{flex: 1}}>
          {cartSummery?.ADDRESS_ID ? (
            <View style={{marginTop: Size.containerPadding}}>
              <AddressCard
                onPress={() =>
                  navigation.navigate('AddressBook', {
                    cartId: {
                      id: cart[0].CART_ID,
                      type: 'S',
                    },
                  })
                }
              />
            </View>
          ) : null}
          <FlatList
            contentContainerStyle={{margin: Size.containerPadding}}
            data={cart}
            removeClippedSubviews={false}
            ItemSeparatorComponent={() => (
              <View style={{height: Size.containerPadding}} />
            )}
            renderItem={({item}) => (
              <CartItem
                item={item}
                onPress={() => {
                  if (!user || user.ID == 0) {
                    handleGuestUserAlert();
                  }
                }}
                onDelete={true}
                updateQty={() => {}}
                onCreate={() => {
                  if (!user || user.ID == 0) {
                    handleGuestUserAlert();
                  }
                }}
              />
            )}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '50%',
                  }}>
                  <Text style={[styles.emptyText, {color: colors.text,fontFamily: fontFamily}]}>
                    {t('cart.cartList.cartempty')}
                  </Text>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 14,
                      fontFamily: fontFamily,
                      color: '#CBCBCB',
                      fontWeight: '500',
                    }}>
                    {t('cart.cartList.fillit')}
                  </Text>
                  <View style={{marginTop: 25}}>
                    <TouchableOpacity
                      onPress={() =>
                        // @ts-ignore
                        resetAndNavigate(navigation, 'Home', 'Dashboard')
                      }
                      style={{
                        borderWidth: 1,
                        paddingHorizontal: 50,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderColor: colors.primary2,
                        backgroundColor: '#fff',
                      }}>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          color: colors.primary2,
                          fontSize: 16,
                          fontWeight: '500',
                        }}>
                        {t('cart.cartList.viewall')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            }
            keyExtractor={(item, index) =>
              `category_${item.SERVICE_ID}_${index}`
            }
          />
          {cart.length > 0 && (
            <View style={styles.checkoutContainer}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('SlotSelection', {
                    services: cart,
                    cartId: cart[0].CART_ID,
                  })
                }
                style={[
                  styles.checkoutButton,
                  {backgroundColor: colors.primary2},
                ]}>
                <Text style={styles.checkoutButtonText}>
                  {t('cart.buttons.checkout')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default CartList;

const styles = StyleSheet.create({
  _headerText: {
     fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _divider: {
    height: 3,
    backgroundColor: '#383838',
  },
  checkoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    margin: 16,
  },
  checkoutButton: {
    height: 44,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666666',
  },
  checkoutButtonText: {
fontFamily: fontFamily,    fontSize: 16,
    fontWeight: 400,
    color: '#ffffff',
    opacity: 0.8,
  },
  emptyText: {
    // marginTop: Size.base,
    fontSize: 20,
    fontFamily: 'SF-Pro-Text-Bold',
   
  },
});
