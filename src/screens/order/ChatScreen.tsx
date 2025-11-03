import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useIsFocused} from '@react-navigation/native';
import {Button, Icon, Header} from '../../components';
import {OrderRoutes} from '../../routes/Order';
import {useSelector} from '../../context';
import {
  apiCall,
  BASE_URL,
  fontFamily,
  Size,
  useStorage,
  useTheme,
} from '../../modules';
import ImagePicker from 'react-native-image-crop-picker';
import Modal from '../../components/Modal';
import VideoPlayer from './components/VideoPlayer';
import {useTranslation} from 'react-i18next';
import moment from 'moment';
import messaging from '@react-native-firebase/messaging';
import Toast from '../../components/Toast';

export interface Message {
  _id: string;
  SENDER_USER_ID: number | null;
  RECIPIENT_USER_ID: number | null;
  ORDER_ID: number;
  ORDER_NUMBER: string;
  MESSAGE: string;
  STATUS: string | null;
  CUSTOMER_ID?: number | null;
  CUSTOMER_NAME?: string;
  BY_CUSTOMER?: boolean;
  RECIPIENT_USER_NAME?: string;
  JOB_CARD_ID?: number;
  JOB_CARD_NUMBER?: string;
  TECHNICIAN_ID?: number;
  TECHNICIAN_NAME?: string;
  ATTACHMENT_URL?: string;
  MEDIA_TYPE?: string;
  CREATED_DATETIME?: string;
  SEND_DATE?: string;
  RECEIVED_DATE?: string | null;
  IS_DELIVERED?: boolean;
  ROOM_ID?: string | null;
  IS_FIRST: number;
}

interface User {
  ID: number;
  NAME: string;
}

export interface ChatScreenRouteParams {
  jobItem: {
    ORDER_ID: number;
    ORDER_NUMBER: string;
    TECHNICIAN_ID: number;
    TECHNICIAN_NAME: string;
    JOB_CARD_ID?: number;
    JOB_CARD_NO?: string;
    JOB_CARD_NUMBER?: string;
    TECHNICIAN_MOBILE_NUMBER: number;
  };
}

export interface ChatScreenProps extends OrderRoutes<'ChatScreen'> {}

interface AppState {
  app: {
    user: User | null;
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({navigation, route}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const {user} = useSelector((state: AppState) => state.app);
  const {jobItem} = route.params as ChatScreenRouteParams;
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);
  const isFocusedRef = useRef(isFocused);
  const [openModal, setOpenModal] = useState({
    upload: false,
    sendModal: false,
  });
  const [media, setMedia] = useState({
    uri: '',
    name: '',
    type: '',
    mediaType: '',
  });
  const [loader, setLoader] = useState({
    chat: true,
    uploadMedia: false,
  });

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 300);
  }, [chatMessages]);

  useEffect(() => {
    getChatMessages();
    subscribeToTopic();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getChatMessages();
    });
  }, []);
  const subscribeToTopic = async () => {
    const topicName = `chat_${jobItem.JOB_CARD_ID}_customer_${user?.ID}_channel`;
    const chatTopic = useStorage.getString('CHAT_TOPIC_TECH');
    if (topicName !== chatTopic) {
      const res = await apiCall.post(
        'api/channelSubscribedUsers/subscribeToChanel',
        {
          CHANNEL_NAME: topicName,
          USER_ID: user?.ID,
          STATUS: true,
          CLIENT_ID: 1,
          USER_NAME: user?.NAME,
          TYPE: 'C',
        },
      );
      if (res.status === 200) {
        await messaging()
          .subscribeToTopic(topicName)
          .then(() => {
            console.log('subscribed to topic');
            useStorage.set('CHAT_TOPIC_TECH', topicName);
          });
      }
    }
  };
  const getChatMessages = async () => {
    try {
      const res = await apiCall.post('api/orderChat/get', {
        // filter: ` AND ORDER_ID = ${jobItem.ORDER_ID} AND JOB_CARD_ID = ${jobItem.JOB_CARD_ID}`,
        filter: {
          JOB_CARD_ID: jobItem.JOB_CARD_ID,
          ORDER_ID: jobItem.ORDER_ID,
        },
        sortKey: 'SEND_DATE',
        sortValue: 'ASC',
      });
      if (res.data && res.data.code === 200) {
        setChatMessages(res.data.data);
        setLoader(prev => ({...prev, chat: false}));
      }
    } catch (error) {
      console.error(t('chat.alerts.errors.getMessages'), error);
      setLoader(prev => ({...prev, chat: false}));
    }
  };
  const handleMediaGalleryUpload = () => {
    ImagePicker.openPicker({
      mediaType: 'any',
      cropping: false,
    })
      .then(file => {
        const mediaType =
          file.mime && file.mime.startsWith('image') ? 'I' : 'V';
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: mediaType,
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
        } else {
          console.error(t('chat.alerts.errors.pickingError'), error);
        }
      });
  };
  const handleMediaPhotoCapture = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      cropping: false,
    })
      .then(file => {
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: 'I',
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
        } else {
          console.error('Error picking media:', error);
        }
      });
  };
  const handleMediaVideoCapture = () => {
    ImagePicker.openCamera({
      mediaType: 'video',
      cropping: false,
    })
      .then(file => {
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: 'V',
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
        } else {
          console.error('Error picking media:', error);
        }
      });
  };
  const uploadMediaFile = async () => {
    setLoader({...loader, uploadMedia: true});
    const formData = new FormData();
    formData.append('Image', {
      uri: media.uri,
      name: media.name,
      type: media.type,
    });
    try {
      const res = await apiCall.post('api/upload/OrderChat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.code === 200) {
        const newMsg: Omit<Message, '_id'> = {
          ORDER_ID: jobItem.ORDER_ID,
          ORDER_NUMBER: jobItem.ORDER_NUMBER,
          CUSTOMER_ID: user?.ID ?? null,
          CUSTOMER_NAME: user?.NAME,
          BY_CUSTOMER: true,
          SENDER_USER_ID: user?.ID ?? null,
          RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
          RECIPIENT_USER_NAME: jobItem.TECHNICIAN_NAME,
          MESSAGE: message,
          JOB_CARD_ID: jobItem.JOB_CARD_ID,
          JOB_CARD_NUMBER: jobItem.JOB_CARD_NO
            ? jobItem.JOB_CARD_NO
            : jobItem.JOB_CARD_NUMBER,
          TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
          TECHNICIAN_NAME: jobItem.TECHNICIAN_NAME,
          CREATED_DATETIME: moment().format('YYYY-MM-DD HH:mm:ss'),
          STATUS: 'sent',
          SEND_DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
          RECEIVED_DATE: null,
          ATTACHMENT_URL: media.name,
          IS_DELIVERED: false,
          ROOM_ID: null,
          MEDIA_TYPE: media.mediaType,
          IS_FIRST: !ReceivedFirstMessage ? 1 : 0,
        };
        const res = await apiCall.post('api/orderChat/create', newMsg);
        if (res.data && res.data.code === 200) {
          const createdMessage: Message = {
            ...newMsg,
            _id: new Date().getTime().toString(),
          };
          setMessage('');
          setMedia({
            mediaType: '',
            name: '',
            type: '',
            uri: '',
          });
          setLoader({...loader, uploadMedia: false});
          setOpenModal({...openModal, upload: false, sendModal: false});
          setChatMessages(prev => [...prev, createdMessage]);
        }
      } else {
        console.error(t('chat.alerts.errors.uploadFailed'), res.data);
        setLoader({...loader, uploadMedia: false});
        throw new Error(t('chat.alerts.errors.uploadFailed'));
      }
    } catch (error) {
      console.error(t('chat.alerts.errors.uploadFailed'), error);
      setLoader({...loader, uploadMedia: false});
      throw error;
    }
  };
  console.log('jobItem...', jobItem);
  const ReceivedFirstMessage =
    chatMessages.some(item => item.BY_CUSTOMER === true) &&
    chatMessages.some(item => item.BY_CUSTOMER === false);
  const handleNewMessage = async (): Promise<void> => {
    if (message.trim().length === 0) {
      Toast(t('chat.alerts.emptyMessage'));
      return;
    }
    const newMsg: Omit<Message, '_id'> = {
      ORDER_ID: jobItem.ORDER_ID,
      ORDER_NUMBER: jobItem.ORDER_NUMBER,
      CUSTOMER_ID: user?.ID ?? null,
      CUSTOMER_NAME: user?.NAME,
      BY_CUSTOMER: true,
      SENDER_USER_ID: user?.ID ?? null,
      RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
      RECIPIENT_USER_NAME: jobItem.TECHNICIAN_NAME,
      MESSAGE: message,
      JOB_CARD_ID: jobItem.JOB_CARD_ID,
      JOB_CARD_NUMBER: jobItem.JOB_CARD_NO
        ? jobItem.JOB_CARD_NO
        : jobItem.JOB_CARD_NUMBER,
      TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
      TECHNICIAN_NAME: jobItem.TECHNICIAN_NAME,
      CREATED_DATETIME: moment().format('YYYY-MM-DD HH:mm:ss'),
      STATUS: 'sent',
      SEND_DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
      RECEIVED_DATE: null,
      ATTACHMENT_URL: media.name,
      IS_DELIVERED: false,
      ROOM_ID: null,
      MEDIA_TYPE: media.mediaType,
      IS_FIRST: !ReceivedFirstMessage ? 1 : 0,
    };
    const res = await apiCall.post('api/orderChat/create', newMsg);
    if (res.data && res.data.code === 200) {
      const createdMessage: Message = {
        ...newMsg,
        _id: new Date().getTime().toString(),
      };
      setMessage('');
      setMedia({
        mediaType: '',
        name: '',
        type: '',
        uri: '',
      });
      setChatMessages(prev => [...prev, createdMessage]);
    }
  };
  const renderItem = ({item}: {item: Message}) => {
    const isUserMessage = item.BY_CUSTOMER;

    return (
      <View
        key={item._id}
        style={{
          alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
          backgroundColor: 'white',
          borderRadius: 11,
          marginVertical: 4,
          maxWidth: '80%',
          padding: 16,
          paddingVertical: 6,
          borderTopRightRadius: isUserMessage ? 0 : 20,
          borderTopLeftRadius: isUserMessage ? 20 : 0,
          borderColor: '#CBCBCB',
          borderWidth: 1,
        }}>
        {item.ATTACHMENT_URL &&
          (item.MEDIA_TYPE === 'I' ? (
            <Image
              source={{
                uri:
                  BASE_URL +
                  'static/OrderChat/' +
                  item.ATTACHMENT_URL +
                  `?timestamp=${new Date().getTime()}`,
              }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 8,
                marginBottom: 4,
                marginTop: 6,
              }}
              onLoad={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({animated: true});
                }, 100);
              }}
            />
          ) : (
            <VideoPlayer
              videoUri={BASE_URL + 'static/OrderChat/' + item.ATTACHMENT_URL}
              style={{
                width: 100,
                borderRadius: 8,
                marginBottom: 4,
                marginTop: 6,
              }}
            />
          ))}
        {item.MESSAGE && (
          <Text
            style={{
              color: '#000000',
              fontSize: 14,
              fontFamily: fontFamily,
              fontWeight: '500',
              letterSpacing: 0.3,
            }}>
            {item.MESSAGE}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 25}>
      <SafeAreaView style={styles.messagingScreen}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            justifyContent: 'space-between',
          }}>
          <Header
            label={jobItem.TECHNICIAN_NAME}
            onBack={() => navigation.goBack()}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.callContainer}
            onPress={() => {
              const phoneNumber = jobItem.TECHNICIAN_MOBILE_NUMBER;
              Linking.openURL(`tel:${phoneNumber}`);
            }}>
            <View>
              <Icon
                name="headset"
                type="MaterialCommunityIcons"
                size={23}
                color={'black'}
              />
            </View>
            <Text style={styles.callText}>{t('chat.call')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: Size.containerPadding,
              paddingTop: Size.containerPadding,
              paddingBottom: Size.sm,
            }}>
            {/* Chat */}
            <View style={styles.chatContainer}>
              {loader.chat ? (
                <ActivityIndicator
                  color={colors.primary}
                  size={'small'}
                  style={{marginTop: Size['3xl'] * 4, alignSelf: 'center'}}
                />
              ) : (
                <FlatList
                  data={chatMessages}
                  ref={flatListRef}
                  renderItem={renderItem}
                  keyExtractor={(item: Message) => item._id}
                  initialNumToRender={10}
                  removeClippedSubviews={false}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({animated: true});
                    }, 100);
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {t('chat.messages.empty')}
                    </Text>
                  }
                />
              )}
            </View>

            {/* Message Input Area */}
            <View style={styles.messageContainer}>
              <TextInput
                placeholder={t('chat.input.placeholder')}
                style={styles.textInput}
                onChangeText={setMessage}
                value={message}
                autoCorrect={false}
                autoCapitalize="none"
                numberOfLines={1}
                placeholderTextColor={'#ccc'}
              />
              <Icon
                name="attachment"
                type="MaterialIcons"
                size={26}
                color="#2A3B8F"
                onPress={() => {
                  setOpenModal({...openModal, upload: true});
                }}
              />
              <Icon
                name="send"
                type="MaterialIcons"
                size={23}
                color="#2A3B8F"
                onPress={handleNewMessage}
              />
            </View>
          </View>
        </View>

        {/* attach */}
        <Modal
          show={openModal.upload}
          onClose={() => {
            setOpenModal({...openModal, upload: false});
          }}
          style={{
            justifyContent: 'flex-end',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          containerStyle={{
            margin: 0,
          }}>
          <View style={{flexDirection: 'row', gap: 20}}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaPhotoCapture();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="camera-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {t('chat.buttons.camera')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaVideoCapture();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="videocam-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {t('chat.buttons.video')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaGalleryUpload();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="images-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {t('chat.buttons.gallery')}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
        {/* send confirmation */}
        <Modal
          show={openModal.sendModal}
          onClose={() => {
            setOpenModal({...openModal, sendModal: false});
          }}
          style={{}}
          containerStyle={{}}>
          <View style={{gap: 20}}>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 500,
                color: '#333333',
                letterSpacing: 0.3,
              }}>
              {t('chat.confirmation.title')}
            </Text>
            <View style={{flexDirection: 'row', gap: 20}}>
              <Button
                label={t('chat.confirmation.cancel')}
                onPress={() => {
                  setOpenModal({...openModal, sendModal: false});
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
                labelStyle={{color: colors.primary}}
              />
              <Button
                label={t('chat.confirmation.send')}
                loading={loader.uploadMedia}
                onPress={() => {
                  uploadMediaFile();
                }}
                style={{flex: 1}}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  messagingScreen: {
    flex: 1,
    backgroundColor: '#F6F8FF',
  },
  receiverName: {
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    // letterSpacing: 0,
  },
  callContainer: {
    alignItems: 'center',
    // paddingVertical: 4,
    flexDirection: 'row',
    marginTop: 25,
  },

  callText: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  chatContainer: {
    backgroundColor: '#FFF',
    flex: 1,
    padding: Size.radius,
    borderRadius: Size.sm,
    // marginTop: Size.lg,
    paddingHorizontal: Size.containerPadding,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: Size.containerPadding,
    paddingVertical: Size.paddingX,
    gap: 10,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#2A3B8F',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    fontFamily: fontFamily,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 6,
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: fontFamily,
    fontWeight: 'bold',
  },
  emptyText: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
    marginTop: Size['3xl'],
  },
});
