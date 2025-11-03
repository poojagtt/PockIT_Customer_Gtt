import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Image, Animated} from 'react-native';
import Icon from './Icon';
import {fontFamily, useTheme} from '../modules';

interface EmptyListProps {
  title?: string;
  message?: string;
  icon?: {
    name: string;
    type: string;
    size?: number;
  };
  image?: any;
}

const EmptyList: React.FC<EmptyListProps> = ({title, message, icon, image}) => {
  const colors = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}>
      {icon ? (
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: colors.primary + '10'},
          ]}>
          <Icon
            name={icon.name}
            type={icon.type as any}
            size={icon.size || 40}
            color={colors.primary}
          />
        </View>
      ) : image ? (
        <Image source={image} style={styles.image} resizeMode="contain" />
      ) : null}
      <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
fontFamily: fontFamily  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
fontFamily: fontFamily  },
});

export default EmptyList;
