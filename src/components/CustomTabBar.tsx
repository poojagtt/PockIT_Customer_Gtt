import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import Svg, {Path, Defs, Filter, FeDropShadow} from 'react-native-svg';
import { fontFamily } from '../modules';

const {width} = Dimensions.get('window');
const height = 60;

const tabBarMargin = 10;
const curvedWidth = width - tabBarMargin * 2;
const tabWidth = curvedWidth / 4;

const CustomTabBar = ({state, descriptors, navigation}) => {
  const translateX = useSharedValue(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // <-- add state

  const hiddenRoutes = ['SearchPage']; // Add any screen names where tab bar should hide

  if (hiddenRoutes.includes(state.routes[state.index].name)) {
    return null;
  }
   useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const insets = useSafeAreaInsets();

  const bottomInset =
    Platform.OS === 'android' && insets.bottom === 0
      ? 10 // or 12, depending on how much space you want
      : insets.bottom;
  useEffect(() => {
    translateX.value = withTiming(state.index * tabWidth + tabBarMargin, {
      duration: 300,
    });
  }, [state.index]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));
  if (keyboardVisible) {
    return null;
  }
  return (
    <View style={[styles.wrapper]}>
      {/* Rounded container with clipping for border radius */}
      <View style={styles.svgWrapper}>
        <Svg width={curvedWidth} height={70}>
          <Defs>
            <Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <FeDropShadow
                dx="0"
                dy="-2"
                stdDeviation="6"
                floodColor="black"
                floodOpacity="0.15"
              />
            </Filter>
          </Defs>
          <Path
            d={getCurvedPath(state.index)}
            fill="#FFFFFF"
            filter="url(#shadow)"
          />
        </Svg>
      </View>

      <Animated.View style={[styles.circleWrapper, animatedStyles]}>
        <View style={styles.circle}>
          {descriptors[state.routes[state.index].key].options.tabBarIcon?.({
            focused: true,
            color: '',
            size: 24,
          })}
        </View>
      </Animated.View>

      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabButton,{ marginBottom:isFocused?-10:0}]}
              activeOpacity={0.7}>
              <View
                style={{
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 10,
                }}>
                {isFocused ? (
                  <View style={{height: 24}} />
                ) : (
                  options.tabBarIcon?.({focused: false, color: '', size: 24})
                )}
              </View>
              {isFocused && (
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontSize: 12,
                    color: isFocused ? '#F36631' : '#999',
                    marginTop: 18,
                    textAlign: 'center',
                  }}>
                  {route.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// function getCurvedPath(index) {
//   const left = index * tabWidth;
//   const curveWidth = tabWidth;
//   const notchDepth = 35;

//   const cp1 = left + 10;
//   const cp2 = left + curveWidth / 2;
//   const cp3 = left + curveWidth - 10;

//   return `
//     M0,0
//     H${left}
//     C${cp1},0 ${cp1},${notchDepth} ${cp2},${notchDepth}
//     C${cp3},${notchDepth} ${cp3},0 ${left + curveWidth},0
//     H${curvedWidth}
//     V80
//     H0
//     Z
//   `;
// }
const notchWidth = tabWidth * 0.9; // Make the curve 60% of a tab, adjust as needed

function getCurvedPath(index) {
  // Center the notch within the tab
  const tabCenter = index * tabWidth + tabWidth / 2;
  const left = tabCenter - notchWidth / 2;
  const curveWidth = notchWidth;
  const notchDepth = 35;

  const cp1 = left + 10;
  const cp2 = left + curveWidth / 2;
  const cp3 = left + curveWidth - 10;

  return `
    M0,0
    H${left}
    C${cp1},0 ${cp1},${notchDepth} ${cp2},${notchDepth}
    C${cp3},${notchDepth} ${cp3},0 ${left + curveWidth},0
    H${curvedWidth}
    V80
    H0
    Z
  `;
}

const styles = StyleSheet.create({
  wrapper: {
    height: 80,
    backgroundColor: '#F5F8FD',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  svgWrapper: {
    position: 'absolute',
    bottom: 0,
    left: tabBarMargin,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    height,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 10,
    marginTop: 10,
    marginHorizontal: tabBarMargin,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
   
  },
  circleWrapper: {
    position: 'absolute',
    top: 0,
    width: tabWidth,
    height: 60,
    alignItems: 'center',
    left: 0,
  },
  circle: {
    width: 50,
    height: 50,
    backgroundColor: '#F36631',
    borderRadius: 29,
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default CustomTabBar;
