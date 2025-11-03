import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {Login, Registration} from '../screens';
import {NavigationContainer} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type AuthParams = {
  Login: undefined;
  Registration: undefined;
};
const AuthStack = createNativeStackNavigator<AuthParams>();

export type AuthRoutes<ScreenName extends keyof AuthParams> =
  NativeStackScreenProps<AuthParams, ScreenName>;

const Auth: React.FC = () => {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <AuthStack.Navigator
        initialRouteName="Login"
        screenOptions={{headerShown: false}}>
          
        <AuthStack.Screen name="Login" component={Login} />
        <AuthStack.Screen name="Registration" component={Registration} />
      </AuthStack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};
export default Auth;
