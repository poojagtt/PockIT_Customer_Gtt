import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Icon } from '../../../components';
import { fontFamily, Size, useTheme } from '../../../modules';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn, FadeInUp, FadeOut, FadeOutUp, LinearTransition, useDerivedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
const Duration = 300;
const PartDetails = ({ partData }: { partData: partListDetail[] }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const [expandCard, setExpandCard] = useState({
    partDetails: false,
  });

  const rotation = {
    partDetails: useDerivedValue(() => (expandCard.partDetails ? withTiming(270, { duration: Duration }) : withTiming(0, { duration: Duration }))),

  };


  const PapartDetailsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.partDetails.value}deg` }],
  }));

  return (
    <View style={[styles._card, { gap: Size.md }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setExpandCard({
            ...expandCard,
            partDetails: !expandCard.partDetails,
          });
        }}>
        <View style={styles._orderContainer}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon type="Feather" name="box" size={22} color='#2A3B8F' />
            <Text style={styles._detailsTitleTxt}>
              {t('jobDetails.partDetails.title')}
            </Text>
          </View>
          <Animated.View style={PapartDetailsAnimatedStyle}>
            <Icon type="Feather" name="chevron-right" size={23} color={'#636363'} />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {expandCard.partDetails && (
        <View style={{ gap: 5 }}>
          {partData.map((item, index) => {
            return (
              <View key={item.ID} style={{ gap: 4, marginTop: 3 }}>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('jobDetails.partDetails.details.part')}:
                  </Text>
                  <Text style={[styles._value]}>{item.INVENTORY_NAME}</Text>
                </View>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('jobDetails.partDetails.details.type')}:
                  </Text>
                  <Text style={[styles._value]}>
                    {item.INVENTORY_CATEGORY_NAME}
                  </Text>
                </View>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('jobDetails.partDetails.details.status')}:
                  </Text>
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    style={[styles._value]}
                  >
                    {((item.STATUS === 'AC' || item.STATUS === 'AP') && item.IS_RETURNED === 0)
                      ? t('jobDetails.partDetails.details.approved')
                      : ((item.STATUS === 'AC' || item.STATUS === 'AP') && item.IS_RETURNED === 1)
                        ? t('jobDetails.partDetails.details.returned')
                        : t('jobDetails.partDetails.details.rejected')
                    }
                  </Text>
                </View>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('jobDetails.partDetails.details.quantity')}:
                  </Text>
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    style={[styles._value]}>
                    {item.QUANTITY}
                  </Text>
                </View>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('jobDetails.partDetails.details.price')}:
                  </Text>
                  <Text style={[styles._value]}>{item.TOTAL_AMOUNT}</Text>
                </View>
                {index !== partData.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: '#c1bfbf',
                      marginTop: 3,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default PartDetails;

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
    shadowOffset: { width: 0, height: 2 },
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
  _label: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'left',
    color: '#636363',

  },
  _value: {
    flex: 2,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 500,
    color: 'black',
    textAlign: 'right',
  },
  _row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 1,
  },
});
