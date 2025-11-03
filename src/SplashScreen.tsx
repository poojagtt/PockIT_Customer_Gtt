// import React, { useEffect } from 'react';
// import {
//   Image,
//   SafeAreaView,
//   StyleSheet,
//   View,
//   Dimensions,
// } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withDelay,
//   Easing,
//   runOnJS,
// } from 'react-native-reanimated';
// import { AppLogo } from './assets'; // your left logo
// import { Reducers, useDispatch } from './context';
// const PockitLogo2 = require('./assets/images/PokitEngginers2.png'); // right logo
// const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png'); // bottom image

// const SCREEN_WIDTH = Dimensions.get('window').width;

// const SplashScreen = () => {
//   // Animation shared values
//   const pokitTranslateX = useSharedValue(0);
//   const pokitOpacity = useSharedValue(1);

//   const appLogoTranslateX = useSharedValue(0);
//   const appLogoScale = useSharedValue(1);

//   const bottomMoveUp = useSharedValue(40); // start below visible (40 px down)
//   const bottomOpacity = useSharedValue(0); // initially invisible

//   const dispatch = useDispatch();

//   // Wrap dispatch call in a normal JS function for runOnJS
//  const triggerDispatch = async () => {
//   try {
//     await dispatch(Reducers.getUserInfo()); // wait for the async call
//     // you can navigate or show next screen here
//   } catch (error) {
//     console.error('User info fetch failed', error);
//     // optionally show retry or error UI
//   }
// };

//   useEffect(() => {
//     setTimeout(() => {
//       // Animate right logo slide & fade out
//       pokitTranslateX.value = withTiming(150, { duration: 700, easing: Easing.out(Easing.exp) });
//       pokitOpacity.value = withTiming(0, { duration: 700 });

//       // Animate left logo slide to center
//       appLogoTranslateX.value = withTiming(46, { duration: 700, easing: Easing.out(Easing.exp) }, () => {
//         // After sliding finishes, scale up appLogo more
//         appLogoScale.value = withTiming(1.9, { duration: 500 });
//       });

//       // Animate bottom image move up and fade in after a delay, then dispatch after done
//       bottomMoveUp.value = withDelay(
//         1500,
//         withTiming(
//           0,
//           { duration: 600, easing: Easing.out(Easing.exp) },
//           (isFinished) => {
//             if (isFinished) {
//               // Use runOnJS to safely call dispatch on JS thread
//               runOnJS(triggerDispatch)();
//             }
//           }
//         )
//       );
//       bottomOpacity.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) }));
//     }, 1000);
//   }, []);

//   const pokitStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: pokitTranslateX.value }],
//     opacity: pokitOpacity.value,
//   }));

//   const appLogoStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: appLogoTranslateX.value },
//       { scale: appLogoScale.value },
//     ],
//   }));

//   const bottomImageStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: bottomMoveUp.value }],
//     opacity: bottomOpacity.value,
//   }));

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.logoRow}>
//         <Animated.Image
//           source={AppLogo}
//           style={[styles.appLogo, appLogoStyle]}
//           resizeMode="contain"
//         />
//         <Animated.View style={[styles.pokitWrapper, pokitStyle]}>
//           <Image
//             source={PockitLogo2}
//             style={styles.pokitLogo}
//             resizeMode="contain"
//           />
//         </Animated.View>
//       </View>

//       <Animated.View style={[styles.bottomImageWrapper, bottomImageStyle]}>
//         <Image
//           source={PokitItengineerscolor}
//           style={styles.bottomImage}
//           resizeMode="contain"
//         />
//       </Animated.View>
//     </SafeAreaView>
//   );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   logoRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: -50,
//     width: 172, // total width for 2 logos + gap (80 + 12 + 80)
//   },
//   appLogo: {
//     width: 90,
//     height: 90,
//   },
//   pokitWrapper: {
//     width: 80,
//     height: 80,
//     marginLeft: 12,
//   },
//   pokitLogo: {
//     width: 90,
//     height: 90,
//   },
//   bottomImageWrapper: {
//     position: 'absolute',
//     bottom: 20, // 20 px above bottom edge
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   bottomImage: {
//     width: 150,
//     height: 40,
//   },
// });









import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { AppLogo, AppLogo1 } from './assets'; // your left logo
import { Reducers, useDispatch } from './context';
import { apiCall, fontFamily, Size, useTheme } from './modules';
import DeviceInfo from 'react-native-device-info';
const PockitLogo2 = require('./assets/images/PokitEngginers2.png'); // right logo
const PokitItengineerscolor = require('./assets/images/PokitItengineerscolor.png'); // bottom image

const SCREEN_WIDTH = Dimensions.get('window').width;

const SplashScreen = () => {
  // Animation shared values
  const pokitTranslateX = useSharedValue(0);
  const pokitOpacity = useSharedValue(1);
  const colors = useTheme();

  const appLogoTranslateX = useSharedValue(0);
  const appLogoScale = useSharedValue(1);

  const bottomMoveUp = useSharedValue(40); // start below visible (40 px down)
  const bottomOpacity = useSharedValue(0); // initially invisible

  const dispatch = useDispatch();

  // Wrap dispatch call in a normal JS function for runOnJS
 const triggerDispatch = async () => {
  try {
    await dispatch(Reducers.getUserInfo()); // wait for the async call
    // you can navigate or show next screen here
  } catch (error) {
    console.error('User info fetch failed', error);
    // optionally show retry or error UI
  }
};
const checkVersion = async () => {
  try {
    const version = DeviceInfo.getVersion();
    const res = await apiCall.post(`globalSetting/getVersion`);
    const { CUR_VERSION } = res.data.data[0].CUSTOMER_CUR_VERSION;
  console.log("res.data.data[0].CUSTOMER_CUR_VERSION <= version",res.data.data[0].CUSTOMER_CUR_VERSION)
  console.log("version",version)


    if (res.data.data[0].CUSTOMER_CUR_VERSION <= version) {
      setIsVersionOK(true); // ✅ Safe to continue
    } 
    // else if (MIN_VERSION <= version) {
    //   setVersionManager({
    //     visible: true,
    //     isForce: false,
    //     message: `A new version is available. Please update.`,
    //   });
    // } 
    else {
      setVersionManager({
        visible: true,
        isForce: true,
        message: `A update is required to continue using the app.`,
      });
    }
  } catch (err) {
    console.error('Version check failed', err);
    // you might want to allow the app to continue in case of error
    setIsVersionOK(true);
  }
};

useEffect(()=>{
  checkVersion();
},[])
const [isVersionOK, setIsVersionOK] = useState(false);

// const checkVersion: () => Promise<void> = async () => {
//     return new Promise((resolve, reject) => {
//       const version = DeviceInfo.getVersion();
//       apiCall
//         .post(`globalSetting/getVersion`)
//         .then(res => {
//           console.log("version response",res.data.data)
//           const {CUR_VERSION, MIN_VERSION} = res.data.data[0];
//           if (CUR_VERSION <= version) {
//             resolve();
//           } else if (MIN_VERSION <= version) {
//             setVersionManager({
//               ...versionManager,
//               isForce: false,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           } else {
//             setVersionManager({
//               ...versionManager,
//               isForce: true,
//               visible: true,
//               message: `New version is available please update`,
//             });
//             reject(null);
//           }
//         })
//         .catch(function (error) {
//           let message = '';
//           if (error.code) {
//             message = error.message;
//           } else if (error.message) {
//             message = error.message;
//           } else {
//             message = `Sorry for your inconvenience`;
//           }
//           reject(message);
//         });
//     });
//   };
const handleUpdate = () => {
 
  const storeUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/in/app/pockit/id6745779480'
      : 'https://play.google.com/store/apps/details?id=com.pockitcust';

  Linking.openURL(storeUrl).catch(err =>
    console.error('Failed to open app store:', err),
  );
};
  useEffect(() => {
    if (!isVersionOK) return;
    setTimeout(() => {
      // Animate right logo slide & fade out
      pokitTranslateX.value = withTiming(150, { duration: 700, easing: Easing.out(Easing.exp) });
      pokitOpacity.value = withTiming(0, { duration: 700 });

      // Animate left logo slide to center
      appLogoTranslateX.value = withTiming(46, { duration: 700, easing: Easing.out(Easing.exp) }, () => {
        // After sliding finishes, scale up appLogo more
        appLogoScale.value = withTiming(1.9, { duration: 500 });
      });

      // Animate bottom image move up and fade in after a delay, then dispatch after done
      bottomMoveUp.value = withDelay(
        1500,
        withTiming(
          0,
          { duration: 600, easing: Easing.out(Easing.exp) },
          (isFinished) => {
            if (isFinished) {
              // Use runOnJS to safely call dispatch on JS thread
              runOnJS(triggerDispatch)();
            }
          }
        )
      );
      bottomOpacity.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) }));
    }, 1000);
  }, [isVersionOK]);

  const pokitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pokitTranslateX.value }],
    opacity: pokitOpacity.value,
  }));

  const appLogoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: appLogoTranslateX.value },
      { scale: appLogoScale.value },
    ],
  }));

  const bottomImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomMoveUp.value }],
    opacity: bottomOpacity.value,
  }));
const [versionManager, setVersionManager] = useState({
    visible: false,
    isForce: false,
    message: '',
  });
  return versionManager.visible?(
     
        <View style={styles._modalContainer}>
          <View style={styles._modalContent}>
            <Image
              source={AppLogo1}
              style={{width: '100%'}}
              resizeMode={'contain'}
            />
          </View>
          <View style={styles._txtContainer}>
            <Text style={styles._txt}>Here is New Version Available</Text>
            <Text style={styles._txt}>{versionManager.message}</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 30,
              gap: 20,
              paddingHorizontal: 20,
            }}>
            {versionManager.isForce ? null : (
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  gap: 10,
                  backgroundColor: '#585858',
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: 24,
                    textAlign: 'center',
                    color: '#E9E9E9',
                    padding: 15,
                  }}>
                  {'Remind Me Later'}
                </Text>
                <ActivityIndicator
                  style={{
                    position: 'absolute',
                    right: Size.padding * 2,
                    alignSelf: 'center',
                  }}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
            onPress={()=>{handleUpdate()}}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                borderRadius: 8,
                // gap: 10,
                backgroundColor: colors.primary,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '500',
                  letterSpacing: 0.69,
                  color: colors.white,
                  fontFamily: fontFamily,
                }}>
                Update
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  right: Size.padding * 2,
                  alignSelf: 'center',
                  fontFamily: fontFamily,
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
     
  ):
   (
     <SafeAreaView style={styles.container}>
      <View style={styles.logoRow}>
        <Animated.Image
          source={AppLogo}
          style={[styles.appLogo, appLogoStyle]}
          resizeMode="contain"
        />
        <Animated.View style={[styles.pokitWrapper, pokitStyle]}>
          <Image
            source={PockitLogo2}
            style={styles.pokitLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomImageWrapper, bottomImageStyle]}>
        <Image
          source={PokitItengineerscolor}
          style={styles.bottomImage}
          resizeMode="contain"
        />
      </Animated.View>

      
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    width: 172, // total width for 2 logos + gap (80 + 12 + 80)
  },
  appLogo: {
    width: 90,
    height: 90,
  },
  pokitWrapper: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
  pokitLogo: {
    width: 90,
    height: 90,
  },
  bottomImageWrapper: {
    position: 'absolute',
    bottom: 20, // 20 px above bottom edge
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomImage: {
    width: 150,
    height: 40,
  },
   _modalContainer: {
    paddingHorizontal:16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  _modalContent: {
    width: '40%',
    height: '20%',
    backgroundColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  _txtContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  _txt: {
    fontFamily: fontFamily,
    textAlign: 'center',
    fontSize: 20,
  },
  _bottomTextContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
  },
});
