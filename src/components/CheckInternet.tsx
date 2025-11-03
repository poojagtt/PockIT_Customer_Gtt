import React, {useEffect, useState} from 'react';
import {View, Modal, Image} from 'react-native';
import {useSelector} from '../context';
import NetInfo from '@react-native-community/netinfo';
import {_noInternet} from '../assets';
import {Size} from '../modules';
interface CheckInternetProps {}
const CheckInternet: React.FC<CheckInternetProps> = () => {
  const [state, setState] = useState(true);
  useEffect(() => {
    let unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected || !state.isInternetReachable) {
        setState(true);
      } else {
        setState(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  if (state)
    return (
      <Modal transparent visible animationType={'fade'} style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View
            style={{
              // padding: 20,
              backgroundColor: 'white',
              borderRadius: 20,
              width: Size.width * 0.8,
              height: Size.width * 0.8,
            }}>
            <Image
              source={_noInternet}
              style={[
                {
                  width: Size.width * 0.8,
                  height: Size.width * 0.8,
                  tintColor: 'black',
                  // aspectRatio: 1,
                },
              ]}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    );
  else return null;
};
export default CheckInternet;
