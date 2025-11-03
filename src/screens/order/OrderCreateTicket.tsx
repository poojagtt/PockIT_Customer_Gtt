import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
 
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {OrderRoutes} from '../../routes/Order';
import {apiCall, fontFamily, Size, useTheme} from '../../modules';
import {Header, Icon, ImagePicker} from '../../components';
import {_noData} from '../../assets';
import {useSelector} from '../../context';
import {useNavigation} from '@react-navigation/native';
import {t} from 'i18next';

interface OrderCreateTicketProps extends OrderRoutes<'OrderCreateTicket'> {}
interface ticketHead {
  ALERT_MSG: string;
  ARCHIVE_FLAG: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  DEPARTMENT_ID: number;
  DEPARTMENT_NAME: string | null;
  ID: number;
  IS_LAST: number;
  IS_LAST_STATUS: string;
  ORG_ID: number;
  PARENT_ID: number;
  PARENT_VALUE: string | null;
  PRIORITY: string;
  READ_ONLY: string;
  SEQ_NO: number;
  STATUS: number;
  TICKET_GROUP_STATUS: string;
  TYPE: string;
  URL: string;
  VALUE: string;
}
interface ticketBody {
  ALERT_MSG: string;
  ARCHIVE_FLAG: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  DEPARTMENT_ID: number;
  DEPARTMENT_NAME: string | null;
  ID: number;
  IS_LAST: number;
  IS_LAST_STATUS: string;
  ORG_ID: number;
  PARENT_ID: number;
  PARENT_VALUE: string | null;
  PRIORITY: string;
  READ_ONLY: string;
  SEQ_NO: number;
  STATUS: number;
  TICKET_GROUP_STATUS: string;
  TYPE: string;
  URL: string;
  VALUE: string;
}
interface faqInterface {
  ANSWER: string;
  ARCHIVE_FLAG: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  FAQ_HEAD_ID: number;
  FAQ_HEAD_NAME: string;
  FAQ_HEAD_STATUS: number;
  FAQ_MASTER_ID: number;
  FAQ_SEQ_NO: number;
  ID: number;
  ORG_ID: number;
  QUESTION: string;
  READ_ONLY: string;
  SEQ_NO: number;
  STATUS: number;
  TAGS: string;
  TICKET_GROUP_ID: number;
  URL: string;
}

const CreateTicketModal = React.memo(
  ({
    type,
    orderId,
    item,
    onClose,
    body,
    visible,
    onSuccess,
  }: {
    type: string;
    orderId: any;
    item: orderDetails | orderList;
    onClose: () => void;
    body: ticketBody | null;
    visible: boolean;
    onSuccess: () => void;
  }) => {
    const navigation = useNavigation();
    const colors = useTheme();
    const {user, address} = useSelector(state => state.app);
    const [loading, setLoading] = useState<boolean>(false);
    const [showLoaderModal, setShowLoaderModal] = useState<boolean>(false);
    const [faqs, setFaqs] = useState<{
      loading: boolean;
      data: faqInterface[];
    }>({
      loading: false,
      data: [],
    });
    const [activeFaq, setActiveFaq] = useState<number>(0);
    const [ticket, setTicket] = useState({
      message: '',
      attachment: '',
      fileName: '',
      fileType: '',
      show: false,
    });
    useEffect(() => {
      if (visible) {
        getFaqs();
      }
    }, [visible, body]);

    const getFaqs = async () => {
      setFaqs({loading: true, data: []});
      apiCall
        .post(`api/ticketFaqMapping/getTicketFaqMapping`, {
          ORG_ID: body?.ORG_ID,
          TICKET_GROUP_ID: body?.ID,
        })
        .then(res => {
          setFaqs({loading: false, data: res.data.data});
        })
        .catch(err => {
          setFaqs({loading: false, data: []});
          Alert.alert('Error', 'Unable to get FAQs');
        });
    };
    const generateTicketNo = () => {
      const today = new Date();
      const datePart = `${today.getFullYear().toString().slice(-2)}${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const randomPart = Math.floor(1000000000 + Math.random() * 9000000000);
      return `${datePart}${randomPart}`;
    };
    const uploadFile: () => Promise<string> = async () => {
      try {
        let form = new FormData();
        form.append('Image', {
          uri: ticket.attachment,
          type: ticket.fileType,
          name: ticket.fileName,
        });
        return await apiCall
          .post('api/upload/ticket', form, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(res => {
            return ticket.fileName;
          })
          .catch(error => {
            return '';
          });
      } catch (error) {
        return '';
      }
    };
    const createTicket = useCallback(async () => {
      setLoading(true);
      setShowLoaderModal(true);
      let fileName = '';
      if (ticket.message == '') {
        Alert.alert('Error', 'Please enter a message');
        // setLoading(false);
        return;
      }
      if (ticket.attachment) {
        fileName = await uploadFile();
      }
      const payload = {
        URL: fileName,
        TICKET_GROUP_ID: body?.ID,
        TICKET_NO: generateTicketNo(),
        USER_ID: user?.ID,
        SUBJECT: body?.VALUE,
        MOBILE_NO: user?.MOBILE_NO,
        EMAIL_ID: user?.EMAIL,
        CLOUD_ID: 1,
        QUESTION: ticket.message,
        STATUS: 'P',
        CLIENT_ID: 1,
        DEPARTMENT_ID: body?.DEPARTMENT_ID,
        DEPARTMENT_NAME: body?.DEPARTMENT_NAME,
        USER_TYPE: 'C',
        ORG_ID: body?.ORG_ID,
        TERRITORY_ID: address?.TERRITORY_ID,
        ORDER_ID: type == 'S' ? null : item.ORDER_ID,
        JOB_CARD_ID: type == 'S' ? null : item.JOB_CARD_ID,
        SHOP_ORDER_ID: type == 'S' ? orderId : null,
        ...(type !== 'S' && {
          WARRANTY_ALLOWED: item.WARRANTY_ALLOWED,
          WARRANTY_PERIOD: item.WARRANTY_PERIOD,
          GUARANTEE_ALLOWED: item.GUARANTEE_ALLOWED,
          GUARANTEE_PERIOD: item.GUARANTEE_PERIOD,
        }),
      };
      apiCall
        .post(`api/ticket/create`, payload)
        .then(res => {
          const ticketMasterId = res.data?.TICKET_MASTER_ID;
          setLoading(false);
          setShowLoaderModal(false);
          Alert.alert('Success', 'Ticket created successfully', [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                // @ts-ignore
                navigation.popToTop();
              },
            },
          ]);
        })
        .catch(err => {
          setLoading(false);
          setShowLoaderModal(false);
          Alert.alert('Error', 'Unable to create ticket');
        });
    }, [ticket, body, user, item]);
    return (
      <>
        <Modal visible={true} transparent={false} onRequestClose={onClose}>
         <SafeAreaProvider>
           
                    
           <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={{ flex: 1 }}
    >
            <View style={{flex: 1}}>
              <Header
                label={t('order.create.title')}
                onBack={() => onClose()}
              />
              <View style={{flex: 1, backgroundColor: colors.background}}>
                {faqs.loading ? (
                  <View style={styles.loader}>
                    <ActivityIndicator size={'large'} color={colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    removeClippedSubviews={false}
                    data={faqs.data}
                    ListHeaderComponent={() => (
                      <View style={styles.headerContainer}>
                        <Text style={styles.listHeaderText}>
                          {
                            'We found some similar issues that have been reported before. Please check the FAQs below before creating a new ticket.'
                          }
                        </Text>
                      </View>
                    )}
                    keyExtractor={(item, index) => `ticket_${item.ID}_${index}`}
                    contentContainerStyle={styles.listContainer}
                    ItemSeparatorComponent={() => <View style={{height: 12}} />}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl refreshing={false} onRefresh={getFaqs} />
                    }
                    renderItem={({item}) => {
                      return (
                        <View>
                          <TouchableOpacity
                            style={styles.card}
                            onPress={() => {
                              setActiveFaq(activeFaq == item.ID ? 0 : item.ID);
                            }}>
                            <Text style={styles.ticketNumber}>
                              {item.QUESTION}
                            </Text>
                            <Icon
                              name={
                                activeFaq == item.ID
                                  ? 'chevron-down'
                                  : 'chevron-right'
                              }
                              type="MaterialCommunityIcons"
                              size={24}
                              color={colors.text}
                            />
                          </TouchableOpacity>
                          {activeFaq == item.ID && (
                            <View
                              style={[
                                styles.faqContent,
                                {backgroundColor: colors.background},
                              ]}>
                              <Text
                                style={[
                                  styles.faqAnswer,
                                  {color: colors.text,fontFamily: fontFamily},
                                ]}>
                                {item.ANSWER}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    }}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Image source={_noData} style={styles.emptyImage} />
                      </View>
                    }
                  />
                )}
                {ticket.show ? (
                  <View
                    style={[
                      styles.footerContainer,
                      {backgroundColor: colors.white},
                    ]}>
                    <View style={styles.footerContent}>
                      <View
                        style={{
                          flexDirection: 'row',
                          // marginHorizontal:,
                          borderWidth: 1,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          borderRadius: 10,
                          flex: 1,
                        }}>
                        <TextInput
                        maxLength={1000}
                          numberOfLines={3}
                          value={ticket.message}
                          onChangeText={text => {
                            setTicket({...ticket, message: text});
                          }}
                          style={[
                            styles.messageInput,
                            {
                              backgroundColor: colors.background,
                              // borderColor: colors.border,
                              color: colors.text,
                              textAlignVertical: 'top',
                            },
                          ]}
                          placeholder="Type your message..."
                          placeholderTextColor="#666"
                          multiline
                        />
                        <ImagePicker
                          onCapture={res => {
                            setTicket({
                              ...ticket,
                              attachment: res.fileUrl,
                              fileName: res.fileName,
                              fileType: res.fileType,
                            });
                          }}
                          style={
                            [{
                              alignSelf:'flex-end'
                            }
                              // styles.sendButton,
                              // { backgroundColor: colors.primary },
                            ]
                          }>
                          {ticket.attachment ? (
                            <View style={{position: 'relative'}}>
                              <Image
                                source={{uri: ticket.attachment}}
                                style={{
                                  width: 60,
                                  height: 58,
                                  borderRadius: 5,
                                  margin: 10,
                                }}
                              />
                              <TouchableOpacity
                                onPress={() =>
                                  setTicket({...ticket, attachment: ''})
                                }
                                style={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 10,
                                  backgroundColor: colors.primary,
                                  borderRadius: 10,
                                  padding: 2,
                                }}>
                                <Icon
                                  name="close"
                                  type="MaterialCommunityIcons"
                                  size={15}
                                  color={colors.white}
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.sendButton,
                                {backgroundColor: colors.primary},
                              ]}>
                              <Icon
                                name="paperclip"
                                type="MaterialCommunityIcons"
                                size={20}
                                color={colors.white}
                              />
                            </View>
                          )}
                        </ImagePicker>
                      </View>

                      <View style={{flexDirection: 'row', gap: 8}}>
                        <TouchableOpacity
                          onPress={() => createTicket()}
                          style={[
                            styles.sendButton,
                            {backgroundColor: colors.primary},
                          ]}>
                          <Icon
                            name="send"
                            type="MaterialCommunityIcons"
                            size={20}
                            color={colors.white}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.footerContainer,
                      {backgroundColor: colors.white},
                    ]}>
                    <View style={styles.footerContent}>
                      <Icon
                        name="information-circle-outline"
                        type="Ionicons"
                        size={20}
                        color={colors.text}
                        style={styles.infoIcon}
                      />
                      <Text style={[styles.footerText, {color: colors.text,fontFamily: fontFamily}]}>
                        {
                          'If you cannot find the answer to your question, please create a new ticket.'
                        }
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setTicket({...ticket, show: true});
                      }}
                      style={[
                        styles.completeButton,
                        {
                          backgroundColor: colors.primary,
                          shadowColor: colors.primary,
                        },
                      ]}>
                      <Icon
                        name="plus-circle"
                        type="MaterialCommunityIcons"
                        size={20}
                        color={colors.white}
                        style={{marginRight: 8}}
                      />
                      <Text
                        style={[
                          styles.completeButtonText,
                          {color: colors.white,fontFamily: fontFamily},
                        ]}>
                        {'Create Support Ticket'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        
         </SafeAreaProvider>
        </Modal>

        {/* <Modal visible={showLoaderModal} transparent animationType="fade">
          <View style={styles.loaderModal}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 10 }}>Creating Ticket...</Text>
          </View>
        </Modal> */}
      </>
    );
  },
);

const CreateTickets: React.FC<OrderCreateTicketProps> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const {ticketGroup, jobItem, type, orderId} = route.params;
  const [loading, setLoading] = useState<boolean>(false);
  const [ticketHead, setTicketHead] = useState<ticketHead | null>(null);
  const [ticketBody, setTicketBody] = useState<ticketBody[]>([]);
  const [modal, setModal] = useState<{
    show: boolean;
    ticketBody: ticketBody | null;
    ticketHead: ticketHead | null;
  }>({show: false, ticketBody: null, ticketHead: null});

  const getTicketGroup = async () => {
    setLoading(true);
    try {
      apiCall
        .post(`api/ticketGroup/get`, {
          filter: ` AND PARENT_ID = ${ticketGroup} AND TYPE='Q' `,
          sortKey: 'ID',
          sortValue: 'ASC',
        })
        .then(res => {
          if (res.status == 200 && res.data.data) {
            let head = res.data.data[0];
            apiCall
              .post(`api/ticketGroup/get`, {
                filter: ` AND PARENT_ID = ${head.ID} AND TYPE = 'O' AND TICKET_TYPE = 'O' AND STATUS = 1 `,
                sortKey: 'SEQ_NO',
                sortValue: 'ASC',
              })
              .then(res => {
                if (res.status == 200) {
                  let body = res.data.data;
                  setTicketHead(head);
                  setTicketBody(body);
                  setLoading(false);
                } else {
                  setLoading(false);
                }
              })
              .catch(err => {
                setLoading(false);
                throw new Error(err);
              });
          }
        })
        .catch(err => {
          throw new Error(err);
        });
    } catch (error) {
      Alert.alert('Error', 'Unable to get ticket group');
      setLoading(false);
    }
  };
  useEffect(() => {
    getTicketGroup();
  }, []);
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{flex: 1}}>
        <Header
          label={t('order.ticket.title')}
          onBack={() => navigation.goBack()}
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size={'large'} color={colors.primary} />
          </View>
        ) : (
          <FlatList
            removeClippedSubviews={false}
            data={ticketBody}
            ListHeaderComponent={() => (
              <View style={styles.headerContainer}>
                <Text style={styles.listHeaderText}>{ticketHead?.VALUE}</Text>
              </View>
            )}
            keyExtractor={(item, index) => `ticket_${item.ID}_${index}`}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{height: 12}} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={getTicketGroup} />
            }
            renderItem={({item}) => {
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    if (item.IS_LAST) {
                      setModal({
                        show: true,
                        ticketBody: item,
                        ticketHead: ticketHead,
                      });
                    } else {
                      navigation.push('OrderCreateTicket', {
                        ticketGroup: item.ID,
                        jobItem,
                        type,
                        orderId,
                      });
                    }
                  }}>
                  <Text style={styles.ticketNumber}>{item.VALUE}</Text>
                  <Icon
                    name="chevron-right"
                    type="MaterialCommunityIcons"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image source={_noData} style={styles.emptyImage} />
              </View>
            }
          />
        )}
        {modal.show && (
          <CreateTicketModal
            onClose={() =>
              setModal({show: false, ticketBody: null, ticketHead: null})
            }
            type={type}
            orderId={orderId}
            body={modal.ticketBody}
            item={jobItem}
            visible={modal.show}
            onSuccess={() => {
              setModal({show: false, ticketBody: null, ticketHead: null});
              navigation.popToTop();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
export default CreateTickets;

const styles = StyleSheet.create({
  loaderModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  footerContainer: {
    padding: Size.padding,
    // paddingBottom: 16 + Size.padding,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  footerContent: {
    flexDirection: 'row',
    // alignItems: 'flex-start',
    marginBottom: 16,
    // paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily,
    lineHeight: 20,
    color: '#666',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: fontFamily,
    fontWeight: '600',
  },
  faqContent: {
    padding: Size.padding,
    paddingTop: 10 + Size.padding,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    zIndex: -1,
    // marginHorizontal: Size.padding,
    marginTop: -15,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: fontFamily,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerContainer: {
    padding: Size.padding,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  statusTag: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily,
    paddingHorizontal: 12,

    paddingVertical: 4,
    borderRadius: 20,
  },
  messageInputContainer: {
    padding: Size.padding,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    // gap: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    // flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalFooterInput: {
    flex: 1,
  },
  modalFooterButton: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalContent: {
    flex: 1,
    padding: Size.padding,
  },
  modalHeader: {
    padding: Size.padding,
    elevation: 2,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  headerTop: {
    flexDirection: 'row',
    // alignItems: 'center',
    // gap: 12,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C28',
    fontFamily: fontFamily,
  },
  searchInput: {
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  filterText: {
    fontSize: 14,
    fontFamily: fontFamily,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#092B9C',
    fontFamily: fontFamily,
  },
  date: {
    fontSize: 12,
    color: '#666',
    fontFamily: fontFamily,
  },
  cardContent: {
    gap: 12,
  },
  section: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontFamily: fontFamily,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: fontFamily,
  },
  statusBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: fontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 130,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    width: 150,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: '#F5F5F5',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontFamily: fontFamily,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketDetails: {
    padding: Size.padding,
    borderRadius: 12,
    marginBottom: Size.padding,
    elevation: 1,
  },
  detailRow: {
    gap: 4,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: fontFamily,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fontFamily,
    fontWeight: '500',
  },
  chatList: {
    padding: Size.padding,
  },
  emptyChat: {
    marginTop: 8,
    color: '#666666',
    fontSize: 14,
    fontFamily: fontFamily,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontFamily: fontFamily,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily,
  },
  messageTime: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: fontFamily,
  },
  messageInput: {
    flex: 1,
    maxHeight: 75,
    minHeight: 75,
    borderRadius: 20,
    paddingHorizontal: 16,
    // paddingVertical: 8,
    // borderWidth: 1,
    fontFamily: fontFamily,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  actionContainer: {
    padding: Size.padding,
    borderTopWidth: 1,
  },
});
