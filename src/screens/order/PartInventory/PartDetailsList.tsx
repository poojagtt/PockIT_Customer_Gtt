import {
  View,
  Text,
 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, {useEffect, useState} from 'react';
import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {Button, Icon, Header} from '../../../components';
import {OrderRoutes} from '../../../routes/Order';
import {useSelector} from '../../../context';
import {useTranslation} from 'react-i18next';

interface PartListProps extends OrderRoutes<'PartDetailsList'> {}
const PartDetailsList: React.FC<PartListProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const {user} = useSelector(state => state.app);
  const {jobItem, onSuccess} = route.params;
  console.log('jobItem..here', jobItem);
  const [partDetails, setPartDetails] = useState<{
    data: partListDetail[];
    loading: boolean;
  }>({
    data: [],
    loading: true,
  });

  const [loader, setLoader] = useState({
    accept: false,
    deny: false,
  });

  useEffect(() => {
    getPartList();
  }, []);

  const getPartList = () => {
    try {
      apiCall
        .post('api/inventoryRequestDetails/get', {
          filter: ` AND CUSTOMER_ID = ${user?.ID} AND JOB_CARD_ID = ${jobItem.JOB_CARD_ID} AND STATUS = 'P' `,
        })
        .then(res => {
          setPartDetails({...partDetails, data: res.data.data, loading: false});
        })
        .catch(err => {
          setPartDetails({...partDetails, loading: false});
        });
    } catch (error) {
      console.warn('error..', error);
    }
  };
  const requestAcceptDeny = (status: string) => {
    try {
      setLoader({
        ...loader,
        accept: status == 'A' ? true : false,
        deny: status == 'R' ? true : false,
      });
      const INVENTORY_IDS: number[] = [];
      const IDS: number[] = [];
      partDetails.data.map((item: partListDetail) => {
        if (item.INVENTORY_ID) {
          INVENTORY_IDS.push(item.INVENTORY_ID);
        }
        IDS.push(item.ID);
      });
      const body = {
        CUSTOMER_ID: user?.ID,
        TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
        TECHNICIAN_NAME: jobItem.TECHNICIAN_NAME,
        ORDER_ID: jobItem.ORDER_ID,
        JOB_CARD_ID: jobItem.JOB_CARD_ID,
        JOB_CARD_NO: jobItem.JOB_CARD_NO,
        REQUEST_MASTER_ID: partDetails.data[0].REQUEST_MASTER_ID,
        INVENTORY_IDS:JSON.stringify(INVENTORY_IDS),
        IDS: JSON.stringify(IDS),
        STATUS: status,
        CLIENT_ID: 1,
      };
      apiCall
        .post('api/inventoryRequest/updateRequestStatus', body)
        .then(res => {
          if (res.status == 200 && res.data.code == 200) {
            setLoader({
              ...loader,
              accept: false,
              deny: false,
            });

            if (onSuccess) {
              onSuccess();
            }
            else
            {
              navigation.goBack();
            }
          }
        })
        .catch(err => {
          console.warn('err..', err);
          setLoader({
            ...loader,
            accept: false,
            deny: false,
          });
        });
    } catch (error) {
      console.warn('error..', error);
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View>
        <Header
          label={t('jobDetails.partDetails.title')}
          onBack={() => navigation.goBack()}
        />
      </View>
      <View style={styles._container}>
        <View style={{flex: 1}}>
          {partDetails.loading ? (
            <ActivityIndicator
              color={colors.primary}
              size={'small'}
              style={{marginTop: Size.field}}
            />
          ) : (
            <View style={{marginTop: Size.paddingY, maxHeight: '100%'}}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => {
                      getPartList();
                    }}
                    colors={['#2A3B8F']}
                  />
                }>
                {partDetails.data.map((item, index) => {
                  return (
                    <View key={item.ID} style={[styles._card, {gap: 8}]}>
                      <View style={styles._row}>
                        <Text style={[styles._label]}>
                          {t('jobDetails.partDetails.labels.part')}:
                        </Text>
                        <Text style={[styles._value]}>
                          {item.INVENTORY_NAME}
                        </Text>
                      </View>
                      {item.INVENTORY_CATEGORY_NAME ? (
                        <View style={styles._row}>
                          <Text style={[styles._label]}>
                            {t('jobDetails.partDetails.labels.type')}:
                          </Text>
                          <Text style={[styles._value]}>
                            {item.INVENTORY_CATEGORY_NAME}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles._row}>
                        <Text style={[styles._label]}>
                          {t('jobDetails.partDetails.labels.quantity')}:
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
                          {t('jobDetails.partDetails.labels.price')}:
                        </Text>
                        <Text
                          style={[
                            styles._value,
                          ]}>{`₹${Number(item.TOTAL_AMOUNT).toLocaleString('en-IN')}`}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              {/* note */}
              <View style={styles._orderContainer}>
                <View style={styles._noteContainer}>
                  <Icon
                    type="Feather"
                    name={'info'}
                    size={22}
                    color={'black'}
                  />
                  <Text style={[styles._noteText]}>
                    {t('jobDetails.partDetails.note')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <View style={{gap: 8}}>
          <Button
            style={{borderRadius: 8}}
            label={t('jobDetails.partDetails.buttons.accept')}
            onPress={() => {
              requestAcceptDeny('A');
            }}
            loading={loader.accept}
          />
          <Button
          outlined
            style={{
              // backgroundColor: 'white',
              borderBlockColor: colors.primary2,
              borderWidth: 1,
              borderRadius: 8,
            }}
            label={t('jobDetails.partDetails.buttons.deny')}
            labelStyle={{color: colors.primary2}}
            onPress={() => {
              requestAcceptDeny('R');
            }}
            loaderColor={colors.primary2}
            loading={loader.deny}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PartDetailsList;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
  },
  _headerTxt: {
     fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
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
  _noteContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
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
  _noteText: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'left',
    color: 'black',
  },
});
