import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {apiCall, useStorage} from '../../modules';
import {RootState} from './store';
import {Alert} from 'react-native';

interface cartState {
  cart: ServicesInterface[] | null;
  cartSummery: cartSummeryInterface | null;
  products: CartProduct[] | null;
  type: string | null;
  loading: boolean;
  error: string | null;
}
const initialState: cartState = {
  cart: null,
  cartSummery: null,
  products: null,
  type: 'S',
  loading: false,
  error: null,
};
interface createPayloadInterface {
  QUANTITY: number;
  SERVICE_ID: number;
  INVENTORY_ID: number;
  TYPE: string;
  SERVICE_CATALOGUE_ID: number;
  BRAND_NAME: string;
  MODEL_NUMBER: string;
  SERVICE_PHOTO_FILE: string;
  DESCRIPTION: string;
  QUANTITY_PER_UNIT: number;
  UNIT_ID: number;
  UNIT_NAME: string;
}
type deletePayloadInterface = {
  SERVICE_ID: number;
};
type updatePayloadInterface = {
  SERVICE_ID: number;
  QUANTITY: number;
};
type deleteProduct = {
  INVENTORY_ID: number;
};
type updateProduct = {
  INVENTORY_ID: number;
  QUANTITY: number;
};

export const getCartInformation = createAsyncThunk<cartGetType, undefined>(
  `cart/getCartInformation`,
  async (_, {}) => {
    const user: number | undefined = useStorage.getNumber('user');
    if (!user) {
      return Promise.reject('Unable to get user');
    } else {
      const cartData: cartGetType = await apiCall
        .post(`api/cart/getDetails`, {CUSTOMER_ID: user})
        .then(res => {
        
          if (res.data.code == 200) {
            return res.data.data;
          } else {
            return Promise.reject('Unable to get the data');
          }
        })
        .catch(err => {
          console.warn(err);
          return Promise.reject('Unable to get the data');
        });
      return cartData;
    }
  },
);
export const createCartInformation = createAsyncThunk<
  void,
  createPayloadInterface
>(`cart/create`, async (payload, {getState, dispatch}) => {
  const {app, cart} = getState() as RootState;
  const body = {
    SERVICE_ID: payload.SERVICE_ID,
    QUANTITY: payload.QUANTITY,
    INVENTORY_ID: payload.INVENTORY_ID,
    TYPE: payload.TYPE,
    SERVICE_CATALOGUE_ID: payload.SERVICE_CATALOGUE_ID,
    BRAND_NAME: payload.BRAND_NAME,
    MODEL_NUMBER: payload.MODEL_NUMBER,
    SERVICE_PHOTO_FILE: payload.SERVICE_PHOTO_FILE,
    DESCRIPTION: payload.DESCRIPTION,
    IS_TEMP_CART: 0,
    CUSTOMER_ID: app.user?.ID,
    ADDRESS_ID: app.address?.ID,
    TERITORY_ID: app.territory?.ID,
    STATE_ID: app.address?.STATE_ID,
    QUANTITY_PER_UNIT: payload.QUANTITY_PER_UNIT,
    UNIT_ID: payload.UNIT_ID,
    UNIT_NAME: payload.UNIT_NAME,
  };
  if (!cart.type || cart.type == payload.TYPE) {
    createCart(body)
      .then(res => {
        dispatch(getCartInformation());
      })
      .catch(err => {
        console.warn(err);
        return Promise.reject(err ? err : 'Unable to get the data');
      });
  } else {
    Alert.alert(
      'Cart Already Exists',
      `Already different cart is created, did we override the cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            createCart(body)
              .then(res => {
                dispatch(getCartInformation());
              })
              .catch(err => {
                console.warn(err);
                return Promise.reject(err ? err : 'Unable to get the data');
              });
          },
        },
      ],
    );
  }
});

async function createCart(body: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    apiCall
      .post(`api/cart/add`, body)
      .then(res => {
        if (res.data.code == 200) {
          resolve(true);
        } else {
          reject(res.data.message ? res.data.message : 'Failed to add to cart');
        }
      })
      .catch(err => {
        console.warn(err);
        reject(err ? err : 'Failed to get the data');
      });
  });
}
export const deleteCartItem = createAsyncThunk<
  deletePayloadInterface,
  deletePayloadInterface
>(`cart/delete`, async (payload, {getState, dispatch}) => {
  const {app, cart: cartStates} = getState() as RootState;
  let cart = cartStates.cart ? cartStates.cart : [];
  let element = cart.find(item => item.SERVICE_ID == payload.SERVICE_ID);
  if (!element) {
    return Promise.reject('Unable to delete cart item');
  }
  const cartData: boolean = await apiCall
    .post(`api/cart/service/delete`, {
      CUSTOMER_ID: app.user?.ID,
      SERVICE_ID: element.SERVICE_ID,
      CART_ID: element.CART_ID,
      CART_ITEM_ID: element.CART_ITEM_ID,
      TYPE: 'S',
    })
    .then(res => {
      if (res.data.code == 200) {
        dispatch(getCartInformation());
        return true;
      } else {
        return Promise.reject(
          res.data.message ? res.data.message : 'Unable to delete cart item',
        );
      }
    });
  if (cartData) {
    return payload;
  } else {
    return Promise.reject('Unable to delete cart item');
  }
});

export const updateCartItem = createAsyncThunk<
  updatePayloadInterface,
  updatePayloadInterface
>(`cart/update`, async (payload, {getState, dispatch}) => {
  const {app, cart: cartStates} = getState() as RootState;
  let cart = cartStates.cart ? cartStates.cart : [];
  let element = cart.find(item => item.SERVICE_ID == payload.SERVICE_ID);
  if (!element) {
    return Promise.reject('Unable to delete cart item');
  }
  const cartData: boolean = await apiCall
    .post(`api/cart/service/update`, {
      CUSTOMER_ID: app.user?.ID,
      SERVICE_ID: element.SERVICE_ID,
      CART_ID: element.CART_ID,
      CART_ITEM_ID: element.CART_ITEM_ID,
      QUANTITY: payload.QUANTITY,
      TYPE: 'S',
    })
    .then(res => {
      if (res.data.code == 200) {
        dispatch(getCartInformation());
        return true;
      } else {
        return Promise.reject(
          res.data.message ? res.data.message : 'Unable to update cart item',
        );
      }
    });
  if (cartData) {
    return payload;
  } else {
    return Promise.reject('Unable to update cart item');
  }
});

export const deleteProductItem = createAsyncThunk<deleteProduct, deleteProduct>(
  `cart/delete`,
  async (payload, {getState, dispatch}) => {
    const {app, cart: cartStates} = getState() as RootState;
    let cart = cartStates.products ? cartStates.products : [];
    let element = cart.find(item => item.ID == payload.INVENTORY_ID);
    if (!element) {
      return Promise.reject('Unable to delete cart item');
    }
    const payloadttt={
       TYPE: 'P',
        INVENTORY_ID: element.ID,
        CUSTOMER_ID: app.user?.ID,
        CART_ID: element.CART_ID, // cartDetails.CART_ID
        CART_ITEM_ID: element.CART_ITEM_ID, // cartDetails.ID
    }
   
    const cartData: boolean = await apiCall
      .post(`api/cart/product/delete`, {
        TYPE: 'P',
        INVENTORY_ID: element.ID,
        CUSTOMER_ID: app.user?.ID,
        CART_ID: element.CART_ID, // cartDetails.CART_ID
        CART_ITEM_ID: element.CART_ITEM_ID, // cartDetails.ID
      })
      .then(res => {

       

        if (res.data.code == 200) {
          dispatch(getCartInformation());
          return true;
        } else {
          return Promise.reject(
            res.data.message ? res.data.message : 'Unable to delete cart item',
          );
        }
      });
    if (cartData) {
      return payload;
    } else {
      return Promise.reject('Unable to delete cart item');
    }
  },
);

export const updateProductItem = createAsyncThunk<updateProduct, updateProduct>(
  `cart/update`,
  async (payload, {getState, dispatch}) => {
    const {app, cart: cartStates} = getState() as RootState;
    let cart = cartStates.products ? cartStates.products : [];
    let element = cart.find(item => item.ID == payload.INVENTORY_ID);
    if (!element) {
      return Promise.reject('Unable to delete cart item');
    }
    const cartData: boolean = await apiCall
      .post(`api/cart/product/update`, {
        TYPE: 'P',
        CUSTOMER_ID: app.user?.ID,
        INVENTORY_ID: element.ID,
        CART_ID: element.CART_ID,
        CART_ITEM_ID: element.CART_ITEM_ID,
        QUANTITY: payload.QUANTITY,
      })
      .then(res => {
        if (res.data.code == 200) {
          dispatch(getCartInformation());
          return true;
        } else {
          return Promise.reject(
            res.data.message ? res.data.message : 'Unable to update cart item',
          );
        }
      })
      .catch(err => {
        console.warn(err);
        return Promise.reject(err ? err : 'Unable to get the data');
      });
    if (cartData) {
      return payload;
    } else {
      return Promise.reject('Unable to update cart item');
    }
  },
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(getCartInformation.pending, state => {
      state.loading = true;
      state.cart = null;
      state.error = null;
    });
    builder.addCase(getCartInformation.fulfilled, (state, { payload }) => {
  // let cart: ServicesInterface[] | null = null;
  // let product: CartProduct[] | null = null;

  let cart: ServicesInterface[] = [];
let product: CartProduct[] = [];


  if (payload.TYPE === 'S') {
    cart = payload.CART_DETAILS.map(item => ({
      DURARTION_HOUR: item.DURARTION_HOUR || 0,
      DURARTION_MIN: item.DURARTION_MIN || 0,
      SERVICE_RATING: item.SERVICE_RATING,
      CART_ID: item.CART_ID,
      CART_ITEM_ID: item.ID,
      CATEGORY_ID: item.CATEGORY_ID,
      CATEGORY_NAME: item.CATEGORY_NAME,
      IS_EXPRESS: item.IS_EXPRESS,
      IS_PARENT: 0,
      PREPARATION_HOURS: Number(item.PREPARATION_HOURS),
      PREPARATION_MINUTE: Number(item.PREPARATION_MINUTES),
      PRICE: Number(item.UNIT_PRICE),
      QTY: 1,
      QUANTITY: item.QUANTITY,
      SERVICE_END_TIME: item.END_TIME,
      SERVICE_ID: item.SERVICE_ID,
      SERVICE_NAME: item.SERVICE_NAME,
      SERVICE_START_TIME: item.START_TIME,
      SUB_CATEGORY_ID: item.SUB_CATEGORY_ID,
      SUB_CATEGORY_NAME: item.SUB_CATEGORY_NAME,
      TOTAL_PRICE: Number(item.TOTAL_PRICE),
      CESS: item.CESS,
      SERVICE_IMAGE: item.SERVICE_IMAGE,
      CGST: item.CGST,
      EXPRESS_CHARGES: item.EXPRESS_CHARGES,
      IGST: item.IGST,
      MAX_QTY: item.MAX_QTY,
      SERVICE_DESCRIPTION: item.DESCRIPTION,
      SERVICE_PARENT_ID: item.SERVICE_CATALOGUE_ID,
      SERVICE_PARENT_NAME: item.SERVICE_PARENT_NAME,
      SGST: item.SGST,
      TAX_AMOUNT: item.TAX_AMOUNT,
      TAX_RATE: item.TAX_RATE,
    }));
  } else {
    // product = payload.CART_DETAILS.map(item => ({
    //   CART_ID: item.CART_ID,
    //   CART_ITEM_ID: item.ID,
    //   ID: item.INVENTORY_ID,
    //   DISCOUNTED_PRICE: item.DISCOUNTED_PRICE,
    //   DISCOUNT_ALLOWED: item.DISCOUNT_ALLOWED,
    //   SELLING_PRICE: item.SELLING_PRICE,
    //   INVENTORY_IMAGE: item.INVENTORY_IMAGE,
    //   CURRENT_STOCK: item.CURRENT_STOCK,
    //   ITEM_NAME: item.SERVICE_NAME,
    //   PRODUCT_NAME: item.SERVICE_NAME,
    //   VARIANT_COMBINATION: item.VARIANT_COMBINATION,
    //   QUANTITY: item.QUANTITY,
    //   IS_HAVE_VARIANTS: item.IS_HAVE_VARIANTS,
    //   DESCRIPTION: item.DESCRIPTION,
    //   UNIT_ID: item.UNIT_ID,
    //   UNIT_NAME: item.UNIT_NAME,
    //   QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
    // }));

    product = payload.CART_DETAILS.length > 0
  ? payload.CART_DETAILS.map(item => ({
      CART_ID: item.CART_ID,
      CART_ITEM_ID: item.ID,
      ID: item.INVENTORY_ID,
      DISCOUNTED_PRICE: item.DISCOUNTED_PRICE,
      DISCOUNT_ALLOWED: item.DISCOUNT_ALLOWED,
      SELLING_PRICE: item.SELLING_PRICE,
      INVENTORY_IMAGE: item.INVENTORY_IMAGE,
      CURRENT_STOCK: item.CURRENT_STOCK,
      ITEM_NAME: item.SERVICE_NAME,
      PRODUCT_NAME: item.SERVICE_NAME,
      VARIANT_COMBINATION: item.VARIANT_COMBINATION,
      QUANTITY: item.QUANTITY,
      IS_HAVE_VARIANTS: item.IS_HAVE_VARIANTS,
      DESCRIPTION: item.DESCRIPTION,
      UNIT_ID: item.UNIT_ID,
      UNIT_NAME: item.UNIT_NAME,
      QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
    }))
  : [];

  }

  state.loading = false;
  state.error = null;
  // state.cart = cart;
  // state.products = product;

  state.cart = cart ?? [];
state.products = product ?? [];

  state.cartSummery = payload.CART_INFO[0];

  // ✅ FIXED: only update type if cart has items
  if (
    (payload.TYPE === 'P' && payload.CART_DETAILS?.length > 0) ||
    (payload.TYPE === 'S' && payload.CART_DETAILS?.length > 0)
  ) {
    state.type = payload.TYPE;
  }
});

    // builder.addCase(getCartInformation.fulfilled, (state, {payload}) => {
    //   let cart: ServicesInterface[] | null = null;
    //   let product: CartProduct[] | null = null;
    //   if (payload.TYPE == 'S') {
    //     cart = payload.CART_DETAILS.map(item => ({
    //       DURARTION_HOUR: item.DURARTION_HOUR ? item.DURARTION_HOUR : 0,
    //       DURARTION_MIN: item.DURARTION_MIN ? item.DURARTION_MIN : 0,
    //       SERVICE_RATING: item.SERVICE_RATING,
    //       CART_ID: item.CART_ID,
    //       CART_ITEM_ID: item.ID,
    //       CATEGORY_ID: item.CATEGORY_ID,
    //       CATEGORY_NAME: item.CATEGORY_NAME,
    //       IS_EXPRESS: item.IS_EXPRESS,
    //       IS_PARENT: 0,
    //       PREPARATION_HOURS: Number(item.PREPARATION_HOURS),
    //       PREPARATION_MINUTE: Number(item.PREPARATION_MINUTES),
    //       PRICE: Number(item.UNIT_PRICE),
    //       QTY: 1,
    //       QUANTITY: item.QUANTITY,
    //       SERVICE_END_TIME: item.END_TIME,
    //       SERVICE_ID: item.SERVICE_ID,
    //       SERVICE_NAME: item.SERVICE_NAME,
    //       SERVICE_START_TIME: item.START_TIME,
    //       SUB_CATEGORY_ID: item.SUB_CATEGORY_ID,
    //       SUB_CATEGORY_NAME: item.SUB_CATEGORY_NAME,
    //       TOTAL_PRICE: Number(item.TOTAL_PRICE),
    //       CESS: item.CESS,
    //       SERVICE_IMAGE: item.SERVICE_IMAGE,
    //       CGST: item.CGST,
    //       EXPRESS_CHARGES: item.EXPRESS_CHARGES,
    //       IGST: item.IGST,
    //       MAX_QTY: item.MAX_QTY,
    //       SERVICE_DESCRIPTION: item.DESCRIPTION,
    //       SERVICE_PARENT_ID: item.SERVICE_CATALOGUE_ID,
    //       SERVICE_PARENT_NAME: item.SERVICE_PARENT_NAME,
    //       SGST: item.SGST,
    //       TAX_AMOUNT: item.TAX_AMOUNT,
    //       TAX_RATE: item.TAX_RATE,
    //     }));
    //   } else {
    //     product = payload.CART_DETAILS.map(item => ({
    //       CART_ID: item.CART_ID,
    //       CART_ITEM_ID: item.ID,
    //       ID: item.INVENTORY_ID,
    //       DISCOUNTED_PRICE: item.DISCOUNTED_PRICE,
    //       DISCOUNT_ALLOWED: item.DISCOUNT_ALLOWED,
    //       SELLING_PRICE: item.SELLING_PRICE,
    //       INVENTORY_IMAGE: item.INVENTORY_IMAGE,
    //       CURRENT_STOCK: item.CURRENT_STOCK,
    //       ITEM_NAME: item.SERVICE_NAME,
    //       PRODUCT_NAME: item.SERVICE_NAME,
    //       VARIANT_COMBINATION: item.VARIANT_COMBINATION,
    //       QUANTITY: item.QUANTITY,
    //       IS_HAVE_VARIANTS: item.IS_HAVE_VARIANTS,
    //       DESCRIPTION: item.DESCRIPTION,
    //       UNIT_ID: item.UNIT_ID,
    //       UNIT_NAME: item.UNIT_NAME,
    //       QUANTITY_PER_UNIT: item.QUANTITY_PER_UNIT,
    //     }));
    //   }
    //   state.loading = false;
    //   state.error = null;
    //   state.cart = cart;
    //   state.products = product;
    //   state.cartSummery = payload.CART_INFO[0];
    //   state.type = payload.TYPE;
    //   // state.cart = payload;
    // });
    builder.addCase(getCartInformation.rejected, (state, {error}) => {
            state.loading = false;

      state.cart = [];
state.products = [];
state.cartSummery = null;
      state.error = error.message ? error.message : 'Something went wrong';
    });
    builder.addCase(createCartInformation.fulfilled, (state, {payload}) => {});
    builder.addCase(deleteCartItem.fulfilled, (state, {payload}) => {
      let cart = state.cart ? state.cart : [];
      let index = cart.findIndex(item => item.SERVICE_ID == payload.SERVICE_ID);
      if (index != -1) {
        cart.splice(index, 1);
      }
      state.cart = cart;
    });
    builder.addCase(updateCartItem.fulfilled, (state, {payload}) => {
      let cart = state.cart ? state.cart : [];
      let index = cart.findIndex(item => item.SERVICE_ID == payload.SERVICE_ID);
      if (index != -1) {
        cart[index].QUANTITY = payload.QUANTITY;
      }
      state.cart = cart;
    });
  },
});
export const {} = cartSlice.actions;
export default cartSlice.reducer;
