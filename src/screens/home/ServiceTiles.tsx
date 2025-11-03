import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {Icon} from '../../components';
import moment from 'moment';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_defaultImage} from '../../assets';
import {_styles} from '../../modules/stylesheet';
import {useTranslation} from 'react-i18next';

interface ServiceTilesProps {
  item: ServicesInterface;
  onPress?: () => void;
  onCreate: (value: number) => void;
  updateQty: (value: number) => void;
  onDelete?: boolean;
}
const ServiceTiles: React.FC<ServiceTilesProps> = ({
  item,
  onPress,
  onCreate,
  onDelete,
  updateQty,
}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {territory, user} = useSelector(state => state.app);
  // const timeFormat = (h: number, m: number) =>
  //   useMemo(() => {
  //     let hours = h;
  //     let minutes = ('00' + m).slice(-2);
  //     return `${hours} hr ${minutes} min`;
  //   }, [item]);
  const convertToMinutes = (hours: number, minutes: number): number => {
    return hours * 60 + minutes;
  };
  const formatTime = (start: string, end: string) =>
    useMemo(() => {
      let starting = moment(start, 'HH:mm:ss').format('hh:mm A');
      let ending = moment(end, 'HH:mm:ss').format('hh:mm A');
      return starting + ' - ' + ending;
    }, [item]);
  const getTotalPrice = useMemo(() => {
    if (item.TOTAL_PRICE) {
      return Number(item.TOTAL_PRICE);
    } else {
      let qty = Number(item.QUANTITY ? item.QUANTITY : 1);
      return item.PRICE * qty;
    }
  }, [item]);

  const styles = StyleSheet.create({
    quantityButton: {
      width: 30,
      height: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Size.radius,
    },
  });
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress ? onPress : () => {}}
      onLongPress={() => console.log(item)}
      style={{
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        borderColor: `#E7E6E6`,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 6,
        elevation: 2,
      }}>
      <View style={{alignItems: 'center', gap: 8, flexDirection: 'row'}}>
        <View
          style={{
            height: 60,
            width: 60,
            borderRadius: 30,
            backgroundColor: '#f4f9f5',
            padding: 12,
          }}>
          <Image
            style={{
              width: '100%',
              height: '100%',
            }}
            defaultSource={_defaultImage}
            source={
              item.SERVICE_IMAGE
                ? {
                    uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
        </View>
        {territory?.IS_EXPRESS_SERVICE_AVAILABLE && item.IS_EXPRESS ? (
          <Text
            style={{
              position: 'absolute',
              top: 1,
              right: 0,
              paddingHorizontal: 8,
              paddingVertical: 0,
              backgroundColor: colors.primary,
              borderRadius: 20,
              color: colors.background,
              fontSize: 10,
              fontFamily: fontFamily,
            }}>
            {t('serviceList.express')}
          </Text>
        ) : null}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
          }}>
          <View>
            <Text
              style={{
                paddingHorizontal: 8,
                fontFamily: fontFamily,
                fontSize: 16,
                fontWeight: 500,
                color: colors.text,
                opacity: 0.8,
                paddingRight:
                  territory?.IS_EXPRESS_SERVICE_AVAILABLE && item.IS_EXPRESS
                    ? 20
                    : 8,
              }}
              numberOfLines={2}>
              {item.SERVICE_NAME}
            </Text>
          </View>

          {user?.CUSTOMER_TYPE == 'I' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Size.padding,
                paddingHorizontal: 8,
                marginTop: 8,
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#636363',
                }}>
                {t('serviceTiles.baseprice')}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 400,
                  color: colors.text,
                  opacity: 0.8,
                }}>
                {'₹' + getTotalPrice.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Size.padding,
              paddingHorizontal: 8,
              marginTop: 4,
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 400,
                color: '#636363',
              }}>
              {user?.CUSTOMER_TYPE == 'B'
                ? t('serviceTiles.sla')
                : t('serviceTiles.estimatetime')}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 400,
                color: colors.text,
                opacity: 0.8,
              }}>
              {`${convertToMinutes(
                item.DURARTION_HOUR,
                item.DURARTION_MIN,
              )} Min`}

              {/* {timeFormat(item.DURARTION_HOUR, item.DURARTION_MIN)} */}
            </Text>
          </View>

          {Number(item.SERVICE_RATING) !== 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Size.padding,
                paddingHorizontal: 8,
                marginTop: 4,
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#636363',
                }}>
                {t('serviceTiles.rating')}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {Number(item.SERVICE_RATING) !== 0 && (
                  <View style={{marginTop: 4}}>
                    <Icon name="star" type="EvilIcons" color="#F36631" />
                  </View>
                )}
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontSize: 14,
                    fontWeight: 400,
                    color: colors.text,
                    opacity: 0.8,
                    marginLeft: 6,
                    marginTop: 3,
                  }}>
                  {Number(item.SERVICE_RATING) === 0
                    ? 'No rating yet'
                    : item.SERVICE_RATING}
                </Text>
              </View>
            </View>
          )}
        </View>

        {onDelete ? (
          <View style={{left: 5}}>
            <Icon
              name="delete-outline"
              type="MaterialIcons"
              color={colors.background}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                dispatch(
                  Reducers.deleteCartItem({
                    SERVICE_ID: item.SERVICE_ID,
                  }),
                );
              }}
            />
          </View>
        ) : null}
        <View>
          <Icon
            type="Feather"
            name={'chevron-right'}
            size={23}
            color={'#636363'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};
export default ServiceTiles;
