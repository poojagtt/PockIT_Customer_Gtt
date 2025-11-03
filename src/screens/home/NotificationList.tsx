import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import FileViewer from 'react-native-file-viewer';
import React, {useEffect, useState} from 'react';
import {Modal as RNModal} from 'react-native';
import {Platform} from 'react-native';
import {
  apiCall,
  fontFamily,
  Size,
  useTheme,
  IMAGE_URL,
  useStorage,
} from '../../modules';
import {_noData} from '../../assets';
import {Header, Icon} from '../../components';
import moment from 'moment';
import {useSelector} from '../../context';
import {HomeRoutes} from '../../routes/Home';
import messaging from '@react-native-firebase/messaging';
import {t} from 'i18next';
import RNFS from 'react-native-fs';
import {goBack} from '../../routes/navigationRef';

interface NotificationProps extends HomeRoutes<'NotificationList'> {}
const NotificationList: React.FC<NotificationProps> = ({navigation}) => {
  const colors = useTheme();
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const {user} = useSelector(state => state.app);
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string>('All');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('');
  const [notifications, setNotifications] = useState<{
    data: JobNotification[];
    isLoading: boolean;
  }>({
    data: [],
    isLoading: false,
  });
  const storedChannels = useStorage.getString('SUBSCRIBED_CHANNELS');
  let channelNames = '';
  if (storedChannels) {
    try {
      const parsedChannels = JSON.parse(storedChannels);
      channelNames = parsedChannels
        .map((item: {CHANNEL_NAME: any}) => `'${item.CHANNEL_NAME}'`)
        .join(', ');
    } catch (e) {
      console.error('Error parsing subscribed channels:', e);
    }
  }
  useEffect(() => {
    getNotifications(1, true);
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getNotifications(1, true);
    });
  }, [selectedFilterValue]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getNotifications = async (pageIndex = 1, isRefresh = false) => {
    if (isRefresh) {
      setNotifications(prev => ({...prev, isLoading: true}));
    } else {
      setIsPaginating(true);
    }
    try {
      let baseFilter = `AND ((TYPE='C' AND MEMBER_ID=${user?.ID}) OR (TOPIC_NAME IN (${channelNames})))`;
      if (selectedFilterValue) {
        selectedFilterLabel === 'Job'
          ? (baseFilter += ` AND NOTIFICATION_TYPE IN ('J', 'JC','H', 'F','P','JR') `)
          : selectedFilterLabel==='Inventory Request'
          ? (baseFilter += ` AND MEDIA_TYPE='${selectedFilterValue}'`)
          : (baseFilter += ` AND NOTIFICATION_TYPE='${selectedFilterValue}'`);
      }
      const response = await apiCall.post('api/notification/get', {
        filter: baseFilter,
        pageIndex,
        pageSize: PAGE_SIZE,
      });
      if (response.status === 200) {
        console.log('Notification fetched successfully', response.data.data);
        const newData = response.data.data;
        setHasMore(newData.length === PAGE_SIZE);
        setNotifications(prev => ({
          data: pageIndex === 1 ? newData : [...prev.data, ...newData],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPaginating(false);
      if (isRefresh) {
        setNotifications(prev => ({...prev, isLoading: false}));
      }
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, {color: colors.text}]}>
        {t('notification.nonotificaation')}
      </Text>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 14,
          fontFamily: fontFamily,
          color: '#CBCBCB',
          fontWeight: '500',
        }}>
        {t('notification.empty')}
      </Text>
      <View style={{marginTop: 25}}>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            paddingHorizontal: 50,
            paddingVertical: 10,
            borderRadius: 8,
            borderColor: colors.primary2,
            backgroundColor: '#fff',
          }}
          onPress={() => goBack()}>
          <Text
            style={{
              fontFamily: fontFamily,
              color: colors.primary2,
              fontSize: 16,
              fontWeight: '500',
            }}>
            {t('notification.backTohome')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  // if (notifications.isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color={colors.primary} />
  //     </View>
  //   );
  // }

  // const requestStoragePermission = async (
  //   fileUrl: string,
  //   fileName: string,
  // ) => {
  //   try {
  //     const hasPermission = await Permissions.checkStorage();
  //     if (!hasPermission) {
  //       await Permissions.requestStorage();
  //     }
  //     downloadFile(fileUrl, fileName);
  //   } catch (err) {
  //     console.warn('Storage permission error:', err);
  //     Alert.alert(
  //       'Permission Required',
  //       'Storage permission is required to download files. Please grant permission in settings.',
  //     );
  //   }
  // };

  // const requestStoragePermission = async (fileUrl: string, fileName: string) => {
  //   try {
  //     const granted = await Permissions.requestStorage();
  //     console.log("granted",granted)
  //     if (granted) {
  //       downloadFile(fileUrl, fileName);
  //     } else {
  //       Alert.alert('Permission Denied', 'Storage permission is required.');
  //     }
  //   } catch (err) {
  //     console.warn('Storage permission error:', err);
  //   }
  // };

  // const downloadFile = async (fileUrl: string, fileName: string) => {
  //   const downloadPath =
  //     Platform.OS === 'android'
  //       ? RNFS.DownloadDirectoryPath
  //       : RNFS.DocumentDirectoryPath;

  //   const downloadDest = `${downloadPath}/${fileName}`;

  //   try {
  //     const options = {
  //       fromUrl: fileUrl,
  //       toFile: downloadDest,
  //       background: true,
  //     };

  //     const result = RNFS.downloadFile(options);

  //     result.promise
  //       .then(res => {
  //         Alert.alert('Download Complete', `File saved to: ${downloadDest}`);
  //       })
  //       .catch(err => {
  //         console.log('Download error:', err);
  //         Alert.alert('Error', 'File download failed.');
  //       });
  //   } catch (error) {
  //     console.error('Download error:', error);
  //     Alert.alert('Error', 'Something went wrong during download.');
  //   }
  // };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to download files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const downloadFile = async (
    fileUrl: string,
    fileName: string,
    setLoadingDownload: (val: boolean) => void,
  ) => {
    if (!fileUrl || !fileName) {
      Alert.alert('Error', 'Invalid file URL or name');
      return;
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const downloadDest = `${RNFS.DocumentDirectoryPath}/${sanitizedFileName}`;

    setLoadingDownload(true);

    const options = {
      fromUrl: fileUrl,
      toFile: downloadDest,
      background: true,
    };

    try {
      const result = await RNFS.downloadFile(options).promise;

      setLoadingDownload(false);

      if (result.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to:\n${downloadDest}`, [
          {
            text: 'Open File',
            onPress: async () => {
              try {
                await FileViewer.open(downloadDest, {showOpenWithDialog: true});
              } catch (err) {
                Alert.alert(
                  'Error',
                  'Cannot open file. No suitable app found.',
                );
                console.error('File open error:', err);
              }
            },
          },
          {text: 'OK'},
        ]);
      } else {
        Alert.alert('Download Failed', `Status Code: ${result.statusCode}`);
      }
    } catch (error) {
      setLoadingDownload(false);
      console.error('Download error:', error);
      Alert.alert('Error', 'File download failed. Please try again.');
    }
  };
  // const downloadFile = async (
  //   fileUrl: string,
  //   fileName: string,
  //   setLoadingDownload: (val: boolean) => void,
  // ) => {
  //   if (!fileUrl || !fileName) {
  //     Alert.alert('Error', 'Invalid file URL or name');
  //     return;
  //   }

  //   const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  //   let downloadDest = '';

  //   if (Platform.OS === 'android') {
  //     const hasPermission = await requestStoragePermission();
  //     if (!hasPermission) {
  //       Alert.alert(
  //         'Permission Denied',
  //         'Cannot download file without storage permission.',
  //       );
  //       return;
  //     }
  //     downloadDest = `${RNFS.DownloadDirectoryPath}/${sanitizedFileName}`;
  //   } else {
  //     // iOS uses DocumentDirectoryPath
  //     downloadDest = `${RNFS.DocumentDirectoryPath}/${sanitizedFileName}`;
  //   }

  //   setLoadingDownload(true);

  //   const options = {
  //     fromUrl: fileUrl,
  //     toFile: downloadDest,
  //     background: true,
  //   };

  //   try {
  //     const download = RNFS.downloadFile(options);
  //     const result = await download.promise;

  //     setLoadingDownload(false);

  //     if (result.statusCode === 200) {
  //       Alert.alert('Success', `File downloaded to:\n${downloadDest}`);
  //     } else {
  //       Alert.alert('Download Failed', `Status Code: ${result.statusCode}`);
  //     }
  //   } catch (error) {
  //     setLoadingDownload(false);
  //     console.error('Download error:', error);
  //     Alert.alert('Error', 'File download failed. Please try again.');
  //   }
  // };
  const notificationTypes = [
    'All',
    'Order',
    'Job',
    'Support Ticket',
    'Feedbacks',
    'Inventory Request',
    'Shop',
  ];

  const handlePress = (label: string) => {
    setSelectedFilterLabel(label);
    const value =
      label === 'All'
        ? ''
        : label === 'Order'
        ? 'O'
        : label === 'Job'
        ? 'J || JC'
        : label === 'Support Ticket'
        ? 'TC'
        : label === 'Feedbacks'
        ? 'F'
        : label === 'Inventory Request'
        ? 'IR'
        : label === 'Shop'
        ? 'SH'
        : '';
    setSelectedFilterValue(value);
    setPage(1); // reset page
  };

const getNotificationIcon = (data: any) => {
  const title = data.TITLE?.toLowerCase() || '';

  if (title.includes('order')) {
    if (
      title.includes('placed successfully') ||
      title.includes('order placed') ||
      title.includes('order has been placed')
    )
      return { name: 'clipboard-check', type: 'MaterialCommunityIcons', color: '#3170DE' };

    if (title.includes('accepted'))
      return { name: 'clipboard-check-outline', type: 'MaterialCommunityIcons', color: '#3170DE' };
    if (title.includes('packaged'))
      return { name: 'cube', type: 'Feather', color: '#3170DE' };
    if (title.includes('dispatched') || title.includes('out for delivery'))
      return { name: 'truck', type: 'Feather', color: '#3170DE' };
    if (title.includes('sent for pickup'))
      return { name: 'box-arrow-in-up', type: 'MaterialCommunityIcons', color: '#3170DE' };
    if (
      title.includes('label generated') ||
      title.includes('label') ||
      title.includes('shipping label') ||
      title.includes('placed in shiprocket')
    )
      return { name: 'barcode', type: 'MaterialCommunityIcons', color: '#3170DE' };

    return { name: 'file-document-outline', type: 'MaterialCommunityIcons', color: '#3170DE' };
  }

  if (title.includes('job')) {
    if (title.includes('completed'))
      return { name: 'check-circle', type: 'Feather', color: '#F39C12' };
    if (title.includes('scheduled'))
      return { name: 'calendar-check', type: 'Feather', color: '#F39C12' };
    if (title.includes('technician has arrived'))
      return { name: 'map-pin', type: 'Feather', color: '#F39C12' };
    if (title.includes('created'))
      return { name: 'user-check', type: 'Feather', color: '#F39C12' };
    return { name: 'briefcase', type: 'Feather', color: '#F39C12' };
  }

  if (title.includes('inventory') || title.includes('payment')) {
    if (title.includes('payment request') || title.includes('payment status updated'))
      return { name: 'credit-card', type: 'Feather', color: '#27AE60' };
    if (title.includes('low stock alert'))
      return { name: 'alert-triangle', type: 'Feather', color: '#E74C3C' };
    return { name: 'box', type: 'Feather', color: '#27AE60' };
  }

  if (title.includes('happy code')) {
    return { name: 'key', type: 'Feather', color: '#8E44AD' };
  }

  if (title.includes('shop')) {
    return { name: 'storefront', type: 'MaterialIcons', color: '#8E44AD' };
  }

  if (title.includes('ticket')) {
    return { name: 'ticket', type: 'Feather', color: '#E74C3C' };
  }

  if (title.includes('feedback')) {
    return { name: 'message-circle', type: 'Feather', color: '#FFD700' };
  }

  return { name: 'bell', type: 'Feather', color: '#3170DE' };
};
  return (
    <SafeAreaView style={styles.container}>
      <Header
        label={t('Notifications')}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Shop', {screen: 'ShopHome'} as any);
          }
        }}
      />

      <View style={{marginVertical: 12}}>
        <FlatList
          data={notificationTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item + index}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({item}) => {
            const isSelected = selectedFilterLabel === item;
            return (
              <TouchableOpacity
                onPress={() => handlePress(item)}
                style={[styles.chip, isSelected && styles.selectedChip]}>
                <Text
                  style={[styles.chipText, isSelected && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={{paddingHorizontal: 12}}>
        {notifications.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ListFooterComponent={() =>
              isPaginating ? (
                <View style={{paddingVertical: 20}}>
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              ) : null
            }
            onEndReached={async () => {
              if (!isPaginating && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                await getNotifications(nextPage);
              }
            }}
            onEndReachedThreshold={0.3}
            data={notifications.data}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
                const iconProps = getNotificationIcon(item);

              const today = moment();
              const differenceInDays = today.diff(
                item.CREATED_MODIFIED_DATE,
                'days',
              );
              let displayDate;
              if (differenceInDays > 10) {
                displayDate = moment(item.CREATED_MODIFIED_DATE).format(
                  'DD/MMM/YYYY',
                );
              } else {
                differenceInDays == 0
                  ? (displayDate = 'Today')
                  : differenceInDays == 1
                  ? (displayDate = differenceInDays + ' day')
                  : (displayDate = differenceInDays + ' days');
              }

              return (
                <View style={styles.notificationItem}>
                  <View style={styles.itemHeader}>
                    <View
                  style={[
                    styles.iconContainer,
                    {backgroundColor: colors.secondary2+'50',marginRight:10},
                  ]}>
                  <Icon
                    name={iconProps.name}
            type={iconProps.type}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                    <View style={styles.headerContent}>
                      <Text style={[styles.title, {color: colors.text}]}>
                        {item.TITLE.replace(/\*/g, '')}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <View>
                      {item.DESCRIPTION && (
                        <Text style={styles.description}>
                          {item.DESCRIPTION}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                      }}>
                      {item.ATTACHMENT && (
                        <TouchableOpacity
                          style={styles.download}
                          onPress={() =>
                            // requestStoragePermission(
                            //   `${IMAGE_URL}notificationAttachment/${item.ATTACHMENT}`,
                            //   item.ATTACHMENT,
                            // )
                            downloadFile(
                              `${IMAGE_URL}notificationAttachment/${item.ATTACHMENT}`,
                              item.ATTACHMENT,
                              setLoadingDownload,
                            )
                          }>
                          <Text style={styles.downloadtxt}>Download</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.time}>
                    {`${displayDate}  |  ${moment(
                      item.CREATED_MODIFIED_DATE,
                    ).format('HH:mm a')}`}
                  </Text>
                </View>
              );
            }}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => getNotifications()}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>
      {/* Full-Screen Loader for Language Update */}
      {loadingDownload && (
        <RNModal
          transparent={true}
          animationType="none"
          visible={loadingDownload}>
          <View style={styles._loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </RNModal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
    // padding: Size.containerPadding,
    backgroundColor: '#F6F8FF',
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headingTxt: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size['2xl'],
    marginBottom: Size.lg,
  },
  listContainer: {
    flexGrow: 1,
    padding: Size.padding,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  notificationItem: {
    backgroundColor: 'white',
    paddingVertical: Size.sm,
    paddingHorizontal: Size.lg,
    marginBottom: Size.sm,
    // elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    // shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E7E6E6',
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginLeft: Size.radius,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  time: {
    alignSelf: 'flex-end',
    // flex:0.4,
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: fontFamily,
  },
  description: {
    fontSize: 12,
    fontFamily: fontFamily,
    fontWeight: 400,
    color: '#444',
    marginTop: Size.sm,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: Size.base,
    fontSize: 20,
    fontFamily: fontFamily,
    fontWeight: '500',
  },
  download: {
    backgroundColor: '#3170DE',
    padding: 5,
    borderRadius: 8,
    marginLeft: 10,
    marginTop: 10,
    width: 100,
  },
  downloadtxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fontFamily,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    backgroundColor: '#F1F3F6',
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },

  selectedChip: {
    backgroundColor: '#3170DE',
    borderColor: '#3170DE',
  },

  chipText: {
    fontSize: 14,
    color: '#1D1D1D',
    fontWeight: '500',
    fontFamily: fontFamily,
  },

  selectedText: {
    color: '#ffffff',
  },
});

export default NotificationList;
