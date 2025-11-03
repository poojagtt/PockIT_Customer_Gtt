import {
  View,
  Text,

  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, { useEffect, useState } from 'react';
import { apiCall, fontFamily, Size, useTheme } from '../../../modules';
import { Button, Icon } from '../../../components';
import { OrderRoutes } from '../../../routes/Order';
import { useSelector } from '../../../context';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import RazorpayCheckout, { RazorpayCheckoutOptions } from 'react-native-razorpay';
import { RAZOR_PAY_KEY } from '../../../modules/services';
import moment from 'moment';
import Toast from '../../../components/Toast';

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}
interface partSummery {
  ARCHIVE_FLAG: string;
  ASSIGNED_DATE: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  CUSTOMER_ID: number;
  CUSTOMER_NAME: string;
  CUSTOMER_TYPE: string;
  END_TIME: string;
  EXPECTED_DATE_TIME: string;
  ID: number;
  JOB_CARD_ID: number;
  JOB_CARD_NO: string;
  JOB_CREATED_DATE: string;
  JOB_STATUS: string | null;
  ORDER_ID: number;
  ORDER_NO: string;
  PAYMENT_MODE: string | null;
  PAYMENT_STATUS: string;
  READ_ONLY: string;
  REMARK: string;
  REQUESTED_DATE_TIME: string;
  SCHEDULED_DATE_TIME: string;
  SERVICE_ADDRESS: string;
  SERVICE_ID: number;
  SERVICE_NAME: string;
  START_TIME: string;
  STATUS: string;
  TECHNICIAN_ID: number;
  TECHNICIAN_NAME: string;
  TERRITORY_ID: number;
  TERRITORY_NAME: string;
  TOTAL_AMOUNT: string;
  TOTAL_ITEMS: number;
  TOTAL_RATE: string;
  TOTAL_TAX_RATE: string;
  VERIFICATION_DATE: string;
}
interface PaymentSummaryProps extends OrderRoutes<'PaymentSummary'> { }
// Payment error: {"code": 0, "description": "Post payment parsing error"}
const PaymentSummary: React.FC<PaymentSummaryProps> = ({ navigation, route }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { user } = useSelector(state => state.app);
  const { jobItem, pendingPaymentsData, onSuccess } = route.params;
  const [partDetails, setPartDetails] = useState<{
    data: partListDetail[];
    loading: boolean;
  }>({
    data: [],
    loading: true,
  });
  const [loader, setLoader] = useState({
    payCash: false,
    payOnline: false,
  });
  const [summary, setSummary] = useState<{
    data: partSummery | null;
    loading: boolean;
  }>({
    data: null,
    loading: true,
  });

  useEffect(() => {
    getPartList();
    getPaymentSummary();
  }, []);

  const getPartList = () => {
    try {
      apiCall
        .post('api/inventoryRequestDetails/get', {
          filter: ` AND CUSTOMER_ID = ${user?.ID} AND JOB_CARD_ID = ${jobItem.JOB_CARD_ID} AND STATUS = 'AC' `,
        })
        .then(res => {
          setPartDetails({ ...partDetails, data: res.data.data, loading: false });
        })
        .catch(err => {
          setPartDetails({ ...partDetails, loading: false });
        });
    } catch (error) {
      console.warn('error..', error);
    }
  };

  const getPaymentSummary = async () => {
    try {
      const response = await apiCall.post('api/inventoryRequest/get', {
        filter: ` AND CUSTOMER_ID = ${user?.ID} AND JOB_CARD_ID = ${jobItem.JOB_CARD_ID} AND STATUS = 'AC' `,
      });


      setSummary({ data: response.data.data[0], loading: false });
    } catch (error) {
      console.warn('error..', error);
      setSummary({ ...summary, loading: false });
    }
  };

  const options: RazorpayCheckoutOptions = {
    description: t('paymentSummary.payment.description'),
    currency: 'INR',
    key: RAZOR_PAY_KEY,
    amount: Math.round(pendingPaymentsData.TOTAL_AMOUNT * 100).toString(),
    name: 'PockIT',
    prefill: {
      name: user?.NAME,
      email: user?.EMAIL,
      contact: user?.MOBILE_NO,
    },
    theme: { color: '#2196F3' },
    retry: { enabled: true },
    send_sms_hash: true,
    method: {
      netbanking: true,
      card: true,
      upi: true,
      wallet: true,
    },
  };
  const createTransaction = () => {
    const payload = {

      ORDER_ID: jobItem.ORDER_ID,
      CUSTOMER_ID: user?.ID,
      JOB_CARD_ID: jobItem.JOB_CARD_ID,
      CART_ID: 0,
      PAYMENT_FOR: 'P',
      amount: Math.round(pendingPaymentsData.TOTAL_AMOUNT * 100).toString(),

    };
    try {
      apiCall.post('api/paymentGatewayTransactions/createOrder', payload).then(res => {

        if (res.data.code == 200 && res.data.data.amount) {
          const options: RazorpayCheckoutOptions = {
            description: t('paymentSummary.payment.description'),
            currency: 'INR',
            key: RAZOR_PAY_KEY,
            amount: Math.round(pendingPaymentsData.TOTAL_AMOUNT * 100).toString(),
            name: 'PockIT',
            order_id: res.data.data.id,
            prefill: {
              name: user?.NAME,
              email: user?.EMAIL,
              contact: user?.MOBILE_NO,
            },
            theme: { color: '#2196F3' },
            retry: { enabled: true },
            send_sms_hash: true,
            method: {
              netbanking: true,
              card: true,
              upi: true,
              wallet: true,
            },
          };
          handlePayment(options);

        } else {
          Toast("Something went wrong! Plesae try again later")
        }
      });
    }
    catch (error: any) {
      Toast(error.message);
    }
  }
  const handlePayment = async (options: any) => {
    try {
      const response: PaymentResponse = await RazorpayCheckout.open(options);
      if (response && response.razorpay_payment_id) {
        updatePaymentStatus(response, 200);
      }
    } catch (error: any) {
      let errorMessage = t('paymentSummary.payment.errors.cancelled');
      if (error.description == 'Post payment parsing error') {
        updatePaymentStatus(error, 300);
      } else if (error.code === 'PAYMENT_CANCELLED') {
        errorMessage = t('paymentSummary.payment.errors.cancelled');
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = t('paymentSummary.payment.errors.network');
      } else if (error.description) {
        errorMessage = error.description;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
  };

  const updatePaymentStatus = async (data: PaymentResponse, code: number) => {
    try {
      setLoader(prev => ({ ...prev, payOnline: true }));
      const body = {
        ORDER_ID: jobItem.ORDER_ID,
        CUSTOMER_ID: user?.ID,
        JOB_CARD_ID: jobItem.JOB_CARD_ID,
        TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
        VENDOR_ID: jobItem.VENDOR_ID,
        MOBILE_NUMBER: user?.MOBILE_NO,
        PAYMENT_FOR: 'P',
        PAYMENT_MODE: 'O',
        PAYMENT_TYPE: 'O',
        TRANSACTION_DATE: moment().format('YYYY-MM-DD'),
        TRANSACTION_ID: data.razorpay_payment_id,
        TRANSACTION_STATUS: 'Success',
        TRANSACTION_AMOUNT: pendingPaymentsData.TOTAL_AMOUNT,
        PAYLOAD: options,
        RESPONSE_DATA: data,
        RESPONSE_CODE: code,
        MERCHENT_ID: RAZOR_PAY_KEY,
        RESPONSE_MESSAGE:
          code == 200
            ? t('paymentSummary.payment.errors.success')
            : t('paymentSummary.payment.errors.failed'),
        CLIENT_ID: 1,
      };

      const response = await apiCall.post(
        'api/invoicepaymentdetails/addPaymentTransactions',
        body,
      );
      if (response.data.code == 200) {
        setLoader(prev => ({ ...prev, payOnline: false }));
        onSuccess();
      }
    } catch (error) {
      setLoader(prev => ({ ...prev, payOnline: false }));
      console.warn(
        'API Error',
        'An error occurred while updating payment status.',
      );
    }
  };
  const paymentCash = async () => {
    try {
      setLoader(prev => ({ ...prev, payCash: true }));
      const body = {
        ORDER_ID: jobItem.ORDER_ID,
        CUSTOMER_ID: user?.ID,
        JOB_CARD_ID: jobItem.JOB_CARD_ID,
        JOB_CARD_NO: jobItem.JOB_CARD_NO,
        TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
        VENDOR_ID: jobItem.VENDOR_ID,
        MOBILE_NUMBER: user?.MOBILE_NO,
        PAYMENT_FOR: 'P',
        PAYMENT_MODE: 'C',
        PAYMENT_TYPE: 'C',
        TRANSACTION_DATE: moment().format('YYYY-MM-DD'),
        TRANSACTION_ID: null,
        TRANSACTION_STATUS: 'Success',
        TRANSACTION_AMOUNT: pendingPaymentsData.TOTAL_AMOUNT,
        PAYLOAD: null,
        RESPONSE_DATA: null,
        RESPONSE_CODE: 200,
        MERCHENT_ID: RAZOR_PAY_KEY,
        RESPONSE_MESSAGE: 'Transaction success',
        CLIENT_ID: 1,
      };

      const response = await apiCall.post(
        'api/invoicepaymentdetails/addPaymentTransactions',
        body,
      );
      if (response.data.code == 200) {
        onSuccess();
        setLoader(prev => ({ ...prev, payCash: false }));
      }
    } catch (error) {
      setLoader(prev => ({ ...prev, payCash: false }));
      console.warn(
        'API Error',
        'An error occurred while updating payment status.',
        error,
      );
    }
  };
  const validItems = partDetails.data.filter(
    item => item.IS_RETURNED === 0 && item.STATUS !== 'R'
  );

  const grandTotal = validItems.reduce(
    (sum, item) => sum + Number(item.TOTAL_AMOUNT || 0),
    0
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles._container}>
        <Icon
          name="keyboard-backspace"
          type="MaterialCommunityIcons"
          size={25}
          color={'#999999'}
          onPress={() => {
            navigation.goBack();
          }}
        />
        <View
          style={{
            marginTop: Size.containerPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={[styles._headerTxt, { flex: 1 }]}>
            {t('paymentSummary.title')}
          </Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ gap: 6, marginTop: Size.paddingY }}>
            {partDetails.data.map(item => {

              return (
                (item.IS_RETURNED === 0 && item.STATUS !== 'R') ? (
                  <View key={item.ID} style={[styles._card, { gap: 5 }]}>
                    <View style={styles._row}>
                      <Text style={[styles._label]}>
                        {t('paymentSummary.labels.part')}:
                      </Text>
                      <Text style={[styles._value]}>{item.INVENTORY_NAME}</Text>
                    </View>
                    {item.INVENTORY_CATEGORY_NAME ? (
                      <View style={styles._row}>
                        <Text style={[styles._label]}>
                          {t('paymentSummary.labels.type')}:
                        </Text>
                        <Text style={[styles._value]}>
                          {item.INVENTORY_CATEGORY_NAME}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles._row}>
                      <Text style={[styles._label]}>
                        {t('paymentSummary.labels.quantity')}:
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
                        {t('paymentSummary.labels.price')}:
                      </Text>
                      <Text style={[styles._value]}>
                        {Number(item.TOTAL_AMOUNT).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                ) : null
              );
            })}

            <View
              style={[styles._card, { gap: Size.md, marginBottom: Size.radius }]}>
              <View
                style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icon
                  name="rupee"
                  type="FontAwesome"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles._detailsTitleTxt}>
                  {t('paymentSummary.labels.partTotal')}
                </Text>
              </View>
              <View style={{ gap: 4, marginTop: 3 }}>
                {/* <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('paymentSummary.labels.subTotal')}:
                  </Text>
                  <Text style={[styles._value]}>
                    ₹{Number(summary.data?.TOTAL_RATE).toLocaleString('en-IN') || 0}
                  </Text>
                </View>
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('paymentSummary.labels.tax')}:
                  </Text>
                  <Text style={[styles._value]}>
                    ₹{Number(summary.data?.TOTAL_TAX_RATE).toLocaleString('en-IN') || 0}
                  </Text>
                </View> */}
                <View style={styles._row}>
                  <Text style={[styles._label]}>
                    {t('paymentSummary.labels.total')}:
                  </Text>
                  <Text style={[styles._value]}>
                    ₹{Number(grandTotal).toLocaleString('en-IN') || 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <Icon
                name="infocirlceo"
                type="AntDesign"
                size={20}
                color={colors.primary} />
              <Text style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 400,
                color: '#OEOEOE', marginLeft: 10
              }}>
                You will receive the invoice once the order is completed.
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={{ gap: 12 }}>
          <Button
            label={t('paymentSummary.buttons.proceed')}
            onPress={() => {
              createTransaction();
            }}
            loading={loader.payOnline}
          />
          <Button
            label={t('paymentSummary.buttons.proceedCash')}
            onPress={() => {
              paymentCash();
            }}
            loading={loader.payCash}
          />
          {/* <Button
            label={t('paymentSummary.buttons.cancel')}
            onPress={() => {
              navigation.goBack();
            }}
          /> */}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PaymentSummary;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
  },
  _headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
  },
  _card: {
    marginTop: 10,
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
  _detailsTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
    // letterSpacing: 0.6,
  },
  _jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Size['2xl'],
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: '#E5E5E5',
    borderTopColor: '#E5E5E5',
    paddingVertical: 5,
  },
  _jobTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#343434',
    letterSpacing: 0.6,
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
    fontWeight: 400,
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
