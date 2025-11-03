import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Modal} from 'react-native';
import {fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import {Button, Icon} from '../../components';
import {OtpInput} from 'react-native-otp-entry';
import {useTranslation} from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


interface OtpModalProps {
  visible: boolean;
  onBack: () => void;
  value: string;
  onSuccess: () => void;
  onChange: (otp: string) => void;
  onResend: () => void;
  sendTo: string;
  loading: boolean;
  error: string;
}

const OtpModal: React.FC<OtpModalProps> = ({
  visible,
  value,
  onBack,
  onSuccess,
  onChange,
  onResend,
  loading,
  sendTo,
  error,
}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [timer, setTimer] = useState(0);
  const [resetKey, setResetKey] = useState(0);
console.log("sendTo",loading)
  const timeOutCallback = useCallback(
    () => setTimer(currTimer => currTimer - 1),
    [],
  );

  useEffect(() => {
    if (timer > 0) {
      const timeId = setTimeout(timeOutCallback, 1000);
      return () => clearTimeout(timeId);
    }
  }, [timer, timeOutCallback]);

  useEffect(() => {
    setTimer(120);
  }, [visible]);

  return (
    <Modal
      transparent={false}
      visible={visible}
      onRequestClose={() => {
        onBack();
      }}>
     <SafeAreaProvider>
       <SafeAreaView style={{flex: 1,backgroundColor: 'white' }} edges={['top', 'bottom']}>
        <View
          style={{
            flex: 1,
          }}>
          <Text
            onPress={() => {
              onBack();
            }}
            style={GlobalStyle.modalBackground}
          />
          <View
            style={{
              backgroundColor: colors.background,
              padding: Size.containerPadding,
              gap: Size['3xl'],
              flex: 1,
            }}>
            <Icon
              name="chevron-back"
              type="Ionicons"
              color={'#403f3f'}
              size={23}
              onPress={() => {
                onBack();
              }}
            />
            <View style={{flex: 1, marginTop:30}}>
              <View style={{gap: 8}}>
                <Text
                  style={[
                    {
                      fontSize: 22,
                      fontWeight: '500',
                      textAlign: 'center',
                      fontFamily,
                      color: colors.text,
                      lineHeight: 28.64,
                    },
                  ]}>
                  {t('login.verificationCode')}
                </Text>
                <Text
                  style={[
                    {
                      fontSize: 12,
                      fontWeight: '400',
                      textAlign: 'center',
                      fontFamily,
                      color: '#636363',
                      lineHeight: 14.32,
                    },
                  ]}>
                   OTP has been sent on your{' '}
  <Text style={{fontWeight: '600', color: colors.black}}>
    {sendTo.includes('@') ? 'email address' : 'WhatsApp number'}
  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily,
                    color: colors.textColor,
                    lineHeight: 16.71,
                  }}>
                  {sendTo}
                </Text>

{/* 
                {error ? (
                  <Text
                    style={{
                      fontSize: Size.md,
                      textAlign: 'center',
                      fontFamily,
                      paddingHorizontal: Size.containerPadding * 2,
                      color: colors.error,
                    }}>
                    {'' + error}
                  </Text>
                ) : null} */}
                
              </View>


              <View
                style={{
                  gap: Size.padding,
                  marginVertical: Size['2xl'],
                }}>
                  
                <OtpInput
                  key={resetKey}
                  numberOfDigits={4}
                  onTextChange={text => onChange(text)}
                  autoFocus
                  blurOnFilled
                  theme={{
                    containerStyle: {
                      justifyContent: 'center',
                      gap: 8,
                    },
                    pinCodeTextStyle: {
                      fontFamily,
                      fontWeight: '500',
                      fontSize: 14,
                      lineHeight: 16.71,
                    },
                    pinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background
                    },
                    filledPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius:12,
                      borderWidth: 1,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                    focusedPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: colors.primary2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                    disabledPinCodeContainerStyle: {
                      width: 50,
                      height: 50,
                      borderRadius:12,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                    },
                  }}
                  onFilled={text => {
                    onChange(text);
                  }}
                />
              </View>
              
              {error ? (
                  <Text
                    style={{
                      fontSize: Size.md,
                      textAlign: 'center',
                      fontFamily,
                      paddingHorizontal: Size.containerPadding * 2,
                      color: '#C71F1F',
                      fontWeight:400,
                      marginTop:-10,
                      marginBottom:8
                    }}>
                    {error}
                  </Text>
                ) : null}
              <View style={{gap: 8}}>
                {timer > 0 ? (
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: '400',
                        textAlign: 'center',
                        fontFamily,
                        color:timer<50?'#f36631': '#636363',
                        lineHeight: 14.32,
                      },
                    ]}>
                   {`${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}

                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily,
                    color: '#636363',
                    lineHeight: 14.32,
                  }}>
                  {t('login.dontReceiveCode')}
                  <Text
                    onPress={() => {
                      if (timer > 0) return;
                      onChange('');
                      setResetKey(prev => prev + 1);
                      onResend();
                      setTimer(60);
                    }}
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      textAlign: 'center',
                      fontFamily,
                      color: timer > 0 ? colors.text : colors.primary,
                      textDecorationLine: timer > 0 ? 'none' : 'underline',
                      lineHeight: 16.71,
                    }}>
                    {' ' + t('login.resendOTP')}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{justifyContent: 'flex-end'}}>
              <Button
               
   onPress={() => {
    if (!loading && value.length === 4) {
      onSuccess();
    }
  }}
  disabled={loading || value.length !== 4}
                label={t('login.verify')}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
     </SafeAreaProvider>
    </Modal>
  );
};

export default OtpModal;
const styles = StyleSheet.create({});
