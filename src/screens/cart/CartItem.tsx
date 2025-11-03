import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import {fontFamily, IMAGE_URL, useTheme} from '../../modules';
import {Icon} from '../../components';
import moment from 'moment';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_defaultImage} from '../../assets';
import {useTranslation} from 'react-i18next';

interface CartItemProps {
  item: ServicesInterface;
  onPress?: () => void;
  onCreate: (value: number) => void;
  updateQty: (value: number) => void;
  onDelete?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({item, onDelete}) => {
  const colors = useTheme();
  const {user} = useSelector((state) => state.app);
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const getTotalPrice = useMemo(() => {
    if (item.TOTAL_PRICE) {
      return Number(item.TOTAL_PRICE);
    } else {
      let qty = Number(item.QUANTITY ? item.QUANTITY : 1);
      return item.PRICE * qty;
    }
  }, [item]);
const convertToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};
  const getFormattedDateTime = useMemo(() => {
    const startTime = moment(item.SERVICE_START_TIME, 'HH:mm:ss');
    const endTime = moment(item.SERVICE_END_TIME, 'HH:mm:ss');
    const date = moment().format('ddd, MMM D');
    return `${date} | ${startTime.format('hh:mm A')} - ${endTime.format(
      'hh:mm A',
    )}`;
  }, [item]);
  const timeFormat = (h: number, m: number) => {
    const hours = h;
    const minutes = ('00' + m).slice(-2);
    return `${hours} hr ${minutes} min`;
  };
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <View>
            <Image
              style={{
                width: 40,
                height: 40,
                borderRadius: 30,
                // backgroundColor: '#D9D9D9',
                backgroundColor: '#F4F7F9',
              }}
              defaultSource={_defaultImage}
              source={
                item.SERVICE_IMAGE
                  ? {
                      uri:
                        IMAGE_URL +
                        'Item/' +
                        item.SERVICE_IMAGE,
                     cache: 'default',
                    }
                  : _defaultImage
              }
            />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: fontFamily,
              color: colors.text,
              fontWeight: '500',
              maxWidth: '70%',
            }}>
            {item.SERVICE_NAME}
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
          onPress={() => {
            if (onDelete) {
              dispatch(
                Reducers.deleteCartItem({
                  SERVICE_ID: item.SERVICE_ID,
                }),
              );
            }
          }}>
          <Icon
            name="trash-outline"
            type="Ionicons"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={{gap: 8}}>
        {user?.CUSTOMER_TYPE == 'I' && (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{color: '#636363', fontSize: 14,fontFamily: fontFamily}}>
              {t('serviceTiles.baseprice')}
            </Text>
            <Text style={{color: colors.text, fontSize: 14,fontFamily: fontFamily}}>
              ₹{getTotalPrice.toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={{color: '#636363', fontSize: 14,fontFamily: fontFamily}}>
            {t('serviceTiles.estimatetime')}
          </Text>
          <Text style={{color: colors.text, fontSize: 14,fontFamily: fontFamily}}>
            {/* {convertToMinutes(item.DURARTION_HOUR, item.DURARTION_MIN)} */}
            {timeFormat(item.DURARTION_HOUR, item.DURARTION_MIN)}
          </Text>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={{color: '#636363', fontSize: 14,fontFamily: fontFamily}}>Qty.</Text>
          <Text style={{color: colors.text, fontSize: 14}}>
            {item.QUANTITY || 1}
          </Text>
        </View>

        <View
          style={{
            marginTop: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
          <Icon name="time-outline" type="Ionicons" size={18} color="#636363" />
          <Text style={{color: '#636363', fontSize: 14,fontFamily: fontFamily}}>
            {getFormattedDateTime}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CartItem;
