import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {
  Dashboard,
  Category,
  ServiceDetails,
  ServiceList,
  SubCategory,
  SlotSelection,
  Overview,
  SearchPage,
  MainMenu,
  AddressBook,
  Profile,
  Settings,
  About,
  Licenses,
  Notification,
  HelpAndSupport,
  Payment,
  PopularBrands,
  ProductList,
  ProductDetails,
} from '../screens';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import NotificationList from '../screens/home/NotificationList';
import {CreateTickets, Knowledgebase, ManageTickets} from '../screens/Menu';
import {CartList, PlaceOrder} from '../screens/shop';
import SubCategories from '../screens/home/SubCategories';
import ServiceListNonService from '../screens/home/ServiceListNonService';
import ServiceListItemsNonService from '../screens/home/ServiceListItemsNonService';

export type HomeParams = {
  Dashboard: undefined;
  Category: {item: TerritoryWiseCategoryInterface[]};
  SubCategory: {item: TerritoryWiseCategoryInterface};
  SubCategories: {item: TerritoryWiseCategoryInterface};

  ServiceList: {
    subCategory: SubCategoryInterface;
    service: ServicesInterface | null;
    path: string[];
  };
  ServiceListNonService: {
    subCategory: SubCategoryInterface;
    service: ServicesInterface | null;
    path: string[];
  };
  ServiceListItemsNonService: {
    subCategory: SubCategoryInterface;
    service: ServicesInterface | null;
  };
  ServiceDetails: {quantity: any; service: ServicesInterface; path: string[]};
  SlotSelection: {
    cartId: number;
    services: ServicesInterface[];
  };
  Overview: {
    cartId: number;
  };
  SearchPage: undefined;
  NotificationList: undefined;
  MainMenu: undefined;
  AddressBook: {
    cartId: {id: number | null; type: string | null};
  };
  Profile: undefined;
  Settings: undefined;
  Language: undefined;
  About: undefined;
  TermsAndConditions: undefined;
  Licenses: undefined;
  Notification: undefined;
  HelpAndSupport: undefined;
  Payment: undefined;
  Knowledgebase: undefined;
  ManageTickets: undefined;
  CreateTickets: {
    ticketGroup: number;
  };
  PopularBrands: undefined;
  ProductList: {
    BRAND: any;
  };
  ProductDetails: {
    item: any;
  };
  CartList: undefined;
  PlaceOrder: {cartId: number};
};
const HomeStack = createNativeStackNavigator<HomeParams>();

export type HomeRoutes<ScreenName extends keyof HomeParams> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Home: React.FC = () => {
  return (
    <HomeStack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Dashboard" component={Dashboard} />
      <HomeStack.Screen name="Category" component={Category} />
      <HomeStack.Screen name="SubCategory" component={SubCategory} />
      <HomeStack.Screen name="SubCategories" component={SubCategories} />

      <HomeStack.Screen name="ServiceList" component={ServiceList} />
      <HomeStack.Screen
        name="ServiceListNonService"
        component={ServiceListNonService}
      />
      <HomeStack.Screen
        name="ServiceListItemsNonService"
        component={ServiceListItemsNonService}
      />

      <HomeStack.Screen name="ServiceDetails" component={ServiceDetails} />
      <HomeStack.Screen name="SlotSelection" component={SlotSelection} />
      <HomeStack.Screen name="Overview" component={Overview} />
      <HomeStack.Screen name="SearchPage" component={SearchPage} />
      <HomeStack.Screen
        name={'NotificationList'}
        component={NotificationList}
      />
      <HomeStack.Screen name="MainMenu" component={MainMenu} />
      <HomeStack.Screen name="AddressBook" component={AddressBook} />
      <HomeStack.Screen name="Profile" component={Profile} />
      <HomeStack.Screen name={'Settings'} component={Settings} />
      <HomeStack.Screen name={'About'} component={About} />
      <HomeStack.Screen name={'Licenses'} component={Licenses} />
      <HomeStack.Screen name={'Notification'} component={Notification} />
      <HomeStack.Screen name={'HelpAndSupport'} component={HelpAndSupport} />
      <HomeStack.Screen name={'Payment'} component={Payment} />
      <HomeStack.Screen name={'Knowledgebase'} component={Knowledgebase} />
      <HomeStack.Screen name={'ManageTickets'} component={ManageTickets} />
      <HomeStack.Screen name={'CreateTickets'} component={CreateTickets} />
      <HomeStack.Screen name="PopularBrands" component={PopularBrands} />
      <HomeStack.Screen name="ProductList" component={ProductList} />
      <HomeStack.Screen name="ProductDetails" component={ProductDetails} />
      <HomeStack.Screen name="CartList" component={CartList} />
      <HomeStack.Screen name="PlaceOrder" component={PlaceOrder} />
    </HomeStack.Navigator>
  );
};
export default Home;
