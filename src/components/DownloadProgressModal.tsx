import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import Modal from './Modal';
import Svg, {Circle, Path} from 'react-native-svg';
import {Size, fontFamily, useTheme} from '../modules';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface DownloadProgressModalProps {
  visible: boolean;
  progress: number;
  onClose: () => void;
}

const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  visible,
  progress,
  onClose,
}) => {
  const {t} = useTranslation();
  const colors = useTheme();
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const pathLength = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (progress === 100) {
      scale.value = withSequence(
        withTiming(0.8, {duration: 200}),
        withTiming(1.1, {duration: 200}),
        withTiming(1, {duration: 200}),
      );
      pathLength.value = withDelay(
        200,
        withTiming(1, {
          duration: 600,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        }),
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [progress, onClose]);

  const animatedTickProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(
      circumference - pathLength.value * circumference,
      {duration: 300},
    ),
  }));

  const renderContent = () => {
    if (progress === 100) {
      return (
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{scale: scale}],
            },
          ]}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedPath
              d={`M${size * 0.3},${size * 0.5} L${size * 0.45},${
                size * 0.65
              } L${size * 0.7},${size * 0.35}`}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={circumference}
              animatedProps={animatedTickProps}
            />
          </Svg>
          <Text style={styles.downloadingText}>
            {t('downloadModal.downloadSuccess')}
          </Text>
        </Animated.View>
      );
    }

    if (progress > 0) {
      return (
        <View style={styles.container}>
          <Svg width={size} height={size}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E5E5"
              strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <Text style={styles.progressText}>{`${Math.round(progress)}%`}</Text>
          <Text style={styles.downloadingText}>
            {t('downloadModal.downloading')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ActivityIndicator size={'large'} color={colors.primary} />
      </View>
    );
  };

  return (
    <Modal
      show={visible}
      onClose={onClose}
      containerStyle={{
        padding: Size.xl,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      {renderContent()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  progressText: {
    position: 'absolute',
    fontSize: 24,
    fontFamily: fontFamily,
    fontWeight: '600',
    color: '#092B9C',
    top: '45%',
  },
  downloadingText: {
    
    marginTop: Size.lg,
    fontSize: 16,
    fontFamily: fontFamily,
    color: '#333333',
  },
});

export default DownloadProgressModal;
