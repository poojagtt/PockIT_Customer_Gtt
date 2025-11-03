import {View, Text, StyleSheet} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {fontFamily, Permissions, Size, useTheme} from '../../../modules';
import {Button, Icon} from '../../../components';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {useTranslation} from 'react-i18next';
import LocationMocking from './LocationMocking';
import Animated, {LinearTransition} from 'react-native-reanimated';

interface props {
  jobItem: orderDetails;
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
  onMessageClick: () => void;
}

const Duration = 300;
const TechnicianDetails = ({jobItem, techData, onMessageClick}: props) => {
  const colors = useTheme();
  const mapRef = useRef<MapView | any>();
  const {t} = useTranslation();
  const [region, setRegion] = useState({
    latitude: 16.8524,
    longitude: 74.5815,
    latitudeDelta: 2.5,
    longitudeDelta: 2.5,
    loading: true,
  });
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const Permission = await Permissions.checkLocation();
      if (!Permission) {
        await Permissions.requestLocation();
      } else {
        Geolocation.getCurrentPosition(
          async location => {
            let {latitude, longitude} = location.coords;
            setRegion({
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: 2.5,
              longitudeDelta: 2.5,
              loading: false,
            });
          },
          err => {
            console.warn('location ', err);
            {
              timeout: 2000;
            }
            getCurrentLocation();
          },
        );
      }
    } catch (error) {
      console.warn('error....', error);
    }
  };
  return (
    <Animated.View
      layout={LinearTransition.stiffness(45).duration(Duration)}
      style={styles._card}>
      {/* <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Icon
          name="dot-fill"
          type="Octicons"
          size={20}
          color={colors.primary}
        />
        <Text style={styles._detailsTitleTxt}>
          {t('jobDetails.technicianDetails')}
        </Text>
      </View> */}
      <View>
        <View style={{flexDirection: 'row', gap: 8}}>
          <Icon
            name="engineering"
            type="MaterialIcons"
            color="#2A3B8F"
            size={25}
          />
          <Text style={[styles._value]}>{techData?.NAME}</Text>
          


          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 4, }}>
              <Icon name="star" type="EvilIcons" color='#636363' style={{top:4}} />
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 400,
                  // lineHeight: 20,
                  color: '#636363',
                }}>
                {techData?.AVERAGE_REVIEW ?? 0}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4}}>
              <Icon name="handbag" type="SimpleLineIcons" size={14} color='#636363' style={{top:4}} />
              <Text
                style={{
                fontFamily: fontFamily,
                  fontSize: 14,
                  fontWeight: 400,
                  // lineHeight: 20,
                  color: '#636363',
                }}>
                {techData?.job_count ?? 0}
              </Text>
            </View>
          </View>
        </View>
        <View style={{height: Size.sm}} />
        {techData.TRACK_STATUS == 'ST' && (
          <LocationMocking jobItem={jobItem} />
          // <MapView
          //   ref={mapRef}
          //   style={{height: 250, width: '100%', borderRadius: Size.radius}}
          //   initialRegion={region}>
          //   <Marker
          //     coordinate={{
          //       latitude: region.latitude,
          //       longitude: region.longitude,
          //     }}
          //   />
          // </MapView>
        )}
        <View />
        {techData.ID && jobItem.ORDER_STATUS != "CO" &&(
          <Button
            label={t('technicianDetails.sendMessage')}
            onPress={() => onMessageClick()}
          />
        )}
        {/* {techData.ID && (
          <Text style={[styles._note]}>{t('technicianDetails.technicianNote')}</Text>
        )} */}
      </View>
    </Animated.View>
  );
};

export default TechnicianDetails;

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
    shadowOffset: {width: 0, height: 2},
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
    fontSize: 14,
    fontWeight: 400,
    textAlign: 'left',
    color: '#636363',
  },
  _value: {
    flex: 2,
   fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: 'black',
  },
  _messageContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#9975F7',
    padding: Size.paddingY,
    borderRadius: 8,
    marginTop: Size.sm,
    alignItems: 'center',
    paddingHorizontal: Size.radius,
    gap: 10,
  },
  _messageTxt: {
     fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: '#333333',
    marginBottom: 2,
  },
  _note: {
     fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: 500,
    color: '#999999',
    lineHeight: 14.32,
    marginTop: Size.sm,
  },
});