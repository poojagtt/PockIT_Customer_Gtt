import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import {
  ProductList,
  ShopHome,
  PopularBrands,
  ProductDetails,
  CartList,
  PlaceOrder,
  OrderOverview,
  CancelOrderS,
} from '../screens/shop';
import {
  About,
  AddressBook,
  HelpAndSupport,
  MainMenu,
  Profile,
  Settings,
} from '../screens';
import {CreateTickets, ManageTickets} from '../screens/Menu';
import LatestAllProduct from '../screens/shop/LatestAllProduct';

export type ShopParams = {
  ShopHome: undefined;
  ProductList: {BRAND: any};
  PopularBrands: undefined;
  ProductDetails: {item: Product};
  CartList: undefined;
  PlaceOrder: {cartId: number};
  OrderOverview: {orderId: number,OrderDataDetails:orderList};
  CancelOrderS: {
    item: orderList;
  };
  AddressBook: {
    cartId: {id: number | null; type: string | null};
  };
  MainMenu: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
  HelpAndSupport: undefined;
  ManageTickets: undefined;
  CreateTickets: {
    ticketGroup: number;
  };
  LatestAllProduct: {
    type:string;
  };
};

const ShopStack = createNativeStackNavigator<ShopParams>();

export type ShopRoutes<ScreenName extends keyof ShopParams> =
  CompositeScreenProps<
    NativeStackScreenProps<ShopParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;

const Shops: React.FC = () => {
  return (
    <ShopStack.Navigator
      initialRouteName="ShopHome"
      screenOptions={{headerShown: false}}>
      {/* Product List Screen */}
      <ShopStack.Screen name="ShopHome" component={ShopHome} />
      <ShopStack.Screen name="ProductList" component={ProductList} />
      <ShopStack.Screen name="PopularBrands" component={PopularBrands} />
      <ShopStack.Screen name="ProductDetails" component={ProductDetails} />
      <ShopStack.Screen name="CartList" component={CartList} />
      <ShopStack.Screen name="PlaceOrder" component={PlaceOrder} />
      <ShopStack.Screen name="OrderOverview" component={OrderOverview} />
      <ShopStack.Screen name="CancelOrderS" component={CancelOrderS} />
      <ShopStack.Screen name="AddressBook" component={AddressBook} />
      <ShopStack.Screen name="MainMenu" component={MainMenu} />
      <ShopStack.Screen name="Profile" component={Profile} />
      <ShopStack.Screen name={'Settings'} component={Settings} />
      <ShopStack.Screen name={'About'} component={About} />
      <ShopStack.Screen name={'HelpAndSupport'} component={HelpAndSupport} />
      <ShopStack.Screen name={'ManageTickets'} component={ManageTickets} />
      <ShopStack.Screen name={'CreateTickets'} component={CreateTickets} />
      <ShopStack.Screen
        name={'LatestAllProduct'}
        component={LatestAllProduct}
      />
    </ShopStack.Navigator>
  );
};

export default Shops;
