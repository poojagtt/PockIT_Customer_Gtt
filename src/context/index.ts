import { store, useDispatch, useSelector } from './reducers/store';
import { setSplash, getUserInfo, setAddress, setUser, setDefaultAddress } from './reducers/app';
import {
  createCartInformation,
  deleteCartItem,
  getCartInformation,
  updateCartItem,
  deleteProductItem,
  updateProductItem
} from './reducers/cart';
class AllReducer {
  setSplash = setSplash;
  getUserInfo = getUserInfo;
  setAddress = setAddress;
  setUser = setUser;
  setDefaultAddress = setDefaultAddress;
  createCartInformation = createCartInformation;
  deleteCartItem = deleteCartItem;
  getCartInformation = getCartInformation;
  updateCartItem = updateCartItem;
  updateProductItem = updateProductItem;
  deleteProductItem = deleteProductItem;
}

const Reducers = new AllReducer();
export { store, useDispatch, useSelector, Reducers };
