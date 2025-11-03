import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {apiCall, fontFamily, IMAGE_URL} from '../../modules';
import {Button, Icon, MathJax} from '../../components';
import {_noProfile} from '../../assets';
import {useSelector} from '../../context';
import {formatPeriod} from '../../Functions';
import ImageView from 'react-native-image-viewing';
import Toast from '../../components/Toast';
import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';

interface ServiceInfoModalProps {
  service: ServicesInterface;
  navigation?:any;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  onQuantityChange?: (qty: number) => void;
}

const ServiceInfoModal: React.FC<ServiceInfoModalProps> = ({
  navigation,
  service,
  onClose,
  onConfirm,
}) => {
  console.log("navigation in service modal",navigation)
  const {address, allAddress, territory} = useSelector(state => state.app);
  const [details, setDetails] = useState<boolean>(false);
  const {user} = useSelector(state => state.app);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [openModal, setOpenModal] = useState({
    imageView: false,
  });

  const timeFormat = (h: number, m: number) =>
    useMemo(() => {
      let hours = h;
      let minutes = ('00' + m).slice(-2);
      return `${hours} hr ${minutes} min`;
    }, [service]);

  const {t} = useTranslation();
  const convertToMinutes = (hours: number, minutes: number): number => {
    return hours * 60 + minutes;
  };
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );
  const getTotalPrice = useMemo(() => {
    if (service.TOTAL_PRICE) {
      return Number(service.TOTAL_PRICE);
    } else {
      let qty = Number(service.QUANTITY ? service.QUANTITY : 1);
      return service.PRICE * qty;
    }
  }, [service]);
  return (
    //    <Modal style={{maxHeight:200}}  visible={true} onRequestClose={() => onClose()} transparent>
    // <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)'}}>
    //     {/* Overlay to close */}
    //     <Text
    //       onPress={() => onClose()}
    //       style={{
    //         backgroundColor: 'rgba(0,0,0,.3)',
    //         flex: 1,
    //         position: 'absolute',
    //         top: 0,
    //         left: 0,
    //         right: 0,
    //         bottom: 0,
    //         zIndex: -1,
    //       }}
    //     />

    //     {/* Wrapper to float the close button above modal */}
    //     <View style={{ position: 'relative' }}>
    //       {/* Floating Close Button */}
    //       <TouchableOpacity style={styles.floatingCloseButton} onPress={onClose}>
    //         <Icon name="close" type="MaterialIcons" size={24} color="#333" />
    //       </TouchableOpacity>

    //       {/* Main Modal Container */}
    //       <View style={styles.container}>
    //         <Text style={styles.title} numberOfLines={2}>
    //           {service?.SERVICE_NAME}
    //         </Text>

    //         <ScrollView
    //           showsVerticalScrollIndicator={false}
    //           contentContainerStyle={styles.scrollContent}>
    //           <View style={styles.detailsContainer}>
    //             {user?.CUSTOMER_TYPE == 'I' && (
    //               <View style={styles.row}>
    //                 <Text style={styles.label}>
    //                   {t('home.ServiceInfoModal.baseprice')}
    //                 </Text>
    //                 <Text style={styles.value}>₹ {getTotalPrice}</Text>
    //               </View>
    //             )}

    //             <View style={styles.row}>
    //               <Text style={styles.label}>
    //                 {user?.CUSTOMER_TYPE == 'B'
    //                   ? t('serviceTiles.sla')
    //                   : t('home.ServiceInfoModal.Estimatedtime')}
    //               </Text>
    //               <Text style={styles.value}>
    //                 {`${convertToMinutes(service.DURARTION_HOUR, service.DURARTION_MIN)} Min`}
    //               </Text>
    //             </View>

    //             {/* {service.WARRANTY_ALLOWED == 1 && (
    //               <View style={styles.row}>
    //                 <Text style={styles.label}>
    //                   {t('home.ServiceInfoModal.warranty')}
    //                 </Text>
    //                 <Text style={styles.value}>
    //                   {formatPeriod(service.WARRANTY_PERIOD)}
    //                 </Text>
    //               </View>
    //             )} */}

    //             {service.GUARANTEE_ALLOWED == 1 && (
    //               <View style={styles.row}>
    //                 <Text style={styles.label}>
    //                   {t('home.ServiceInfoModal.guarantee')}
    //                 </Text>
    //                 <Text style={styles.value}>
    //                   {formatPeriod(service.GUARANTEE_PERIOD)}
    //                 </Text>
    //               </View>
    //             )}

    //             {Number(service?.SERVICE_RATING) !== 0 &&  <View style={styles.row}>
    //               <Text style={styles.label}>
    //                 {t('home.ServiceInfoModal.rating')}
    //               </Text>
    //               <View style={{ flexDirection: 'row', gap: 2 ,alignItems:'center'}}>
    //                 {Number(service?.SERVICE_RATING) !== 0 && (
    //                   <View style={{ marginTop: 4 }}>
    //                     <Icon name="star" type="EvilIcons" color="#F36631" />
    //                   </View>
    //                 )}
    //                 <Text style={[styles.value,{marginTop:3}]}>
    //                   {Number(service?.SERVICE_RATING) === 0
    //                     ? 'No rating yet'
    //                     : service?.SERVICE_RATING}
    //                 </Text>
    //                 {Number(service?.SERVICE_RATING) > 0 && (
    //                   <TouchableOpacity
    //                     onPress={() => {
    //                       setSelectedServiceId(service?.SERVICE_ID);
    //                       setReviewModalVisible(true);
    //                     }}>
    //                     <Text style={styles.reviewLink}>
    //                       {t('home.ServiceInfoModal.viewreview')}
    //                     </Text>
    //                   </TouchableOpacity>
    //                 )}
    //               </View>
    //             </View>}

    //             <View style={styles.quantitySection}>
    //               <Text style={styles.label}>
    //                 {t('home.ServiceInfoModal.selectquantity')}
    //               </Text>
    //               <View style={styles.quantityControls}>
    //                 <TouchableOpacity
    //                   style={styles.quantityButton}
    //                   onPress={() => {
    //                     if (selectedQuantity <= 1) {
    //                       Toast(t('home.ServiceInfoModal.minimumQuantity'));
    //                     } else {
    //                       setSelectedQuantity(selectedQuantity - 1);
    //                     }
    //                   }}>
    //                   <Icon
    //                     name="remove"
    //                     type="MaterialIcons"
    //                     size={23}
    //                     color={selectedQuantity <= 1 ? '#999' : '#333'}
    //                   />
    //                 </TouchableOpacity>
    //                 <Text style={styles.quantityValue}>{selectedQuantity}</Text>
    //                 <TouchableOpacity
    //                   style={styles.quantityButton}
    //                   onPress={() => {
    //                     if (service.MAX_QTY && service.MAX_QTY > selectedQuantity) {
    //                       setSelectedQuantity(selectedQuantity + 1);
    //                     } else {
    //                       Toast(
    //                         t('home.ServiceInfoModal.maxQuantity', {
    //                           maxQuantity: service.MAX_QTY,
    //                         }),
    //                       );
    //                     }
    //                   }}>
    //                   <Icon
    //                     name="add"
    //                     type="MaterialIcons"
    //                     size={23}
    //                     color="black"
    //                   />
    //                 </TouchableOpacity>
    //               </View>
    //             </View>

    //             <Pressable
    //               style={styles.linkRow}
    //               onPress={() => setDetails(!details)}>
    //               <View style={styles.linkIconContainer}>
    //                 <Icon
    //                   name="info"
    //                   type="MaterialIcons"
    //                   size={20}
    //                   color="#4169E1"
    //                 />
    //               </View>
    //               <Text style={styles.linkText}>
    //                 {t('home.ServiceinfoModal.howpockitworks')}
    //               </Text>
    //               <Icon
    //                 name={details ? 'chevron-down' : 'chevron-right'}
    //                 type="Entypo"
    //                 size={24}
    //                 color="#999"
    //               />
    //             </Pressable>

    //             {details && <MathJax text={service?.SERVICE_DESCRIPTION || ''} />}
    //             {details && service.SERVICE_DETAILS_IMAGE && (
    //               <TouchableOpacity
    //                 activeOpacity={0.8}
    //                 style={{ width: '100%' }}
    //                 onPress={() => {
    //                   setOpenModal({ ...openModal, imageView: true });
    //                 }}>
    //                 <Image
    //                   source={{
    //                     uri:
    //                       IMAGE_URL +
    //                       'ServiceDetailsImage/' +
    //                       service.SERVICE_DETAILS_IMAGE,
    //                   }}
    //                   style={{ width: '100%', aspectRatio: 1 }}
    //                   resizeMode="contain"
    //                 />
    //               </TouchableOpacity>
    //             )}
    //           </View>
    //         </ScrollView>

    //         <View style={styles.footer}>
    //           <Button
    //             label="Confirm"
    //             onPress={()=>onConfirm(selectedQuantity)}
    //             style={styles.confirmButton}
    //           />
    //         </View>
    //       </View>
    //     </View>
    //   </View>

    //   {isReviewModalVisible && selectedServiceId && (
    //     <ReviewModal
    //       serviceId={selectedServiceId}
    //       onClose={() => setReviewModalVisible(false)}
    //     />
    //   )}
    //   {openModal.imageView && (
    //     <ImageView
    //       images={[
    //         {
    //           uri:
    //             IMAGE_URL +
    //             'ServiceDetailsImage/' +
    //             service.SERVICE_DETAILS_IMAGE,
    //         },
    //       ]}
    //       imageIndex={0}
    //       visible={openModal.imageView}
    //       onRequestClose={() => {
    //         setOpenModal({ ...openModal, imageView: false });
    //       }}
    //     />
    //   )}
    // </Modal>

    <BottomModalWithCloseButton onClose={onClose} visible={true} show={true}>
      <View style={{maxHeight: '95%'}}>
        <Text style={styles.title} numberOfLines={2}>
          {service?.SERVICE_NAME}
        </Text>

        <View style={{}}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.detailsContainer}>
              {user?.CUSTOMER_TYPE === 'I' && (
                <View style={styles.row}>
                  <Text style={styles.label}>
                    {t('home.ServiceInfoModal.baseprice')}
                  </Text>
                  <Text style={styles.value}>
                    ₹ {getTotalPrice.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.row}>
                <Text style={styles.label}>
                  {user?.CUSTOMER_TYPE === 'B'
                    ? t('serviceTiles.sla')
                    : t('home.ServiceInfoModal.Estimatedtime')}
                </Text>
                <Text style={styles.value}>
                  {`${convertToMinutes(
                    service.DURARTION_HOUR,
                    service.DURARTION_MIN,
                  )} Min`}
                </Text>
              </View>

              {service.GUARANTEE_ALLOWED == 1 && (
                <View style={styles.row}>
                  <Text style={styles.label}>
                    {t('home.ServiceInfoModal.guarantee')}
                  </Text>
                  <Text style={styles.value}>
                    {formatPeriod(service.GUARANTEE_PERIOD)}
                  </Text>
                </View>
              )}

              {Number(service?.SERVICE_RATING) !== 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>
                    {t('home.ServiceInfoModal.rating')}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 2,
                      alignItems: 'center',
                    }}>
                    <View style={{marginTop: 4}}>
                      <Icon name="star" type="EvilIcons" color="#F36631" />
                    </View>
                    <Text style={[styles.value, {marginTop: 3}]}>
                      {Number(service?.SERVICE_RATING) === 0
                        ? 'No rating yet'
                        : service?.SERVICE_RATING}
                    </Text>
                    {Number(service?.SERVICE_RATING) > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedServiceId(service?.SERVICE_ID);
                          setReviewModalVisible(true);
                        }}>
                        <Text style={styles.reviewLink}>
                          {t('home.ServiceInfoModal.viewreview')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.quantitySection}>
                <Text style={styles.label}>
                  {t('home.ServiceInfoModal.selectquantity')}
                </Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      if (address?.TERRITORY_ID) {
                        if (selectedQuantity <= 1) {
                          Toast(t('home.ServiceInfoModal.minimumQuantity'));
                        } else {
                          setSelectedQuantity(selectedQuantity - 1);
                        }
                      } else {
                        Alert.alert(
                          t('serviceList.territoryNotServiced'),
                          t('serviceList.territoryNotServicedMessage', {
                            defaultValue:
                              'We currently do not provide services in your selected territory. Please update your delivery address to a location where our services are available.',
                          }),
                          [
                            {
                              text: t('common.ok'),
                              onPress: () => {},
                            },
                          ],
                          {
                            cancelable: true,
                          },
                        );
                      }
                    }}>
                    <Icon
                      name="remove"
                      type="MaterialIcons"
                      size={23}
                      color={selectedQuantity <= 1 ? '#999' : '#333'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{selectedQuantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      if (address?.TERRITORY_ID) {
                        if (
                          service.MAX_QTY &&
                          service.MAX_QTY > selectedQuantity
                        ) {
                          setSelectedQuantity(selectedQuantity + 1);
                        } else {
                          Toast(
                            t('home.ServiceInfoModal.maxQuantity', {
                              maxQuantity: service.MAX_QTY,
                            }),
                          );
                        }
                      } else {
                        Alert.alert(
                          t('serviceList.territoryNotServiced'),
                          t('serviceList.territoryNotServicedMessage', {
                            defaultValue:
                              'We currently do not provide services in your selected territory. Please update your delivery address to a location where our services are available.',
                          }),
                          [
                            {
                              text: t('common.ok'),
                              onPress: () => {},
                            },
                          ],
                          {
                            cancelable: true,
                          },
                        );
                      }
                    }}>
                    <Icon
                      name="add"
                      type="MaterialIcons"
                      size={23}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Pressable
                style={styles.linkRow}
                onPress={() => setDetails(!details)}>
                <View style={styles.linkIconContainer}>
                  <Icon
                    name="info"
                    type="MaterialIcons"
                    size={20}
                    color="#4169E1"
                  />
                </View>
                <Text style={styles.linkText}>
                  {t('home.ServiceinfoModal.howpockitworks')}
                </Text>
                <Icon
                  name={details ? 'chevron-down' : 'chevron-right'}
                  type="Entypo"
                  size={24}
                  color="#999"
                />
              </Pressable>

              {details && <MathJax text={service?.SERVICE_DESCRIPTION || ''} />}
              {details && service.SERVICE_DETAILS_IMAGE && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{width: '100%'}}
                  onPress={() => {
                    setOpenModal({...openModal, imageView: true});
                  }}>
                  <Image
                    source={{
                      uri:
                        IMAGE_URL +
                        'ServiceDetailsImage/' +
                        service.SERVICE_DETAILS_IMAGE,
                    }}
                    style={{width: '100%', aspectRatio: 1}}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
            </View>
             {/* Footer always visible */}
        <View style={{marginVertical: 10}}>
          <Button
            label="Confirm"
            onPress={() => {
              if(!address)
              {

                navigation.navigate('AddressBook', {
                  cartId: { id: null, type: null },
                })
              }
             else if (address?.TERRITORY_ID) {
                onConfirm(selectedQuantity);
              } else {
                 Alert.alert(
                          t('serviceList.territoryNotServiced'),
                          t('serviceList.territoryNotServicedMessage', {
                            defaultValue:
                              'We currently do not provide services in your selected territory. Please update your delivery address to a location where our services are available.',
                          }),
                          [
                            {
                              text: t('common.ok'),
                              onPress: () => {},
                            },
                          ],
                          {
                            cancelable: true,
                          },
                        );
              }
            }}
            style={styles.confirmButton}
          />
        </View>
          </ScrollView>
        </View>

       
      </View>
      {isReviewModalVisible && selectedServiceId && (
        <ReviewModal
          serviceId={selectedServiceId}
          onClose={() => setReviewModalVisible(false)}
        />
      )}
      {openModal.imageView && (
        <ImageView
          images={[
            {
              uri:
                IMAGE_URL +
                'ServiceDetailsImage/' +
                service.SERVICE_DETAILS_IMAGE,
            },
          ]}
          imageIndex={0}
          visible={openModal.imageView}
          onRequestClose={() => {
            setOpenModal({...openModal, imageView: false});
          }}
        />
      )}
    </BottomModalWithCloseButton>
  );
};

interface ReviewModalProps {
  serviceId: number;
  onClose: () => void;
}

interface Review {
  RATING: number;
  COMMENTS: string;
  CUSTOMER_NAME: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({serviceId, onClose}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await apiCall.post('/customerServiceFeedback/get', {
          filter: ' AND SERVICE_ID =' + serviceId,
        });

        if (response.data.code === 200) {
          setReviews(response.data.data);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.warn('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchReviews();
    }
  }, [serviceId]);

  return (
    <Modal visible={true} onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.reviewContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" type="MaterialIcons" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.reviewTitle}>Customer Reviews</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#F36631" />
          ) : reviews.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {reviews.map((review: any, index: number) => (
                <View
                  key={index}
                  style={[styles.reviewItem, {flexDirection: 'row'}]}>
                  <View style={styles.profileContainer}>
                    <Image
                      source={
                        review.PROFILE_PHOTO
                          ? {
                              uri:
                                IMAGE_URL +
                                'CustomerProfile/' +
                                review.PROFILE_PHOTO,
                              cache: 'default',
                            }
                          : require('../../assets/images/no-profile.png')
                      }
                      style={styles.profileImage}
                    />
                  </View>
                  <View>
                    <Text style={styles.reviewUser}>
                      {review.CUSTOMER_NAME}
                    </Text>

                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Icon
                        name="star"
                        type="MaterialIcons"
                        size={16}
                        color="#F36631"
                      />
                      <Text style={styles.reviewRating}>{review.RATING}</Text>
                    </View>
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.COMMENTS}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noReviews}>No reviews available</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 16,
    maxHeight: '100%', // So it doesn't take full screen/ so it appears like a sheet and scrolls
  },
  scrollContent: {
    // paddingBottom: 80, // Space for footer
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily,
    fontWeight: '600',
    color: 'black',
    // marginTop: 24,
    paddingBottom: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailsContainer: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily,
    color: '#636363',
    fontWeight: '400',
  },
  value: {
    fontSize: 14,
    fontFamily: fontFamily,
    color: 'black',
    fontWeight: '400',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 4,
  },
  reviewLink: {
    fontSize: 15,
    fontWeight: 400,
    color: '#3170DE',
    marginLeft: 4,
    fontFamily: fontFamily,
    top: 2,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    padding: 3,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  floatingCloseButton: {
    position: 'absolute',
    top: -50, // position above the modal
    left: '50%',
    marginLeft: -20, // center horizontally (adjust if needed)
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },

  quantityValue: {
    fontSize: 16,
    fontFamily: fontFamily,
    color: '#333333',
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily,
    color: '#333333',
    fontWeight: '400',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  confirmButton: {
    backgroundColor: '#3170DE',
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reviewContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '60%',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },

  reviewTitle: {
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    // textAlign: 'center',
  },
  reviewItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#F4F7F9',
    borderRadius: 10,
  },
  reviewUser: {
    fontFamily: fontFamily,
    fontWeight: '500',
    fontSize: 16,
    color: 'black',
  },
  reviewRating: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '500',
    color: '#F36631',
    fontFamily:fontFamily
  },
  reviewComment: {
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: 'black',
    marginTop: 5,
  },
  noReviews: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
    fontFamily: fontFamily,
  },
});

export default ServiceInfoModal;
