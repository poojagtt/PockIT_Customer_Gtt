import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
// @ts-ignore
import StarRating from 'react-native-star-rating-widget';
import { Button, Icon } from '../../../components';
import { apiCall, fontFamily, Size, useTheme } from '../../../modules';
import { useSelector } from '../../../context';
import { useTranslation } from 'react-i18next';
import Toast from '../../../components/Toast';

interface Props {
  jobDetails: orderDetails;
  techData: {
    AVERAGE_REVIEW: string;
    CUSTOMER_STATUS: string;
    ID: number;
    JOB_CARD_STATUS: string;
    NAME: string;
    TECHNICIAN_STATUS: string;
    TRACK_STATUS: string;
    job_count: number;
  };
  onSuccess: () => void;
}

const RateUs = ({ jobDetails, techData, onSuccess }: Props) => {
  const { user } = useSelector(state => state.app);
  const colors = useTheme();
  const { t } = useTranslation();
  const [rating, setRating] = useState({
    service: 0,
    technician: 0,
    serviceRemark: '',
    techRemark: '',
  });
  const [loader, setLoader] = useState(false);

  const addFeedback = async () => {
    try {
      setLoader(true);
      const body = {
        ORDER_ID: jobDetails.ORDER_ID,
        CUSTOMER_ID: user?.ID,
        SERVICE_ID: jobDetails.SERVICE_ITEM_ID,
        JOB_CARD_ID: jobDetails.JOB_CARD_ID,
        TECHNICIAN_RATING: rating.technician,
        SERVICE_RATING: rating.service,
        TECHNICIAN_COMMENTS: rating.techRemark,
        SERVICE_COMMENTS: rating.serviceRemark,
        TECHNICIAN_ID: techData.ID,
        TECHNICIAN_NAME: techData.NAME,
        CUSTOMER_NAME: user?.NAME,
        ORDER_NUMBER: jobDetails.ORDER_NUMBER,
      };

      const res = await apiCall.post(
        'api/customertechnicianfeedback/technicianServiceFeedbackByCustomer',
        body,
      );

      if (res.status == 200 && res.data.code == 200) {
        onSuccess();
      }
    } catch (error) {
      console.warn('err..', error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={[styles._card, { gap: Size.md }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ }}>
          <Icon name="star" type="EvilIcons" color='#2A3B8F' size={26} />
        </View>
        <Text style={styles._detailsTitleTxt}>
          {t('jobDetails.feedback.title')}
        </Text>
      </View>

      {/* service rating */}
      <View style={{ gap: 10 }}>
        <Text style={[styles._label]}>
          {t('jobDetails.feedback.description')}
        </Text>
        <StarRating
          rating={rating.service}
          onChange={(e: any) => {
            setRating({ ...rating, service: e });
          }}
          starSize={30}
          enableHalfStar={false}
        />
      </View>
      <TextInput
        multiline
        placeholder={t('jobDetails.feedback.comment')}
        value={rating.serviceRemark}
        onChangeText={txt => {
          setRating({ ...rating, serviceRemark: txt });
        }}
        placeholderTextColor={'#ccc'}
        style={{
          // borderWidth: 1,
          // borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: Size.padding,
          minHeight: 85,
          textAlignVertical: 'top',
          backgroundColor:'#F4F7F9',
          fontFamily:'SF-Pro-Text-Bold',
          fontSize:12
        }}
      />

      {/* technician rating */}
      <View style={{ gap: 10 }}>
        <Text style={[styles._label]}>
          {t('jobDetails.feedback.technicianRating')}
        </Text>
        <StarRating
          rating={rating.technician}
          onChange={(e: any) => {
            setRating({ ...rating, technician: e });
          }}
          starSize={30}
          enableHalfStar={false}
        />
      </View>
      <TextInput
        multiline
        placeholder={t('jobDetails.feedback.comment1')}
        value={rating.techRemark}
        onChangeText={txt => {
          setRating({ ...rating, techRemark: txt });
        }}
        style={{
          // borderWidth: 1,
          // borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: Size.padding,
          minHeight: 85,
          textAlignVertical: 'top',
          backgroundColor:'#F4F7F9',
          fontFamily:'SF-Pro-Text-Bold',
          fontSize:12
        }}
        placeholderTextColor={'#ccc'}
      />
      <Button
      outlined={true}
     
        label="Submit"
        onPress={() => {
          if (rating.service < 1) {
            Toast(
              t('jobDetails.feedback.serviceRating') + ' is required',
            );
            return;
          } else if (rating.technician < 1) {
            Toast(
              t('jobDetails.feedback.technicianRating') + ' is required',
            );
            return;
          } else {
            addFeedback();
          }
        }}
        loading={loader}
      />
    </View>
  );
};

export default RateUs;

const styles = StyleSheet.create({
  _card: {
    marginTop: 5,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  _detailsTitleTxt: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',

  },
  _label: {
    flex: 1,
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 400,
    textAlign: 'left',
    color: '#000',
  },
});