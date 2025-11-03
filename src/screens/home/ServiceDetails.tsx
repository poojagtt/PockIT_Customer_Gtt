import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
 
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {Button, Header, Icon, ImagePicker, TextInput} from '../../components';
import {apiCall, fontFamily, Size, tokenStorage, useStorage, useTheme} from '../../modules';
import {Reducers, useDispatch, useSelector} from '../../context';
import {HomeRoutes} from '../../routes/Home';
import {_laptop, _modalNumberImage} from '../../assets';
import Modal from '../../components/Modal';
import {useTranslation} from 'react-i18next';
import ProgressBar from '../../components/ProgressBar';
import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';

interface deviceDetailsInterface {
  brandName: string;
  modelName: string;
  imageUrl: string;
  description: string;
}

// <<<<<<< HEAD
// interface ServiceDetailsProps extends HomeRoutes<'ServiceDetails'> { }
// const ServiceDetails: React.FC<ServiceDetailsProps> = ({ navigation, route }) => {
//   const {service, path} = route.params;
//   const { user, address, territory } = useSelector(state => state.app);
// =======
interface ServiceDetailsProps extends HomeRoutes<'ServiceDetails'> {}
const ServiceDetails: React.FC<ServiceDetailsProps> = ({navigation, route}) => {
  const {service: servicesDetails, path,quantity} = route.params;
  const [service, setService] = useState<ServicesInterface>(servicesDetails);
  const {user, address, territory} = useSelector(state => state.app);
  const dispatch = useDispatch();
  const colors = useTheme();
  const [deviceInfo, setDeviceInfo] = useState<deviceDetailsInterface>({
    brandName: '',
    modelName: '',
    imageUrl: '',
    description: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [addCartLoader, setAddCartLoader] = useState<boolean>(false);
  const [modal, setModal] = useState({
    modelInfo: false,
    uploadInfo: false,
  });
  const {cart} = useSelector(state => state.cart);

  const handleClose = () => {
    setDeviceInfo({...deviceInfo, imageUrl: ''});
  };
console.log("hereeeeeeeeeeeeeeeee")
  const {t} = useTranslation();
  async function createTempCart() {
    try {
      setLoading(true);
      if (!user || !address || !territory) {
        setLoading(false);
         console.log('\n\n\n\nuhfwy000000000000',territory)
        return Promise.reject(t('serviceDetails.userNotFound'));
      }
      console.log('000000000000')
      let payload = {
        CUSTOMER_ID: user.ID,
        ADDRESS_ID: address.ID,
        SERVICE_ID: service.SERVICE_ID,
        TERITORY_ID: territory.ID,
        INVENTORY_ID: 0,
        TYPE: 'S',
        QUANTITY: quantity?quantity:1,
        STATE_ID: address.STATE_ID,
        IS_TEMP_CART: 1,
        BRAND_NAME: deviceInfo.brandName,
        SERVICE_CATALOGUE_ID: service.SERVICE_PARENT_ID,
        MODEL_NUMBER: deviceInfo.modelName,
        SERVICE_PHOTO_FILE: '',
        DESCRIPTION: deviceInfo.description,
        QUANTITY_PER_UNIT: 0,
        UNIT_ID: 0,
        UNIT_NAME: '',
      };
      if (deviceInfo.imageUrl) {
        const name = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
        let formData = new FormData();
        formData.append('Image', {
          uri: deviceInfo.imageUrl,
          type: 'image/jpeg',
          name,
        });
        let uploadImage: boolean = await apiCall
          .post('api/upload/CartItemPhoto', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(res => {
            if (res.data && res.data.code == 200) {
              return true;
            } else {
              return false;
            }
          })
          .catch(error => {
            return false;
          });
        if (uploadImage) {
          payload.SERVICE_PHOTO_FILE = name;
        }
      }

      apiCall
        .post(`api/cart/add`, payload)
        .then(res => {
          if (res.data.code == 200) {
            const params = {
              cartId: res.data.data.CART_ID,
              services: [service],
            };
            navigation.navigate('SlotSelection', params);
            setLoading(false);
          } else {
            setLoading(false);
            return Promise.reject(res.data.message);
          }
        })
        .catch(err => {
          console.warn(err);
          setLoading(false);
        });
    } catch (error) {
      console.warn(error);
      setLoading(false);
    }
  }
  async function addCart() {
    setAddCartLoader(true);
    if (!user || user.ID == 0) {
      Alert.alert(
        t('serviceDetails.guestTitle'),
        t('serviceDetails.guestMessage'),
        [
          {text: t('serviceDetails.cancel'), onPress: () => {

          }},
          {
            text: t('serviceDetails.login'),
            onPress: () => {
              useStorage.delete('user');
              tokenStorage.clearToken();
              dispatch(Reducers.setSplash(true));
            },
            isPreferred: true,
          },
        ],
        {
          cancelable: false,
        },
      );
    } else {
      if (!address) {
        return;
      }
      let payload = {
        TYPE: 'S',
        QUANTITY: 1,
        INVENTORY_ID: 0,
        SERVICE_ID: service.SERVICE_ID,
        BRAND_NAME: deviceInfo.brandName,
        DESCRIPTION: deviceInfo.description,
        MODEL_NUMBER: deviceInfo.modelName,
        SERVICE_CATALOGUE_ID: service.SERVICE_PARENT_ID ?? 0,
        SERVICE_PHOTO_FILE: '',
        QUANTITY_PER_UNIT: 0,
        UNIT_ID: 0,
        UNIT_NAME: '',
      };
      if (deviceInfo.imageUrl) {
        const name = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
        let formData = new FormData();
        formData.append('Image', {
          uri: deviceInfo.imageUrl,
          type: 'image/jpeg',
          name,
        });
        let uploadImage: boolean = await apiCall
          .post('api/upload/CartItemPhoto', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(res => {
            if (res.data && res.data.code == 200) {
              return true;
            } else {
              return false;
            }
          })
          .catch(error => {
            return false;
          });
        if (uploadImage) {
          payload.SERVICE_PHOTO_FILE = name;
        }
      }
      dispatch(Reducers.createCartInformation(payload));
      setService({...service, QUANTITY: 1});
    }
    setAddCartLoader(false);
  }
  async function updateQuantity(qty: number) {
    dispatch(
      Reducers.updateCartItem({
        QUANTITY: qty,
        SERVICE_ID: service.SERVICE_ID,
      }),
    );
    setService({...service, QUANTITY: qty});
  }
  async function deleteCartItem() {
    dispatch(
      Reducers.deleteCartItem({
        SERVICE_ID: service.SERVICE_ID,
      }),
    );
    setService({...service, QUANTITY: 0});
  }

  return (
    
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
       <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 25}
      >
      <View>
        <Header
          label={service.CATEGORY_NAME}
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* <View style={{paddingHorizontal: 16, paddingTop: 16, gap: 8}}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={24}
            color={'#999999'}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles._headerText}>{service.CATEGORY_NAME}</Text>
        </View> */}

      <ProgressBar width={'100%'} />
      <View style={{flex: 1, marginTop: 10}}>
        {/* <Text
          onPress={() => navigation.goBack()}
          style={{
            marginHorizontal: 16,
            // paddingHorizontal: 8,
             fontFamily: fontFamily,
            fontSize: 16,
            fontWeight: 500,
            color: colors.text,
            // opacity: 0.8,
          }}>
          {path.map(item => item).join(' > ')}
          <Text style={{ fontWeight: 700 }}>{` > ${service.SERVICE_NAME}`}</Text>
        </Text> */}
        <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={true}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginHorizontal: 16,
              marginBottom: 10,
              // marginTop:10
            }}>
            <Text
              style={{
                flex: 1,

               fontFamily: fontFamily,
                fontSize: 16,
                fontWeight: 500,
                color: colors.text,
              }}>
              {t('serviceDetails.deviceDetails')}
            </Text>
            <Text
              onPress={() => {
                if (!user || user.ID == 0) {
                  Alert.alert(
                    t('serviceDetails.guestTitle'),
                    t('serviceDetails.guestMessage'),
                    [
                      {text: t('serviceDetails.cancel'), onPress: () => {}},
                      {
                        text: t('serviceDetails.login'),
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
                  createTempCart();
                }
              }}
              style={{
                paddingHorizontal: 8,
               fontFamily: fontFamily,
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 30,
                // letterSpacing: 0.1,
                color: '#636363',
                opacity: 0.6,
                textDecorationLine: 'underline',
                textDecorationColor: '#636363',
                textDecorationStyle: 'solid',
              }}>
              {t('serviceDetails.skip')}
            </Text>
          </View>
          <View style={[styles._card]}>
            <View style={{gap: 5}}>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text
                  style={{
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.text,
                    // opacity: 0.8,
                    // letterSpacing: 0.1,
                    // lineHeight: 20,
                  }}>
                  {t('serviceDetails.brandNameLabel')}
                </Text>
                <Text
                  style={{
                  fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 400,
                    color: '#636363',
                    // opacity: 0.6,
                    // letterSpacing: 0.1,
                    // lineHeight: 20,
                  }}>
                  {t('serviceDetails.optional')}
                </Text>
              </View>
              <TextInput
                placeholder={t('serviceDetails.brandPlaceholder')}
                value={deviceInfo.brandName}
                keyboardType="email-address"
                placeholderTextColor={`#636363`}
                onChangeText={brandName =>
                  setDeviceInfo({...deviceInfo, brandName})
                }
                style={{
                  backgroundColor: 'white',
                  padding: 8,
                  borderRadius: 8,
                  borderColor: '#CBCBCB',
                  borderWidth: 1,
                }}
              />
            </View>
            <View style={{gap: 5}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                <Text
                  style={{
                    flex: 1,
                  fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.text,
                    // opacity: 0.8,
                    // letterSpacing: 0.1,
                    // lineHeight: 20,
                  }}>
                  {t('serviceDetails.modelNumberLabel')}
                </Text>
                <Text
                  style={{
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 400,
                    color: '#636363',
                  }}>
                  {t('serviceDetails.optional')}
                </Text>
                <Icon
                  type="Feather"
                  name="info"
                  color="#636363"
                  onPress={() => {
                    setModal({...modal, modelInfo: true});
                  }}
                />
              </View>
              <TextInput
                placeholder={t('serviceDetails.modelPlaceholder')}
                value={deviceInfo.modelName}
                keyboardType="email-address"
                placeholderTextColor={`#636363`}
                onChangeText={modelName =>
                  setDeviceInfo({...deviceInfo, modelName})
                }
                style={{
                  backgroundColor: 'white',
                  padding: 8,
                  borderRadius: 8,
                  borderColor: '#CBCBCB',
                  borderWidth: 1,
                }}
              />
            </View>
            <View style={{gap: 5}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  // gap: 8,
                }}>
                <Text
                  style={{
                    flex: 1,
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.text,
                    // opacity: 0.8,
                    // letterSpacing: 0.1,
                    // lineHeight: 20,
                  }}>
                  {t('serviceDetails.uploadPhotoLabel')}
                </Text>
                <Text
                  style={{
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 400,
                    color: '#636363',
                    marginRight: 8,
                  }}>
                  {t('serviceDetails.optional')}
                </Text>
                <Icon
                  type="Feather"
                  name="info"
                  color="#636363"
                  onPress={() => {
                    setModal({...modal, uploadInfo: true});
                  }}
                />
              </View>
              <View>
                <ImagePicker
                  onCapture={res => {
                    setDeviceInfo({...deviceInfo, imageUrl: res.fileUrl});
                  }}
                  style={{
                    // flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#CBCBCB',
                    borderRadius: 8,
                    // paddingHorizontal: 12,
                    padding: 8,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        paddingBottom: 12,
                       fontFamily: fontFamily,
                        fontSize: 15,
                        fontWeight: 400,
                        color: '#636363',
                      }}>
                      {t('serviceDetails.browseImage')}
                    </Text>
                    <Icon type="Feather" name="upload" color="#636363" />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <Image
                      source={{
                        uri: deviceInfo.imageUrl,
                        cache: 'default',
                      }}
                      style={{height: 120, flex: 1, width: '100%'}}
                      resizeMode="contain"
                    />

                    {deviceInfo.imageUrl && (
                      <TouchableOpacity
                        onPress={handleClose}
                        style={{
                          padding: 4,
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          backgroundColor: 'white',
                          borderRadius: 50,
                          borderWidth: 1,
                        }}>
                        <Icon type="Feather" name="x" color="black" size={20} />
                      </TouchableOpacity>
                    )}
                  </View>
                </ImagePicker>
              </View>
            </View>
            <View style={{gap: 5}}>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text
                  style={{
                    fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.text,
                    // opacity: 0.8,
                    // letterSpacing: 0.1,
                    // lineHeight: 20,
                  }}>
                  {t('serviceDetails.descriptionLabel')}
                </Text>
                <Text
                  style={{
                   fontFamily: fontFamily,
                    fontSize: 16,
                    fontWeight: 400,
                    color: '#636363',
                  }}>
                  {t('serviceDetails.optional')}
                </Text>
              </View>
              <TextInput
                placeholder={t('serviceDetails.descriptionPlaceholder')}
                value={deviceInfo.description}
                keyboardType="email-address"
                placeholderTextColor={`#636363`}
                onChangeText={description =>
                  setDeviceInfo({...deviceInfo, description})
                }
                style={{
                  backgroundColor: 'white',
                  padding: 8,
                  borderRadius: 8,
                  borderColor: '#CBCBCB',
                  borderWidth: 1,
                }}
              />
            </View>
          </View>
        </ScrollView>
        {/* button Section */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: colors.background,
            gap: 16,
            padding: 16,
            // marginBottom: 100,
          }}>
          {/* {addCartLoader ? (
            <View
              style={{
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: '#f2f2f2',
                borderWidth: 1,
                borderColor: '#cccccc',
              }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) 
          : service.QUANTITY > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 49,
                borderRadius: 8,
                backgroundColor: '#f2f2f2',
                borderWidth: 1,
                borderColor: '#cccccc',
                marginBottom: -100,
              }}>
              <TouchableOpacity
                onPress={() => {
                  if (Number(service.QUANTITY) - 1 == 0) {
                    deleteCartItem();
                  } else {
                    updateQuantity(Number(service.QUANTITY) - 1);
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="minus" size={20} type="MaterialCommunityIcons" />
              </TouchableOpacity>

              <Text
                style={{
                  minWidth: 30,
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '500',
                  fontFamily: fontFamily
                }}>
                {service.QUANTITY}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (Number(service.QUANTITY) < Number(service.MAX_QTY)) {
                    updateQuantity(Number(service.QUANTITY) + 1);
                  } else {
                    Alert.alert(t('serviceDetails.maxQuantityLimit'));
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="plus" size={20} type="MaterialCommunityIcons" />
              </TouchableOpacity>
            </View>
          ) : (
            null
            // <Icon
            //   name="cart-plus"
            //   size={24}
            //   type="MaterialCommunityIcons"
            //   style={{
            //     // height: 44,
            //     // width: 44,
            //     padding: 10,
            //     alignItems: 'center',
            //     justifyContent: 'center',
            //     borderRadius: 8,
            //     backgroundColor: '#f2f2f2',
            //     borderWidth: 1,
            //     borderColor: '#cccccc',
            //   }}
            //   onPress={() => addCart()}
            // />
          )
          } */}
          <Button
            onLongPress={() => {}}
            label={t('serviceDetails.nextButton')}
            onPress={() => {
              console.log('wetu[')
              if (!user || user.ID == 0) {
                Alert.alert(
                  t('serviceDetails.guestTitle'),
                  t('serviceDetails.guestMessage'),
                  [
                    {text: t('serviceDetails.cancel'), onPress: () => {}},
                    {
                      text: t('serviceDetails.login'),
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
                createTempCart();
              }
            }}
            loading={loading}
            style={{flex: 1}}
          />
        </View>
      </View>

      {/* button Section
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
          gap: 16,
          padding: 16,
          marginBottom:100
        }}>
        {addCartLoader ? (
          <View
            style={{
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: '#f2f2f2',
              borderWidth: 1,
              borderColor: '#cccccc',
            }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : service.QUANTITY > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 44,
              borderRadius: 8,
              backgroundColor: '#f2f2f2',
              borderWidth: 1,
              borderColor: '#cccccc',
              marginBottom:-100
            }}>
            <TouchableOpacity
              onPress={() => {
                if (Number(service.QUANTITY) - 1 == 0) {
                  deleteCartItem();
                } else {
                  updateQuantity(Number(service.QUANTITY) - 1);
                }
              }}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="minus" size={20} type="MaterialCommunityIcons" />
            </TouchableOpacity>

            <Text
              style={{
                minWidth: 30,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '500',
              }}>
              {service.QUANTITY}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (Number(service.QUANTITY) < Number(service.MAX_QTY)) {
                  updateQuantity(Number(service.QUANTITY) + 1);
                } else {
                  Alert.alert(t('serviceDetails.maxQuantityLimit'));
                }
              }}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
          
              }}>
              <Icon name="plus" size={20} type="MaterialCommunityIcons" />
            </TouchableOpacity>
          </View>
        ) : (
          <Icon
            name="cart-plus"
            size={24}
            type="MaterialCommunityIcons"
            style={{
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: '#f2f2f2',
              borderWidth: 1,
              borderColor: '#cccccc',
            }}
            onPress={() => addCart()}
          />
        )}
        <Button
          onLongPress={() => {
          }}
          label={t('serviceDetails.nextButton')}
          onPress={() => createTempCart()}
          loading={loading}
          style={{flex: 1}}
        />
      </View> */}
      <BottomModalWithCloseButton
        show={modal.modelInfo || modal.uploadInfo}
        title={modal.modelInfo ? t('serviceDetails.modelInfoTitle') : 'Example'}
        onClose={() => setModal({modelInfo: false, uploadInfo: false})}>
        {modal.modelInfo && (
          <Text
            style={{
              fontSize: 14,
             fontFamily: fontFamily,
              fontWeight: '400',
              color: '#707070',
              // lineHeight: 18,
            }}>
            {t('serviceDetails.modelInfoDescription')}
          </Text>
        )}
        <Image
          source={modal.modelInfo ? _modalNumberImage : _laptop}
          style={{
            width: '100%',
            height: 200,
            resizeMode: 'contain',
            alignSelf: 'center',
          }}
        />
      </BottomModalWithCloseButton>
      <RNModal visible={addCartLoader || loading} transparent={true} />
       </KeyboardAvoidingView>
    </SafeAreaView>
   
  );
};
export default ServiceDetails;
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
  },
  _card: {
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  _modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  _modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  _modalTitle: {
    paddingBottom: 20,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
