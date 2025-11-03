import {Platform} from 'react-native';
import {
  PERMISSIONS,
  Permission,
  RESULTS,
  check,
  request,
} from 'react-native-permissions';
type checkInterface = 'location' | 'camera';

class PermissionClass {
  _requestPermissionMultiple: (permission: Permission[]) => Promise<void> =
    async permissions => {
      return new Promise((success, reject) => {
        const results: boolean[] = [];
        for (const permission of permissions) {
          if (permission) {
            this._checkAndRequestPermission(permission)
              .then(() => results.push(true))
              .catch(err => {
                console.warn(err, permission);
                results.push(false);
              });
          }
        }

        for (const result of results) {
          if (!result) {
            return reject();
          }
        }
        return success();
      });
    };
  _checkAndRequestPermission: (permission: Permission) => Promise<void> =
    async permission => {
      return new Promise((success, reject) => {
        if (!permission) {
          reject('no permission founds');
        } else {
          try {
            check(permission)
              .then(result => {
                if (result === RESULTS.GRANTED) {
                  success();
                } else {
                  this._request(permission)
                    .then(() => success())
                    .catch(err => reject(err));
                }
              })
              .catch(err => reject(err));
          } catch (error) {
            reject(error);
          }
        }
      });
    };
  _request: (permission: Permission) => Promise<void> = async permission => {
    return new Promise((success, reject) => {
      try {
        request(permission)
          .then(value => {
            // value === RESULTS.GRANTED
            // ?
            success();
            // : reject(`Reject due to` + value);
          })
          .catch(err => reject(err));
      } catch (error) {
        reject(error);
        console.warn('Error while Requesting Permission', error);
      }
    });
  };
  _checkMultiple: (permissions: Permission[]) => Promise<boolean> =
    async permissions => {
      return new Promise(async (success, reject) => {
        const results: boolean[] = [];
        for (const permission of permissions) {
          if (permission) {
            const result = await check(permission)
              .then(result => {
                if (result === RESULTS.GRANTED) {
                  return true;
                } else {
                  return false;
                }
              })
              .catch(err => {
                reject(err);
                return false;
              });
            results.push(result);
          }
        }
        for (const result of results) {
          if (!result) {
            return success(false);
          }
        }
        return success(true);
      });
    };
  checkCamera: (value: checkInterface) => Promise<boolean> = async () => {
    try {
      let permissions: Permission[] = [];
      if (Platform.OS == 'ios') {
        permissions.push(PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY);
      } else if (Platform.OS == 'android') {
        permissions.push(
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          // PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        );
      } else {
        permissions = [];
      }
      if (permissions.length) {
        return await this._checkMultiple(permissions);
      } else {
        return false;
      }
    } catch (error) {
      console.warn('Storage Permission Error', error);
      return false;
    }
  };
  requestCamera: () => Promise<boolean> = async () => {
    try {
      let permissions: Permission[] = [];
      if (Platform.OS == 'ios') {
        permissions.push(PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.PHOTO_LIBRARY);
      } else if (Platform.OS == 'android') {
        permissions.push(
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          // PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        );
      } else {
        permissions = [];
      }
      if (permissions.length) {
        return await this._requestPermissionMultiple(permissions)
          .then(() => true)
          .catch(err => {
            console.warn(`Request Camera Error`, err);
            return false;
          });
      } else {
        return false;
      }
    } catch (error) {
      console.warn('Storage Permission Error', error);
      return false;
    }
  };
  checkLocation: () => Promise<boolean> = async () => {
    try {
      let permissions: Permission[] = [];
      if (Platform.OS === 'ios') {
        permissions.push(
          // PERMISSIONS.IOS.LOCATION_ALWAYS,
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        );
      } else if (Platform.OS === 'android') {
        permissions.push(
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        );
      } else {
        permissions = [];
      }
      if (permissions.length) {
        return await this._checkMultiple(permissions);
      } else {
        return false;
      }
    } catch (error) {
      console.warn('Storage Permission Error', error);
      return false;
    }
  };
  requestLocation: () => Promise<void> = () => {
    return new Promise((res, rej) => {
      try {
        let permissions: Permission[] = [];
        if (Platform.OS === 'ios') {
          permissions.push(
            // PERMISSIONS.IOS.LOCATION_ALWAYS,
            PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          );
        } else if (Platform.OS === 'android') {
          permissions.push(
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
          );
        } else {
          rej(`Platform mismatch...`);
        }
        if (permissions.length) {
          this._requestPermissionMultiple(permissions)
            .then(() => res())
            .catch(err => rej(err));
        } else {
          rej('Permission not Found');
        }
      } catch (error) {
        rej(error);
      }
    });
  };
  // checkStorage: () => Promise<boolean> = async () => {
  //   try {
  //     let permissions: Permission[] = [];
  //     if (Platform.OS === 'ios') {
  //       permissions.push(PERMISSIONS.IOS.MEDIA_LIBRARY);
  //     } else if (Platform.OS === 'android') {
  //       if (Platform.Version >= 30) {
  //         permissions.push(
  //           PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
  //           PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
  //           PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
  //         );
  //       } else {
  //         permissions.push(
  //           PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  //           PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  //         );
  //       }
  //     } else {
  //       return false;
  //     }
  //     if (permissions.length) {
  //       return await this._checkMultiple(permissions);
  //     } else {
  //       return false;
  //     }
  //   } catch (error) {
  //     console.warn('Storage Permission Error', error);
  //     return false;
  //   }
  // };
  // requestStorage: () => Promise<void> = () => {
  //   return new Promise((res, rej) => {
  //     try {
  //       let permissions: Permission[] = [];
  //       if (Platform.OS === 'ios') {
  //         permissions.push(PERMISSIONS.IOS.MEDIA_LIBRARY);
  //       } else if (Platform.OS === 'android') {
  //         if (Platform.Version >= 33) {
  //           permissions.push(
  //             PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
  //             PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
  //             PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
  //           );
  //         } else {
  //           permissions.push(
  //             PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  //             PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  //           );
  //         }
  //       } else {
  //         rej(`Platform mismatch...`);
  //       }
  //       if (permissions.length) {
  //         this._requestPermissionMultiple(permissions)
  //           .then(() => res())
  //           .catch(err => rej(err));
  //       } else {
  //         rej('Permission not Found');
  //       }
  //     } catch (error) {
  //       rej(error);
  //     }
  //   });
  // };

  async checkStorage(): Promise<boolean> {
    try {
      const permissions: Permission[] =
        Platform.OS === 'ios'
          ? [PERMISSIONS.IOS.MEDIA_LIBRARY]
          : Platform.Version >= 33
          ? [
              // PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
              // PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
              PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
            ]
          : [
              PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
              PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            ];
      return await this._checkMultiple(permissions);
    } catch (error) {
      console.warn('Storage Permission Error:', error);
      return false;
    }
  }

  async requestStorage(): Promise<boolean> {
    try {
      const permissions: Permission[] =
        Platform.OS === 'ios'
          ? [PERMISSIONS.IOS.MEDIA_LIBRARY]
          // : Platform.Version >= 33
          // ? [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES]
          : [
              PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
              PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            ];
      await this._requestPermissionMultiple(permissions);
      return true;
    } catch (error) {
      console.warn('Request Storage Error:', error);
      return false;
    }
  }


}

const Permissions = new PermissionClass();
export default Permissions;
