import {View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent} from 'react-native';
import React, {useState} from 'react';
import {Icon} from '../../../components';
import {fontFamily, Size, useTheme} from '../../../modules';
import moment from 'moment';
import {useTranslation} from 'react-i18next';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  orderDetails: orderList;
  orderStatus: orderJobStatus[];
}

const Duration = 300;
const OrderStatus = ({orderDetails, orderStatus}: Props) => {
  const {t} = useTranslation();
  const colors = useTheme();
  const [expandCard, setExpandCard] = useState({orderStatus: false});
  const [textHeights, setTextHeights] = useState<number[]>([]);

  // Shared Value for Chevron Rotation
  const rotateValue = useSharedValue(0);

  const handleTextLayout = (index: number, event: LayoutChangeEvent) => {
    const {height} = event.nativeEvent.layout;
    setTextHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  };

  // Animated Rotation Style
  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotateValue.value}deg`}],
  }));

  // Toggle Expand/Collapse
  const toggleExpand = () => {
    const isExpanding = !expandCard.orderStatus;
    rotateValue.value = withTiming(isExpanding ? 270 : 0, {duration: 300});
    setExpandCard({orderStatus: isExpanding});
  };

  return (
    <Animated.View
      layout={LinearTransition.stiffness(45).duration(Duration)}
      style={styles._card}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand}>
        <View style={styles._orderContainer}>
          <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
            <Icon
              type="MaterialCommunityIcons"
              name={'clipboard-text-clock-outline'}
              size={22}
              color={colors.primary}
            />
            <Text style={[styles._detailsTitleTxt]}>
              {t('multiJobs.orderStatus')}
            </Text>
          </View>
          <Animated.View style={animatedChevronStyle}>
            <Icon
              type="Feather"
              name="chevron-right"
              size={23}
              color={'#636363'}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      <View
        style={{
          marginTop: 14,
          padding: Size.padding,
          // borderWidth: 0.5,
          // borderColor: '#E5E5E5',
          borderRadius: 6,
          backgroundColor: '#F4F7F9',
        }}>
        <View style={{flexDirection: 'row', gap: 10}}>
          <Icon
            type="Ionicons"
            name="checkmark-circle-outline"
            size={22}
            color={'#2A3B8F'}
          />
          <Text
            style={[
              styles._detailsTitleTxt,
              {fontWeight: 500, color: colors.primary,fontFamily: fontFamily},
            ]}>
            {orderDetails.ORDER_STATUS_NAME}
          </Text>
        </View>
      </View>
      {expandCard.orderStatus && (
        <View
          style={{
            marginTop: 15,
            marginHorizontal: Size.containerPadding,
          }}>
          {orderStatus.map((item, index) => {
            return (
              <Animated.View
                entering={FadeInUp.stiffness(45).duration(Duration)}
                exiting={FadeOutUp.stiffness(45)}
                key={index}>
                <View style={{flexDirection: 'row', gap: 6, marginBottom: 6}}>
                  <View style={{gap: 2}}>
                    <View style={styles.outerCircle}>
                      <View style={styles.innerCircle} />
                    </View>
                    {index !== orderStatus.length - 1 && (
                      <View
                        style={{
                          width: 1.2,
                          height: textHeights[index] || 20,
                          backgroundColor: colors.primary,
                          marginTop: 6,
                          marginLeft: 7,
                        }}
                      />
                    )}
                  </View>

                  <View style={{gap: 0}}>
                    <Text
                      onLayout={(event) => handleTextLayout(index, event)}
                      style={[
                        styles._detailsTitleTxt,
                        {
                          fontWeight: 400,
                          fontSize: 14,
                         fontFamily: fontFamily,
                          color: colors.primary,
                        },
                      ]}
                      numberOfLines={2}>
                      {item.ORDER_STATUS}
                    </Text>
                    <Text
                      style={[
                        styles._detailsTitleTxt,
                        {
                          fontWeight: 400,
                          fontSize: 11,
                         fontFamily: fontFamily,
                          color: colors.heading,
                        },
                      ]}>
                      {`${moment(item.DATE_TIME).format(
                        'DD MMM YYYY, hh:mm a',
                      )}`}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
};

export default OrderStatus;

const styles = StyleSheet.create({
  _card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  _orderContainer: {
    flexDirection: 'row',
    borderColor: '#fff',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  _detailsTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
  },
  outerCircle: {
    width: 16,
    height: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2A3B8F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#2A3B8F',
  },
});
