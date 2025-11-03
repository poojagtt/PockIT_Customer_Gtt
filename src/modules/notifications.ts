import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, AndroidStyle} from '@notifee/react-native';
import {IMAGE_URL} from './services';
import {navigate} from '../routes/navigationRef';

export const Notification = async (
  notification: FirebaseMessagingTypes.RemoteMessage,
) => {
  try {
    let {title, body}: any = notification.notification;

    const {data1, attachmentType, attachmentUrl}: any = notification.data;

    // Handle navigation based on status
    const handleNotification = (remoteMessage: any) => {
      const type = remoteMessage.data3;
      const data = JSON.parse(remoteMessage.data4 as string);
      if (type === 'O') {
        data[0]?.ORDER_STATUS === 'OP' ||
        data[0]?.ORDER_STATUS === 'OA' ||
        data[0]?.ORDER_STATUS === 'OR' ||
        data[0]?.ORDER_STATUS === 'CA'
          ? navigate('Order', {screen: 'OrderPreview', params: {item: data[0]}})
          : navigate('Order', {screen: 'MultiJobs', params: {item: data[0]}});
      } else if (type === 'J') {
        data[0]?.ORDER_STATUS === 'OA'
          ? navigate('Order', {screen: 'OrderPreview', params: {item: data[0]}})
          : navigate('Order', {
              screen: 'JobDetails',
              params: {jobItem: data[0]},
            });
      } else if (type === 'S') {
        navigate('Order', {
          screen: 'OrderOverview',
          params: {orderId: data[0].ID || 0},
        });
      } else if (type === 'C') {
        navigate('Order', {screen: 'ChatScreen', params: {jobItem: data}});
      } else if (type == 'I') {
        console.log("here")
        navigate('Order', {screen: 'PartDetailsList', params: {jobItem: data[0]}});
      } else if (type == 'F') {
        navigate('Order', {screen: 'JobDetails', params: {jobItem: data[0]}});
      }
    };

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    let style: any = {type: AndroidStyle.BIGTEXT, text: body};
    if (attachmentType === 'I' && attachmentUrl) {
      style = {
        type: AndroidStyle.BIGPICTURE,
        picture: IMAGE_URL + 'notificationAttachment/' + attachmentUrl,
      };
    }

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        sound: 'default',
        style,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        showTimestamp: true,
        timestamp: Date.now(),
      },
      data: notification.data,
    });

    // NotificationSounds.getNotifications('notification').then((soundsList: string | any[]) => {
    //   if (soundsList.length > 0) {
    //     playSampleSound(soundsList[1]);
    //   }
    // });

    // Add notification press listener
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === 1 && detail.notification) {
        // type 1 is PRESS
        handleNotification(detail.notification?.data);
      }
    });
  } catch (err) {
    console.warn(err);
  }
};
