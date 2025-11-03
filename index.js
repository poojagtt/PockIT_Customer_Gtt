/**
 * @format
 */
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import {store} from './src/context';
import {enableScreens} from 'react-native-screens';
import {Notification} from './src/modules/notifications';
import {useEffect} from 'react';
import {getMessaging} from '@react-native-firebase/messaging';
import i18n from './src/i18n/i18n';
import {I18nextProvider} from 'react-i18next';
import {useStorage} from './src/modules';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {BASE_URL, useTheme} from './src/modules';

const messaging = getMessaging();
messaging.setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});



const Application = () => {
  
  enableScreens(false);
  useEffect(() => {
    const notification = messaging.onMessage(async remoteMessage => {
      console.log('remoteMessage', remoteMessage);
      const isNotificationsEnabled = useStorage.getBoolean(
        'NOTIFICATIONS_ENABLED',
      );
      if (
        isNotificationsEnabled == true ||
        isNotificationsEnabled == undefined
      ) {
        Notification(remoteMessage);
      }
    });
    return () => {
      notification();
    };
  }, []);
    const color = useTheme();
  
  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
       <SafeAreaProvider style={{flex: 1, backgroundColor: color.background,}}>
        <App />
        </SafeAreaProvider>
      </Provider>
    </I18nextProvider>
  );
};
AppRegistry.registerComponent(appName, () => Application);
