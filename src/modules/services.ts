// // export const BASE_URL: string = 'https://p8rhkmb7-8767.inc1.devtunnels.ms/'; //Bahubali
// export const BASE_URL: string = 'https://1786vqrk-8767.inc1.devtunnels.ms/'; //Darshan
// // export const BASE_URL: string = 'https://pn5m5nf6-8090.inc1.devtunnels.ms/'; //Ujef
// // export const BASE_URL: string = 'https://e9c6-2401-4900-1c9b-720e-7c61-c354-55fe-1c8b.ngrok-free.app/'; //Kedar Sir
// // export const BASE_URL: string = 'https://pockitadmin.uvtechsoft.com:8767/'; //Testing Server
// // export const BASE_URL: string = 'https://jsonplaceholder.typicode.com/'; //Live Server
// // export const SOCKET_URL: string = 'https://pockit.pockitengineers.com/'; //Live Server
// // export const BASE_URL: string = 'https://pockit.pockitengineers.com/auth/'; //Live Server
// // export const BASE_URL: string = 'https://98769p8r-8768.inc1.devtunnels.ms/'; //Pranali

// export const API_KEY: string = 'WGykEs0b241gNKcDshYU9C4I0Ft1JoSb';
// export const APPLICATION_KEY: string = 'ZU63HDzj79PEFzz5';
// export const IMAGE_URL = BASE_URL + 'static/';
// // export const RAZOR_PAY_KEY = 'rzp_test_SO1E5ovbNuNP0B';
// export const RAZOR_PAY_KEY = 'rzp_live_UOLu84DuvGULjK';

// export const MAP_API = 'AIzaSyA1EJJ0RMDQwzsDd00Oziy1pytYn_Ozi-g';
// import axios from 'axios';
// import {tokenStorage} from './hooks';
// export const apiCall = axios.create({
//   baseURL: BASE_URL,
//   timeoutErrorMessage: `We're having a bit of a snag connecting to the server. Let's try again later.`,
// });
// apiCall.interceptors.request.use(config => {
//   const token = tokenStorage.getToken();
//   if (token) {
//     config.headers.token = token;
//     config.headers.apiKey = API_KEY;
//     config.headers.applicationKey = APPLICATION_KEY;
//   } else {
//     config.headers.token = '';
//     config.headers.apiKey = API_KEY;
//     config.headers.applicationKey = APPLICATION_KEY;
//   }
//   return config;
// });
// apiCall.interceptors.response.use(
//   function (response) {
//     console.log(
//       'success::',
//       `${response.config.baseURL}${response.config.url}`,
//       response.config.data,
//     );
//     return response;
//   },
//   function (error) {
//     if (axios.isAxiosError(error)) {
//       console.warn('In interceptor', error.stack);
//       if (error.response) {
//         return Promise.reject({
//           code: error.response.status,
//           message: error.response.data.message,
//         });
//       } else {
//         return Promise.reject({
//           code: 999,
//           message: error.message,
//           data: error.code,
//         });
//       }
//     } else {
//       return Promise.reject(error);
//     }
//   },
// );

// // apiCall.interceptors.response.use(
// //   response => response,
// //   error => {
// //     if (axios.isAxiosError(error)) {
// //       let message = 'Something went wrong';
// //       let code = error.response?.status || 500;
// //       let data = error.code;

// //       try {
// //         if (typeof error.response?.data === 'object') {
// //           message = error.response.data.message || message;
// //         } else if (typeof error.response?.data === 'string') {
// //           console.warn('Server returned non-JSON error response');
// //         }
// //       } catch (parseErr) {
// //         console.warn('Error parsing error response', parseErr);
// //       }

// //       // Create a real Error and attach extra info
// //       const customError = new Error(message);
// //       (customError as any).code = code;
// //       (customError as any).data = data;

// //       return Promise.reject(customError);
// //     }

// //     const unknownError = new Error('Unexpected error occurred');
// //     return Promise.reject(unknownError);
// //   }
// // );

// export const BASE_URL: string = 'https://98769p8r-6787.inc1.devtunnels.ms/';//Pranali
// export const BASE_URL: string = 'http://192.168.29.47:6787/'; 
// export const BASE_URL: string = 'https://p8rhkmb7-8767.inc1.devtunnels.ms/'; //Bahubali
// export const BASE_URL: string = 'https://1786vqrk-6787.inc1.devtunnels.ms/'; //Darshan
export const BASE_URL: string = 'https://pn5m5nf6-8767.inc1.devtunnels.ms/'; //Ujef
// export const BASE_URL: string = 'https://e9c6-2401-4900-1c9b-720e-7c61-c354-55fe-1c8b.ngrok-free.app/'; //Kedar Sir
// export const BASE_URL: string = 'https://pockitadmin.uvtechsoft.com:8767/'; //Testing Server
// export const BASE_URL: string = 'https://jsonplaceholder.typicode.com/'; //Live Server
// export const SOCKET_URL: string = 'https://pockit.pockitengineers.com/'; //Live Server
// export const BASE_URL: string = 'https://pockit.pockitengineers.com/auth/'; //Live Server
// export const BASE_URL: string = 'https://console.pockitengineers.com/auth/'; //Live Server production


// Your API keys
export const API_KEY: string = 'WGykEs0b241gNKcDshYU9C4I0Ft1JoSb';
export const APPLICATION_KEY: string = 'ZU63HDzj79PEFzz5';

export const IMAGE_URL = BASE_URL + 'static/';
// export const RAZOR_PAY_KEY = 'rzp_test_SO1E5ovbNuNP0B';
export const RAZOR_PAY_KEY = 'rzp_live_UOLu84DuvGULjK';
const SECRET_KEY = 'POCKIT@321';

export const MAP_API =Platform.OS=='android'? 'AIzaSyDZLO0t-wcSaB9cc8EcIRT6tdvfuuMXkcs':'AIzaSyBch51HSSKjdBT1_doeapN6s46i4iCSeDw';
import axios from 'axios';
import {tokenStorage} from './hooks';
// @ts-ignore
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';


const encrypt = (text: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    if (encrypted === text) {
      console.error('Encryption failed: output matches input');
    }
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};


export const apiCall = axios.create({
  baseURL: BASE_URL,
  timeoutErrorMessage: `We're having a bit of a snag connecting to the server. Let's try again later.`,
});
apiCall.interceptors.request.use(config => {
  const token = tokenStorage.getToken();
  const encryptedApiKey = encrypt(API_KEY);
  const encryptedApplicationKey = encrypt(APPLICATION_KEY);
 
  if (token) {
    config.headers.token = token;
    config.headers.apiKey = encryptedApiKey;
    config.headers.applicationKey = encryptedApplicationKey;
  } else {
    config.headers.token = '';
    // config.headers.apiKey = API_KEY;
    config.headers.apiKey = encryptedApiKey;
    config.headers.applicationKey = encryptedApplicationKey;
    // config.headers.applicationKey = APPLICATION_KEY;
  }
  return config;
});
apiCall.interceptors.response.use(
  function (response) {
    console.log(
      'success::',
      `${response.config.baseURL}${response.config.url}`,
      response.config.data,
    );
    return response;
  },
  function (error) {
    if (axios.isAxiosError(error)) {
      console.warn('In interceptor', error.stack);
      if (error.response) {
        return Promise.reject({
          code: error.response.status,
          message: error.response.data.message,
        });
      } else {
        return Promise.reject({
          code: 999,
          message: error.message,
          data: error.code,
        });
      }
    } else {
      return Promise.reject(error);
    }
  },
);