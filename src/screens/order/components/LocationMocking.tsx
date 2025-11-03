import React, {useState, useRef, useEffect} from 'react';
import {View, StyleSheet, Platform, Image} from 'react-native';
import MapView, {Marker, AnimatedRegion, Polyline} from 'react-native-maps';
import database from '@react-native-firebase/database';
import {apiCall, MAP_API, Permissions, Size, useTheme} from '../../../modules';
import Geolocation from 'react-native-geolocation-service';
import {MapViewRoute} from 'react-native-maps-routes';
import {_techMapIcon} from '../../../assets';
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = 0.0421;

interface props {
  jobItem: orderDetails;
}
const LocationMocking = ({jobItem}: props) => {
  const mapRef = useRef<MapView | null>(null);
  const markerRef = useRef<any>(null);
  const colors = useTheme();

  const [region, setRegion] = useState({
    latitude: 16.8524,
    longitude: 74.5815,
  });

  const [currentCoords, setCurrentCoords] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);
  useEffect(() => {
    const locationRef = database().ref(`Jobs/${jobItem.JOB_CARD_ID}/location`);
    console.log('3456789...',typeof locationRef.on)
    console.log('3456789...',jobItem.JOB_CARD_ID)
    const onValueChange = locationRef.on('value', snapshot => {
       console.log('snapshot...',snapshot)
       const loc = snapshot.val();
       console.log('loc...',loc)
      if (loc) {
        animate(loc.latitude, loc.longitude);
        if (currentCoords) {
          mapRef.current?.fitToCoordinates(
            [
              {latitude: loc.latitude, longitude: loc.longitude},
              {
                latitude: Number(jobItem.LATITUDE),
                longitude: Number(jobItem.LONGITUDE),
              },
            ],
            {
              edgePadding: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50,
              },
              animated: true,
            },
          );
        }
        setCurrentCoords({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
    });
    return () => locationRef.off('value', onValueChange);
  }, [jobItem]);



   const [routeCoordinates, setRouteCoordinates] = useState([]);
  useEffect(() => {
    fetchRouteCoordinates(currentCoords, jobItem, MAP_API)
      .then(setRouteCoordinates)
      .catch(console.warn);
  }, [region,currentCoords, jobItem]);
  const fetchRouteCoordinates = async (origin, destination, apiKey) => {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${Number(destination.LOCATION_LATITUDE)},${Number(
      destination.LOCATION_LONG,
    )}`;

    const response = await apiCall.post('getDirections', {
      LOCATION_LATITUDE: origin.latitude, // Origin latitude (e.g., Pune)
      LOCATION_LONG: origin.longitude, // Origin longitude
      destination: {
        LOCATION_LATITUDE: destination.LATITUDE, // Destination latitude (e.g., Mumbai)
        LOCATION_LONG: destination.LONGITUDE, // Destination longitude
      },
    });
    // const json = await response.json();

    console.log(
      '\n\n\fetchRouteCoordinates',
      response.data.json.routes[0].overview_polyline.points,
    ); // <-- Use the awaited json here

    if (response.data.json.routes.length) {
      const points = decodePolyline(
        response.data.json.routes[0].overview_polyline.points,
      );
      return points;
    }

    throw new Error('No routes found');
  };

  // Decode polyline utility
  function decodePolyline(encoded) {
    let poly = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

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

  const animate = (latitude: number, longitude: number) => {
    const newCoordinate = {
      latitude,
      longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    if (Platform.OS === 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 3000);
      }
    } else {
      // currentCoords.timing({...newCoordinate, duration: 3000}).start();
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        // style={StyleSheet.absoluteFillObject}
        style={{height: 250, width: '100%', borderRadius: Size.radius}}
        initialRegion={{
          latitude: currentCoords
            ? currentCoords.latitude
            : Number(jobItem.LATITUDE) || region.latitude,
          longitude: currentCoords
            ? currentCoords.longitude
            : Number(jobItem.LONGITUDE) || region.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
       >
        {/* technician location  */}
        {currentCoords ? (
          <Marker.Animated ref={markerRef} coordinate={currentCoords}>
            <View>
              <Image
                source={_techMapIcon}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            </View>
          </Marker.Animated>
        ) : null}
        {/* customer current location */}
        <Marker
          coordinate={{
            latitude: Number(jobItem.LATITUDE) || region.latitude,
            longitude: Number(jobItem.LONGITUDE) || region.longitude,
          }}
        />
  <Polyline
  coordinates={routeCoordinates}
  strokeColor={colors.primary}
  strokeWidth={3}
/>


         
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LocationMocking;
