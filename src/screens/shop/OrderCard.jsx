import {View, Text} from 'react-native';
import {useTheme} from '../../modules';
import {useTranslation} from 'react-i18next';

const OrderCard = ({orderDetails}) => {
  const colors = useTheme();
  const {t} = useTranslation();

  const getStatusTranslation = status => {
    switch (status) {
      case 'P':
        return t('shop.orderCard.status.pending');
      case 'OA':
        return t('shop.orderCard.status.accepted');
      case 'OR':
        return t('shop.orderCard.status.rejected');
      case 'ON':
        return t('shop.orderCard.status.prepared');
      case 'OK':
        return t('shop.orderCard.status.packed');
      case 'OD':
        return t('shop.orderCard.status.dispatched');
      case 'OS':
        return t('shop.orderCard.status.delivered');
      default:
        return t('shop.orderCard.status.cancelled');
    }
  };

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <View
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#f3f4f6',
              borderRadius: 16,
            }}
          />
          <View>
            <Text style={{color: '#1f2937', fontSize: 16, fontWeight: '700',fontFamily: fontFamily}}>
              {orderDetails.NAME}
            </Text>
            <Text style={{fontSize: 12, fontWeight: '500', color: '#4b5563',fontFamily: fontFamily}}>
              {t('shop.orderCard.orderId')} : {orderDetails.ORDER_NUMBER}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          borderColor: colors.disable,
          borderBottomWidth: 1,
          marginBottom: 16,
        }}
      />
      {/* Status and delivery info */}
      <View style={{gap: 8}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{color: '#4b5563',fontFamily: fontFamily}}>{t('shop.orderCard.status')}</Text>
          <View
            style={{
              backgroundColor: '#f3f4f6',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
            }}>
            <Text style={{fontSize: 12, color: '#4b5563',fontFamily: fontFamily}}>
              {getStatusTranslation(orderDetails.ORDER_STATUS)}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={{color: '#4b5563',fontFamily: fontFamily}}>
            {t('shop.orderCard.deliveryBy')}
          </Text>
          <Text style={{color: '#1f2937',fontFamily: fontFamily}}>
            {orderDetails.ESTIMATED_DATE_TIME}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
