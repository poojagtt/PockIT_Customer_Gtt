import {
  View,
  Text,
 
  ScrollView,
  TouchableOpacity,
  TextInput,
 
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, {useEffect, useState} from 'react';
import {apiCall, fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import {useSelector} from '../../context';
import {Button, Icon, Header, Loader} from '../../components';
import {Checkbox} from 'react-native-paper';
import {Modal} from 'react-native';
import moment from 'moment';
import {OrderRoutes} from '../../routes/Order';
import {useTranslation} from 'react-i18next';
import Toast from '../../components/Toast';

interface OrderCancelProps extends OrderRoutes<'CancelOrder'> {}

const CancelOrder: React.FC<OrderCancelProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const {item} = route.params;
  const {user} = useSelector(state => state.app);
  const [selectedReasons, setSelectedReasons] = useState<any>([]);
  const [loader, setLoader] = useState(false);
  const [comment, setComment] = useState('');
  const [reasonsData, setReasonsData] = useState<CancelReason[]>([]);
  const [openModal, setOpenModal] = useState({
    confirm: false,
  });

  const toggleReason = (item: CancelReason) => {
    const alreadySelected = selectedReasons.some(
      (reason: CancelReason) => reason.ID === item.ID,
    );

    if (alreadySelected) {
      setSelectedReasons(
        selectedReasons.filter((reason: CancelReason) => reason.ID !== item.ID),
      );
    } else {
      setSelectedReasons([...selectedReasons, item]);
    }
  };

  useEffect(() => {
    getCancellationReason();
  }, []);

  const getCancellationReason = async () => {
    setLoader(true);

    try {
      const res = await apiCall.post('api/cancleOrderReason/get', {
        filter: ` AND IS_ACTIVE = 1 AND TYPE = 'CO' AND REASON_FOR='S'`,
        sortKey:'ID',
        sortValue:'asc'
      });

      if (res.status === 200 && res.data.code === 200) {
        setReasonsData(res.data.data);
      }
    } catch (error) {
      console.warn('Error fetching reasons:', error);
    } finally {
      setLoader(false);
    }
  };
  const cancelOrder = () => {
    setLoader(true);
    try {
      const body = {
        REQUESTED_DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
        CUSTOMER_ID: user?.ID,
        ORDER_ID: item.ID,
        PAYMENT_ID: null,
        CANCELLED_BY: null,
        CANCEL_DATE: null,
        REASON: selectedReasons
          .map((item: CancelReason) => item.REASON)
          .join(', '),
        REMARK: '',
        CUSTOMER_REMARK: comment,
        REFUND_STATUS: 'P',
        CLIENT_ID: 1,
        REFUNDED_DATE: null,
        PAYMENT_REFUND_STATUS: null,
        ORDER_CREATED_BY:item.ORDER_CREATED_BY,
        ORDER_CREATER_ID:item.ORDER_CREATER_ID,
      };
      apiCall
        .post('api/ordercancellationtransactions/create', body)
        .then(res => {
          if (res.data.code == 200) {
            setLoader(false);
            setOpenModal({...openModal, confirm: false});
            navigation.replace('OrderList', {});
          }
        })
        .catch(err => {
          setOpenModal({...openModal, confirm: false});
          setLoader(false);
        });
    } catch (error) {
      setLoader(false);
      console.warn('error...', error);
    }
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <Header
        // label={t('cancelOrder.title')}
        label={t('order.cancleOrder.title')}
        onBack={() => navigation.goBack()}
      />

      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: Size.containerPadding,
        }}>
        <View style={{flex: 1}}>
          <Text
            style={{fontFamily: fontFamily, fontSize: 16,
              fontWeight: 500,
              lineHeight: 30,
              textAlign: 'left',
              // marginTop: Size.containerPadding,
              color: '#0E0E0E',
            }}>
            {t('cancelOrder.selectReason')}
          </Text>
          <View
            style={{
              marginTop: Size.lg,
              padding: 12,
              borderWidth: 0.5,
              borderColor: '#E7E6E6',
              borderRadius: 8,
              paddingVertical: Size.radius,
              paddingBottom: 30,
              maxHeight: '80%',
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: {width: 0, height: 2},
              shadowRadius: 6,
              elevation: 2,
            }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {loader ? (
                <ActivityIndicator
                  size="small"
                  color="#2A3B8F"
                  style={{marginTop: 20}}
                />
              ) : (
                <View style={{flex: 1}}>
                  {reasonsData.map(item => {
                    const isChecked = selectedReasons.some(
                      (selected: CancelReason) => selected.ID === item.ID,
                    );
                    return (
                      <TouchableOpacity
                        key={item.ID}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          // paddingVertical: 5,
                        }}
                        onPress={() => toggleReason(item)}>
                                                 <View  style={{borderWidth:Platform.OS=='ios'? 1:0, borderColor:Platform.OS=='ios'? '#B0B0B0':'transparent', borderRadius:Platform.OS=='ios'? 4:0, marginRight: Platform.OS=='ios'?12:0,marginBottom:Platform.OS=='ios'? 8:0}}>
                          
                        <Checkbox
                          status={isChecked ? 'checked' : 'unchecked'}
                          onPress={() => toggleReason(item)}
                          color="#2A3B8F"
                          uncheckedColor="#757575"
                        />
                        </View>
                        <View style={styles.textContainer}>
                          <Text
                            style={styles.text}
                            numberOfLines={2}
                            ellipsizeMode="tail">
                            {item.REASON}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <View style={{marginTop: 10,marginHorizontal:20}} />
            <TextInput
              multiline
              placeholder={t('cancelOrder.comment.placeholder')}
              placeholderTextColor={'#60A5FA'}
              value={comment}
              onChangeText={txt => {
                setComment(txt);
              }}
              style={{
                fontFamily:fontFamily,
                borderRadius: 6,
                backgroundColor: '#F4F7F9',
                paddingHorizontal: Size.padding,
                minHeight: 85,
                textAlignVertical: 'top',
              }}
              maxLength={256}
            />
            {comment.length > 0 && (
              <Text style={styles.characterCount}>{comment.length}/256</Text>
            )}
          </View>
        </View>
        <Button
          style={{backgroundColor: '#3170DE', borderRadius: 8}}
          label={t('cancelOrder.buttons.cancel')}
          onPress={() => {
            if (selectedReasons.length == 0) {
              Toast(
                t('cancelOrder.reasonDescription'),
              );
            } else {
              setOpenModal({...openModal, confirm: true});
            }
          }}
        />
      </View>

      {openModal.confirm && (
        <Modal
          animationType='fade'
          transparent={true}
          visible={openModal.confirm}
          onRequestClose={() => {
            setOpenModal({...openModal, confirm: false});
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              onPress={() => {
                setOpenModal({...openModal, confirm: false});
              }}
              style={GlobalStyle.modalBackground}
            />
            <View
              style={{
                justifyContent: 'center',
                backgroundColor: '#FFF',
                paddingHorizontal: Size.containerPadding * 2,
                paddingVertical: Size.md * 2,
                borderRadius: 8,
                margin: Size.radius * 2,
                width: '70%',
              }}>
              <Text
                style={{
                  fontSize: 16,
                 fontFamily: fontFamily,
                  fontWeight: 700,
                  // letterSpacing: 0.6,
                  color: '#333333',
                }}>
                {t('cancelOrder.modal.title')}
              </Text>

              <Button
                label={t('cancelOrder.buttons.confirm')}
                onPress={cancelOrder}
                loading={loader}
                style={{marginTop: Size['2xl']}}
              />
            </View>
          </View>
        </Modal>
      )}
      {/* <Loader show={loader} /> */}
    </SafeAreaView>
  );
};

export default CancelOrder;
const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
   fontFamily: fontFamily,
    fontWeight: '400',
    color: 'black',
    lineHeight: 18,
    includeFontPadding: false,
    paddingVertical: 2,
  },
  characterCount: {
    fontSize: 12,
   fontFamily: fontFamily,
    color: '#757575',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});
