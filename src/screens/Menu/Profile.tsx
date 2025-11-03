import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import {MenuRoutes} from '../../routes/Menu';
import {apiCall, BASE_URL, IMAGE_URL} from '../../modules/services';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_noProfile} from '../../assets';
import {Button, Header, Icon, ImagePicker, TextInput} from '../../components';
import {fontFamily, Size, useTheme} from '../../modules';
import {isValidGST} from '../../modules/validations';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Toast from '../../components/Toast';

interface ProfileProps extends MenuRoutes<'Profile'> {}
const Profile: React.FC<ProfileProps> = ({navigation}) => {
  const {user} = useSelector(state => state.app);
  const dispatch = useDispatch();
  const colors = useTheme();
  const {t} = useTranslation();

  const [formData, setFormData] = useState({
    imageUrl: '',
    name: '',
    hasGst: false,
    companyName: '',
    companyAdd: '',
    gstNumber: '',
    loading: true,
  });

  const getProfile = useCallback(async () => {
    setFormData(prev => ({...prev, loading: true}));
    try {
      const res = await apiCall.post(`api/customer/get`, {
        filter: ` AND ID=${user?.ID}`,
      });
      if (res.data && res.data.code === 200) {
        const userData: UserInterface = res.data.data[0];
        dispatch(Reducers.setUser(userData));
        setFormData({
          imageUrl: userData.PROFILE_PHOTO
            ? `${IMAGE_URL}CustomerProfile/${userData.PROFILE_PHOTO}`
            : '',
          name: userData.NAME,
          companyAdd: userData.COMPANY_ADDRESS || '',
          companyName: userData.INDIVIDUAL_COMPANY_NAME || '',
          gstNumber: userData.GST_NO ? userData.GST_NO : '',
          hasGst: userData.IS_HAVE_GST == 1 ? true : false,
          loading: false,
        });
      } else {
        throw new Error(t('profile.errors.fetchFailed'));
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('profile.errors.fetchFailed'),
      );
      setFormData(prev => ({...prev, loading: false}));
    }
  }, [user?.ID, dispatch, t]);

  const updateProfile = useCallback(async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('profile.errors.userDataUnavailable'));
      return;
    }

    // Validate GST fields when hasGst is true
    if (formData.hasGst) {
      if (!formData.companyName.trim()) {
        Toast('Please enter company name');
        return;
      }
      if (!formData.companyAdd.trim()) {
        Toast('Please enter company address');
        return;
      }
      if (formData.gstNumber.trim().length == 0) {
        Toast('Please enter GST number');
        return;
      }
      if (!isValidGST(formData.gstNumber)) {
        Toast('Please enter a valid GST number format');
        return;
      }
    }

    try {
      setFormData(prev => ({...prev, loading: true}));
      let imageURL = user.PROFILE_PHOTO
        ? `${IMAGE_URL}CustomerProfile/${user?.PROFILE_PHOTO}`
        : '';
      let sameName = formData.name === user.NAME;
      let sameProfile = formData.imageUrl === imageURL;
      let profilePhoto = user.PROFILE_PHOTO || '';

      // if (sameName && sameProfile && !formData.hasGst) {
      //   Alert.alert(t('profile.alerts.noChanges'));
      //   setFormData(prev => ({...prev, loading: false}));
      //   return;
      // }

      if (formData.imageUrl === '') {
        profilePhoto = '';
      } else if (!sameProfile && formData.imageUrl) {
        const form = new FormData();
        const fileName = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
        form.append('Image', {
          // uri: formData.imageUrl,
          uri: formData.imageUrl.startsWith('file://')
            ? formData.imageUrl
            : `file://${formData.imageUrl}`,

          type: 'image/jpeg',
          name: fileName,
        });

        const uploadRes = await apiCall.post(
          'api/upload/CustomerProfile',
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (uploadRes.data && uploadRes.data.code === 200) {
          profilePhoto = fileName;
        }
      }
      const payload = {
        ...user,
        NAME: formData.name,
        PROFILE_PHOTO: profilePhoto,
        IS_HAVE_GST: formData.hasGst,
        INDIVIDUAL_COMPANY_NAME: formData.companyName
          ? formData.companyName
          : null,
        COMPANY_ADDRESS: formData.companyAdd ? formData.companyAdd : null,
        GST_NO: formData.gstNumber ? formData.gstNumber : null,
      };
      console.log('234567890----', payload);
      const updateRes = await apiCall.put('api/customer/update', payload);

      if (updateRes.data && updateRes.data.code === 200) {
        Toast('Profile updated successfully');
        await getProfile();
      } else {
        throw new Error(t('profile.errors.updateFailed'));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error, error?.response);
      Alert.alert(
        t('common.error'),
        error.message || t('profile.errors.updateError'),
      );
    } finally {
      setFormData(prev => ({...prev, loading: false}));
    }
  }, [
    user,
    formData.name,
    formData.imageUrl,
    formData.hasGst,
    formData.companyName,
    formData.companyAdd,
    formData.gstNumber,
    getProfile,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      getProfile();
    }, [getProfile]),
  );

  const renderContent = () => {
    if (formData.loading) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={{flex: 1, backgroundColor: colors.background}}>
        <Header
          label={t('menu.profile.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={{flex: 1}}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: Size.containerPadding,
              paddingVertical: Size.containerPadding,
              paddingBottom: 30,
            }}
            keyboardShouldPersistTaps="handled"
            // removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}>
            <View style={styles._profileSection}>
              <ImagePicker
                style={styles._profileImageContainer}
                isDelete={true}
                onCapture={res => {
                  setFormData(prev => ({...prev, imageUrl: res.fileUrl}));
                }}>
                <Image
                  source={
                    formData.imageUrl
                      ? {
                          uri:
                            (formData.imageUrl.startsWith('http')
                              ? formData.imageUrl
                              : `file://${formData.imageUrl}`) +
                            `?timestamp=${new Date().getTime()}`,
                        }
                      : _noProfile
                  }
                  style={styles._profileImage}
                />
                <Icon
                  type="Octicons"
                  name="pencil"
                  size={19}
                  style={styles._editIcon}
                  color={colors.primary}
                />
              </ImagePicker>
            </View>

            <View style={styles._divider} />
            <View style={styles._inputContainer}>
              <TextInput
                label={t('menu.profile.labels.name')}
                value={formData.name}
                onChangeText={name => setFormData(prev => ({...prev, name}))}
                imp
              />
              <TextInput
                label={t('menu.profile.labels.mobile')}
                value={user?.MOBILE_NO || ''}
                onChangeText={() => {}}
                disable
                imp
              />
              <TextInput
                label={t('menu.profile.labels.email')}
                value={user?.EMAIL || ''}
                onChangeText={() => {}}
                disable
                imp
              />
              {user?.CUSTOMER_TYPE == 'I' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{
                      fontFamily: 'SF-Pro-Text-Bold',
                      fontSize: 14,
                      fontWeight: '400',
                      paddingLeft: 8,
                      lineHeight: 16,
                      color: colors.text,
                    }}>
                    GST Invoice?
                  </Text>
                  <Switch
                    value={formData.hasGst}
                    onValueChange={value => {
                      setFormData(prev => ({
                        ...prev,
                        hasGst: value,
                        companyName: value ? prev.companyName : '',
                        companyAdd: value ? prev.companyAdd : '',
                        gstNumber: value ? prev.gstNumber : '',
                      }));
                    }}
                    style={styles.switch}
                    trackColor={{false: '#767577', true: colors.secondary}}
                    thumbColor={formData.hasGst ? '#fff' : '#f4f3f4'}
                  />
                </View>
              )}
              {formData.hasGst && user?.CUSTOMER_TYPE == 'I' && (
                <View style={{}}>
                  <TextInput
                    label={t('menu.profile.labels.companyName')}
                    value={formData?.companyName || ''}
                    onChangeText={companyName =>
                      setFormData(prev => ({...prev, companyName}))
                    }
                    placeholder="Company name"
                    imp
                    maxLength={128}
                  />
                  <View style={{height: 10}} />
                  <TextInput
                    label={t('menu.profile.labels.companyAddress')}
                    value={formData?.companyAdd || ''}
                    onChangeText={companyAdd =>
                      setFormData(prev => ({...prev, companyAdd}))
                    }
                    placeholder="Company address"
                    multiline
                    imp
                    maxLength={256}
                  />
                  <View style={{height: 10}} />
                  <TextInput
                    label={t('menu.profile.labels.gstNo')}
                    value={formData?.gstNumber || ''}
                    onChangeText={gstNumber =>
                      setFormData(prev => ({...prev, gstNumber}))
                    }
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    error={
                      formData.gstNumber
                        ? !isValidGST(formData.gstNumber)
                        : false
                    }
                    errorMessage={
                      formData.gstNumber && !isValidGST(formData.gstNumber)
                        ? 'Please enter a valid GST number'
                        : ''
                    }
                    maxLength={15}
                    imp
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <View style={styles._buttonContainer}>
          <Button
            label={t('menu.profile.buttons.update')}
            onPress={updateProfile}
            style={{
              backgroundColor: formData.loading
                ? colors.disable
                : colors.primary2,
            }}
            disable={formData.loading}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'red'}}>
      <View style={styles._container}>
        {/* <View>
          <Header
            label={t('menu.profile.title')}
            onBack={() => navigation.goBack()}
          />
        </View> */}
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // adjust offset as needed
        >
          {renderContent()}
          {/* <View style={styles._buttonContainer}>
          <Button
            label={t('menu.profile.buttons.update')}
            onPress={updateProfile}
            style={{
              backgroundColor: formData.loading
                ? colors.disable
                : colors.primary2,
            }}
            disable={formData.loading}
          />
        </View> */}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  _buttonContainer: {
    padding: Size.containerPadding,
  },
  _container: {
    flex: 1,
    backgroundColor: '#F6F8FF',
  },
  _profileSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  _profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  _profileImage: {
    width: 150,
    height: 150,
    borderWidth: 3.5,
    borderColor: '#FBA042',
    borderRadius: 95,
  },
  _editIcon: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    backgroundColor: '#fff',
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  _inputContainer: {
    gap: 12,
  },
  _loadingIndicator: {
    marginTop: 50,
  },
  _divider: {
    height: 1,
    marginBottom: 10,
    backgroundColor: '#E7E6E6',
  },
  switch: {
    transform: [
      {scaleX: Platform.OS == 'android' ? 1.4 : 1},
      {scaleY: Platform.OS == 'android' ? 1.4 : 1},
    ],
  },
});
