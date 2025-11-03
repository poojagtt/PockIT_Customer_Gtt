import {PayloadAction, createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {useStorage, apiCall} from '../../modules';
import {Alert} from 'react-native';
import {useEffect} from 'react';

const guest: UserInterface = {
  ID: 0,
  NAME: 'GUEST',
  ACCOUNT_STATUS: 1,
  ALTCOUNTRY_CODE: '',
  ALTERNATE_MOBILE_NO: '',
  ARCHIVE_FLAG: 'F',
  CLIENT_ID: 1,
  CLOUD_ID: '',
  COUNTRY_CODE: '',
  CREATED_MODIFIED_DATE: '',
  CUSTOMER_TYPE: 'I',
  DEVICE_ID: '',
  EMAIL: '',
  GST_NO: '',
  IS_SPECIAL_CATALOGUE: 0,
  LOGOUT_DATETIME: '',
  MOBILE_NO: '',
  READ_ONLY: 'N',
  REGISTRATION_DATE: '',
  SALUTATION: '',
  CURRENT_ADDRESS_ID: null,
  CUSTOMER_CATEGORY_ID: 0,
  COMPANY_NAME: null,
  PAN: null,
  PROFILE_PHOTO: null,
};
export interface AppState {
  splash: boolean;
  user: UserInterface | null;
  address: AddressInterface | null;
  allAddress: AddressInterface[] | null;
  territory: TerritoryInterface | null;
}
const initialState: AppState = {
  splash: true,
  user: null,
  address: null,
  allAddress: null,
  territory: null,
};

export const getUserInfo = createAsyncThunk<
  {
    user: UserInterface | null;
    address: AddressInterface | null;
    allAddress: AddressInterface[] | null;
    territory: TerritoryInterface | null;
  },
  undefined
>(`app/getUserInfo`, async (_, {}) => {
  let user: number | undefined = useStorage.getNumber('user');
  if (user == undefined) {
    return {
      user: null,
      address: null,
      allAddress: null,
      territory: null,
    };
  } else if (user == 0) {
    let address: AddressInterface | null = null;
    let addressString: string | undefined =
      useStorage.getString('guestAddress');
    if (addressString) {
      address = JSON.parse(addressString);
    } else {
      address = null;
    }
    return {
      user: guest,
      address: address,
      allAddress: null,
      territory: null,
    };
  } else {
    let userData: UserInterface | null = null;
    let addressData: AddressInterface | null = null;
    let allAddressData: AddressInterface[] | null = null;
    let territoryData: TerritoryInterface | null = null;

    allAddressData = await apiCall
      .post(`api/customerAddress/get`, {
        filter: ` AND CUSTOMER_ID = ${user} AND STATUS=1`,
        sortKey: 'IS_DEFAULT',

        sortValue: 'desc',
      })
      .then(res => {
        if (res.data.code == 200) {
          return res.data.data;
        } else {
          return null;
        }
      })
      .catch(error => {
        console.warn('Error In Redux for getting a Data', error);
        return null;
      });
    userData = await apiCall
      .post(`api/customer/get`, {
        filter: ` AND ID=${user} AND IS_DELETED_BY_CUSTOMER=0 AND ACCOUNT_STATUS=1`,
      })
      .then(res => {
        if (res.data.code == 200) {
          return res.data.data[0];
        } else {
          return null;
        }
      })
      .catch(error => {
        console.warn('Error In Redux for getting a Data', error);
        return null;
      });

    if (allAddressData && allAddressData.length > 0) {
      const defaultAddress = allAddressData.find(
        value => value.IS_DEFAULT == 1,
      );

      if (!defaultAddress) {
        makedefaultAddress(
          userData?.ID,
          allAddressData[0].ID,
          allAddressData[0],
        );
      }
      addressData = defaultAddress ? defaultAddress : allAddressData[0];
      //MakeAddressDefault(ADDRESS_ID, USER_ID)
      useStorage.set(
        'address',
        JSON.stringify(defaultAddress ? defaultAddress : allAddressData[0]),
      );
    } else {
      addressData = null;
    }
     console.log('addressData...', addressData);
    if (addressData) {
      territoryData = await apiCall
        .post(`api/territory/get`, {
          filter: ` AND ID=${addressData.TERRITORY_ID}`,
        })
        .then(res => {
          console.log('addressData...', res.data);
          if (res.data.code == 200) {
            return res.data.data[0];
          } else {
            return null;
          }
        })
        .catch(err => {
          console.warn('Error In Redux for getting a territory', err);
          return null;
        });
    } else {
      territoryData = null;
    }
    console.log('territoryData...', territoryData);
    return {
      user: userData,
      address: addressData,
      allAddress: allAddressData,
      territory: territoryData,
    };
  }
});

const makedefaultAddress = (
  CUSTOMER_ID: number | undefined,
  ID: number,
  address: AddressInterface,
) => {
  apiCall
    .post('api/customerAddress/updateAddressDefault', {
      ...address,
      CUSTOMER_ID,
      ID,
    })
    .then(res => {
      return;
    })
    .catch(err => {
      console.warn('Unable to make default', err);
    });
};

export const setAddress = createAsyncThunk<
  {address: AddressInterface | null; territory: TerritoryInterface | null},
  AddressInterface | null
>('app/setAddress', async address => {
  let addressData = address;
  let territoryData: TerritoryInterface | null = null;
  if (addressData) {
    territoryData = await apiCall
      .post(`api/territory/get`, {
        filter: ` AND ID=${addressData.TERRITORY_ID}`,
      })
      .then(res => {
        if (res.data.code == 200) {
          return res.data.data[0];
        } else {
          return null;
        }
      })
      .catch(err => {
        console.warn('Error In Redux for getting a territory', err);
        return null;
      });
  } else {
    territoryData = null;
  }
  return {address: addressData, territory: territoryData};
});

export const AppSlice = createSlice({
  name: 'App',
  initialState,
  reducers: {
    setSplash: (state, {payload}: PayloadAction<boolean>) => {
      state.splash = payload;
    },
    setUser: (state, {payload}: PayloadAction<UserInterface>) => {
      state.user = payload;
    },
    setDefaultAddress: (state, {payload}: PayloadAction<AddressInterface>) => {
      state.address = payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(getUserInfo.pending, state => {
      state.splash = true;
      state.user = null;
    });
    builder.addCase(getUserInfo.fulfilled, (state, {payload}) => {
      state.splash = false;
      state.user = payload.user;
      state.address = payload.address;
      state.allAddress = payload.allAddress;
      state.territory = payload.territory;
    });
    builder.addCase(setAddress.fulfilled, (state, {payload}) => {
      state.address = payload.address;
      state.territory = payload.territory;
    });
  },
});

export const {setSplash, setUser, setDefaultAddress} = AppSlice.actions;
export default AppSlice.reducer;
