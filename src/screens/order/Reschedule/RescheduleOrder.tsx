import {
  View,
  Text,
 
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, {useEffect, useState} from 'react';
import {Button, Icon, Header, Loader} from '../../../components';
import {apiCall, fontFamily, Size, useTheme} from '../../../modules';
import {Checkbox} from 'react-native-paper';
import {useSelector} from '../../../context';
import {OrderRoutes} from '../../../routes/Order';
import {useTranslation} from 'react-i18next';
import Toast from '../../../components/Toast';

interface OrderRescheduleProps extends OrderRoutes<'RescheduleOrder'> {}

const RescheduleOrder: React.FC<OrderRescheduleProps> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const {services} = route.params;
  const {user} = useSelector(state => state.app);
  const [selectedReasons, setSelectedReasons] = useState<any>([]);
  const [loader, setLoader] = useState(false);
  const [comment, setComment] = useState('');
  const [reasonsData, setReasonsData] = useState<CancelReason[]>([]);

  const toggleReason = (item: CancelReason) => {
    const alreadySelected = selectedReasons.some(
      (reason: CancelReason) => reason.ID === item.ID,
    );

    if (alreadySelected) {
      setSelectedReasons(
        selectedReasons.filter((reason: CancelReason) => reason.ID !== item.ID),
      );
    } else {
      setSelectedReasons([...selectedReasons, item]);
    }
  };

  useEffect(() => {
    getRescheduleReason();
  }, []);

  const getRescheduleReason = async () => {
    setLoader(true);

    try {
      const res = await apiCall.post('api/cancleOrderReason/get', {
        filter: ` AND IS_ACTIVE = 1 AND TYPE = 'OR' AND REASON_FOR='S'`,
        sortKey:'ID',
        sortValue:'asc'
      });

      if (res.status === 200 && res.data.code === 200) {
        setReasonsData(res.data.data);
      }
    } catch (error) {
      console.warn('Error fetching reasons:', error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <Header
        label={t('rescheduleOrder.title')}
        onBack={() => navigation.goBack()}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: Size.containerPadding,
        }}>
        <View style={{flex: 1}}>
          <Text style={styles.subHeaderText}>
            {t('rescheduleOrder.selectReason')}
          </Text>

          <View style={styles.reasonsContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {loader ? (
                <ActivityIndicator
                  size="small"
                  color="#2A3B8F"
                  style={{marginTop: 20}}
                />
              ) : (
                <View style={{flex: 1}}>
                  {reasonsData.map(item => {
                    const isChecked = selectedReasons.some(
                      (selected: CancelReason) => selected.ID === item.ID,
                    );
                    return (
                      <TouchableOpacity
                        key={item.ID}
                        style={styles.reasonItem}
                        onPress={() => toggleReason(item)}>
                                                 <View  style={{borderWidth:Platform.OS=='ios'? 1:0, borderColor:Platform.OS=='ios'? '#B0B0B0':'transparent', borderRadius:Platform.OS=='ios'? 4:0, marginRight: Platform.OS=='ios'?12:0}}>
                          
                        <Checkbox
                          status={isChecked ? 'checked' : 'unchecked'}
                          onPress={() => toggleReason(item)}
                          color="#2A3B8F"
                          uncheckedColor="#757575"
                        />
                        </View>
                        <View style={styles.textContainer}>
                          <Text
                            style={styles.text}
                            numberOfLines={2}
                            ellipsizeMode="tail">
                            {item.REASON}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={{marginTop: Size.paddingY}} />
            </ScrollView>

            <View>
              <TextInput
                multiline
                placeholder={t('rescheduleOrder.input.placeholder')}
                placeholderTextColor={'#60A5FA'}
                value={comment}
                onChangeText={setComment}
                style={styles.commentInput}
                maxLength={256}
              />
              {comment.length > 0 && (
                <Text style={styles.characterCount}>{comment.length}/256</Text>
              )}
            </View>
          </View>
        </View>
        <Button
          style={{backgroundColor: colors.buttonbackground, borderRadius: 8}}
          label={t('rescheduleOrder.buttons.next')}
          onPress={() => {
            if (selectedReasons.length === 0) {
              Toast(
                t('rescheduleOrder.alerts.noReason'),
              );
            } else {
              navigation.navigate('SelectDateTime', {
                services: services,
                selectedReasons: selectedReasons,
                comment: comment,
              });
            }
          }}
        />
      </View>
      {/* <Loader show={loader} /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerText: {
     fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
    marginTop: Size.containerPadding,
  },
  subHeaderText: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 30,
    textAlign: 'left',
    marginTop: Size.containerPadding,
    color: '#0E0E0E',
  },
  reasonsContainer: {
    marginTop: Size.lg,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#E7E6E6',
    borderRadius: 8,
    paddingVertical: Size.radius,
    paddingBottom: 30,
    maxHeight: '80%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  reasonsTitle: {
     fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: '#3E3E3E',
    marginBottom: Size.radius,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  reasonText: {
    fontSize: 13,
     fontFamily: fontFamily,
    fontWeight: 400,
    color: 'black',
  },
  commentInput: {
    fontFamily:fontFamily,
    borderRadius: 6,
    backgroundColor: '#F4F7F9',
    paddingHorizontal: Size.padding,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
   fontFamily: fontFamily,
    fontWeight: '400',
    color: 'black',
    lineHeight: 18,
    includeFontPadding: false,
    paddingVertical: 2,
  },
  characterCount: {
    fontSize: 12,
   fontFamily: fontFamily,
    color: '#757575',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});

export default RescheduleOrder;
