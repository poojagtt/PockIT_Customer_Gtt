import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  SectionList,
} from 'react-native';
import { fontFamily, Size, useTheme } from '../../modules';
import { MenuRoutes } from '../../routes/Menu';
import { apiCall } from '../../modules/services';
import { Reducers, useDispatch, useSelector } from '../../context';
import { Button, Header, Icon } from '../../components';
import AddressPopUp from '../home/AddressPopUp';
import { useTranslation } from 'react-i18next';
import { ShopRoutes } from '../../routes/Shops';
import { CartRoutes } from '../../routes/Cart';
import { HomeRoutes } from '../../routes/Home';
import Toast from '../../components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setDefaultAddress } from '../../context/reducers/app';

type AddressBookProps =
  | MenuRoutes<'AddressBook'>
  | ShopRoutes<'AddressBook'>
  | CartRoutes<'AddressBook'>
  | HomeRoutes<'AddressBook'>;

interface ModalState {
  options: boolean;
  addressToDelete: AddressInterface | null;
  warning: boolean;
}

const AddressBook: React.FC<AddressBookProps> = ({ navigation, route }) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {
    id: SharedCartId,
    type: SharedCartType,
  }: { id: number | null; type: string | null } = route.params?.cartId ?? {
    id: null,
    type: null,
  }; // Added default value
  const { t } = useTranslation();
  const [Addresses, setAddresses] = useState<AddressInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, address: currentAddress } = useSelector(state => state.app);
  const { type } = useSelector(state => state.cart);
  const [modal, setModal] = useState<ModalState>({
    options: false,
    addressToDelete: null,
    warning: false,
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [addressModal, setAddressModal] = useState<{
    show: boolean;
    addressData: AddressInterface | undefined;
    isEdit: boolean;
  }>({
    addressData: undefined,
    isEdit: false,
    show: false,
  });
  const [selected, setSelected] = useState<AddressInterface | null>(
    currentAddress,
  );
  
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/customerAddress/get', {
          filter: ` AND CUSTOMER_ID=${user?.ID} AND STATUS =1`,
          sortKey: 'IS_DEFAULT',

          sortValue: 'desc',
        })
        .then(res => res.data);

      if (response.code === 200) {
        let data: AddressInterface[] = response.data;
        let newData: AddressInterface[] = data.map(item => {
          if (currentAddress?.ID == item.ID) {
            // makeDefault
            dispatch(Reducers.setDefaultAddress(item));
            return { ...item, IS_DEFAULT: 1 };
          } else {
            return { ...item, IS_DEFAULT: 0 };
          }
        });
        setAddresses(newData);
         if (newData.length === 1 && newData[0].IS_DEFAULT !== 1) {
          setDefaultForSingleAddress(newData[0]);
        }
      } else {
        // Alert.alert(t('common.error'), t('menu.addressBook.alerts.fetchError')); // Translate
      }
    } catch (error) {
      console.error('Error in fetchAddresses:', error);
      // Alert.alert(t('common.error'), t('menu.addressBook.alerts.fetchError')); // Translate
    } finally {
      setLoading(false);
    }
  };
  const sortedAddresses = [
    {
      title: t('addressBook.sections.deliversTo'), // Translate
      info: null,
      data: Addresses.filter(
        item =>
          item.TERRITORY_ID == currentAddress?.TERRITORY_ID &&
          ((SharedCartType === 'S' && item.PINCODE_FOR !== 'I') ||
            (SharedCartType === 'P' && item.PINCODE_FOR !== 'S')),
      ),
    },
    {
      title: t('addressBook.sections.doesNotDeliverTo'), // Translate
      info: t('addressBook.sections.notInServiceAreaInfo'), // Translate
      data: Addresses.filter(
        item =>
          item.TERRITORY_ID != currentAddress?.TERRITORY_ID &&
          ((SharedCartType === 'S' && item.PINCODE_FOR !== 'I') ||
            (SharedCartType === 'P' && item.PINCODE_FOR !== 'S')),
      ),
    },
  ];
  const setDefaultForSingleAddress = async (address: AddressInterface) => {
    if (!address) return;
    try {
      setLoading(true);
      const update = await apiCall.post('api/customerAddress/updateAddressDefault', {
        ...address,
        CUSTOMER_ID: user?.ID,
        ID: address.ID,
      });
      if (update.data.code === 200) {
        if (SharedCartId) {
          const response = await apiCall.post(`api/cart/address/update`, {
            TYPE: SharedCartType,
            CUSTOMER_ID: user?.ID,
            CART_ID: SharedCartId,
            ADDRESS_ID: address.ID,
            NEW_TERRITORY_ID: address.TERRITORY_ID,
            OLD_TERRITORY_ID: currentAddress?.TERRITORY_ID,
          });
          if (response.data.code != 200) {
            Toast(t('menu.addressBook.alerts.defaultError'));
          }
        }
        dispatch(Reducers.setAddress(address));
        navigation.goBack();
      } else {
        Toast(t('menu.addressBook.alerts.defaultError'));
      }
    } catch (error) {
      console.error('Error setting default address for single address:', error);
      Toast(t('menu.addressBook.alerts.defaultError'));
    } finally {
      setLoading(false);
    }
  };
  const openDeleteModal = (address: AddressInterface) => {
    setModal({
      options: true,
      addressToDelete: address,
      warning: false,
    });
  };
  const closeDeleteModal = () => {
    setModal({
      options: false,
      addressToDelete: null,
      warning: false,
    });
  };
  const makeDefault = async () => {
    try {
      const update = await apiCall.post(
        'api/customerAddress/updateAddressDefault',
        {
          ...selected,
          CUSTOMER_ID: user?.ID,
          ID: selected?.ID,
        },
      );
      if (update.data.code == 200) {
        if (SharedCartId) {
          const response = await apiCall.post(`api/cart/address/update`, {
            TYPE: SharedCartType,
            CUSTOMER_ID: user?.ID,
            CART_ID: SharedCartId,
            ADDRESS_ID: selected?.ID,
            NEW_TERRITORY_ID: selected?.TERRITORY_ID,
            OLD_TERRITORY_ID: currentAddress?.TERRITORY_ID,
          });
          if (response.data.code != 200) {
            Toast(
              t('menu.addressBook.alerts.defaultError'), // Translate
            );
          }
        }
        dispatch(Reducers.setAddress(selected ? selected : currentAddress));
        navigation.goBack();
      } else {
        Alert.alert(
          t('common.error'),
          t('menu.addressBook.alerts.defaultError'),
        ); // Translate
      }
    } catch (error) {
      console.error('Error in makeDefault:', error);
      Alert.alert(t('common.error'), t('menu.addressBook.alerts.defaultError')); // Translate
    }
  };
  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <SafeAreaView style={styles._container}>
      <Header
        label={t('menu.addressBook.title')}
        onBack={() => navigation.goBack()}
      />
     {Addresses.length == 0 && <View>
        <Text style={{ alignSelf: 'center', marginTop: '50%', fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333333', }}>Please add an address to continue
        </Text>
        {/* <Text style={{ alignSelf: 'center', marginTop: 8,fontFamily:fontFamily,
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#666666', }}>Add your address to continue
        </Text> */}
      </View>}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles._loaderContainer}
        />
      ) : SharedCartId ? (
        <SectionList
          sections={sortedAddresses}
          removeClippedSubviews={false}
          contentContainerStyle={{ margin: 15, gap: 12 }}
          keyExtractor={(item, index) => `${item.ID}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              disabled={item.TERRITORY_ID != currentAddress?.TERRITORY_ID}
              onPress={() => setSelected(item)}
              style={{
                borderRadius: 8,

                // borderWidth: 1,
                padding: 12,
                gap: 6,
                elevation: 6,

                borderColor:
                  selected && selected.ID == item.ID
                    ? colors.primary
                    : colors.disable,

                shadowOffset: { height: 2, width: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                backgroundColor:
                  item.TERRITORY_ID != currentAddress?.TERRITORY_ID
                    ? '#F0F0F0'
                    : '#FFF',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    flex: 1,
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333333',
                      opacity: 0.8,
                      flex: 1,
                    }}>
                    {item.ADDRESS_LINE_1}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  {user?.CUSTOMER_TYPE == 'I' && (
                    <Icon
                      type="Feather"
                      name="edit-2"
                      size={16}
                      color={colors.primary}
                      onPress={() =>
                        setAddressModal({
                          ...addressModal,
                          show: true,
                          addressData: item,
                          isEdit: true,
                        })
                      }
                    />
                  )}
                  {item.IS_DEFAULT !== 1 && user?.CUSTOMER_TYPE == 'I' && (
                    <Icon
                      type="MaterialCommunityIcons"
                      name="trash-can-outline"
                      size={21}
                      color={colors.primary}
                      onPress={() => openDeleteModal(item)}
                    />
                  )}
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#666666',
                  opacity: 0.8,
                }}>
                {item.ADDRESS_LINE_2} {item.DISTRICT_NAME} {item.PINCODE}
              </Text>
              {item.IS_DEFAULT == 1 && (
                <Text
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    color: colors.background,
                    fontSize: 10,
                    fontFamily: fontFamily,
                    alignSelf: 'flex-end',
                    textAlign: 'center',
                    margin: -5,
                  }}>
                  {t('menu.addressBook.labels.defaultAddress')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.info ? (
                  <Icon
                    type="Feather"
                    name={'help-circle'}
                    size={20}
                    color={colors.primary}
                    onPress={() =>
                      setExpandedSection(
                        expandedSection === section.title
                          ? null
                          : section.title,
                      )
                    }
                  />
                ) : null}
              </View>
              {expandedSection === section.title && section.info && (
                <Text style={styles.sectionInfo}>{section.info}</Text>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={Addresses}
          keyExtractor={item => item.ID.toString()}
          removeClippedSubviews={false}
          contentContainerStyle={{ margin: 15, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              style={{
                borderRadius: 8,
                borderWidth: 1,
                padding: 15,
                gap: 6,
                elevation: 8,
                borderColor:
                  selected && selected.ID == item.ID
                    ? colors.primary
                    : colors.disable,
                shadowColor: '#00000000',
                shadowOffset: { height: 2, width: 0 },
                shadowOpacity: 10,
                shadowRadius: 12,
                backgroundColor: '#FFF',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    flex: 1,
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#333333',
                      opacity: 0.8,
                      flex: 1,
                    }}>
                    {item.ADDRESS_LINE_1}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  {user?.CUSTOMER_TYPE == 'I' && (
                    <Icon
                      type="Feather"
                      name="edit-2"
                      size={16}
                      color={colors.primary}
                      onPress={() =>
                        setAddressModal({
                          ...addressModal,
                          show: true,
                          addressData: item,
                          isEdit: true,
                        })
                      }
                    />
                  )}
                  {item.IS_DEFAULT !== 1 && user?.CUSTOMER_TYPE == 'I' && (
                    <Icon
                      type="MaterialCommunityIcons"
                      name="trash-can-outline"
                      size={21}
                      color={colors.primary}
                      onPress={() => openDeleteModal(item)}
                    />
                  )}
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#666666',
                  opacity: 0.8,
                }}>
                {item.ADDRESS_LINE_2} {item.DISTRICT_NAME} {item.PINCODE}
              </Text>
              {item.IS_DEFAULT == 1 && (
                <Text
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    color: colors.background,
                    fontSize: 10,
                    fontFamily: fontFamily,
                    alignSelf: 'flex-end',
                    textAlign: 'center',
                    margin: -5,
                  }}>
                  {t('menu.addressBook.labels.defaultAddress')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      {currentAddress?.ID === selected?.ID ? (
        <View style={styles._footer}>
          {user?.CUSTOMER_TYPE == 'B' ? null : (
            <Button
              label={t('addressBook.buttons.addNew')}
              onPress={() => {
                setAddressModal({
                  ...addressModal,
                  show: true,
                  addressData: undefined,
                  isEdit: false,
                });
              }}
            />
          )}
        </View>
      ) : (
        <View style={{ padding: 16, gap: 8 }}>
          <Button
            label={t('menu.addressBook.buttons.useAddress')}
            onPress={() => makeDefault()}
          />
        </View>
      )}
      {addressModal.show ? (
        <AddressPopUp
          onClose={() => {
            setAddressModal({
              ...addressModal,
              show: false,
              addressData: undefined,
              isEdit: false,
            });
          }}
          onSuccess={() => {
            setAddressModal({
              ...addressModal,
              show: false,
              addressData: undefined,
              isEdit: false,
            });
            fetchAddresses();
            // dispatch(Reducers.getUserInfo());
          }}
          show={addressModal.show}
          addressData={addressModal.addressData}
          isEdit={addressModal.isEdit}
          type={SharedCartType}
        />
      ) : null}
      <Modal
        transparent={true}
        visible={modal.options}
        onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('addressBook.deleteModal.title')}
            </Text>
            <Text style={styles.modalSubtitle}>{selected?.ADDRESS_LINE_2}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeDeleteModal}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>
                  {t('addressBook.deleteModal.cancelButton')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (!modal.addressToDelete) return;

                  try {
                    const response = await apiCall.post(
                      'api/customerAddress/deleteAddress',
                      {
                        ADDRESS_ID: modal.addressToDelete.ID,
                        CUSTOMER_ID: user?.ID,
                        CLIENT_ID: user?.CLIENT_ID,
                      },
                    );
                    if (response.data.code === 200) {
                      Toast(t('addressBook.deleteModal.successToast')); // Translate
                      fetchAddresses();
                    } else {
                      Alert.alert(
                        t('common.error'),
                        t('addressBook.deleteModal.errorAlert'),
                      ); // Translate
                    }
                  } catch (error) {
                    console.error('Error deleting address:', error);
                    Alert.alert(
                      t('common.error'),
                      t('addressBook.deleteModal.errorAlert'),
                    ); // Translate
                  } finally {
                    closeDeleteModal();
                  }
                }}
                style={styles.approveButton}>
                <Text style={styles.approveButtonText}>
                  {t('addressBook.deleteModal.confirmButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={modal.warning}
        onRequestClose={() => setModal(prev => ({ ...prev, warning: false }))}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('addressBook.warningModal.title')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('addressBook.warningModal.subtitle')}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModal(prev => ({ ...prev, warning: false }))}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setModal(prev => ({ ...prev, warning: false }));
                  // makeDefault(); // Call makeDefault directly
                }}
                style={styles.approveButton}>
                <Text style={styles.approveButtonText}>
                  {t('address.change')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default AddressBook;

const styles = StyleSheet.create({
  _footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  _container: {
    flex: 1,
    // padding: Size.containerPadding,
    backgroundColor: '#F6F8FF',
  },
  _headingTxt: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#333333',
  },
  _addressItem: {
    flex: 1,
    marginHorizontal: 10,
  },
  _addressName: {
    fontSize: 17,
    fontWeight: 500,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  _addressDetails: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: fontFamily,
    color: '#333333',
    marginLeft: Size['2xl'],
    marginTop: Size.base,
  },
  _actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: -8,
  },
  _addText: {
    fontSize: 18,
    color: '#1C1C28',
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  _addAddress: {},
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    margin: 15,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#0E0E0E',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636363',
    textAlign: 'left',
    marginTop: 4,
    fontFamily: fontFamily,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0057FF',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3170DE',
    fontFamily: fontFamily,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3170DE',
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FDFDFD',
    fontFamily: fontFamily,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    backgroundColor: '#F6F8FF',
    gap: 8,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: fontFamily,
    // flex: 1,
  },
  sectionInfo: {
    fontSize: 14,
    color: '#666666',
    fontFamily: fontFamily,
    opacity: 0.8,
    paddingLeft: 4,
    paddingHorizontal: 7,
  },
});

{
  /**
   *   const makeDefault = () => {
    const cartId =
      type == 'P'
        ? products?.length
          ? products[0].CART_ID
          : null
        : cart?.length
        ? cart[0].CART_ID
        : null;
    if (cartId) {
      if (currentAddress?.TERRITORY_ID != selected?.TERRITORY_ID) {
        setModal(prev => ({...prev, warning: true}));
      } else {
        defaultAddress();
      }
    } else {
      defaultAddress();
    }
  };
  const defaultAddress = async () => {
    try {
      apiCall
        .post('api/customerAddress/updateAddressDefault', {
          CUSTOMER_ID: user?.ID,
          ID: selected?.ID,
        })
        .then(res => {
          if (res.data.code == 200) {
            // @ts-ignore
            dispatch(Reducers.setAddress(selected ? selected : currentAddress));
            updateAddress();
            navigation.goBack();
          } else {
            Alert.alert(t('menu.addressBook.alerts.defaultError'));
          }
        });
    } catch (error) {}
  };
  const updateAddress = async () => {
    try {
      // @ts-ignore
      const cartId =
        type == 'P'
          ? products?.length
            ? products[0].CART_ID
            : null
          : cart?.length
          ? cart[0].CART_ID
          : null;

      if (SharedCartId || cartId) {
        const response = await apiCall.post(`api/cart/address/update`, {
          TYPE: SharedCartId ? 'P' : type,
          CUSTOMER_ID: user?.ID,
          CART_ID: SharedCartId ? SharedCartId : cartId,
          ADDRESS_ID: selected?.ID,
          NEW_TERRITORY_ID: selected?.TERRITORY_ID,
          OLD_TERRITORY_ID: currentAddress?.TERRITORY_ID,
        });
        if (response.data.code == 200) {
          ToastAndroid.show('Address Updated', ToastAndroid.SHORT);
          dispatch(Reducers.getCartInformation());
        } else {
          Alert.alert('Failed to update address');
        }
      } else {
        dispatch(Reducers.getCartInformation());
      }
    } catch (error) {
      Alert.alert(t('Failed to update address'));
    }
  };

   */
}
