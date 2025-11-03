import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useReducer,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  PermissionsAndroid,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  API_KEY,
  apiCall,
  fontFamily,
  GlobalStyle,
  isValidMobile,
  MAP_API,
  Permissions,
  Size,
  useStorage,
  useTheme,
} from '../../modules';
import axios from 'axios';

import MapView, { Address, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { Reducers, useDispatch, useSelector } from '../../context';
import { Button, Icon, TextInput } from '../../components';
import Modal from '../../components/Modal';
import { _styles } from '../../modules/stylesheet';
import { _noData } from '../../assets';
import { useTranslation } from 'react-i18next';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import messaging from '@react-native-firebase/messaging';
import Toast from '../../components/Toast';

interface AddressPopUpProps {
  show: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  isEdit?: boolean;
  addressData?: AddressInterface;
  type: string | null;
}
interface errorInterface {
  ADDRESS_LINE_1: string;
  ADDRESS_LINE_2: string;
  LANDMARK: string;
  CITY_NAME: string;
  POSTAL_CODE: string;
  STATE: string;
}
interface UserPayload {
  CUSTOMER_ID: number;
  CUSTOMER_TYPE: number;
  CONTACT_PERSON_NAME: string;
  MOBILE_NO: string;
  EMAIL_ID: string;
  ADDRESS_LINE_1: string;
  ADDRESS_LINE_2: string | '';
  COUNTRY_ID: number | null;
  STATE_ID: number | null;
  CITY_ID: number | null;
  CITY_NAME: string;
  DISTRICT_ID: number | null;
  PINCODE_ID: string | null;
  PINCODE: string | null;
  GEO_LOCATION: string;
  TYPE: 'H' | 'B' | string;
  IS_DEFAULT: 1 | 0;
  CLIENT_ID: 1;
  PINCODE_FOR: string;
}
interface GuestPayload {
  user: UserInterface;
  address: AddressInterface;
}

interface AddressState {
  mapLocation: {
    latitude: number;
    longitude: number;
    address: Address | null | any;
    loading: boolean;
  };
  contactPerson: {
    name: string;
    mobile: string;
  };
  address: AddressInterface;
  error: errorInterface;
  modal: {
    requestPermission: boolean;
    pinCodeSelection: boolean;
    stateSelection: boolean;
    contactPersonUpdate: boolean;
  };
  postalCode: {
    value: string;
    data: PinCode[];
    loading: boolean;
  };
  stateData: {
    data: any[];
    searchValue: string;
  };
}

type AddressAction =
  | { type: 'SET_MAP_LOCATION'; payload: Partial<AddressState['mapLocation']> }
  | {
    type: 'SET_CONTACT_PERSON';
    payload: Partial<AddressState['contactPerson']>;
  }
  | { type: 'SET_ADDRESS'; payload: Partial<AddressState['address']> }
  | { type: 'SET_ERROR'; payload: Partial<AddressState['error']> }
  | { type: 'SET_MODAL'; payload: Partial<AddressState['modal']> }
  | { type: 'SET_POSTAL_CODE'; payload: Partial<AddressState['postalCode']> }
  | { type: 'SET_STATE_DATA'; payload: Partial<AddressState['stateData']> };

const initialState: AddressState = {
  mapLocation: {
    latitude: 0,
    longitude: 0,
    address: null,
    loading: true,
  },
  contactPerson: {
    name: '',
    mobile: '',
  },
  address: {
    ADDRESS_LINE_1: '',
    ADDRESS_LINE_2: '',
    CITY_ID: null,
    CITY_NAME: '',
    CONTACT_PERSON_NAME: '',
    COUNTRY_ID: null,
    COUNTRY_NAME: '',
    CUSTOMER_ID: 0,
    CUSTOMER_NAME: '',
    DISTRICT_ID: 0,
    DISTRICT_NAME: '',
    EMAIL_ID: '',
    GEO_LOCATION: '',
    ID: 0,
    IS_DEFAULT: 0,
    LANDMARK: '',
    MOBILE_NO: '',
    PINCODE: '',
    PINCODE_FOR: '',
    PINCODE_ID: '',
    STATE_ID: 0,
    STATE_NAME: '',
    TERRITORY_ID: 0,
    TERRITORY_NAME: '',
    TYPE: 'H',
  },
  error: {
    ADDRESS_LINE_1: '',
    ADDRESS_LINE_2: '',
    LANDMARK: '',
    CITY_NAME: '',
    POSTAL_CODE: '',
    STATE: '',
  },
  modal: {
    requestPermission: false,
    pinCodeSelection: false,
    stateSelection: false,
    contactPersonUpdate: false,
  },
  postalCode: {
    value: '',
    data: [],
    loading: false,
  },
  stateData: {
    data: [],
    searchValue: '',
  },
};

function addressReducer(
  state: AddressState,
  action: AddressAction,
): AddressState {
  switch (action.type) {
    case 'SET_MAP_LOCATION':
      return { ...state, mapLocation: { ...state.mapLocation, ...action.payload } };
    case 'SET_CONTACT_PERSON':
      return {
        ...state,
        contactPerson: { ...state.contactPerson, ...action.payload },
      };
    case 'SET_ADDRESS':
      return { ...state, address: { ...state.address, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: { ...state.error, ...action.payload } };
    case 'SET_MODAL':
      return { ...state, modal: { ...state.modal, ...action.payload } };
    case 'SET_POSTAL_CODE':
      return { ...state, postalCode: { ...state.postalCode, ...action.payload } };
    case 'SET_STATE_DATA':
      return { ...state, stateData: { ...state.stateData, ...action.payload } };
    default:
      return state;
  }
}

const handleApiError = (error: any, t: any) => {
  console.error('API Error:', error);
  Toast(error.response?.data?.message || t('common.errors.somethingWentWrong'));
};
console.log("MAP_API", MAP_API)
// Add these interfaces after the existing interfaces
interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
}

const AddressPopUp: React.FC<AddressPopUpProps> = ({
  show,
  onClose,
  onSuccess,
  isEdit = false,
  addressData,
  type,
}) => {
  const { user, address: reduxAddress } = useSelector(state => state.app);
  const isGuest = user && user.ID == 0;

  const dispatch = useDispatch();
  const colors = useTheme();
  const mapRef = useRef<MapView | null>(null);
  const [state, dispatchState] = useReducer(addressReducer, initialState);
  const { t } = useTranslation();
  const [mapStyle, setMapStyle] = useState('map');
  const [loading, setLoading] = useState(false);
  const [userdetails, setUserDetails] = useState(false);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const setMapLocation = useCallback(
    (payload: Partial<AddressState['mapLocation']>) => {
      dispatchState({ type: 'SET_MAP_LOCATION', payload });
    },
    [],
  );

  const [query, setQuery] = useState('');

  const changeLocation = useCallback(
    async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      try {
        console.log("mapRef.current", mapRef.current)
        if (mapRef.current) {
          const data: Address | undefined =
            await mapRef.current.addressForCoordinate({
              latitude,
              longitude,
            });

          setMapLocation({
            ...state.mapLocation,
            latitude,
            longitude,
            address: data || null,
          });

          // Update address fields if data is available
          if (data) {
            dispatchState({
              type: 'SET_ADDRESS',
              payload: {
                ADDRESS_LINE_2: `${data.name || ''}${data.subLocality ? ', ' + data.subLocality : ''
                  }${data.locality ? ', ' + data.locality : ''}`,
                CITY_NAME: data.locality || '',
                PINCODE: data.postalCode || '',
              },
            });

            dispatchState({
              type: 'SET_POSTAL_CODE',
              payload: {
                value: data.postalCode || '',
              },
            });
          }
        }
      } catch (err) {
        console.warn('Error getting address:', err);
        setMapLocation({
          ...state.mapLocation,
          latitude,
          longitude,
          address: null,
        });
      }
    },
    [state.mapLocation, setMapLocation],
  );

  const getCurrentLocation = useCallback(async () => {
    try {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setMapLocation({
              ...state.mapLocation,
              latitude,
              longitude,
              loading: false,
            });
            // Always call changeLocation to fetch address for these coordinates
            changeLocation({ latitude, longitude });
            resolve({ latitude, longitude });
          },
          error => {
            console.warn('Location error:', error);
            setMapLocation({
              ...state.mapLocation,
              latitude: 0,
              longitude: 0,
              loading: false,
            });
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      });
    } catch (error) {
      console.warn('Error getting location:', error);
      setMapLocation({
        ...state.mapLocation,
        latitude: 0,
        longitude: 0,
        loading: false,
      });
    }
  }, [state.mapLocation, setMapLocation, changeLocation]);

  const checkPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('address.locationPermission.title'),
            message: t('address.locationPermission.message'),
            buttonNeutral: t('address.locationPermission.askMeLater'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('splash.ok'),
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await getCurrentLocation();
        } else {
          Alert.alert(
            t('address.locationPermission.requiredTitle'),
            t('address.locationPermission.requiredMessage'),
            [
              {
                text: t('common.cancel'),
                style: 'cancel',
                onPress: () => {
                  setMapLocation({
                    ...state.mapLocation,
                    latitude: 0,
                    longitude: 0,
                    loading: false,
                  });
                },
              },
              {
                text: t('address.locationPermission.openSettings'),
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ],
          );
          setMapLocation({
            ...state.mapLocation,
            latitude: 0,
            longitude: 0,
            loading: false,
          });
        }
      } else if (Platform.OS === 'ios') {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        if (auth === 'granted') {
          Geolocation.getCurrentPosition(
            position => {
              const { latitude, longitude } = position.coords;
              setMapLocation({
                ...state.mapLocation,
                latitude,
                longitude,
                loading: false,
              });
              // Call changeLocation here as well
              changeLocation({ latitude, longitude });
            },
            error => {
              console.warn('iOS location error:', error);
              Alert.alert(
                t('address.locationPermission.requiredTitle'),
                t('address.locationPermission.requiredMessage'),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => {
                      setMapLocation({
                        ...state.mapLocation,
                        latitude: 0,
                        longitude: 0,
                        loading: false,
                      });
                    },
                  },
                  {
                    text: t('address.locationPermission.openSettings'),
                    onPress: () => {
                      Linking.openURL('app-settings:');
                    },
                  },
                ],
              );
              setMapLocation({
                ...state.mapLocation,
                latitude: 0,
                longitude: 0,
                loading: false,
              });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else {
          Alert.alert(
            t('address.locationPermission.requiredTitle'),
            t('address.locationPermission.requiredMessage'),
            [
              {
                text: t('common.cancel'),
                style: 'cancel',
                onPress: () => {
                  setMapLocation({
                    ...state.mapLocation,
                    latitude: 0,
                    longitude: 0,
                    loading: false,
                  });
                },
              },
              {
                text: t('address.locationPermission.openSettings'),
                onPress: () => {
                  Linking.openURL('app-settings:');
                },
              },
            ],
          );
          setMapLocation({
            ...state.mapLocation,
            latitude: 0,
            longitude: 0,
            loading: false,
          });
        }
      }
    } catch (error) {
      console.warn('Permission check error:', error);
      Alert.alert(
        t('common.error'),
        t('address.locationPermission.accessErrorMessage'),
        [
          {
            text: t('splash.ok'),
            onPress: () => {
              setMapLocation({
                ...state.mapLocation,
                latitude: 0,
                longitude: 0,
                loading: false,
              });
            },
          },
        ],
      );
      setMapLocation({
        ...state.mapLocation,
        latitude: 0,
        longitude: 0,
        loading: false,
      });
    }
  }, [
    getCurrentLocation,
    state.mapLocation,
    setMapLocation,
    t,
    changeLocation,
  ]);

  const fetchPlaces = async (input: string) => {
    if (!input) return setPlaces([]);
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input,
            key: MAP_API,
            types: '(cities)',
          },
        },
      );
      setPlaces(res.data.predictions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await apiCall.post('getPlaces', {
        SEARCHKEY: text,
      });

      if (res.status === 200) {
        console.log("\n\n\nNew API response:", res);
        setSuggestions(res.data.data);
      } else {
        console.warn('Non-200 response status:', res.status);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
    // try {
    //   const res = await axios.get(
    //     `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
    //     {
    //       params: {
    //         input: text,
    //         key: MAP_API,
    //         language: 'en',
    //       },
    //     },
    //   );
    //   console.log("map",res.data)
    //   setSuggestions(res.data.predictions);
    // } catch (err) {
    //   console.error('Autocomplete error:', err);
    // }
  };


  const fetchPlaceDetails = async (
    placeId: string,
  ): Promise<PlaceDetails | null> => {

    try {
      const res = await apiCall.post('getPlaceDetails', {
        placeId: placeId,
      });

      if (res.status === 200) {
        console.log("\n\n\nDetails response:", res);

        const { lat, lng, address } = res.data.data;

        console.log("Parsed place details:", { lat, lng, address });

        return { lat, lng, address };
      } else {
        console.warn('Non-200 response status:', res.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }

    // try {
    //   const res = await axios.get(
    //     `https://maps.googleapis.com/maps/api/place/details/json`,
    //     {
    //       params: {
    //         place_id: placeId,
    //         key: MAP_API,
    //       },
    //     },
    //   );
    //   const {lat, lng} = res.data.result.geometry.location;
    //   console.log("res.datalat,l.predictions",lat,lng)
    //   return {lat, lng, address: res.data.result.formatted_address};
    // } catch (err) {
    //   console.error('Place details error:', err);
    //   return null;
    // }
  };

  const handleSelectPlace = async (item: PlaceSuggestion) => {
    const details = await fetchPlaceDetails(item.place_id);
    if (details) {
      const { lat, lng, address } = details;
      setLocation({
        latitude: lat,
        longitude: lng,
        address,
      });

      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setInput(address);
      setSuggestions([]);
    }
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 200);
  };

  function getPostalCode() {
    try {
      dispatchState({
        type: 'SET_POSTAL_CODE',
        payload: { loading: true, data: [] },
      });
      let fil = ` AND PINCODE_NUMBER LIKE '%${state.postalCode.value}%'`;
      fil += type === 'S' ? ` AND PINCODE_FOR != 'I'` : '';
      fil += type === 'P' ? ` AND PINCODE_FOR != 'S'` : '';
      apiCall
        .post(`pincode/get`, {
          pageIndex: 1,
          pageSize: 10,
          sortKey: 'SEQ_NO',
          sortValue: 'asc',
          filter: fil,
        })
        .then(data => {
          if (
            data.data.code == 200 &&
            data.data.data &&
            data.data.data.length > 0
          ) {
            dispatchState({
              type: 'SET_POSTAL_CODE',
              payload: {
                loading: false,
                data: data.data.data,
              },
            });
            dispatchState({
              type: 'SET_ADDRESS',
              payload: {
                ...state.address,
                STATE_ID: data.data.data[0].STATE || 0,
                STATE_NAME: data.data.data[0].STATE_NAME || '',
                PINCODE_ID: data.data.data[0].ID,
                PINCODE: data.data.data[0].PINCODE,
                PINCODE_FOR: data.data.data[0].PINCODE_FOR,
                COUNTRY_ID: data.data.data[0].COUNTRY_ID,
                COUNTRY_NAME: data.data.data[0].COUNTRY_NAME,
                DISTRICT_ID: data.data.data[0].DISTRICT,
                DISTRICT_NAME: data.data.data[0].DISTRICT_NAME,
              },
            });
          } else {
            dispatchState({
              type: 'SET_POSTAL_CODE',
              payload: {
                loading: false,
                data: [],
              },
            });
          }
        })
        .catch(err => {
          console.warn(err);
          dispatchState({
            type: 'SET_POSTAL_CODE',
            payload: {
              loading: false,
              data: [],
            },
          });
        });
    } catch (err) {
      console.warn(err);
      dispatchState({
        type: 'SET_POSTAL_CODE',
        payload: {
          loading: false,
          data: [],
        },
      });
    }
  }

  const validateAddress = useCallback(
    async (
      address: AddressInterface,
    ): Promise<{
      isValid: boolean;
      errors: errorInterface;
      territory?: TerritoryPinCodeMapping | null;
    }> => {
      const errors: errorInterface = {
        ADDRESS_LINE_1: '',
        ADDRESS_LINE_2: '',
        LANDMARK: '',
        CITY_NAME: '',
        POSTAL_CODE: '',
        STATE: '',
      };

      if (!address.ADDRESS_LINE_1?.trim()) {
        errors.ADDRESS_LINE_1 = t('address.errors.addressLine1Required');
      }

      if (!address.CITY_NAME?.trim()) {
        errors.CITY_NAME = t('address.errors.cityRequired');
      }

      if (!address.PINCODE_ID) {
        errors.POSTAL_CODE = t('address.errors.pincodeRequired');
      }

      if (!address.STATE_ID) {
        errors.STATE = t('address.errors.stateRequired');
      }

      // Check territory validation if pincode exists
      let territory = null;
      if (address.PINCODE_ID && type != null) {
        territory = await getTerritoryId(address.PINCODE_ID);
        if (!territory) {
          errors.POSTAL_CODE = t('address.errors.territoryNotServed');
        }
      }

      return {
        isValid: !Object.values(errors).some(error => error !== ''),
        errors,
        territory,
      };
    },
    [t],
  );

  const saveAddress = useCallback(async () => {
    try {
      const validation = await validateAddress(state.address);

      if (
        !state.address.ADDRESS_LINE_2 ||
        state.address.ADDRESS_LINE_2.trim() === ''
      ) {
        dispatchState({
          type: 'SET_ERROR',
          payload: { ADDRESS_LINE_2: t('address.errors.buildingNameRequired') },
        });
        return;
      }

      if (!validation.isValid) {
        dispatchState({
          type: 'SET_ERROR',
          payload: validation.errors,
        });
        return;
      }

      if (
        !validation.territory &&
        validation.errors.POSTAL_CODE === t('address.errors.territoryNotServed')
      ) {
        Alert.alert(
          t('address.errors.sorry'),
          t('address.errors.territoryNotServed'),
          [
            {
              text: t('address.errors.ok'),
              onPress: () => {
                dispatchState({
                  type: 'SET_POSTAL_CODE',
                  payload: { value: '' },
                });
                dispatchState({
                  type: 'SET_ADDRESS',
                  payload: {
                    PINCODE: '',
                    PINCODE_ID: '',
                    PINCODE_FOR: '',
                    COUNTRY_ID: 0,
                    COUNTRY_NAME: '',
                    DISTRICT_ID: 0,
                    DISTRICT_NAME: '',
                    STATE_ID: 0,
                    STATE_NAME: '',
                  },
                });
              },
            },
          ],
        );
        return;
      }

      if (isGuest) {
        const data = await checkValidationForGuest();
        await useStorage.set(`user`, 0);
        await useStorage.set(`guestAddress`, JSON.stringify(data.address));
        dispatch(Reducers.setSplash(true));
      } else {
        setLoading(true);
        const payload = await checkValidation();
        const endpoint = isEdit
          ? 'api/customerAddress/updateAddress'
          : 'api/customerAddress/createAddress';
        const response = await apiCall[isEdit ? 'put' : 'post'](endpoint, {
          ...payload,
          ...(isEdit ? { ID: addressData?.ID, STATUS: 1 } : {}),
        });
        if (response.data.code === 200) {
          if (!isEdit && response.data.SUBSCRIBED_CHANNELS) {
            const topic = response.data.SUBSCRIBED_CHANNELS;
            const prevTopic = JSON.parse(
              useStorage.getString('SUBSCRIBED_CHANNELS') || '[]',
            );
            const newTopic = [...prevTopic, ...topic];
            useStorage.set('SUBSCRIBED_CHANNELS', JSON.stringify(newTopic));
            if (topic) {
              topic.map(async (item: any) => {
                await messaging()
                  .subscribeToTopic(item.CHANNEL_NAME)
                  .then(() => { });
              });
            }
          }
          onSuccess();
          Toast(t(isEdit ? 'address.addressUpdated' : 'address.addressAdded'));
        }
        setLoading(false);
      }
    } catch (error) {
      handleApiError(error, t);
      setLoading(false);
    }
  }, [
    isGuest,
    isEdit,
    addressData,
    onSuccess,
    state.address,
    t,
    validateAddress,
    checkValidationForGuest,
    checkValidation,
    dispatch,
  ]);

  const handleValidationError = useCallback((error: any) => {
    const newError = { ...error };
    if (error.code === 'USER') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_1: '',
          ADDRESS_LINE_2: '',
          CITY_NAME: '',
          STATE_NAME: '',
          POSTAL_CODE: '',
        },
      });
    } else if (error.code === 'ADDRESS_LINE_1') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_1: error.message,
          ADDRESS_LINE_2: '',
          LANDMARK: '',
          POSTAL_CODE: '',
          CITY_NAME: '',
          STATE: '',
        },
      });
    } else if (error.code === 'ADDRESS_LINE_2') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_1: '',
          ADDRESS_LINE_2: error.message,
          LANDMARK: '',
          POSTAL_CODE: '',
          CITY_NAME: '',
          STATE: '',
        },
      });
    } else if (error.code === 'POSTAL_CODE') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_2: '',
          ADDRESS_LINE_1: '',
          LANDMARK: '',
          POSTAL_CODE: error.message,
          CITY_NAME: '',
          STATE: '',
        },
      });
    } else if (error.code === 'CITY') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_2: '',
          ADDRESS_LINE_1: '',
          LANDMARK: '',
          POSTAL_CODE: '',
          CITY_NAME: error.message,
          STATE: '',
        },
      });
    } else if (error.code === 'STATE') {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_2: '',
          ADDRESS_LINE_1: '',
          LANDMARK: '',
          POSTAL_CODE: '',
          CITY_NAME: '',
          STATE: error.message,
        },
      });
    } else {
      dispatchState({
        type: 'SET_ERROR',
        payload: {
          ...error,
          ADDRESS_LINE_1: '',
          ADDRESS_LINE_2: '',
          CITY_NAME: '',
          STATE_NAME: '',
          POSTAL_CODE: '',
        },
      });
    }
  }, []);

  function checkValidation(): Promise<UserPayload> {
    return new Promise((resolve, reject) => {
      if (!user) reject({ code: 'USER', message: `User not found` });
      else if (!state.address.TYPE)
        reject({ code: 'TYPE', message: `Please Select your type` });
      else if (!state.address.ADDRESS_LINE_1)
        reject({
          code: 'ADDRESS_LINE_1',
          message: t('address.errors.addressLine1Required'),
        });
      else if (
        state.address.ADDRESS_LINE_1 &&
        state.address.ADDRESS_LINE_1.trim() == ''
      )
        reject({
          code: 'ADDRESS_LINE_1',
          message: `House number/flat no/floor no can not be empty`,
        });
      else if (
        !state.address.ADDRESS_LINE_2 ||
        state.address.ADDRESS_LINE_2.trim() === ''
      )
        reject({
          code: 'ADDRESS_LINE_2',
          message: t('address.errors.buildingNameRequired'),
        });
      else if (!state.address.PINCODE_ID)
        reject({
          code: 'POSTAL_CODE',
          message: t('address.errors.pincodeRequired'),
        });
      else if (!state.address.CITY_NAME || state.address.CITY_NAME.length == 0)
        reject({ code: 'CITY', message: t('address.errors.cityRequired') });
      else if (!state.address.STATE_ID)
        reject({ code: 'STATE', message: t('address.errors.stateRequired') });
      else
        resolve({
          CUSTOMER_ID: user.ID,
          CUSTOMER_TYPE: 1,
          CONTACT_PERSON_NAME: state.contactPerson.name,
          MOBILE_NO: state.contactPerson.mobile,
          EMAIL_ID: '',
          ADDRESS_LINE_1: state.address.ADDRESS_LINE_1,
          ADDRESS_LINE_2: state.address.ADDRESS_LINE_2,
          COUNTRY_ID: state.address.COUNTRY_ID,
          STATE_ID: state.address.STATE_ID,
          CITY_ID: state.address.CITY_ID,
          CITY_NAME: state.address.CITY_NAME,
          PINCODE_ID: state.address.PINCODE_ID,
          PINCODE: state.address.PINCODE,
          DISTRICT_ID: state.address.DISTRICT_ID,
          GEO_LOCATION: state.address.GEO_LOCATION,
          TYPE: state.address.TYPE,
          IS_DEFAULT: state.address.IS_DEFAULT,
          CLIENT_ID: 1,
          PINCODE_FOR: state.address.PINCODE_FOR,
        });
    });
  }
  async function checkValidationForGuest(): Promise<GuestPayload> {
    let Territory: null | TerritoryPinCodeMapping = await getTerritoryId(
      state.address.PINCODE_ID,
    );
    return new Promise(async (resolve, reject) => {
      if (!Territory) {
        const payload = await checkValidation();
        resolve({
          user: {
            ACCOUNT_STATUS: 0,
            ALTCOUNTRY_CODE: '+91',
            ALTERNATE_MOBILE_NO: '',
            ARCHIVE_FLAG: 'F',
            CLIENT_ID: 1,
            CLOUD_ID: '',
            COMPANY_NAME: '',
            COUNTRY_CODE: '+91',
            CREATED_MODIFIED_DATE: '',
            CURRENT_ADDRESS_ID: null,
            CUSTOMER_CATEGORY_ID: 1,
            CUSTOMER_TYPE: 'I',
            DEVICE_ID: '',
            EMAIL: '',
            GST_NO: '',
            ID: 0,
            IS_SPECIAL_CATALOGUE: 0,
            LOGOUT_DATETIME: '',
            MOBILE_NO: '',
            NAME: '',
            PAN: '',
            PROFILE_PHOTO: '',
            READ_ONLY: 'N',
            REGISTRATION_DATE: '',
            SALUTATION: '',
          },
          address: {
            ADDRESS_LINE_1: state.address.ADDRESS_LINE_1,
            ADDRESS_LINE_2: state.address.ADDRESS_LINE_2,
            CITY_ID: state.address.CITY_ID,
            CITY_NAME: state.address.CITY_NAME,
            CONTACT_PERSON_NAME: state.contactPerson.name,
            COUNTRY_ID: 0,
            COUNTRY_NAME: state.address.COUNTRY_NAME,
            CUSTOMER_ID: 0,
            CUSTOMER_NAME: '',
            DISTRICT_ID: 0,
            DISTRICT_NAME: state.address.DISTRICT_NAME,
            EMAIL_ID: '',
            GEO_LOCATION: state.address.GEO_LOCATION,
            ID: 0,
            IS_DEFAULT: 1,
            LANDMARK: state.address.LANDMARK,
            MOBILE_NO: state.contactPerson.mobile,
            PINCODE: state.address.PINCODE,
            PINCODE_ID: state.address.PINCODE_ID,
            PINCODE_FOR: state.address.PINCODE_FOR,
            STATE_ID: 0,
            STATE_NAME: state.address.STATE_NAME,
            TERRITORY_ID: null,
            TERRITORY_NAME: '',
            TYPE: state.address.TYPE,
            ARCHIVE_FLAG: 'F',
            CLIENT_ID: 1,
            CREATED_MODIFIED_DATE: '',
            READ_ONLY: 'N',
          },
        });
        // Alert.alert(
        //   t('address.errors.sorry'),
        //   t('address.errors.territoryNotServed'),
        //   [
        //     {
        //       text: t('address.errors.ok'),
        //       onPress: () => {
        //         dispatchState({
        //           type: 'SET_POSTAL_CODE',
        //           payload: {value: ''},
        //         });
        //         dispatchState({
        //           type: 'SET_ADDRESS',
        //           payload: {
        //             PINCODE: '',
        //             PINCODE_ID: '',
        //             PINCODE_FOR: '',
        //             COUNTRY_ID: 0,
        //             COUNTRY_NAME: '',
        //             DISTRICT_ID: 0,
        //             DISTRICT_NAME: '',
        //             STATE_ID: 0,
        //             STATE_NAME: '',
        //           },
        //         });
        //       },
        //     },
        //   ],
        // );
        // reject('We are not serving in your area');
      } else {
        try {
          const payload = await checkValidation();
          resolve({
            user: {
              ACCOUNT_STATUS: 0,
              ALTCOUNTRY_CODE: '+91',
              ALTERNATE_MOBILE_NO: '',
              ARCHIVE_FLAG: 'F',
              CLIENT_ID: 1,
              CLOUD_ID: '',
              COMPANY_NAME: '',
              COUNTRY_CODE: '+91',
              CREATED_MODIFIED_DATE: '',
              CURRENT_ADDRESS_ID: null,
              CUSTOMER_CATEGORY_ID: 1,
              CUSTOMER_TYPE: 'I',
              DEVICE_ID: '',
              EMAIL: '',
              GST_NO: '',
              ID: 0,
              IS_SPECIAL_CATALOGUE: 0,
              LOGOUT_DATETIME: '',
              MOBILE_NO: '',
              NAME: '',
              PAN: '',
              PROFILE_PHOTO: '',
              READ_ONLY: 'N',
              REGISTRATION_DATE: '',
              SALUTATION: '',
            },
            address: {
              ADDRESS_LINE_1: state.address.ADDRESS_LINE_1,
              ADDRESS_LINE_2: state.address.ADDRESS_LINE_2,
              CITY_ID: state.address.CITY_ID,
              CITY_NAME: state.address.CITY_NAME,
              CONTACT_PERSON_NAME: state.contactPerson.name,
              COUNTRY_ID: 0,
              COUNTRY_NAME: state.address.COUNTRY_NAME,
              CUSTOMER_ID: 0,
              CUSTOMER_NAME: '',
              DISTRICT_ID: 0,
              DISTRICT_NAME: state.address.DISTRICT_NAME,
              EMAIL_ID: '',
              GEO_LOCATION: state.address.GEO_LOCATION,
              ID: 0,
              IS_DEFAULT: 1,
              LANDMARK: state.address.LANDMARK,
              MOBILE_NO: state.contactPerson.mobile,
              PINCODE: state.address.PINCODE,
              PINCODE_ID: state.address.PINCODE_ID,
              PINCODE_FOR: state.address.PINCODE_FOR,
              STATE_ID: 0,
              STATE_NAME: state.address.STATE_NAME,
              TERRITORY_ID: Territory.TERRITORY_ID,
              TERRITORY_NAME: Territory.TERRITORY_NAME,
              TYPE: state.address.TYPE,
              ARCHIVE_FLAG: 'F',
              CLIENT_ID: 1,
              CREATED_MODIFIED_DATE: '',
              READ_ONLY: 'N',
            },
          });
        } catch (error) {
          console.warn('Validation error for guest:', error);
          handleValidationError(error);
          reject(error);
        }
      }
    });
  }

  async function getTerritoryId(
    pincodeId: string | null,
  ): Promise<TerritoryPinCodeMapping | null> {
    if (!pincodeId) return null;
    try {
      const data = await apiCall.post(`territory/pincode/get`, {
        filter: ` AND PINCODE_ID = '${pincodeId}'`,
      });
      if (data.data.code == 200 && data.data.data.length > 0) {
        return data.data.data[0];
      } else {
        return null;
      }
    } catch (err) {
      console.warn('Error fetching territory:', err);
      return null;
    }
  }

  useEffect(() => {
    const initializeLocation = async () => {
      if (!state.modal.requestPermission && state.mapLocation.loading) {
        await checkPermission();
      }
    };

    initializeLocation();
  }, [
    checkPermission,
    state.modal.requestPermission,
    state.mapLocation.loading,
  ]);
  useEffect(() => {
    if (state.postalCode.value?.length > 3) {
      getPostalCode();
    }
  }, [state.postalCode.value]);
  useEffect(() => {
    checkForGuest();
    getState();
  }, []);
  useEffect(() => {
    if (isEdit && addressData) {
      dispatchState({
        type: 'SET_ADDRESS',
        payload: addressData,
      });
      dispatchState({
        type: 'SET_CONTACT_PERSON',
        payload: {
          name: addressData.CONTACT_PERSON_NAME || '',
          mobile: addressData.MOBILE_NO || '',
        },
      });
      dispatchState({
        type: 'SET_POSTAL_CODE',
        payload: {
          value: addressData.PINCODE || '',
        },
      });
    } else if (!isEdit && user) {
      dispatchState({
        type: 'SET_CONTACT_PERSON',
        payload: {
          name: user.NAME || '',
          mobile: user.MOBILE_NO || '',
        },
      });
    }
  }, [isEdit, addressData, user]);
  async function checkForGuest() {
    if (!user) {
      let addressString = useStorage.getString('address');
      if (addressString) {
        let address: AddressInterface = JSON.parse(addressString);
        dispatchState({
          type: 'SET_ADDRESS',
          payload: {
            ...address,
            ADDRESS_LINE_2: address.ADDRESS_LINE_2.split('\n')[0],
          },
        });
      }
    }
  }
  useEffect(() => {
    // Only run if mapRef is ready, not loading, and we have coordinates but no address
    if (
      mapRef.current &&
      !state.mapLocation.loading &&
      state.mapLocation.latitude !== 0 &&
      state.mapLocation.longitude !== 0 &&
      (!state.mapLocation.address || !state.mapLocation.address.name)
    ) {
      changeLocation({
        latitude: state.mapLocation.latitude,
        longitude: state.mapLocation.longitude,
      });
    }
  }, [
    state.mapLocation.latitude,
    state.mapLocation.longitude,
    state.mapLocation.loading,
    mapRef.current,
    state.mapLocation.address,
    changeLocation,
  ]);
  const getState = () => {
    try {
      apiCall
        .post(`state/get`, {
          filter: ' AND IS_ACTIVE = 1 ',
          sortKey: 'SEQ_NO',
          sortValue: 'asc'
        })

        .then(res => {
          console.log("state", res.data)
          dispatchState({
            type: 'SET_STATE_DATA',
            payload: { data: res.data.data },
          });
        })
        .catch(error => {
          console.warn('err..', error);
        });
    } catch (error) { }
  };

  const memoizedMapView = useMemo(
    () => (
      <MapView
        style={{ flex: 1 }}
        ref={mapRef}
        onRegionChange={cord => {
          if (!state.mapLocation.loading) {
            setMapLocation({
              ...state.mapLocation,
              latitude: cord.latitude,
              longitude: cord.longitude,
            });
          }
        }}
        onRegionChangeComplete={cord => {
          if (!state.mapLocation.loading) {
            changeLocation({
              latitude: cord.latitude,
              longitude: cord.longitude,
            });
          }
        }}
        initialRegion={{
          latitude: state.mapLocation.latitude || 20.5937,
          longitude: state.mapLocation.longitude || 78.9629,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}>
        {!state.mapLocation.loading && (
          <Marker
            coordinate={{
              latitude: state.mapLocation.latitude,
              longitude: state.mapLocation.longitude,
            }}
          />
        )}
      </MapView>
    ),
    [
      state.mapLocation.latitude,
      state.mapLocation.longitude,
      state.mapLocation.loading,
      changeLocation,
    ],
  );

  const [location, setLocation] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    address: '',
  });

  const [input, setInput] = useState('');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8FF' }}>
      <Modal
        show={true}
        onClose={onClose ? onClose : () => { }}
        containerStyle={{ flex: 1, margin: 0 }}>
        <SafeAreaView
          style={{
            flex: 1,
            // padding: Size.containerPadding,
            marginTop: Platform.OS == 'ios' ? 20 : 0,
          }}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            color="#4C4C4C"
            size={24}
            style={{
              alignItems: 'flex-start',
            }}
            onPress={() => mapStyle == 'list' ? setMapStyle('map') : user?.CUSTOMER_TYPE == 'B' ? BackHandler.exitApp() : onClose()}
          />
          {state.address.GEO_LOCATION ? (
            <SafeAreaView style={{ flex: 1 }}>
              {/* {onClose ? (
                <Icon
                  name="keyboard-backspace"
                  type="MaterialCommunityIcons"
                  color="#4C4C4C"
                  size={24}
                  style={{
                    alignItems: 'flex-start',
                  }}
                  onPress={onClose}
                />
              ) : null} */}
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    borderWidth: 0.5,
                    width: 95,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 75,
                    borderColor: '#FDEEE9',
                  }}>
                  <Icon
                    name="location-sharp"
                    type="Ionicons"
                    color="#2A3B8F"
                    size={40}
                    style={{
                      alignSelf: 'center',
                      marginVertical: 20,
                      borderWidth: 1,
                      borderRadius: 40,
                      borderColor: '#FBA042',
                      padding: 8,
                    }}
                  />
                </View>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F5F8FD',
                  paddingHorizontal: 14,
                  paddingVertical: 24,
                  gap: 16,
                }}>
                <ScrollView
                  contentContainerStyle={{ gap: 16 }}
                  showsVerticalScrollIndicator={false}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: '500',
                      fontSize: 20,
                      lineHeight: 23.87,
                      letterSpacing: 0.25,
                      color: '#1C1C28',
                    }}>
                    {isEdit ? t('address.editTitle') : t('address.addTitle')}
                  </Text>

                  <View
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      gap: 2,
                      backgroundColor: '#FDFDFD',
                    }}>
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        fontWeight: '400',
                        fontSize: 12,
                        lineHeight: 20,
                        color: '#9C9C9C',
                      }}>
                      {t('address.saveAddressAs')}
                    </Text>

                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        paddingHorizontal: 8,
                      }}>
                      <Text
                        onPress={() =>
                          dispatchState({
                            type: 'SET_ADDRESS',
                            payload: { TYPE: 'H' },
                          })
                        }
                        style={{
                          width: '30%',
                          marginHorizontal: 4,
                          textAlign: 'center',
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor:
                            state.address.TYPE == 'H'
                              ? colors.primary2
                              : '#CBCBCB',
                          paddingVertical: 10,
                          fontFamily: fontFamily,
                          fontWeight: '500',
                          fontSize: 14,
                          lineHeight: 24,
                          color: '#1C1C28',
                        }}>
                        {t('address.home')}
                      </Text>

                      <Text
                        onPress={() =>
                          dispatchState({
                            type: 'SET_ADDRESS',
                            payload: { TYPE: 'W' },
                          })
                        }
                        style={{
                          width: '30%',
                          marginHorizontal: 4,
                          textAlign: 'center',
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor:
                            state.address.TYPE == 'W'
                              ? colors.primary2
                              : '#CBCBCB',
                          paddingVertical: 10,
                          fontFamily: fontFamily,
                          fontWeight: '500',
                          fontSize: 14,
                          lineHeight: 24,
                          color: '#1C1C28',
                        }}>
                        {t('address.work')}
                      </Text>

                      <Text
                        onPress={() =>
                          dispatchState({
                            type: 'SET_ADDRESS',
                            payload: { TYPE: 'O' },
                          })
                        }
                        style={{
                          width: '30%',
                          marginHorizontal: 4,
                          textAlign: 'center',
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor:
                            state.address.TYPE == 'O'
                              ? colors.primary2
                              : '#CBCBCB',
                          paddingVertical: 10,
                          fontFamily: fontFamily,
                          fontWeight: '500',
                          fontSize: 14,
                          lineHeight: 24,
                          color: '#1C1C28',
                        }}>
                        {'Other'}
                      </Text>
                    </View>
                  </View>

                  {!isGuest ? (
                    <TouchableOpacity
                      onPress={() => {
                        dispatchState({
                          type: 'SET_MODAL',
                          payload: { contactPersonUpdate: true },
                        });
                      }}
                      style={{
                        borderRadius: 8,
                        padding: 12,
                        gap: 2,
                        backgroundColor: '#FDFDFD',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        flex: 1,
                      }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontWeight: '600',
                            fontSize: 11,
                            lineHeight: 20,
                            color: '#9C9C9C',
                          }}>
                          {t('address.contactPersonDetails')}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontWeight: '400',
                            fontSize: 16,
                            lineHeight: 20,
                            color: '#1C1C28',
                          }}>
                          {state.contactPerson.name},{' '}
                          <Text
                            style={{
                              fontWeight: '500',
                            }}>
                            {state.contactPerson.mobile}
                          </Text>
                        </Text>
                      </View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 10,
                        }}>
                        <Icon
                          name="chevron-small-right"
                          type="Entypo"
                          color="#636363"
                          size={25}
                        />
                      </View>
                    </TouchableOpacity>
                  ) : null}
                  <View
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      gap: 12,
                      backgroundColor: '#FDFDFD',
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (addressData?.GEO_LOCATION) {
                          dispatchState({
                            type: 'SET_MAP_LOCATION',
                            payload: {
                              address: '',
                              latitude: Number(
                                addressData.GEO_LOCATION.split(',')[0],
                              ),
                              longitude: Number(
                                addressData.GEO_LOCATION.split(',')[1],
                              ),
                            },
                          });
                        }
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: { GEO_LOCATION: '' },
                        });

                        // getPostalCode();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#FDEEE9',
                        backgroundColor: '#FDFDFD',
                      }}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontSize: 14,
                            fontWeight: '500',
                            color: '#1C1C28',
                          }}>
                          {state.address.GEO_LOCATION
                            ? state.mapLocation.address
                              ? `${state.mapLocation.address.name || ''}${state.mapLocation.address.subLocality
                                ? ', ' +
                                state.mapLocation.address.subLocality
                                : ''
                              }`
                              : state.address.ADDRESS_LINE_2
                            : t('address.addLocation')}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontSize: 14,
                          fontWeight: '500',
                          color: colors.primary2,
                        }}>
                        {t('address.change')}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      numberOfLines={1}
                      placeholder={t('address.housePlaceholder')}
                      value={state.address.ADDRESS_LINE_1}
                      placeholderTextColor={`#D2D2D2`}
                      onChangeText={(text: string) => {
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: { ADDRESS_LINE_1: text },
                        });
                        dispatchState({
                          type: 'SET_ERROR',
                          payload: { ADDRESS_LINE_1: '' },
                        });
                      }}
                      error={state.error.ADDRESS_LINE_1 ? true : false}
                      errorMessage={state.error.ADDRESS_LINE_1}
                    />

                    <TextInput
                      placeholder={t('address.buildingPlaceholder')}
                      value={state.address.ADDRESS_LINE_2}
                      placeholderTextColor="#707070"
                      onChangeText={(text: string) => {
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: { ADDRESS_LINE_2: text },
                        });

                        dispatchState({
                          type: 'SET_ERROR',
                          payload: {
                            ADDRESS_LINE_2: text.trim()
                              ? ''
                              : 'Building name is required',
                          },
                        });
                      }}
                      error={state.error.ADDRESS_LINE_2 ? true : false}
                      errorMessage={state.error.ADDRESS_LINE_2}
                    />

                    <TextInput
                      placeholder={t('address.landmark')}
                      value={state.address.LANDMARK}
                      placeholderTextColor={`#707070`}
                      onChangeText={(text: string) =>
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: { LANDMARK: text },
                        })
                      }
                      error={state.error.LANDMARK ? true : false}
                      errorMessage={state.error.LANDMARK}
                    />
                    <View style={{ gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => {
                          dispatchState({
                            type: 'SET_MODAL',
                            payload: { pinCodeSelection: true },
                          });
                        }}
                        style={{
                          alignSelf: 'stretch',
                          borderRadius: 8,
                          borderWidth: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          gap: 10,
                          minHeight: 50,
                          borderColor: '#CBCBCB',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={{
                            fontFamily: fontFamily,

                            fontSize: 15,
                            lineHeight: 22.5,
                            color: state.address.PINCODE
                              ? '#3d3d3d'
                              : '#D2D2D2',
                          }}>
                          {state.address.PINCODE
                            ? state.address.PINCODE
                            : t('address.selectPinCode')}
                        </Text>
                      </TouchableOpacity>
                      {state.error.POSTAL_CODE ? (
                        <Text
                          style={[
                            GlobalStyle.errorMessage,
                            { color: colors.error, fontFamily: fontFamily },
                          ]}>
                          {'' + state.error.POSTAL_CODE}
                        </Text>
                      ) : null}
                    </View>
                    <TextInput
                      placeholder={t('address.cityPlaceholder')}
                      value={state.address.CITY_NAME}
                      placeholderTextColor={`#CBCBCB`}
                      onChangeText={(text: string) =>
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: { CITY_NAME: text },
                        })
                      }
                      error={state.error.CITY_NAME ? true : false}
                      errorMessage={state.error.CITY_NAME}
                    />
                    <View style={{ gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => {
                          dispatchState({
                            type: 'SET_MODAL',
                            payload: { stateSelection: true },
                          });
                        }}
                        style={{
                          alignSelf: 'stretch',
                          borderRadius: 8,
                          borderWidth: 1,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          gap: 10,
                          minHeight: 50,
                          borderColor: '#CBCBCB',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontWeight: 400,
                            fontSize: 15,
                            lineHeight: 22.5,
                            color: state.address.STATE_NAME
                              ? '#3d3d3d'
                              : '#D2D2D2',
                          }}>
                          {state.address.STATE_NAME
                            ? state.address.STATE_NAME
                            : t('address.selectState')}
                        </Text>
                      </TouchableOpacity>
                      {state.error.STATE ? (
                        <Text
                          style={[
                            GlobalStyle.errorMessage,
                            { color: colors.error, fontFamily: fontFamily },
                          ]}>
                          {'' + state.error.STATE}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </ScrollView>
                <Button
                  loading={loading}
                  onPress={() => saveAddress()}
                  label={
                    isEdit ? t('address.updateAddress') : t('address.confirm')
                  }
                />
              </View>
            </SafeAreaView>
          ) : mapStyle == 'list' ? (
            <SafeAreaView style={{ flex: 1, padding: Size.containerPadding }}>
              <View style={{}}>

                <View
                  style={{
                    zIndex: 1000,
                    marginTop: Platform.OS == 'ios' ? 30 : 10,
                    position: 'relative'
                  }}  >
                  <TextInput
                    value={input}
                    onChangeText={handleInputChange}
                    placeholder={t('address.map.searchPlaceholder')}
                    returnKeyType="search"
                    style={styles.textInput}
                  />
                  {suggestions.length > 0 && (
                    <FlatList
                      data={suggestions}
                      keyExtractor={item => item.place_id}
                      style={styles.listView}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => handleSelectPlace(item)}>
                          <Text style={{ fontFamily: fontFamily }}>{item.description}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>

                <MapView
                  ref={mapRef}
                  style={{ flex: 1, marginTop: 10, borderRadius: 8 }}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}>
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                  />
                </MapView>
                <View style={{ height: 500, marginTop: 10 }}>
                  {state.mapLocation.loading ? (
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <ActivityIndicator
                        size={'large'}
                        color={colors.primary}
                      />
                    </View>
                  ) : (
                    memoizedMapView
                  )}

                  <View
                    style={{
                      padding: Size.padding,
                      alignSelf: 'stretch',
                      top: -30,
                      paddingBottom: Size.padding,
                      backgroundColor: colors.background,
                    }}>
                    <View style={{ padding: 10, gap: 7 }}>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontWeight: '500',
                          fontSize: 16,
                          lineHeight: 19.09,

                          color: 'black',
                        }}>
                        User Location
                      </Text>
                      <Text
                        style={{
                          fontFamily: fontFamily,
                          fontWeight: '500',
                          fontSize: 20,
                          lineHeight: 23.87,
                          color: 'black',
                        }}>
                        {state.mapLocation.address
                          ? state.mapLocation.address.name
                          : `Place the marker at your order location`}
                      </Text>
                      {state.mapLocation.address && (
                        <Text
                          style={{
                            fontFamily: fontFamily,
                            fontWeight: '400',
                            fontSize: 16,
                            lineHeight: 19.09,
                            color: '#636363',
                          }}>
                          {state.mapLocation.address
                            ? `${state.mapLocation.address.subLocality
                              ? state.mapLocation.address.subLocality + ', '
                              : ''
                            }${state.mapLocation.address.locality
                              ? state.mapLocation.address.locality + ', '
                              : ''
                            }${state.mapLocation.address.postalCode
                              ? state.mapLocation.address.postalCode
                              : ''
                            }`
                            : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={{
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    marginHorizontal: 10,
                    backgroundColor: '#3170DE',
                    marginTop: -15,
                  }}
                  onPress={() => {
                    if (
                      state.mapLocation.address &&
                      state.mapLocation.address.name
                    ) {
                      dispatchState({
                        type: 'SET_ADDRESS',
                        payload: {
                          ADDRESS_LINE_2: state.mapLocation.address
                            ? `${state.mapLocation.address.name || ''}${state.mapLocation.address.subLocality
                              ? ', ' + state.mapLocation.address.subLocality
                              : ''
                            }${state.mapLocation.address.locality
                              ? ', ' + state.mapLocation.address.locality
                              : ''
                            }`
                            : '',
                          ADDRESS_LINE_1: '',
                          CITY_NAME: state.mapLocation.address.locality
                            ? state.mapLocation.address.locality
                            : '',

                          GEO_LOCATION: `${state.mapLocation.latitude}, ${state.mapLocation.longitude}`,
                          // PINCODE: '',
                          // PINCODE_ID: 0,
                        },
                      });
                      dispatchState({
                        type: 'SET_POSTAL_CODE',
                        payload: {
                          value: state.mapLocation.address
                            ? state.mapLocation.address.postalCode
                            : '',
                        },
                      });

                    } else {
                      Toast('Please move your marker on land');
                    }
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: 24,
                      textAlign: 'center',
                      color: '#FDFDFD',
                    }}>
                    {t('address.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          ) : (
            <View style={{ flex: 1 }}>
              {state.mapLocation.loading ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ActivityIndicator size={'large'} color={colors.primary} />
                </View>
              ) : (
                memoizedMapView
              )}
              <View
                style={{
                  padding: Size.padding,
                  alignSelf: 'stretch',
                  top: -30,
                  paddingBottom: Size.padding,
                  backgroundColor: colors.background,
                  borderRadius: 10,
                }}>
                <View style={{ padding: 16, gap: 7 }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: 19.09,

                      color: 'black',
                    }}>{`Service Location`}</Text>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 20,
                      lineHeight: 23.87,
                      color: 'black',
                    }}>
                    {state.mapLocation.address
                      ? state.mapLocation.address.name
                      : `Place the marker at your order location`}
                  </Text>
                  {state.mapLocation.address && (
                    <Text
                      style={{
                        fontFamily: fontFamily,
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: 19.09,
                        color: '#636363',
                      }}>
                      {state.mapLocation.address
                        ? `${state.mapLocation.address.subLocality
                          ? state.mapLocation.address.subLocality + ', '
                          : ''
                        }${state.mapLocation.address.locality
                          ? state.mapLocation.address.locality + ', '
                          : ''
                        }${state.mapLocation.address.postalCode
                          ? state.mapLocation.address.postalCode
                          : ''
                        }`
                        : ''}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={{
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    gap: 10,
                    marginHorizontal: 16,
                    backgroundColor: '#3170DE',
                  }}
                  onPress={() => {
                    if (
                      state.mapLocation.address &&
                      state.mapLocation.address.name
                    ) {
                      dispatchState({
                        type: 'SET_ADDRESS',
                        payload: {
                          ADDRESS_LINE_2: state.mapLocation.address
                            ? `${state.mapLocation.address.name || ''}${state.mapLocation.address.subLocality
                              ? ', ' + state.mapLocation.address.subLocality
                              : ''
                            }${state.mapLocation.address.locality
                              ? ', ' + state.mapLocation.address.locality
                              : ''
                            }`
                            : '',
                          ADDRESS_LINE_1: '',
                          CITY_NAME: state.mapLocation.address.locality
                            ? state.mapLocation.address.locality
                            : '',

                          GEO_LOCATION: `${state.mapLocation.latitude}, ${state.mapLocation.longitude}`,
                          // PINCODE: '',
                          // PINCODE_ID: 0,
                        },
                      });
                      dispatchState({
                        type: 'SET_POSTAL_CODE',
                        payload: {
                          value: state.mapLocation.address
                            ? state.mapLocation.address.postalCode
                            : '',
                        },
                      });
                      // getPostalCode()
                    } else {
                      Toast(t('address.errors.moveMarker'));
                    }
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: 24,
                      textAlign: 'center',
                      color: '#FDFDFD',
                    }}>
                    {t('address.confirm')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    gap: 10,
                    marginHorizontal: 16,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#3170DE',
                  }}
                  onPress={() => setMapStyle('list')}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: 24,
                      textAlign: 'center',
                      color: '#3170DE',
                    }}>
                    Add Manually
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>

        {state.modal.pinCodeSelection ? (
          <Modal
            title={t('address.selectPinCode')}
            show={state.modal.pinCodeSelection}
            onClose={() =>
              dispatchState({
                type: 'SET_MODAL',
                payload: { pinCodeSelection: false },
              })
            }>
            <View style={{ gap: 4, maxHeight: Size.height / 2 }}>
              <TextInput
                style={{
                  alignSelf: 'stretch',
                  borderRadius: 8,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  gap: 10,
                  borderColor: `#C7C9D9`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 300,
                }}
                placeholder={t('address.searchPinCode')}
                value={state.postalCode.value}
                placeholderTextColor={`#D2D2D2`}
                onChangeText={(text: string) =>
                  dispatchState({
                    type: 'SET_POSTAL_CODE',
                    payload: { value: text },
                  })
                }
              />
              <View style={{ ..._styles.separator }} />
              {state.postalCode.loading ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                  }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={state.postalCode.data}
                  keyExtractor={(item, index) => `pinCode-${item.ID}-${index}`}
                  removeClippedSubviews={false}
                  ItemSeparatorComponent={() => (
                    <View style={{ ..._styles.separator }} />
                  )}
                  renderItem={({ item }) => (
                    <Text
                      onPress={() => {
                        dispatchState({
                          type: 'SET_ADDRESS',
                          payload: {
                            PINCODE: item.PINCODE_NUMBER,
                            PINCODE_ID: item.ID,
                            PINCODE_FOR: item.PINCODE_FOR,
                            COUNTRY_ID: item.COUNTRY_ID,
                            COUNTRY_NAME: item.COUNTRY_NAME,
                            DISTRICT_ID: item.DISTRICT,
                            DISTRICT_NAME: item.DISTRICT_NAME,
                            STATE_ID: item.STATE,
                            STATE_NAME: item.STATE_NAME,
                          },
                        });
                        dispatchState({
                          type: 'SET_MODAL',
                          payload: {
                            pinCodeSelection: false,
                          },
                        });
                        dispatchState({
                          type: 'SET_POSTAL_CODE',
                          payload: {
                            value: '',
                            data: [],
                            loading: false,
                          },
                        });
                      }}
                      style={{
                        fontFamily: fontFamily,
                        fontWeight: 500,
                        fontSize: 13,
                        lineHeight: 24,
                        color: '#1C1C28',
                        paddingVertical: 5,
                      }}>
                      {item.PINCODE_NUMBER}
                    </Text>
                  )}
                  ListEmptyComponent={() => (
                    <Image
                      source={_noData}
                      style={{ width: 100, height: 100, alignSelf: 'center' }}
                    />
                  )}
                />
              )}
            </View>
          </Modal>
        ) : null}
        {state.modal.stateSelection ? (
          <Modal
            title={t('address.stateSelection.title')}
            show={state.modal.stateSelection}
            onClose={() =>
              dispatchState({
                type: 'SET_MODAL',
                payload: { stateSelection: false },
              })
            }>
            <View style={{ gap: 4, maxHeight: Size.height / 2 }}>
              <TextInput
                style={{
                  alignSelf: 'stretch',
                  borderRadius: 8,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  gap: 10,
                  borderColor: `#C7C9D9`,
                }}
                placeholder={t('address.stateSelection.searchPlaceholder')}
                value={state.stateData.searchValue}
                maxLength={6}
                placeholderTextColor={`#D2D2D2`}
                onChangeText={(text: string) =>
                  dispatchState({
                    type: 'SET_STATE_DATA',
                    payload: { searchValue: text },
                  })
                }
              />
              <View style={{ ..._styles.separator }} />
              <FlatList
                data={
                  state.stateData.searchValue.length === 0
                    ? state.stateData.data
                    : state.stateData.data.filter((item: State) =>
                      item.NAME.toLowerCase().includes(
                        state.stateData.searchValue.toLowerCase(),
                      ),
                    )
                }
                keyExtractor={(item, index) => `pinCode-${item.ID}-${index}`}
                removeClippedSubviews={false}
                ItemSeparatorComponent={() => (
                  <View style={{ ..._styles.separator }} />
                )}
                renderItem={({ item }: { item: State }) => (
                  <Text
                    onPress={() => {
                      dispatchState({
                        type: 'SET_ADDRESS',
                        payload: {
                          STATE_ID: item.ID,
                          STATE_NAME: item.NAME,
                        },
                      });
                      dispatchState({
                        type: 'SET_MODAL',
                        payload: {
                          stateSelection: false,
                        },
                      });
                    }}
                    style={{
                      fontFamily: fontFamily,
                      fontWeight: 500,
                      fontSize: 13,
                      lineHeight: 24,
                      color: '#1C1C28',
                      paddingVertical: 5,
                    }}>
                    {item.NAME}
                  </Text>
                )}
                ListEmptyComponent={() => (
                  <Image
                    source={_noData}
                    style={{ width: 100, height: 100, alignSelf: 'center' }}
                  />
                )}
              />
            </View>
          </Modal>
        ) : null}
        {state.modal.contactPersonUpdate ? (
          <Modal
            title={t('address.contactPerson.title')}
            show={state.modal.contactPersonUpdate}
            onClose={() =>
              dispatchState({
                type: 'SET_MODAL',
                payload: { contactPersonUpdate: false },
              })
            }>
            <View style={{ gap: 16, padding: 16 }}>
              <TextInput
                placeholder={t('address.contactPerson.namePlaceholder')}
                value={state.contactPerson.name}
                placeholderTextColor={`#D2D2D2`}
                onChangeText={(text: string) =>
                  dispatchState({
                    type: 'SET_CONTACT_PERSON',
                    payload: { name: text },
                  })
                }
              />
              <TextInput
                placeholder={t('address.contactPerson.mobilePlaceholder')}
                value={state.contactPerson.mobile}
                placeholderTextColor={`#D2D2D2`}
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(text: string) =>
                  dispatchState({
                    type: 'SET_CONTACT_PERSON',
                    payload: { mobile: text },
                  })
                }
              />
              <Button
                onPress={() => {
                  // Validate mobile number
                  if (!isValidMobile(state.contactPerson.mobile)) {
                    Toast(t('address.errors.invalidMobile'));
                    return;
                  }
                  // Close modal after successful update
                  dispatchState({
                    type: 'SET_MODAL',
                    payload: { contactPersonUpdate: false },
                  });
                  // Update address with new contact person details
                  dispatchState({
                    type: 'SET_ADDRESS',
                    payload: {
                      CONTACT_PERSON_NAME: state.contactPerson.name,
                      MOBILE_NO: state.contactPerson.mobile,
                    },
                  });
                }}
                label={t('address.contactPerson.update')}
              />
            </View>
          </Modal>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
};

export default AddressPopUp;
const styles = StyleSheet.create({
  _inputfield: {
    fontSize: Size.lg,
    flex: 1,
    fontWeight: 'bold',
    paddingVertical: Size.padding,
  },
  textInput: {
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    color: '#5d5d5d',
  },
  listView: {
    backgroundColor: 'white',
    maxHeight: 200,
    // position: 'absolute',
    // top: 45,
    // left: 0,
    // right: 0,
    borderRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
});
