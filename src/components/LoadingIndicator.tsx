import React, {useEffect} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {useTheme} from '../modules';

interface LoadingIndicatorProps {
  size?: number;
  color?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 40,
  color,
}) => {
  const colors = useTheme();
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const startAnimation = () => {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    };

    startAnimation();
    return () => {
      spinValue.setValue(0);
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderColor: color || colors.primary,
            transform: [{rotate: spin}],
          },
        ]}
      />
      <View
        style={[
          styles.innerSpinner,
          {
            width: size * 0.85,
            height: size * 0.85,
            backgroundColor: '#fff',
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: size * 0.15,
            height: size * 0.15,
            backgroundColor: color || colors.primary,
            top: 0,
            left: size * 0.425,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 100,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
  innerSpinner: {
    position: 'absolute',
    borderRadius: 100,
  },
  dot: {
    position: 'absolute',
    borderRadius: 100,
  },
});

export default LoadingIndicator;
