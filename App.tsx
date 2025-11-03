// import React from 'react';
// import {KeyboardAvoidingView, Platform, StatusBar, Text, View} from 'react-native';
// import {useSelector} from './src/context';
// import {BASE_URL, useTheme} from './src/modules';
// import SplashScreen from './src/SplashScreen';
// import Routes from './src/routes';
// import Auth from './src/routes/Auth';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   configureReanimatedLogger,
//   ReanimatedLogLevel,
// } from 'react-native-reanimated';
 
// configureReanimatedLogger({
//   level: ReanimatedLogLevel.warn,
//   strict: false,
// });
// import { SafeAreaProvider } from 'react-native-safe-area-context';

 
// type AppProps = {};
// const App: React.FC<AppProps> = () => {
//   const {splash, user} = useSelector(state => state.app);
//   const color = useTheme();
//   const insets = useSafeAreaInsets();
//   console.log(
//     'App insets: ',
//     insets,)

//   return (
//     // <SafeAreaProvider style={{flex: 1, backgroundColor: 'red',}}>
//     //   <KeyboardAvoidingView style={{flex: 1}} behavior={'height'}>
//     //     {/* <View
//     //       style={{
//     //         zIndex: 1000,
//     //         position: 'absolute',
//     //         top: 0,
//     //         alignSelf: 'flex-end',
//     //         paddingVertical: 3,
//     //         opacity: 0.8,
//     //         backgroundColor:
//     //           BASE_URL == 'https://pockitadmin.uvtechsoft.com:8767/'
//     //             ? color.primary
//     //             : color.secondary,
//     //         justifyContent: 'center',
//     //         alignItems: 'center',
//     //         paddingHorizontal: 10,
//     //         borderRadius: 4,
//     //         shadowColor: '#000',
//     //         shadowOffset: {
//     //           width: 0,
//     //           height: 2,
//     //         },
//     //         shadowOpacity: 0.25,
//     //         shadowRadius: 3.84,
//     //         elevation: 5,
//     //       }}>
//     //       <Text
//     //         style={{
//     //           color: '#FFF',
//     //           fontWeight: 'bold',
//     //           fontSize: 12,
//     //         }}>
//     //         Pre Release
//     //       </Text>
//     //     </View> */}
//     //     {splash ? <SplashScreen /> : user ? <Routes /> : <Auth />}
//     //   </KeyboardAvoidingView>
//     // </SafeAreaProvider>

//     <SafeAreaProvider>
//   <SafeAreaView style={{flex: 1,paddingBottom: insets.bottom,backgroundColor:'red'}} edges={['top', 'bottom']}>
//     {/* <KeyboardAvoidingView style={{flex: 1}}   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}> */}
//       {splash ? <SplashScreen /> : user ? <Routes /> : <Auth />}
//     {/* </KeyboardAvoidingView> */}
//   </SafeAreaView>
// </SafeAreaProvider>

//   );
// };
// export default App;


import React from 'react';
import { Platform, StatusBar, Text, TextInput, View } from 'react-native';
import { useSelector } from './src/context';
import { useTheme } from './src/modules';
import SplashScreen from './src/SplashScreen';
import Routes from './src/routes';
import Auth from './src/routes/Auth';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  allowFontScaling: false,
};

// Move this inner logic to a subcomponent so `useSafeAreaInsets()` works properly
const AppContent: React.FC = () => {
  const { splash, user } = useSelector(state => state.app);
  const color = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
        backgroundColor: Platform.OS=='android'? color.primary2:'', // Or 'red' if you're debugging
      }}
      edges={['top']}
    >
      {/* Optional: StatusBar styling */}
      <StatusBar
       translucent={false} 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={color.primary2}
      />
      {/* <SplashScreen /> */}
      {splash ? <SplashScreen /> : user ? <Routes /> : <Auth />}
    </SafeAreaView>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};

export default App;

