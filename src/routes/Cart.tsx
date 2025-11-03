import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {CartList, SlotSelection, Overview} from '../screens';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import {useSelector} from '../context';
import {
  PlaceOrder,
  OrderOverview,
  CartList as CartListP,
} from '../screens/shop';
import {AddressBook} from '../screens';
import GuestCartScreen from '../screens/cart/GuestCartScreen';

export type CartParams = {
  CartList: undefined;
  SlotSelection: {
    cartId: number;
    services: ServicesInterface[];
  };
  Overview: {
    cartId: number;
  };
  PlaceOrder: {cartId: number};
  OrderOverview: {orderId: number};
  AddressBook: {
    cartId: {id: number | null; type: string | null};
  };
};
const CartStack = createNativeStackNavigator<CartParams>();

export type CartRoutes<ScreenName extends keyof CartParams> =
  CompositeScreenProps<
    NativeStackScreenProps<CartParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;

const Cart: React.FC<any> = ({navigation}) => {
 
  const {type} = useSelector(state => state.cart);
  const {user} = useSelector(state => state.app);
   useEffect(() => {
  if (type && type !== '') {
    setCartType(type);
  }
}, [type]);
  const [cartType, setCartType] = useState(type);

  if (user?.ID == 0) {
    return <GuestCartScreen navigation={navigation} />;
  } else {
    return (
      <CartStack.Navigator
        initialRouteName="CartList"
        screenOptions={{headerShown: false}}>
        <CartStack.Screen
          name="CartList"
          component={cartType === 'P' ? CartListP : CartList}
        />
        <CartStack.Screen name="SlotSelection" component={SlotSelection} />
        <CartStack.Screen name="Overview" component={Overview} />
        <CartStack.Screen name="PlaceOrder" component={PlaceOrder} />
        <CartStack.Screen name="OrderOverview" component={OrderOverview} />
        <CartStack.Screen name="AddressBook" component={AddressBook} />
      </CartStack.Navigator>
    );
  }
};
export default Cart;
