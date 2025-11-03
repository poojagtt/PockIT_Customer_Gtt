import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall} from '../../modules/services';
import {fontFamily, Size, useTheme} from '../../modules';
import {Icon} from '../../components';

interface LanguageSettingsProps extends MenuRoutes<'Language'> {}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({navigation}) => {
  const colors = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [Language, setLanguage] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  const fetchLanguage = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/language/get', {
          sortKey: 'ID',
          sortValue: 'asc',
          CUSTOMER_ID: 3,
        })
        .then(res => res.data);
      if (response.code === 200) {
        setLanguage(response.data);
      } else {
        Alert.alert('Failed to fetch languages');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      Alert.alert('Error fetching languages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguage();
  }, []);

  return (
    <View style={styles._container}>
      <Icon
        type="MaterialIcons"
        name="keyboard-backspace"
        size={27}
        color={'#999999'}
        onPress={() => navigation.goBack()}
      />
      <Text style={styles._headingTxt}>Language settings</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#696969"
          style={styles._loaderContainer}
        />
      ) : (
        <FlatList
          data={Language}
          removeClippedSubviews={false}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => {
            return (
              <View style={styles._menuItem}>
                <View style={styles._menuLeft}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSelectLanguage(item.NAME)}
                    style={styles._menuRadioItem}>
                    <View style={styles._menuLeft}>
                      <View
                        style={[
                          styles._circle,
                          selectedLanguage === item.NAME &&
                            styles._circleSelected,
                        ]}>
                        {selectedLanguage === item.NAME && (
                          <View style={styles._innerCircle} />
                        )}
                      </View>
                      <Text style={styles._txt}>{item.NAME}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles._txt}>{item.NAME}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default LanguageSettings;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: 30,
  },
  _headingTxt: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size['2xl'],
    marginBottom: Size.lg,
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    marginTop: 5,
    marginHorizontal: 10,
    gap: 10,
  },
  _menuRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  _menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  _txt: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: fontFamily,
    color: '#232323',
  },
  _circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#092B9C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  _circleSelected: {
    backgroundColor: '#FFF',
  },
  _innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#F36631',
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
