import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useRef} from 'react';
import Home, {HomeParams} from './routes/Home';
import Order, {OrderParams} from './routes/Order';
import Cart, {CartParams} from './routes/Cart';
import {AppLogo, SVG, _backgroundlogo} from './assets';
import Shops, {ShopParams} from './routes/Shops';
import {Reducers, useDispatch, useSelector} from './context';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import {navigate, navigationRef} from './routes/navigationRef';
import * as Animatable from 'react-native-animatable';
import messaging from '@react-native-firebase/messaging';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
export type TabRoutes = {
  Home: NavigatorScreenParams<HomeParams>;
  Order: NavigatorScreenParams<OrderParams>;
  Cart: NavigatorScreenParams<CartParams>;
  Shop: NavigatorScreenParams<ShopParams>;
};
export type TabProps<ScreenName extends keyof TabRoutes> =
  NativeStackScreenProps<TabRoutes, ScreenName>;

const HomeIcon = ({focused, onPress}: {focused: boolean; onPress: any}) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
    <Image
      source={focused ? _backgroundlogo : AppLogo}
      style={{width: 26, height: 24}}
    />
  </TouchableOpacity>
);

interface TabItemProps {
  isImage?: boolean;
  label: string;
  icon?: React.FC<SvgProps>;
  name: string;
  component: React.ComponentType<any>;
}

const TabArr: TabItemProps[] = [
  {
    name: 'Home',
    component: Home,
    isImage: true,
    label: 'Home',
  },
  {
    name: 'Order',
    component: Order,
    icon: SVG.Orders,
    label: 'Order',
  },
  {
    name: 'Cart',
    component: Cart,
    icon: SVG.Cart,
    label: 'Cart',
  },
  {
    name: 'Shop',
    component: Shops,
    icon: SVG.shopp,
    label: 'Shop',
  },
];

import {SvgProps} from 'react-native-svg';
import CustomTabBar from './components/CustomTabBar';
import {fontFamily} from './modules';

interface TabButtonProps {
  item: TabItemProps;
  onPress: () => void;
  accessibilityState: {selected: boolean};
}

const TabButton: React.FC<TabButtonProps> = ({
  item,
  onPress,
  accessibilityState,
}) => {
  const focused = accessibilityState.selected;
  const viewRef = useRef<Animatable.View & View>(null);
  const circleRef = useRef<Animatable.View & View>(null);
  const textRef = useRef<Animatable.View & View>(null);

  useEffect(() => {
    if (focused) {
      viewRef.current?.animate({
        0: {transform: [{scale: 1}]},
        1: {transform: [{scale: 1.2}]},
      });
      circleRef.current?.animate({
        0: {transform: [{translateY: 0}]},
        1: {transform: [{translateY: -18}]},
      });
      textRef.current?.animate({
        0: {transform: [{translateY: 0}]},
        1: {transform: [{translateY: -18}]},
      });
    } else {
      viewRef.current?.animate({
        0: {transform: [{scale: 1}]},
        1: {transform: [{scale: 1}]},
      });
      circleRef.current?.animate({
        0: {transform: [{translateY: 20}]},
        1: {transform: [{translateY: 10}]},
      });
      textRef.current?.animate({
        0: {transform: [{translateY: -10}]},
        1: {transform: [{translateY: 10}]},
      });
    }
  }, [focused]);

  return (
    <View style={styles.centered}>
      <TouchableOpacity onPress={onPress} activeOpacity={1}>
        <Animatable.View style={styles.btn} ref={viewRef} duration={200}>
          <Animatable.View
            style={[styles.circle, focused && styles.focusedCircle]}
            ref={circleRef}>
            {item.isImage ? (
              <HomeIcon focused={focused} onPress={() => {}} />
            ) : item.name === 'Shop' ? (
              focused ? (
                <SVG.ShopWhite width={22} height={22} />
              ) : (
                <SVG.shopp width={24} height={24} />
              )
            ) : item.icon ? (
              <item.icon
                width={focused ? 22 : 24}
                height={focused ? 22 : 24}
                fill={focused ? '#FDFDFD' : '#2A3B8F'}
                onPress={() => {
                  onPress();
                }}
              />
            ) : null}
          </Animatable.View>
        </Animatable.View>
      </TouchableOpacity>
      {focused && (
        <Animatable.Text
          style={[styles.label, styles.focusedLabel]}
          ref={textRef}>
          {item.label}
        </Animatable.Text>
      )}
    </View>
  );
};

const Routes: React.FC = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(Reducers.getCartInformation());
  }, [dispatch]);

  const handleTabPress = (e: TabItemProps) => {
    const targetRouteName = e.name;
    const mainScreens: {[key: string]: string} = {
      Home: 'Dashboard',
      Order: 'OrderList',
      Cart: 'CartList',
      Menu: 'MainMenu',
      Shop: 'ShopHome',
    };
    const mainScreen = mainScreens[targetRouteName];
    if (mainScreen && navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [
          {
            name: targetRouteName,
            state: {
              routes: [
                {
                  name: mainScreen,
                },
              ],
            },
          },
        ],
      });
    }
  };

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotification(remoteMessage);
        }
      });

    messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotification(remoteMessage);
    });
  }, []);
  const {
    loading,
    cart: cartData,
    cartSummery,
    products,
  } = useSelector(state => state.cart);

  const handleNotification = (remoteMessage: any) => {
    const type = remoteMessage.data?.data3;
    const data = JSON.parse(remoteMessage.data?.data4 as string);
    console.log('\n\n\n..data[0]', data[0]);
    if (type === 'O') {
      data[0]?.ORDER_STATUS === 'OP' ||
      data[0]?.ORDER_STATUS === 'OA' ||
      data[0]?.ORDER_STATUS === 'OR' ||
      data[0]?.ORDER_STATUS === 'CA'
        ? navigate('Order', {screen: 'OrderPreview', params: {item: data[0]}})
        : navigate('Order', {screen: 'MultiJobs', params: {item: data[0]}});
    } else if (type === 'J') {
      data[0]?.ORDER_STATUS === 'OA'
        ? navigate('Order', {screen: 'OrderPreview', params: {item: data[0]}})
        : navigate('Order', {screen: 'JobDetails', params: {jobItem: data[0]}});
    } else if (type === 'S') {
      navigate('Order', {
        screen: 'OrderOverview',
        params: {orderId: data[0].ID || 0},
      });
    } else if (type == 'C') {
      navigate('Order', {screen: 'ChatScreen', params: {jobItem: data}});
    } else if (type == 'I') {
      console.log("here route")
 navigate('Order', {screen: 'PartDetailsList', params: {jobItem: data[0]}});

      // navigate('Order', {screen: 'JobDetails', params: {jobItem: data[0]}});
    } else if (type == 'F') {
      navigate('Order', {screen: 'JobDetails', params: {jobItem: data[0]}});
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
          tabBar={props => <CustomTabBar {...props} />}>
          {TabArr.map((item, index) => (
            <Tab.Screen
              key={index}
              name={item.name}
              component={item.component}
              options={{
                tabBarStyle: {display: 'none'},
                tabBarIcon: ({focused}) =>
                  item.name === 'Cart' ? (
                    <View>
                      <SVG.Cart
                        width={focused ? 22 : 24}
                        height={focused ? 22 : 24}
                        fill={focused ? '#FDFDFD' : '#2A3B8F'}
                      />
                      {((cartData && cartData.length > 0) ||
                        (products && products.length > 0)) && (
                        <View
                          style={{
                            position: 'absolute',
                            right: -6,
                            top: -4,
                            backgroundColor: focused ? '#ffffff' : '#F36631',
                            borderRadius: 8,
                            minWidth: 16,
                            height: 16,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 3,
                          }}>
                          <Text
                            style={{
                              color: focused ? '#F36631' : '#fff',
                              fontSize: 10,
                              fontWeight: '400',
                              fontFamily: fontFamily,
                            }}>
                            {cartData?.length || products?.length || 0}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : item.isImage ? (
                    <HomeIcon
                      focused={focused}
                      onPress={() => handleTabPress(item)}
                    />
                  ) : item.name === 'Shop' ? (
                    focused ? (
                      <SVG.ShopWhite width={24} height={24} />
                    ) : (
                      <SVG.shopp width={26} height={26} />
                    )
                  ) : item.icon ? (
                    <item.icon
                      width={focused ? 22 : 24}
                      height={focused ? 22 : 24}
                      fill={focused ? '#FDFDFD' : '#2A3B8F'}
                    />
                  ) : null,
              }}
              listeners={({navigation, route}) => ({
                tabPress: e => {
                  e.preventDefault();
                  const mainScreens: {[key: string]: string} = {
                    Home: 'Dashboard',
                    Order: 'OrderList',
                    Cart: 'CartList',
                    Shop: 'ShopHome',
                  };
                  const mainScreen = mainScreens[route.name as keyof typeof mainScreens];
                  if (mainScreen) {
                    (navigation as any).reset({
                      index: 0,
                      routes: [
                        {
                          name: route.name,
                          state: {
                            index: 0,
                            routes: [{name: mainScreen}],
                          },
                        },
                      ],
                    });
                  } else {
                    (navigation as any).navigate(route.name);
                  }
                },
              })}
            />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Routes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    height: 60,
    marginBottom: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 5},
    shadowRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  btn: {
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  circle: {
    ...StyleSheet.absoluteFillObject,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  focusedCircle: {
    backgroundColor: '#F36631',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
  },
  focusedBtn: {},
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: 'transparent',
    alignSelf: 'center',
    marginTop: 4,
  },
  focusedLabel: {
    color: '#F36631',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginTop: 48,
  },
});
