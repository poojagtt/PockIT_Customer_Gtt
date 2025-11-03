import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from './Icon';
import {fontFamily, Size, useTheme} from '../modules';
import {useDispatch, useSelector} from '../context';
import {useTranslation} from 'react-i18next';

interface AddressCardProps {
  onPress: () => void;
}

const AddressCard: React.FC<AddressCardProps> = ({onPress}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const {cartSummery} = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: Size.padding,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.shadow,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    iconContainer: {
      backgroundColor: colors.background,
      padding: 8,
      borderRadius: 8,
      marginRight: 12,
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontFamily: fontFamily,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 4,
    },
    address: {
      fontSize: 13,
      fontFamily: fontFamily,
      color: '#666666',
      lineHeight: 18,
    },
    editIcon: {
      marginLeft: 8,
    },
  });

  return (
    <View style={{marginHorizontal: Size.containerPadding}}>
      <TouchableOpacity style={[styles.container]} onPress={() => onPress()}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Icon
              name={cartSummery?.ADDRESS_TYPE === 'H' ? 'home' : 'briefcase'}
              type="MaterialCommunityIcons"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {cartSummery?.ADDRESS_TYPE === 'H'
                ? t('placeOrder.home')
                : t('placeOrder.office')}
            </Text>
            <Text style={styles.address} numberOfLines={2}>
              {cartSummery?.ADDRESS_LINE_1
                ? cartSummery?.ADDRESS_LINE_1 + ','
                : ''}
              {cartSummery?.ADDRESS_LINE_2 ? cartSummery?.ADDRESS_LINE_2 : ''}
            </Text>
          </View>
        </View>
        <Icon
          name="pencil"
          type="MaterialCommunityIcons"
          size={18}
          color={colors.primary}
          style={styles.editIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default AddressCard;
