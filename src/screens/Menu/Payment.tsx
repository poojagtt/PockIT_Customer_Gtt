import React from 'react';
import {View, Text, StyleSheet, Image, ScrollView} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {fontFamily, Size, useTheme} from '../../modules';
import {Header, Icon} from '../../components';
import {SafeAreaView} from 'react-native-safe-area-context';
import {t} from 'i18next';

interface PaymentProps extends MenuRoutes<'Payment'> {}
const Payment: React.FC<PaymentProps> = ({navigation}) => {
  const colors = useTheme();
  return (
    <SafeAreaView style={styles._container}>
      <View>
        <Header label={t('Payments')} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{gap: 10, margin: 10}}>
        {/* UIP */}
        <View style={styles._sectionContainer}>
          <Text style={styles._sectionTitle}>UPI</Text>
          <View style={{gap: 10, marginHorizontal: 10, marginTop: 5}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Image
                source={{
                  uri: 'https://img.utdstc.com/icon/d4f/84d/d4f84da5b1339dc1dff493bd53688cae08f84e25252d2efc5dea1acc4cbca274:200',
                  
                }}
                style={styles._icon}
              />
              <Text style={styles._menuItemText}>Paytm UPI</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                gap: 14,
              }}>
              <Image
                source={{
                  uri: 'https://cdn.iconscout.com/icon/free/png-256/free-upi-logo-icon-download-in-svg-png-gif-file-formats--unified-payments-interface-payment-money-transfer-logos-icons-1747946.png',
                }}
                style={styles._icon}
              />
              <Text style={styles._menuItemText}>9999999999@ysil</Text>
              <View style={{marginLeft: 'auto'}}>
                <Icon
                  type="MaterialIcons"
                  name="delete-outline"
                  size={20}
                  color={'#1F5CC7'}
                />
              </View>
            </View>
            <View style={styles._hr} />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Image
                source={{
                  uri: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1e/0e/69/1e0e6987-e72f-5019-2fb8-7a1224ca0e7d/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/1200x600wa.png',
                }}
                style={styles._icon}
              />
              <Text style={styles._menuItemText}>PhonePe</Text>
            </View>
            <View style={styles._hr} />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Image
                source={{
                  uri: 'https://static.toiimg.com/thumb/msid-105399113,width-1280,height-720,resizemode-4/105399113.jpg',
                }}
                style={styles._icon}
              />
              <Text style={styles._menuItemText}>GPay</Text>
            </View>
            <View style={styles._hr} />
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon
                type="Feather"
                name="plus"
                size={35}
                color={colors.primary}
                style={styles._addIcon}
              />
              <Text style={styles._addItemText}>Add new UPI ID</Text>
            </View>
          </View>
        </View>
        {/* cards */}
        <View style={{height: Size['2xl']}} />
        <View style={styles._sectionContainer}>
          <Text style={styles._sectionTitle}>Cards</Text>
          <View style={{gap: 10, marginHorizontal: 10, marginTop: 5}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon
                type="Feather"
                name="plus"
                size={35}
                color={colors.primary}
                style={styles._addIcon}
              />
              <Text style={styles._addItemText}>Add card</Text>
            </View>
          </View>
        </View>

        {/* cash */}
        <View style={{height: Size['2xl']}} />
        <View style={styles._sectionContainer}>
          <Text style={styles._sectionTitle}>Cash</Text>
          <View style={{gap: 10, marginHorizontal: 10, marginTop: 5}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon
                type="Feather"
                name="plus"
                size={35}
                color={colors.primary}
                style={styles._addIcon}
              />
              <Text style={styles._addItemText}>Add</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Payment;
const styles = StyleSheet.create({
  _container: {
    flex: 1,
    // padding: Size.containerPadding,
    backgroundColor: '#F6F8FF',
  },
  _headingTxt: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size['2xl'],
  },
  _sectionContainer: {
    borderWidth: 1,
    borderColor: '#dddbdb',
    margin: 3,
    padding: Size.radius,
    borderRadius: 10,
    // elevation: 5,
    backgroundColor: '#FFF',
  },
  _sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#161616',
  },
  _icon: {
    width: 45,
    height: 45,
  },
  _addIcon: {
    width: 36,
    height: 36,
  },
  _menuItemText: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: fontFamily,
    color: '#6D6D6D',
  },
  _addItemText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: fontFamily,
    color: '#2A3B8F',
  },
  _hr: {
    borderWidth: 0.4,
    borderColor: '#ccc',
    marginHorizontal: -Size.sm,
    marginVertical: 4,
  },
});
