import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  
  RefreshControl,
  Image,
  TextInput as RNTextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useSelector } from '../../context';
import { Icon, Button, TextInput, Header } from '../../components';
import { MenuRoutes } from '../../routes/Menu';
import { apiCall, fontFamily, IMAGE_URL, Size, useTheme } from '../../modules';
import { _noData } from '../../assets';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

interface ManageTicketsProps extends MenuRoutes<'ManageTickets'> { }

const getStatusInfo = (status: string, t: Function) => {
  switch (status.toUpperCase()) {
    case 'P':
      return {
        bg: '#FFF4DE',
        text: '#FFA800',
        label: t('ticketDetails.status.pending'),
      };
      return { bg: '#FFF4DE', text: '#FFA800', label: 'Pending' };
    case 'R':
      return {
        bg: '#E8FFF3',
        text: '#0BB783',
        label: t('ticketDetails.status.resolved'),
      };
    case 'C':
      return {
        bg: '#FFE2E5',
        text: '#F64E60',
        label: t('ticketDetails.status.closed'),
      };
    case 'S':
      return {
        bg: '#E8F0FE',
        text: '#092B9C',
        label: t('ticketDetails.status.assigned'),
      };
    default:
      return {
        bg: '#E8F0FE',
        text: '#092B9C',
        label: t('ticketDetails.status.open'),
      };
  }
};

const TicketDetails = React.memo(
  ({
    visible,
    onClose,
    ticket,
  }: {
    visible: boolean;
    onClose: () => void;
    ticket: Readonly<ticketInterface>;
  }) => {
    const colors = useTheme();
    const { user } = useSelector(state => state.app);
    const [details, setDetails] = useState<ticketDetailsInterface[]>([]);
    const [message, setMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useTranslation();
    useEffect(() => {
      if (ticket) {
        getDetails();
      }
    }, [ticket]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const getDetails = async () => {
      try {
        const res = await apiCall
          .post('api/ticketDetails/get', {
            filter: `AND TICKET_MASTER_ID = ${ticket.ID}`,
            sortKey: 'CREATED_MODIFIED_DATE',
            sortValue: 'asc',
          })
          .then(res => res.data);


        setDetails(res.data);
      } catch (error) {
        console.warn('error', error);
      }
    };
    const sendMessage = useCallback(async () => {
      try {

        if (ticket.STATUS === 'C') {
          await apiCall.put('api/ticket/update', {
            ...ticket,
            KEY: 'SUPPORT_USER',
            STATUS: 'O',
          });


          ticket.STATUS = 'O';
        }
        if (ticket.STATUS === 'R') {
          await apiCall.put('api/ticket/update', {
            ...ticket,
            KEY: 'SUPPORT_USER',
            STATUS: 'O',
          });


          ticket.STATUS = 'O';
        }

        const res = await apiCall
          .post('api/ticketDetails/create', {
            ID: 0,
            SENDER: 'U',
            CLIENT_ID: 1,
            SENDER_ID: user?.ID,
            TICKET_MASTER_ID: ticket.ID,

            DESCRIPTION: message,
            URL: '',
            ORG_ID: 1,
          })
          .then(res => {
            setMessage('');
            getDetails();
          });
      } catch (error) {
        Alert.alert(
          t('common.error'),
          t('ticketDetails.errors.sendMessageError'),
        );
      }
    }, [message, ticket.ID, user?.ID, t]);

    const handleStatusUpdate = async (newStatus: string) => {
      try {
        const response = await apiCall.put('api/ticket/update', {
          ...ticket,
          KEY: "SUPPORT_USER",
          STATUS: newStatus,
        });
        onClose();
      } catch (error) {
        Alert.alert(
          t('common.error'),
          t('ticketDetails.errors.updateStatusError'),
        );
        console.warn('error', error);
      }
    };

    const renderActionButton = () => {
      switch (ticket.STATUS) {
        // case 'S':
        //   return (
        //     <TouchableOpacity
        //       style={[styles.completeButton, { backgroundColor: colors.primary }]}
        //       onPress={() => {
        //         Alert.alert(
        //           t('tickets.resolve.title'),
        //           t('tickets.resolve.message'),
        //           [
        //             { text: t('common.cancel'), style: 'cancel' },
        //             {
        //               text: t('tickets.resolve.confirm'),
        //               onPress: () => handleStatusUpdate('R'),
        //             },
        //           ],
        //         );
        //       }}>
        //       <Icon
        //         name="check"
        //         type="Feather"
        //         size={16}
        //         color={colors.white}
        //       />
        //       <Text style={[styles.completeButtonText, { color: colors.white }]}>
        //         {t('tickets.resolve.button')}
        //       </Text>
        //     </TouchableOpacity>
        //   );
        case 'R':
          return (
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Alert.alert(
                  t('tickets.complete.title'),
                  t('tickets.complete.message'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('tickets.complete.confirm'),
                      onPress: () => handleStatusUpdate('C'),
                    },
                  ],
                );
              }}>
              <Icon
                name="check"
                type="Feather"
                size={16}
                color={colors.white}
              />
              <Text style={[styles.completeButtonText, { color: colors.white }]}>
                {t('tickets.complete.button')}
              </Text>
            </TouchableOpacity>
          );
        default:
          return null;
      }
    };

    return (
   
        <Modal
        
        visible={visible}
        transparent={true}
        onRequestClose={onClose}
        animationType="slide">
       <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }} >
         <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['bottom', 'top','left', 'right']}>
          <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.white,
                borderBottomColor: colors.border,
              },
            ]}>
            <View style={styles.modalHeaderContent}>
              <Icon
                name="keyboard-backspace"
                type="MaterialCommunityIcons"
                size={24}
                color={colors.text}
                onPress={onClose}
              />
              <View>
                <Text style={[styles.modalHeaderText, { color: colors.text }]}>
                  #{ticket.TICKET_NO}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={{ marginLeft: 'auto' }}>
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  type="MaterialCommunityIcons"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {isExpanded && (
              <View
                style={[styles.ticketDetails, { backgroundColor: colors.white }]}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('ticketDetails.subjectLabel')}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {ticket.SUBJECT}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('ticketDetails.questionLabel')}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {ticket.QUESTION}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          <View
            style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <FlatList
              removeClippedSubviews={false}
              data={details}
              renderItem={({ item }) => {
                const isCenter = item.SENDER === 'X';
                const isSelf = item.SENDER === 'U';
                const isOther = item.SENDER === 'S';
                if (!isCenter && !isSelf && !isOther) return null;
                return (
                  <View
                    style={[
                      styles.messageContainer,
                      {
                        justifyContent: isCenter
                          ? 'center'
                          : isSelf
                            ? 'flex-end'
                            : 'flex-start',
                      },
                    ]}>
                    <View
                      style={[
                        styles.messageBubble,
                        {
                          backgroundColor: isCenter
                            ? colors.disable
                            : isSelf
                              ? colors.white
                              : '#F5F5F5',
                          borderTopLeftRadius: isCenter ? 12 : !isSelf ? 0 : 12,
                          borderTopRightRadius: isCenter ? 12 : isSelf ? 0 : 12,
                        },
                      ]}>
                      {isOther && (
                        <Text style={styles.senderName}>
                          {t('ticketDetails.senderName')}
                        </Text>
                      )}
                      {item.URL ? (
                        <>
                          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                            <Image
                              source={{
                                uri: `${IMAGE_URL}ticket/${item.URL}?timestamp=${new Date().getTime()}`,
                               cache: 'default',
                              }}
                              style={{ width: 100, height: 100, borderRadius: 12 }}
                            />
                          </TouchableOpacity>

                          <Modal
                            visible={isModalVisible}
                            transparent={true}
                            onRequestClose={() => setIsModalVisible(false)}
                          >
                            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                              <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
                              >
                                <Icon
                                  name="close"
                                  type="MaterialCommunityIcons"
                                  size={30}
                                  color="#000"
                                />
                              </TouchableOpacity>
                              <Image
                                source={{
                                  uri: `${IMAGE_URL}ticket/${item.URL}?timestamp=${new Date().getTime()}`,
                                 cache: 'default',
                                }}
                                style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                resizeMode="contain"
                              />
                            </View>
                          </Modal>
                        </>
                      ) : null}
                      <Text style={[styles.messageText, { color: colors.text }]}>
                        {item.DESCRIPTION}
                      </Text>
                      {!isCenter && (
                        <Text style={styles.messageTime}>
                          {new Date(item.DATE).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.chatList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon
                    name="chatbubble-outline"
                    type="Ionicons"
                    size={40}
                    color={colors.primary}
                  />
                  <Text style={styles.emptyChat}>
                    {t('chat.messages.empty')}
                  </Text>
                </View>
              }
            />
          </View>

          {/* Input Area */}
          <View
            style={[
              styles.messageInputContainer,
              {
                backgroundColor: colors.white,
                borderTopColor: colors.border,
              },
            ]}>
            <RNTextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('ticketDetails.messagePlaceholder')}
              placeholderTextColor={'#666666'}
              multiline
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                {
                  backgroundColor: colors.primary,
                  opacity: message.trim().length > 0 ? 1 : 0.5,
                },
              ]}
              disabled={message.trim().length === 0}>
              <Icon
                name="send"
                type="MaterialIcons"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          {ticket.STATUS !== 'P' && ticket.STATUS !== 'C' && (
            <View
              style={[
                styles.actionContainer,
                {
                  backgroundColor: colors.white,
                  borderTopColor: colors.border,
                  paddingVertical: 8,
                  alignItems: 'center',
                },
              ]}>
              {renderActionButton()}
            </View>
          )}
          </KeyboardAvoidingView>
        </SafeAreaView>
       </SafeAreaProvider>
      </Modal>
   
    );
  },
);

const ManageTickets: React.FC<ManageTicketsProps> = ({ navigation }) => {
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const { user } = useSelector(state => state.app);
  const [tickets, setTickets] = useState<ticketInterface[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showTicketDetails, setShowTicketDetails] = useState<{
    show: boolean;
    ticket: ticketInterface | null;
  }>({ show: false, ticket: null });
  const [ticketDetails, setTicketDetails] = useState<ticketInterface | null>(
    null,
  );
  const { t } = useTranslation();
  useFocusEffect(
    useCallback(() => {
      manageTickets();
    }, [selectedFilter]),
  );

  useEffect(() => {
    manageTickets();
  }, [selectedFilter, search]);

  const manageTickets = async () => {
    setLoading(true);
    try {
      let filterQuery = ` AND USER_ID = ${user?.ID} AND ORDER_ID IS NULL AND SHOP_ORDER_ID IS NULL`;
      if (selectedFilter) {
        filterQuery += ` AND STATUS = '${selectedFilter}'`;
      }
      if (search.trim().length >= 3) {
        filterQuery += ` AND (TICKET_NO LIKE '%${search}%' OR SUBJECT LIKE '%${search}%' OR QUESTION LIKE '%${search}%')`;
      }
      const response = await apiCall.post('api/ticket/get', {
        filter: filterQuery,
      });

      setTickets(response.data.data || []);
    } catch (error) {
      Alert.alert(
        t('menu.manageTickets.errors.fetchErrorTitle'),
        t('menu.manageTickets.errors.fetchErrorMessage'),
        [{ text: t('splash.ok') }],
      );
    } finally {
      setLoading(false);
    }
  };
  const _filters = [
    { key: '0', label: t('menu.manageTickets.filters.all'), value: '' },
    { key: '1', label: t('menu.manageTickets.filters.pending'), value: 'P' },
    { key: '2', label: t('menu.manageTickets.filters.assigned'), value: 'S' },
    { key: '3', label: t('menu.manageTickets.filters.resolved'), value: 'R' },
    { key: '4', label: t('menu.manageTickets.filters.closed'), value: 'C' },
  ];
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }} >
      <View style={{ flex: 1,paddingVertical:Platform.OS === 'ios' ? Size.containerPadding : 0 }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.white, borderBottomColor: colors.border },
          ]}>
          <Header
            label={t('menu.manageTickets.title')}
            onBack={() => navigation.goBack()}
          />
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}>
            <TextInput
              placeholder={t('menu.manageTickets.searchPlaceholder')}
              value={search}
              onChangeText={text => {
                setSearch(text);
              }}
              leftChild={
                <Icon
                  name="search-outline"
                  type="Ionicons"
                  color={colors.text}
                />
              }
              rightChild={
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setIsDropdownVisible(true)}>
                  <Icon
                    name="filter-outline"
                    type="Ionicons"
                    color={colors.primary}
                    size={20}
                  />
                </TouchableOpacity>
              }
              style={{ ...styles.searchInput, backgroundColor: colors.white }}
            />
          </View>
        </View>

        {/* Tickets List */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size={'large'} color={colors.primary} />
          </View>
        ) : (
          <FlatList
            removeClippedSubviews={false}
            data={tickets}
            keyExtractor={(item, index) => `ticket_${item.ID}_${index}`}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={manageTickets}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => {
              const statusInfo = getStatusInfo(item.STATUS, t);
              return (
                <View
                  style={[
                    styles.card,
                    {
                      borderColor: colors.primary + '15',
                      backgroundColor: colors.white,
                      shadowColor: colors.shadow,
                    },
                  ]}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <Icon
                        name="ticket-outline"
                        type="Ionicons"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        style={[styles.ticketNumber, { color: colors.primary }]}>
                        #{item.TICKET_NO}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.section}>
                      <Text style={styles.label}>
                        {t('menu.manageTickets.card.questionLabel')}
                      </Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {item.QUESTION}
                      </Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.label}>
                        {t('menu.manageTickets.card.subjectLabel')}
                      </Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {item.SUBJECT}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.label}>
                          {t('menu.manageTickets.card.statusLabel')}
                        </Text>
                        <View style={styles.statusContainer}>
                          <Text
                            style={[
                              styles.statusTag,
                              {
                                backgroundColor: statusInfo.bg,
                                color: statusInfo.text,
                                fontFamily: fontFamily
                              },
                            ]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.section]}>
                        <Text style={styles.label}>
                          {t('menu.manageTickets.card.lastRespondedLabel')}
                        </Text>
                        <View style={styles.statusContainer}>
                          <Text
                            style={[
                              styles.statusTag,
                              {
                                backgroundColor: colors.border,
                                color: colors.text,
                                fontFamily: fontFamily
                              },
                            ]}>
                            {moment(item.LAST_RESPONDED).fromNow()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.viewButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onLongPress={() => { }}
                    onPress={() => {
                      setShowTicketDetails({ show: true, ticket: item });
                    }}>
                    <Text
                      style={[styles.viewButtonText, { color: colors.white }]}>
                      {t('menu.manageTickets.card.viewDetailsButton')}
                    </Text>
                    <Icon
                      name="chevron-right"
                      type="Feather"
                      size={18}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image source={_noData} style={styles.emptyImage} />
                <Text style={styles.emptyText}>
                  {t('menu.manageTickets.emptyList')}
                </Text>
              </View>
            }
          />
        )}

        {/* Create Ticket Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary2 }]}
          onPress={() => navigation.push('CreateTickets', { ticketGroup: 0 })}>
          <Icon name="plus" type="Feather" size={20} color={colors.white} />
          <Text style={[styles.createButtonText, { color: colors.white }]}>
            {t('menu.manageTickets.createNewButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        onRequestClose={() => setIsDropdownVisible(false)}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}>
          <View
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: colors.white,
                shadowColor: colors.shadow,
              },
            ]}>
            {_filters.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.dropdownItem,
                  selectedFilter === filter.value && [
                    styles.selectedItem,
                    { backgroundColor: colors.border },
                  ],
                ]}
                onPress={() => {
                  setIsDropdownVisible(false);
                  setSelectedFilter(filter.value);
                }}>
                <Text
                  style={[
                    styles.dropdownText,
                    { color: colors.text },
                    selectedFilter === filter.value && { color: colors.primary },
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showTicketDetails.show && showTicketDetails.ticket && (
        <TicketDetails
          visible={showTicketDetails.show}
          onClose={() => setShowTicketDetails({ show: false, ticket: null })}
          ticket={showTicketDetails.ticket}
        />
      )}
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
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
  },
  modalContainer: {
    flex: 1,
   
  },
  modalFooter: {
    padding: 16,
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
    marginBottom: 16,
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
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: 16,
    color: '#092B9C',
    fontFamily: 'SF-Pro-Text-Bold',
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
    fontSize: Size.md,
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
    fontSize: Size.lg,
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
    fontSize: Size.lg,
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
    fontSize: Size.md,
    color: '#666666',
    fontFamily: fontFamily,
  },
  detailValue: {
    fontSize: Size.md,
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
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    fontFamily: fontFamily,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContainer: {
    padding: Size.padding,
    borderTopWidth: 1,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
});

export default ManageTickets;