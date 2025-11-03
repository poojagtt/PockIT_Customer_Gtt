import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SectionList,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import {Icon} from '../../components';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  apiCall,
  fontFamily,
  IMAGE_URL,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {HomeRoutes} from '../../routes/Home';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_defaultImage} from '../../assets';
import {useTranslation} from 'react-i18next';

interface ServiceData {
  ARCHIVE_FLAG: string;
  AVG_RATINGS: string;
  B2B_PRICE: string;
  B2C_PRICE: string;
  CATEGORY_ID: number;
  CATEGORY_NAME: string;
  CESS: string;
  CGST: string;
  CLIENT_ID: number;
  CREATED_DATE: string;
  CREATED_MODIFIED_DATE: string;
  CUSTOMER_ID: number;
  DESCRIPTION: string;
  DETAILS_DESIGNER: null | string;
  DURARTION_HOUR: number;
  DURARTION_MIN: number;
  END_TIME: string;
  EXPRESS_COST: string;
  HSN_CODE: null | string;
  HSN_CODE_ID: null | number;
  ID: number;
  IGST: string;
  IS_EXPRESS: number;
  IS_FOR_B2B: number;
  IS_JOB_CREATED_DIRECTLY: number;
  IS_NEW: number;
  IS_PARENT: number;
  MAX_QTY: string;
  NAME: string;
  ORG_ID: number;
  PARENT_ID: number;
  PREPARATION_HOURS: number;
  PREPARATION_MINUTES: number;
  QTY: string;
  READ_ONLY: string;
  SERVICE_HTML_URL: string;
  SERVICE_IMAGE: string;
  SERVICE_NAME: null | string;
  SERVICE_TYPE: string;
  SGST: string;
  SHORT_CODE: string;
  START_TIME: string;
  STATUS: number;
  SUB_CATEGORY_ID: number;
  SUB_CATEGORY_NAME: string;
  TAX_ID: number;
  TAX_NAME: string;
  TECHNICIAN_COST: number;
  UNIT_ID: number;
  UNIT_NAME: string;
  VENDOR_COST: string;
  ICON: string;
  IMAGE: string;
  BRAND_IMAGE: string;
  INVENTORY_IMAGE: string;
  children?: {
    key: number;
    title: string;
    DESCRIPTION: string;
    ICON: string;
    BANNER_IMAGE: string;
  }[];
}
interface ServiceResponse {
  CATEGORY: string;
  DATA: ServiceData;
  ROUTE: string;
  SOURCE_ID: number;
  TITLE: string;
}
interface Section {
  title: string;
  data: ServiceResponse[];
}

interface SearchPageProps extends HomeRoutes<'SearchPage'> {}

const SearchPage: React.FC<SearchPageProps> = ({navigation}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {user, address, territory} = useSelector(state => state.app);
  const inputRef = useRef<TextInput>(null);
  const [searchText, setSearchText] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (searchText.length >= 3 && address?.TERRITORY_ID) {
      getSearchedItems();
    } else {
      setSections([]);
    }
  }, [searchText]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const getSearchedItems = async () => {
    if (!address) {
      return;
    }
    if (searchText.length < 3) {
      Alert.alert(
        t('search.alerts.invalid.title'),
        t('search.alerts.invalid.message'),
      );
      return;
    }
    setLoading(true);
    try {
      const response = await apiCall.post('app/global/webSearch', {
        searchKey: searchText,
        CUSTOMER_ID: user?.ID,
        CUSTOMER_TYPE: user?.CUSTOMER_TYPE,
        TERRITORY_ID: [address.TERRITORY_ID],
        TYPE: 'M',
        filter: '',
        pageIndex: 0,
        pageSize: 0,
        sortKey: '',
        sortValue: '',
      });
      if (response.data && response.data.code == 200) {
        let data: Section[] = response.data.data.map((item: any) => ({
          title: item.CATEGORY,
          data: item.MATCHED_RECORDS,
        }));
        setSections(data);
      } else {
        Alert.alert(t('search.alerts.error.title'), response.data.message);
      }
    } catch (err) {
      Alert.alert(t('search.alerts.error.title'));
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({item}: {item: ServiceResponse; index: number}) => {
    if (item.CATEGORY == 'Category' && address?.PINCODE_FOR !== 'I') {
      return (
        <TouchableOpacity
          onPress={() => {
            navigation.push('SubCategory', {
              item: {
                ...item.DATA,
                subCategories:
                  sections
                    .find(section => section.title === 'SubCategory')
                    ?.data.map(subItem => ({
                      BANNER_IMAGE: '',
                      DESCRIPTION: subItem.DATA.DESCRIPTION || '',
                      ID: subItem.DATA.ID,
                      IMAGE: subItem.DATA.IMAGE,
                      NAME: subItem.DATA.NAME,
                    })) || [],
              },
            });
          }}
          style={styles.itemTouchable}>
             <View style={{height:46,width:46,borderRadius:23,backgroundColor:colors.white,padding:8}}>
          <Image
            style={{height:'100%',width:'100%'}}
            defaultSource={_defaultImage}
            source={
              item.DATA.ICON
                ? {
                    uri: IMAGE_URL + 'Category/' + item.DATA.ICON,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
          </View>
          <Text style={styles.itemTitle}>{item.TITLE}</Text>
          <Icon name="chevron-forward" type="Ionicons" color={'#999999'} />
        </TouchableOpacity>
      );
    } else if (item.CATEGORY == 'SubCategory' && address?.PINCODE_FOR !== 'I') {
      return (
        <TouchableOpacity
          onPress={() =>
            navigation.push('ServiceList', {
              // @ts-ignore
              subCategory: item.DATA,
              service: null,
              path: [item.TITLE],
            })
          }
          style={styles.itemTouchable}>
          <View style={{height:46,width:46,borderRadius:23,backgroundColor:colors.white,padding:8}}>
              <Image
            style={{height:'100%',width:'100%'}}
            defaultSource={_defaultImage}
            source={
              item.DATA.IMAGE
                ? {
                    uri: IMAGE_URL + 'SubCategory/' + item.DATA.IMAGE,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
          </View>
          
          <Text style={styles.itemTitle}>{item.TITLE}</Text>
          <Icon name="chevron-forward" type="Ionicons" color={'#999999'} />
        </TouchableOpacity>
      );
    } else if (item.CATEGORY == 'Service' && address?.PINCODE_FOR !== 'I') {
      return (
        <TouchableOpacity
          onPress={() => {
            navigation.push('ServiceList', {
              // @ts-ignore
              subCategory: {
                ID: item.DATA.SUB_CATEGORY_ID,
                NAME: item.DATA.SUB_CATEGORY_NAME,
                DESCRIPTION: '',
                IMAGE: '',
              },
              // @ts-ignore
              service: item.DATA.PARENT_ID
                ? {
                    SERVICE_ID: item.DATA.PARENT_ID,
                    SERVICE_NAME: item.DATA.SERVICE_NAME,
                  }
                : null,
              // @ts-ignore
              path: item.DATA.PARENT_ID
                ? [item.DATA.SUB_CATEGORY_NAME, item.DATA.SERVICE_NAME]
                : [item.DATA.SUB_CATEGORY_NAME],
            });
          }}
          style={styles.itemTouchable}>
             <View style={{height:46,width:46,borderRadius:23,backgroundColor:colors.white,padding:8}}>
          <Image
              style={{height:'100%',width:'100%'}}
            defaultSource={_defaultImage}
            source={
              item.DATA.SERVICE_IMAGE
                ? {
                    uri: IMAGE_URL + 'Item/' + item.DATA.SERVICE_IMAGE,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
          </View>
          <Text style={styles.itemTitle}>{item.TITLE}</Text>
          <Icon name="chevron-forward" type="Ionicons" color={'#999999'} />
        </TouchableOpacity>
      );
    } else if (item.CATEGORY == 'ItemBrands' && address?.PINCODE_FOR !== 'S') {
      return (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ProductList', {BRAND: item.DATA});
          }}
          style={styles.itemTouchable}>
             <View style={{height:46,width:46,borderRadius:23,backgroundColor:colors.white,padding:8}}>

          <Image
            style={{height:'100%',width:'100%'}}
            defaultSource={_defaultImage}
            source={
              item.DATA.BRAND_IMAGE
                ? {
                    uri: IMAGE_URL + 'BrandImages/' + item.DATA.BRAND_IMAGE,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
          </View>
          <Text style={styles.itemTitle}>{item.TITLE}</Text>
          <Icon name="chevron-forward" type="Ionicons" color={'#999999'} />
        </TouchableOpacity>
      );
    } else if (item.CATEGORY == 'Items' && address?.PINCODE_FOR !== 'S') {
      return (
        <TouchableOpacity
          onPress={() => {
            if (!user || user.ID == 0) {
              Alert.alert(
                t('serviceList.guestTitle'),
                t('home.dashboard.guestMessage'),
                [
                  {
                    text: t('serviceList.cancel'),
                    onPress: () => {},
                  },
                  {
                    text: t('serviceList.login'),
                    onPress: () => {
                      useStorage.delete('user');
                      tokenStorage.clearToken();
                      dispatch(Reducers.setSplash(true));
                    },
                    isPreferred: true,
                  },
                ],
                {
                  cancelable: true,
                },
              );
              return;
            }
            navigation.navigate('ProductDetails', {item: item.DATA});
          }}
          style={styles.itemTouchable}>
             <View style={{height:46,width:46,borderRadius:23,backgroundColor:colors.white,padding:8}}>

          <Image
              style={{height:'100%',width:'100%'}}
            defaultSource={_defaultImage}
            source={
              item.DATA.INVENTORY_IMAGE
                ? {
                    uri:
                      IMAGE_URL +
                      'InventoryImages/' +
                      item.DATA.INVENTORY_IMAGE,
                    cache: 'default',
                  }
                : _defaultImage
            }
          />
          </View>
          <Text style={styles.itemTitle}>{item.TITLE}</Text>
          <Icon name="chevron-forward" type="Ionicons" color={'#999999'} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderSectionHeader = ({section}: {section: Section}) => {
    if (section.data.length === 0) {
      return null;
    }
    if (
      (section.title === 'SubCategory' ||
        section.title === 'Category' ||
        section.title === 'Service') &&
      address?.PINCODE_FOR !== 'I'
    ) {
      return <Text style={styles.sectionTitle}>{section.title}</Text>;
    }
    if (section.title === 'ItemBrands' && address?.PINCODE_FOR !== 'S') {
      return <Text style={styles.sectionTitle}>{'Brands'}</Text>;
    }
    if (section.title === 'Items' && address?.PINCODE_FOR !== 'S') {
      return <Text style={styles.sectionTitle}>{section.title}</Text>;
    }
    return null;
  };

  const EmptyStateView = () => (
    <View style={styles.emptyStateContainer}>
      <Icon
        name="search-off"
        type="MaterialIcons"
        size={60}
        color={'#CBCBCB'}
      />
      <Text style={styles.emptyStateTitle}>{t('search.empty.title')}</Text>
      <Text style={styles.emptyStateSubtitle}>{t('search.empty.message')}</Text>
    </View>
  );
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={[styles.container, {paddingBottom: insets.bottom + 12}]}>
          <View style={styles.header}>
            <Icon
              name="keyboard-backspace"
              type="MaterialCommunityIcons"
              size={24}
              color={'#0E0E0E'}
              onPress={() => navigation.navigate('Dashboard')}
            />
            {/* <Text style={styles.headerTitle}>{t('search.title')}</Text> */}
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={[styles.searchContainer, {borderColor: '#CBCBCB'}]}>
              {/* {!searchText && ( )} */}
              <Icon
                name="search"
                type="Feather"
                size={20}
                color={'#636363'}
                style={styles.searchIcon}
              />

              <TextInput
                ref={inputRef}
                placeholder={t('search.input.placeholder')}
                placeholderTextColor="#999999"
                style={[styles.searchInput, {color: colors.text}]}
                returnKeyType="search"
                value={searchText}
                // onChangeText={setSearchText}
                 onChangeText={(text) => {
    // Allow only letters, numbers, and spaces
    const filteredText = text.replace(/[^a-zA-Z0-9 ]/g, '');
    setSearchText(filteredText);
  }}
              />
              {searchText && (
                <Icon
                  name="close"
                  type="AntDesign"
                  size={20}
                  color={'#999999'}
                  style={styles.searchIcon}
                  onPress={() => setSearchText('')}
                />
              )}
            </View>
            {/* {searchText.length > 0 && (
            <TouchableOpacity
              onPress={getSearchedItems}
              style={styles.searchButton}>
              <Text style={styles.searchButtonText}>
                {t('search.buttons.search')}
              </Text>
            </TouchableOpacity>
          )} */}
          </View>

          <SectionList
          onScroll={()=>Keyboard.dismiss()}
            keyboardShouldPersistTaps="handled"
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContainer,
              sections.length === 0 &&
                searchText.length >= 3 &&
                styles.emptyListContainer,
              {paddingBottom: insets.bottom + 80},
            ]}
            // stickySectionHeadersEnabled={false}
            // ListEmptyComponent={searchText.length >= 3 ? EmptyStateView : null}
            ListEmptyComponent={EmptyStateView}
          />
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  container: {
    // flex: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    // gap: 16,
    // backgroundColor:'red',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 12,
    padding: 0,
  },
  headerTitle: {
     fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  searchContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: 'white',
    borderColor: '#E7E6E6',
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily,
    fontSize: 16,
    padding: 0,
  },
  listContainer: {
    // paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginTop: 24,
  },
  itemTouchable: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    borderColor: '#CBCBCB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 46,
    height: 46,
    // borderRadius: 30,
   
  },
  itemTitle: {
    
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19.9,
    color: '#333333',
    opacity: 0.8,
  },
  searchButton: {
    backgroundColor: '#2f2f2f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
     fontFamily: fontFamily,
    fontWeight: '500',
  },
  emptyStateContainer: {
    // flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  emptyStateTitle: {
   fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
   fontFamily: fontFamily,
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
  },
});

export default SearchPage;
