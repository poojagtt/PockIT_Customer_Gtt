import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {
  MainMenu,
  AddressBook,
  Profile,
  Settings,
  Language,
  About,
  TermsAndConditions,
  Licenses,
  Notification,
  HelpAndSupport,
  Payment,
} from '../screens';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import {CreateTickets, Knowledgebase, ManageTickets} from '../screens/Menu';

export type MenuParams = {
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
};
const Menu = createNativeStackNavigator<MenuParams>();

export type MenuRoutes<ScreenName extends keyof MenuParams> =
  CompositeScreenProps<
    NativeStackScreenProps<MenuParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Routes: React.FC = () => {
  return (
    <Menu.Navigator
      initialRouteName="MainMenu"
      screenOptions={{headerShown: false}}>
      <Menu.Screen name={'MainMenu'} component={MainMenu} />
      <Menu.Screen name={'AddressBook'} component={AddressBook} />
      <Menu.Screen name={'Profile'} component={Profile} />
      <Menu.Screen name={'Settings'} component={Settings} />
      {/* <Menu.Screen name={'Language'} component={Language} /> */}
      <Menu.Screen name={'About'} component={About} />
      {/* <Menu.Screen name={'TermsAndConditions'} component={TermsAndConditions} /> */}
      <Menu.Screen name={'Licenses'} component={Licenses} />
      <Menu.Screen name={'Notification'} component={Notification} />
      <Menu.Screen name={'HelpAndSupport'} component={HelpAndSupport} />
      <Menu.Screen name={'Payment'} component={Payment} />
      <Menu.Screen name={'Knowledgebase'} component={Knowledgebase} />
      <Menu.Screen name={'ManageTickets'} component={ManageTickets} />
      <Menu.Screen name={'CreateTickets'} component={CreateTickets} />
    </Menu.Navigator>
  );
};
export default Routes;
