import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  apiCall,
  fontFamily,
  IMAGE_URL,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Reducers, useDispatch, useSelector} from '../../context';
import {Button, Header, Icon} from '../../components';
import CatLogTiles from './CatLogTiles';
import ServiceTiles from './ServiceTiles';
import {HomeRoutes} from '../../routes/Home';
import {_noData} from '../../assets';
import {useTranslation} from 'react-i18next';
import ProgressBar from '../../components/ProgressBar';
import ServiceInfoModal from './ServiceInfoModal';

interface ServiceListProps extends HomeRoutes<'ServiceListNonService'> {}
const ServiceListNonService: React.FC<ServiceListProps> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {service, subCategory, path} = route.params;
  const {address, user} = useSelector(state => state.app);
  const {cart} = useSelector(state => state.cart);
  const [loading, setLoading] = useState<{loader: boolean; footer: boolean}>({
    loader: false,
    footer: false,
  });

  const [search, setSearch] = useState<string>('');
  const [services, setServices] = useState<ServicesInterface[]>([]);
  const {t} = useTranslation();
  const [serviceInfoModal, setServiceInfoModal] = useState<{
    show: boolean;
    service: ServicesInterface | null;
  }>({show: false, service: null});

  async function getService(): Promise<void> {
    // if (!address || !user) {
    //   return;
    // }
    setLoading({...loading, loader: true});
    var payload = {
      SUB_CATEGORY_ID: subCategory.ID,
      //   SEARCHKEY: '',
      //   PARENT_ID: service ? service.SERVICE_ID : 0,
      //   TERRITORY_ID: address.TERRITORY_ID,
      //   CUSTOMER_TYPE: user.CUSTOMER_TYPE,
      //   CUSTOMER_ID: user.CUSTOMER_TYPE == 'B' ? user.ID : undefined,
    };


    const res = await apiCall
      .post('services/get', {
        filter: `AND STATUS=1 AND SUB_CATEGORY_ID=${subCategory.ID} AND (SERVICE_TYPE= 'O' OR SERVICE_TYPE= 'C' OR SERVICE_TYPE IS NULL)`,
        sortKey: 'ID',
        sortValue: 'asc',
      })
      .then(res => res.data);

    if (res && res.code == 200) {
      let data: ServicesInterface[] = res.data.map((item: ServiceInterface) => {
        const element = cart
          ? cart.find(value => value.SERVICE_ID == item.ID)
          : null;
        return {
          IS_PARENT: item.IS_PARENT,
          QTY: Number(item.QTY),
          TOTAL_PRICE: element ? Number(element.TOTAL_PRICE) : 0,
          PRICE: Number(
            user?.CUSTOMER_TYPE == 'B' ? item.B2B_PRICE : item.B2C_PRICE,
          ),
          QUANTITY: element ? element.QUANTITY : 0,
          SERVICE_IMAGE: item.SERVICE_IMAGE,
          PREPARATION_HOURS: item.T_PREPARATION_HOURS,
          PREPARATION_MINUTE: item.T_PREPARATION_MINUTES,
          DURARTION_HOUR: item.DURARTION_HOUR,
          DURARTION_MIN: item.DURARTION_MIN,
          SERVICE_NAME: item.NAME,
          SERVICE_DESCRIPTION: item.DESCRIPTION,
          SERVICE_START_TIME: item.START_TIME,
          SERVICE_END_TIME: item.END_TIME,
          SERVICE_ID: item.ID,
          CART_ID: element ? element.CART_ID : 0,
          CART_ITEM_ID: element ? element.CART_ITEM_ID : 0,
          EXPRESS_CHARGES: item.EXPRESS_COST,
          CESS: item.CESS,
          CGST: item.CGST,
          IGST: item.IGST,
          SGST: item.SGST,
          IS_EXPRESS: item.IS_EXPRESS,
          MAX_QTY: Number(item.MAX_QTY),
          CATEGORY_ID: item.CATEGORY_ID,
          CATEGORY_NAME: item.CATEGORY_NAME,
          SUB_CATEGORY_ID: item.SUB_CATEGORY_ID,
          SUB_CATEGORY_NAME: item.SUB_CATEGORY_NAME,
          SERVICE_PARENT_ID: item.PARENT_ID,
          SERVICE_PARENT_NAME: item.SERVICE_NAME,
          SERVICE_RATING: item.AVG_RATINGS,
          GUARANTEE_ALLOWED: item.GUARANTEE_ALLOWED,
          GUARANTEE_PERIOD: item.GUARANTEE_PERIOD,
          WARRANTY_ALLOWED: item.WARRANTY_ALLOWED,
          WARRANTY_PERIOD: item.WARRANTY_PERIOD,
          SERVICE_DETAILS_IMAGE: item.SERVICE_DETAILS_IMAGE,
        };
      });
      setServices(data);

    } else {
      setServices([]);
    }
    setLoading({...loading, loader: false});
  }

  useEffect(() => {
    getService();
  }, []);

  const filteredSubCategory = useMemo<ServicesInterface[]>(() => {
    const searchLower = search.toLowerCase();
    return services.filter(data =>
      data.SERVICE_NAME.toLowerCase().includes(searchLower),
    );
  }, [services, search]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{flex: 1}}>
        <View>
          <Header
            label={subCategory?.CATEGORY_NAME || ''}
            onBack={() => navigation.goBack()}
          />
        </View>
        <ProgressBar width={'66%'} />
        {loading.loader ? (
          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <ActivityIndicator size={'large'} color={colors.primary} />
          </View>
        ) : (
          <View style={{flex: 1}}>
            <FlatList
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => getService()}
                />
              }
              ListHeaderComponent={
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.text,
                    opacity: 0.8,
                    paddingVertical: 16,
                  }}>
                  {t('serviceList.chooseAction')}
                </Text>
              }
              contentContainerStyle={{marginHorizontal: Size.containerPadding}}
              data={search ? filteredSubCategory : services}
              removeClippedSubviews={false}
              ItemSeparatorComponent={() => (
                <View style={{height: Size.containerPadding}} />
              )}
              renderItem={({item}) => {
                if (item.IS_PARENT) {
                  return (
                    <CatLogTiles
                      item={item}
                      onPress={() => {
                        navigation.navigate('ServiceListItemsNonService', {
                          subCategory: subCategory,
                          service: item,
                        });
                      }}
                    />
                  );
                } else {
                  return (
                    <ServiceTiles
                      item={item}
                      onPress={() => {
                        setServiceInfoModal({show: true, service: item});
                      }}
                      updateQty={qty => {
                        setServices(prevData =>
                          prevData.map(value =>
                            value.SERVICE_ID == item.SERVICE_ID
                              ? {...item, QUANTITY: qty}
                              : value,
                          ),
                        );
                      }}
                      onCreate={qty => {
                        if (!user || user.ID == 0) {
                          Alert.alert(
                            t('serviceList.guestTitle'),
                            t('serviceList.guestMessage'),
                            [
                              {
                                text: t('serviceList.cancel'),
                                onPress: () => {},
                              },
                              {
                                text: t('serviceList.login'),
                                onPress: () => {
                                  useStorage.delete('user');
                                  tokenStorage.clearToken();
                                  dispatch(Reducers.setSplash(true));
                                },
                                isPreferred: true,
                              },
                            ],
                            {
                              cancelable: true,
                            },
                          );
                        } else {
                          if (!address) {
                            return;
                          }
                          dispatch(
                            Reducers.createCartInformation({
                              QUANTITY: qty,
                              QUANTITY_PER_UNIT: 0,
                              UNIT_ID: 0,
                              UNIT_NAME: '',
                              SERVICE_ID: item.SERVICE_ID,
                              BRAND_NAME: '',
                              DESCRIPTION: '',
                              MODEL_NUMBER: '',
                              TYPE: 'S',
                              INVENTORY_ID: 0,
                              SERVICE_CATALOGUE_ID: service
                                ? service.SERVICE_ID
                                : 0,
                              SERVICE_PHOTO_FILE: '',
                            }),
                          );

                          setServices(prevData =>
                            prevData.map(value =>
                              value.SERVICE_ID == item.SERVICE_ID
                                ? {...value, QUANTITY: qty}
                                : value,
                            ),
                          );
                        }
                      }}
                    />
                  );
                }
              }}
              ListEmptyComponent={
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: Size.containerPadding * 2,
                  }}>
                  <Image
                    resizeMode={'contain'}
                    style={{
                      width: 160,
                      height: 160,
                    }}
                    source={_noData}
                    tintColor={colors.primary}
                  />
                </View>
              }
              keyExtractor={(item, index) => {
                return `category_${item.SERVICE_ID}_${index}`;
              }}
            />
          </View>
        )}
        {serviceInfoModal.service && serviceInfoModal.show ? (
          <ServiceInfoModal
          navigation={navigation}
            service={serviceInfoModal.service}
            onConfirm={quantity => {
              if (serviceInfoModal.service) {
                if (!user || user.ID == 0) {
                  Alert.alert(
                    t('serviceList.guestTitle'),
                    t('serviceList.guestMessage'),
                    [
                      {
                        text: t('serviceList.cancel'),
                        onPress: () => {},
                      },
                      {
                        text: t('serviceList.login'),
                        onPress: () => {
                          useStorage.delete('user');
                          tokenStorage.clearToken();
                          dispatch(Reducers.setSplash(true));
                        },
                        isPreferred: true,
                      },
                    ],
                    {
                      cancelable: true,
                    },
                  );
                } else {
                  navigation.push('ServiceDetails', {
                    quantity: quantity,
                    service: serviceInfoModal.service,
                    path: [
                      ...path,
                      service ? service.SERVICE_NAME : subCategory.NAME,
                    ],
                  });
                  setServiceInfoModal({show: false, service: null});
                }
              }
            }}
            onClose={() => setServiceInfoModal({show: false, service: null})}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
};
export default ServiceListNonService;

const styles = StyleSheet.create({
  _headerText: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    // lineHeight: Size.lg,
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _divider: {
    height: 3,
    backgroundColor: '#383838',
  },
  _pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
