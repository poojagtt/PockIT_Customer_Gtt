import {MMKV, Mode} from 'react-native-mmkv';
export const useStorage = new MMKV({
  id: 'local-storage',
  encryptionKey: 'hunter2',
  mode: Mode.SINGLE_PROCESS,
});

useStorage.set('NOTIFICATIONS_ENABLED', true);

export const token = new MMKV({
  id: 'token-storage',
  encryptionKey: 'token_storage',
  mode: Mode.SINGLE_PROCESS,
});

class TokenStorageClass {
  getToken: () => string = () => {
    try {
      const tokenValue = token.getString(`token_value`);
      if (tokenValue) {
        return tokenValue;
      } else {
        return '';
      }
    } catch (error) {
      return '';
    }
  };
  setToken: (value: string) => boolean = value => {
    try {
      if (value) {
        token.set(`token_value`, value);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };
  clearToken: () => void = () => {
    token.clearAll();
  };
}
export const tokenStorage = new TokenStorageClass();
