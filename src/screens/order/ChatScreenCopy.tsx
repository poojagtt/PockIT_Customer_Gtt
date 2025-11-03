// import React, {useEffect, useState, useCallback, useRef} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TextInput,
//   Pressable,
//   ListRenderItem,
// } from 'react-native';
// import {useFocusEffect, useIsFocused} from '@react-navigation/native';
// import {Icon} from '../../components';
// import socket from '../../utils/socket';
// import {OrderRoutes} from '../../routes/Order';
// import {useSelector} from '../../context';

// export interface Message {
//   _id: string;
//   SENDER_USER_ID: number | null;
//   RECIPIENT_USER_ID: number | null;
//   ORDER_ID: number;
//   MESSAGE: string;
//   STATUS: string | null;
//   CUSTOMER_ID?: number | null;
//   CUSTOMER_NAME?: string;
//   BY_CUSTOMER?: boolean;
//   RECIPIENT_USER_NAME?: string;
//   JOB_CARD_ID?: number;
//   TECHNICIAN_ID?: number;
//   TECHNICIAN_NAME?: string;
// }

// interface User {
//   ID: number;
//   NAME: string;
// }

// export interface ChatScreenRouteParams {
//   jobItem: {
//     ORDER_ID: number;
//     TECHNICIAN_ID: number;
//     TECHNICIAN_NAME: string;
//     JOB_CARD_ID?: number;
//   };
// }

// export interface ChatScreenProps extends OrderRoutes<'ChatScreen'> {}

// interface AppState {
//   app: {
//     user: User | null;
//   };
// }

// const ChatScreen: React.FC<ChatScreenProps> = ({navigation, route}) => {
//   const [chatMessages, setChatMessages] = useState<Message[]>([]);
//   const [message, setMessage] = useState<string>('');
//   const {user} = useSelector((state: AppState) => state.app);
//   const {jobItem} = route.params as ChatScreenRouteParams;
//   const isFocused = useIsFocused();

//   const isFocusedRef = useRef(isFocused);
//   useEffect(() => {
//     isFocusedRef.current = isFocused;
//   }, [isFocused]);

//   useEffect(() => {
//     socket.connect();
//     socket.emit('join-room', {
//       SENDER_USER_ID: user?.ID,
//       RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
//       ORDER_ID: jobItem.ORDER_ID,
//     });

//     const handlePreviousMessages = (data: Message | Message[]) => {
//       const newMessages = Array.isArray(data) ? data : [data];
//       setChatMessages(prevMessages => [...prevMessages, ...newMessages]);
//     };

//     const handleReceiveMessage = (data: Message | Message[]) => {
//       const newMessages = Array.isArray(data) ? data : [data];

//       newMessages.forEach(msg => {
//         if (msg.SENDER_USER_ID !== user?.ID && isFocusedRef.current) {
//           socket.emit('read-message', {
//             messageIds: [msg._id],
//             RECIPIENT_USER_ID: user?.ID,
//             SENDER_USER_ID: msg.SENDER_USER_ID,
//             ORDER_ID: jobItem.ORDER_ID,
//           });
//         }
//       });
//       setChatMessages(prevMessages => [...prevMessages, ...newMessages]);
//     };

//     const handleMessageSeen = (data: {messageIds: string[]}) => {
//       setChatMessages(prevMessages =>
//         prevMessages.map(msg =>
//           data.messageIds.includes(msg._id) ? {...msg, STATUS: 'seen'} : msg,
//         ),
//       );
//     };

//     socket.on('previous-messages', handlePreviousMessages);
//     socket.on('receive-message', handleReceiveMessage);
//     socket.on('message-seen', handleMessageSeen);

//     return () => {
//       socket.off('previous-messages', handlePreviousMessages);
//       socket.off('receive-message', handleReceiveMessage);
//       socket.off('message-seen', handleMessageSeen);
//       socket.disconnect();
//     };
//   }, [jobItem.ORDER_ID, jobItem.TECHNICIAN_ID, user?.ID]);

//   useFocusEffect(
//     useCallback(() => {
//       const unreadMessageIds = chatMessages
//         .filter(
//           msg =>
//             msg.STATUS !== 'seen' &&
//             msg.SENDER_USER_ID !== user?.ID &&
//             msg.BY_CUSTOMER === false,
//         )
//         .map(msg => msg._id);
//       if (unreadMessageIds.length > 0) {
//         socket.emit('read-message', {
//           messageIds: unreadMessageIds,
//           RECIPIENT_USER_ID: user?.ID,
//           SENDER_USER_ID: jobItem.TECHNICIAN_ID,
//           ORDER_ID: jobItem.ORDER_ID,
//         });
//       }
//     }, [chatMessages, jobItem.ORDER_ID, user, jobItem.TECHNICIAN_ID]),
//   );

//   const handleNewMessage = (): void => {
//     if (message.trim().length === 0) return;
//     const newMsg: Omit<Message, '_id' | 'STATUS'> = {
//       ORDER_ID: jobItem.ORDER_ID,
//       CUSTOMER_ID: user?.ID ?? null,
//       CUSTOMER_NAME: user?.NAME,
//       BY_CUSTOMER: true,
//       SENDER_USER_ID: user?.ID ?? null,
//       RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
//       RECIPIENT_USER_NAME: jobItem.TECHNICIAN_NAME,
//       MESSAGE: message,
//       JOB_CARD_ID: jobItem.JOB_CARD_ID,
//       TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
//       TECHNICIAN_NAME: jobItem.TECHNICIAN_NAME,
//     };
//     socket.emit('send-message', newMsg);
//     setMessage('');
//   };

//   const renderItem: ListRenderItem<Message> = ({item}) => {
//     const isUserMessage = item.SENDER_USER_ID == user?.ID;
//     return (
//       <Pressable
//         onPress={() => {
//           if (item.SENDER_USER_ID !== user?.ID && item.STATUS !== 'seen') {
//             socket.emit('read-message', {
//               messageIds: [item._id],
//               RECIPIENT_USER_ID: user?.ID,
//               SENDER_USER_ID: item.SENDER_USER_ID,
//               ORDER_ID: jobItem.ORDER_ID,
//             });
//           }
//         }}>
//         <View
//           style={
//             isUserMessage
//               ? styles.userMessageWrapper
//               : styles.otherMessageWrapper
//           }>
//           <Icon
//             type="Ionicons"
//             name="person-circle-outline"
//             size={30}
//             color="black"
//             style={styles.mavatar}
//           />
//           <View
//             style={isUserMessage ? styles.userMessage : styles.otherMessage}>
//             <Text>{item.MESSAGE}</Text>
//             <Text style={styles.timestamp}>{item.STATUS}</Text>
//           </View>
//         </View>
//       </Pressable>
//     );
//   };

//   return (
//     <View style={styles.messagingScreen}>
//       <FlatList
//         data={chatMessages}
//         renderItem={renderItem}
//         keyExtractor={(item: Message) => item._id}
//         initialNumToRender={10}
//         removeClippedSubviews={false}
//         getItemLayout={(_, index) => ({
//           length: 70,
//           offset: 70 * index,
//           index,
//         })}
//       />
//       <View style={styles.messagingInputContainer}>
//         <TextInput
//           style={styles.messagingInput}
//           onChangeText={setMessage}
//           value={message}
//           placeholder="Type a message..."
//           autoCorrect={false}
//           autoCapitalize="none"
//         />
//         <Pressable
//           style={styles.messagingButtonContainer}
//           onPress={handleNewMessage}>
//           <Text style={styles.sendText}>SEND</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// };

// export default ChatScreen;

// const styles = StyleSheet.create({
//   messagingScreen: {
//     flex: 1,
//     padding: 10,
//     backgroundColor: '#F7F7F7',
//   },
//   messagingInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: 'white',
//   },
//   messagingInput: {
//     flex: 1,
//     borderWidth: 1,
//     padding: 10,
//     borderRadius: 20,
//     marginRight: 10,
//   },
//   messagingButtonContainer: {
//     backgroundColor: 'green',
//     padding: 10,
//     borderRadius: 50,
//   },
//   sendText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   userMessageWrapper: {
//     alignItems: 'flex-end',
//     marginBottom: 10,
//     flexDirection: 'row-reverse',
//   },
//   otherMessageWrapper: {
//     alignItems: 'flex-start',
//     marginBottom: 10,
//     flexDirection: 'row',
//   },
//   userMessage: {
//     backgroundColor: 'rgb(194, 243, 194)',
//     padding: 10,
//     borderRadius: 10,
//     maxWidth: '80%',
//   },
//   otherMessage: {
//     backgroundColor: '#f5ccc2',
//     padding: 10,
//     borderRadius: 10,
//     maxWidth: '80%',
//   },
//   timestamp: {
//     fontSize: 10,
//     opacity: 0.6,
//     marginTop: 5,
//   },
//   mavatar: {
//     marginHorizontal: 10,
//   },
// });








import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ListRenderItem,
  
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {Header, Icon} from '../../components';
import socket from '../../utils/socket';
import {OrderRoutes} from '../../routes/Order';
import {useSelector} from '../../context';
import {fontFamily, Size, useTheme} from '../../modules';

export interface Message {
  _id: string;
  SENDER_USER_ID: number | null;
  RECIPIENT_USER_ID: number | null;
  ORDER_ID: number;
  MESSAGE: string;
  STATUS: string | null;
  CUSTOMER_ID?: number | null;
  CUSTOMER_NAME?: string;
  BY_CUSTOMER?: boolean;
  RECIPIENT_USER_NAME?: string;
  JOB_CARD_ID?: number;
  TECHNICIAN_ID?: number;
  TECHNICIAN_NAME?: string;
}

interface User {
  ID: number;
  NAME: string;
}

export interface ChatScreenRouteParams {
  jobItem: {
    ORDER_ID: number;
    TECHNICIAN_ID: number;
    TECHNICIAN_NAME: string;
    JOB_CARD_ID?: number;
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
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const {user} = useSelector((state: AppState) => state.app);
  const {jobItem} = route.params as ChatScreenRouteParams;
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);
  const isFocusedRef = useRef(isFocused);

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    socket.connect();
    socket.emit('join-room', {
      SENDER_USER_ID: user?.ID,
      RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
      ORDER_ID: jobItem.ORDER_ID,
    });

    const handlePreviousMessages = (data: Message | Message[]) => {
      const newMessages = Array.isArray(data) ? data : [data];
      setChatMessages(prevMessages => [...prevMessages, ...newMessages]);
    };

    const handleReceiveMessage = (data: Message | Message[]) => {
      const newMessages = Array.isArray(data) ? data : [data];

      newMessages.forEach(msg => {
        if (msg.SENDER_USER_ID !== user?.ID && isFocusedRef.current) {
          socket.emit('read-message', {
            messageIds: [msg._id],
            RECIPIENT_USER_ID: user?.ID,
            SENDER_USER_ID: msg.SENDER_USER_ID,
            ORDER_ID: jobItem.ORDER_ID,
          });
        }
      });
      setChatMessages(prevMessages => [...prevMessages, ...newMessages]);
    };

    const handleMessageSeen = (data: {messageIds: string[]}) => {
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          data.messageIds.includes(msg._id) ? {...msg, STATUS: 'seen'} : msg,
        ),
      );
    };

    socket.on('previous-messages', handlePreviousMessages);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-seen', handleMessageSeen);

    return () => {
      socket.off('previous-messages', handlePreviousMessages);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-seen', handleMessageSeen);
      socket.disconnect();
    };
  }, [jobItem.ORDER_ID, jobItem.TECHNICIAN_ID, user?.ID]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: false});
    }, 100);
  }, [chatMessages]);

  useFocusEffect(
    useCallback(() => {
      const unreadMessageIds = chatMessages
        .filter(
          msg =>
            msg.STATUS !== 'seen' &&
            msg.SENDER_USER_ID !== user?.ID &&
            msg.BY_CUSTOMER === false,
        )
        .map(msg => msg._id);
      if (unreadMessageIds.length > 0) {
        socket.emit('read-message', {
          messageIds: unreadMessageIds,
          RECIPIENT_USER_ID: user?.ID,
          SENDER_USER_ID: jobItem.TECHNICIAN_ID,
          ORDER_ID: jobItem.ORDER_ID,
        });
      }
    }, [chatMessages, jobItem.ORDER_ID, user, jobItem.TECHNICIAN_ID]),
  );

  const handleNewMessage = (): void => {
    if (message.trim().length === 0) return;
    const newMsg: Omit<Message, '_id' | 'STATUS'> = {
      ORDER_ID: jobItem.ORDER_ID,
      CUSTOMER_ID: user?.ID ?? null,
      CUSTOMER_NAME: user?.NAME,
      BY_CUSTOMER: true,
      SENDER_USER_ID: user?.ID ?? null,
      RECIPIENT_USER_ID: jobItem.TECHNICIAN_ID,
      RECIPIENT_USER_NAME: jobItem.TECHNICIAN_NAME,
      MESSAGE: message,
      JOB_CARD_ID: jobItem.JOB_CARD_ID,
      TECHNICIAN_ID: jobItem.TECHNICIAN_ID,
      TECHNICIAN_NAME: jobItem.TECHNICIAN_NAME,
    };
    socket.emit('send-message', newMsg);
    setMessage('');
  };

  const renderItem: ListRenderItem<Message> = ({item}) => {
    const isUserMessage = item.SENDER_USER_ID == user?.ID;
    return (
      <View
        style={{
          alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
          backgroundColor: '#E5E5E5',
          borderRadius: 8,
          marginVertical: 4,
          maxWidth: '80%',
          padding: 10,
        }}>
        <Text
          style={{
            color: '#000000',
            fontSize: 14,
           fontFamily: fontFamily,
            fontWeight: 500,
            letterSpacing: 0.3,
          }}>
          {item.MESSAGE}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.messagingScreen}>
      <View style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Size.containerPadding,
            paddingTop: Size.containerPadding,
            paddingBottom: Size.sm,
          }}>
          {/* header */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon
                name="arrow-back-ios"
                type="MaterialIcons"
                size={18}
                color={'#333333'}
                onPress={() => {
                  navigation.goBack();
                }}
              />
              <Text style={styles.receiverName}>{jobItem.TECHNICIAN_NAME}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.callContainer}>
              <View style={styles.call}>
                <Icon
                  name="call"
                  type="MaterialIcons"
                  size={18}
                  color={'#333333'}
                  style={{alignSelf: 'center'}}
                />
              </View>
              <Text style={styles.callText}>{'Call'}</Text>
            </TouchableOpacity>
          </View>
          {/* chat */}
          <View style={styles.chatContainer}>
            <FlatList
              data={chatMessages}
              ref={flatListRef}
              renderItem={renderItem}
              keyExtractor={(item: Message) => item._id}
              initialNumToRender={10}
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: 70,
                offset: 70 * index,
                index,
              })}
            />
          </View>
        </View>
        {/* message */}
        <View style={styles.messageContainer}>
          <TextInput
            placeholder="Message"
            style={styles.textInput}
            onChangeText={setMessage}
            value={message}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Icon
            name="attach-file"
            type="MaterialIcons"
            size={22}
            color="#333333"
          />
          <Icon
            name="send-outline"
            type="Ionicons"
            size={22}
            color="#333333"
            onPress={handleNewMessage}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  messagingScreen: {
    flex: 1,
    backgroundColor: '#f4f2f2',
  },
  receiverName: {
   fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: 600,
    color: '#000000',
    letterSpacing: 0.3,
  },
  callContainer: {
    borderRadius: 30,
    backgroundColor: '#515151',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 5,
  },
  call: {
    height: 24,
    width: 24,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  callText: {
  fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  chatContainer: {
    backgroundColor: '#FFF',
    flex: 1,
    padding: Size.radius,
    borderRadius: Size.sm,
    marginTop: Size.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
});
