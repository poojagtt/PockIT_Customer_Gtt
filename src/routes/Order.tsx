import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import {
  OrderList,
  OrderPreview,
  MultiJobs,
  JobDetails,
  CancelOrder,
  PartDetailsList,
  RescheduleOrder,
  SelectDateTime,
  PaymentSummary,
  ChatScreen,
} from '../screens';

import OrderOverview from '../screens/shop/OrderOverview';
import CancelOrderS from '../screens/shop/CancelOrderS';
import GuestOrderScreen from '../screens/order/GuestOrderScreen';
import {OrderCreateTicket, Orderticket} from '../screens/order';

export type OrderParams = {
  OrderList: {
    currentTab?: 'service' | 'product';
  };
  OrderPreview: {
    item: orderList;
  };
  MultiJobs: {
    item: orderList;
  };
  JobDetails: {
    jobItem: orderDetails;
    // item: orderDetails;
  };
  CancelOrder: {
    item: orderList;
  };
  PartDetailsList: {
    jobItem: orderDetails;
    onSuccess?: () => void;
  };
  RescheduleOrder: {
    item: orderList;
    services: orderDetails[];
  };
  SelectDateTime: {
    services: orderDetails[];
    selectedReasons: any[];
    comment: string;
  };
  PaymentSummary: {
    jobItem: orderDetails;
    pendingPaymentsData: PaymentRecord;
    onSuccess: () => void;
  };
  ChatScreen: {
    jobItem: orderDetails;
  };
  OrderOverview: {
    orderId: number;
    OrderDataDetails:orderList;
  };
  CancelOrderS: {
    item: orderList;
  };
  Orderticket: {
    jobItem: orderDetails;
    orderId: number;
    type: string;
  };
  OrderCreateTicket: {
    ticketGroup: number;
    jobItem: orderDetails | orderList;
    type: string;
    orderId: number;
  };
};
const OrderStack = createNativeStackNavigator<OrderParams>();

export type OrderRoutes<ScreenName extends keyof OrderParams> =
  CompositeScreenProps<
    NativeStackScreenProps<OrderParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Orders: React.FC<any> = ({navigation}) => {
  return (
    <OrderStack.Navigator
      initialRouteName="OrderList"
      screenOptions={{headerShown: false}}>
      <OrderStack.Screen name="OrderList" component={OrderList} />
      <OrderStack.Screen name="OrderPreview" component={OrderPreview} />
      <OrderStack.Screen name="MultiJobs" component={MultiJobs} />
      <OrderStack.Screen name="JobDetails" component={JobDetails} />
      <OrderStack.Screen name="CancelOrder" component={CancelOrder} />
      <OrderStack.Screen name="PartDetailsList" component={PartDetailsList} />
      <OrderStack.Screen name="RescheduleOrder" component={RescheduleOrder} />
      <OrderStack.Screen name="SelectDateTime" component={SelectDateTime} />
      <OrderStack.Screen name="PaymentSummary" component={PaymentSummary} />
      <OrderStack.Screen name="ChatScreen" component={ChatScreen} />
      <OrderStack.Screen name="OrderOverview" component={OrderOverview} />
      <OrderStack.Screen name="CancelOrderS" component={CancelOrderS} />
      <OrderStack.Screen name="Orderticket" component={Orderticket} />
      <OrderStack.Screen
        name="OrderCreateTicket"
        component={OrderCreateTicket}
      />
    </OrderStack.Navigator>
  );
  // }
};
export default Orders;
