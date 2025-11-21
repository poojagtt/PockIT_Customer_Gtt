import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import React, { useEffect, useRef, useState } from 'react';
import { fontFamily, IMAGE_URL, Permissions, Size, useTheme } from '../../../modules';
import { Button, Icon } from '../../../components';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useTranslation } from 'react-i18next';
import database from '@react-native-firebase/database';

import LocationMocking from './LocationMocking';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { _defaultImage, _techMapIcon } from '../../../assets';
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
    PROFILE_PHOTO: any
  };
  onMessageClick: () => void;
}

const Duration = 300;
const TechnicianDetails = ({ jobItem, techData, onMessageClick }: props) => {
  const mmkv = new MMKV();
  const colors = useTheme();
  const mapRef = useRef<MapView | any>(null);
  const [isProfileImageVisible, setIsProfileImageVisible] = useState(false);
  const { t } = useTranslation();
  const [persistedProfilePhoto, setPersistedProfilePhoto] = useState<string | null>(null);
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

  const getPersistKey = () => `job_profile_${jobItem?.JOB_CARD_ID}`;

  useEffect(() => {
    const key = getPersistKey();
    const existing = mmkv.getString(key);
    if (existing) {
      setPersistedProfilePhoto(existing);
      return;
    }
    if (techData?.PROFILE_PHOTO) {
      mmkv.set(key, String(techData.PROFILE_PHOTO));
      setPersistedProfilePhoto(String(techData.PROFILE_PHOTO));
    } else {
      setPersistedProfilePhoto(null);
    }
  }, [techData?.PROFILE_PHOTO, jobItem?.JOB_CARD_ID]);

  // Clear persisted image when job completes to avoid stale storage
  useEffect(() => {
    if (jobItem?.ORDER_STATUS === 'CO') {
      const key = getPersistKey();
      mmkv.delete(key);
      setPersistedProfilePhoto(null);
    }
  }, [jobItem?.ORDER_STATUS]);

  const getTechnicianImageSource = () => {
    const filename = persistedProfilePhoto || techData?.PROFILE_PHOTO;
    if (filename) {
      return { uri: IMAGE_URL + 'TechnicianProfile/' + filename, cache: 'default' as const };
    }
    return _techMapIcon;
  };

  const getCurrentLocation = async () => {
    try {
      const Permission = await Permissions.checkLocation();
      if (!Permission) {
        await Permissions.requestLocation();
      } else {
        Geolocation.getCurrentPosition(
          async location => {
            let { latitude, longitude } = location.coords;
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
  console.log("techData", techData)
// Calculates distance between 2 lat/long in KM
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in KM
};

const calculateETA = (distanceKm) => {
  const avgSpeed = 30; // km/hr
  const hours = distanceKm / avgSpeed;
  
  const minutes = Math.round(hours * 60);
  return minutes;
};
  const [currentCoords, setCurrentCoords] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);
const [etaMinutes, setEtaMinutes] = useState<string | null>(null);
const formatETA = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hrs} hr`;
  }

  return `${hrs} hr ${mins} min`;
};

  useEffect(() => {
  const locationRef = database().ref(`Jobs/${jobItem.JOB_CARD_ID}/location`);

  const onValueChange = locationRef.on('value', snapshot => {
    const loc = snapshot.val();
    if (!loc) return;

    const techLat = loc.latitude;
    const techLng = loc.longitude;

    const custLat = jobItem.LATITUDE;
    const custLng = jobItem.LONGITUDE;

    setCurrentCoords({ latitude: techLat, longitude: techLng });

    const distanceKm = getDistanceKm(techLat, techLng, custLat, custLng);
    const etaMinutes = calculateETA(distanceKm);
    setEtaMinutes(formatETA(etaMinutes));
    console.log("Distance from customer:", distanceKm.toFixed(2), "KM");
    console.log("Estimated arrival time:", etaMinutes, "minutes");
  });

  return () => locationRef.off('value', onValueChange);
}, [jobItem]);

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
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {/* <Icon
            name="engineering"
            type="MaterialIcons"
            color="#2A3B8F"
            size={25}
          /> */}
          <TouchableOpacity style={{ height: 40, width: 40 }} onPress={() => {
            setIsProfileImageVisible(true)
          }}>
            <Image
              source={getTechnicianImageSource()}
              resizeMode="contain"
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                borderRadius: 20
              }}
            />
          </TouchableOpacity>
          <Text style={[styles._value]}>{techData?.NAME}</Text>



          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 4, }}>
              <Icon name="star" type="EvilIcons" color='#636363' style={{ top: 4 }} />
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
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Icon name="handbag" type="SimpleLineIcons" size={14} color='#636363' style={{ top: 4 }} />
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
        <View style={{ height: Size.sm }} />
        {techData.TRACK_STATUS == 'ST' && (
          <>{etaMinutes !== null && (
  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.secondary ,marginBottom: 12}}>
    Technician will reach in approx {etaMinutes}
  </Text>
)}
          <LocationMocking jobItem={jobItem} />
          </>
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
        {techData.ID && jobItem.ORDER_STATUS != "CO" && (
          <Button
            label={t('technicianDetails.sendMessage')}
            onPress={() => onMessageClick()}
          />
        )}
        {/* {techData.ID && (
          <Text style={[styles._note]}>{t('technicianDetails.technicianNote')}</Text>
        )} */}
      </View>

      <Modal
        visible={isProfileImageVisible}
        transparent={true}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={() => setIsProfileImageVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsProfileImageVisible(false)}
            style={{ position: 'absolute', top: 40, right: 20, padding: 10 }}>
            <Icon name="close" type="AntDesign" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Image
            source={getTechnicianImageSource()}
            resizeMode="contain"
            style={{ width: '90%', height: '80%' }}
          />
        </View>
      </Modal>



      
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