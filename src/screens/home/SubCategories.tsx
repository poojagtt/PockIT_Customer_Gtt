import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IMAGE_URL, useTheme, fontFamily, apiCall } from '../../modules';
import { Header, Icon } from '../../components';
import { HomeRoutes } from '../../routes/Home';
import { _defaultImage } from '../../assets';
import { useTranslation } from 'react-i18next';
import ProgressBar from '../../components/ProgressBar';
import { TouchableHighlight } from 'react-native';
import Toast from '../../components/Toast';
import { useSelector } from '../../context';

interface ProgressBarProps {
  width: number | `${number}%`;
}

interface SubCategoryProps extends HomeRoutes<'SubCategories'> { }
const SubCategories: React.FC<SubCategoryProps> = ({ navigation, route }) => {
  const colors = useTheme();
  const { t } = useTranslation();
  const { item } = route.params;

  const [subCategory, setSubCategory] = useState<SubCategoryInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filteredSubCategory, setFilteredSubCategory] = useState<
    SubCategoryInterface[]
  >([]);
  const [searchText, setSearchText] = useState<string>('');
  useEffect(() => {
    fetchNonServiceCategories();
  }, []);

  const fetchNonServiceCategories = async () => {
    try {
      const response = await apiCall.post('serviceSubCategory/get', {
        filter: `AND STATUS=1 AND CATEGORY_ID= ${item.ID}`,
        sortKey: 'SEQ_NO',
        sortValue: 'asc'
      });
      if (response.data.code === 200) {
        setSubCategory(response.data.data);
        setFilteredSubCategory(response.data.data);
      } else {
        Toast('No categories found');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const { user, address, allAddress, territory } = useSelector(
    state => state.app,
  );
  const handleSearch = (text: string) => {

    setSearchText(text);
    const filteredData = subCategory.filter(subCat =>

      subCat.NAME.toLowerCase().includes(text.toLowerCase()),
    );
    // console.log("filteredData", filteredData)
    setFilteredSubCategory(filteredData);
  };
  const data = useMemo(() => { }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <View>
          <Header label={item.NAME} onBack={() => navigation.goBack()} />
        </View>

        <ProgressBar width={'34%'} />

        <View
          style={{
            marginVertical: 14,
            flexDirection: 'row',
            alignSelf: 'stretch',
            borderRadius: 8,
            borderWidth: 1,
            height: 48,
            marginHorizontal: 16,
            paddingHorizontal: 8,
            gap: 8,
            borderColor: '#E7E6E6',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
          }}>
          <Icon
            name="search-outline"
            type="Ionicons"
            color="#CBCBCB"
            size={23}
          />
          <TextInput
            style={{
              flex: 1,
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: 500,
              // lineHeight: 17.55,
              color: 'black',
              top: 2,
            }}
            placeholder={t('dashboard.search')}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size={'large'} color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: 500,
                  color: colors.text,
                  paddingBottom: 16,
                }}>
                {t('subcategory.title')}
              </Text>
            }
            data={filteredSubCategory}
            keyExtractor={(item, index) => `subCategory_${item.ID}_${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            removeClippedSubviews={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() =>
                  fetchNonServiceCategories()

                }
              />
            }
            renderItem={({ item: subCategory }) => {
              return (
                <TouchableOpacity
                  onLongPress={() => {
                    console.log(subCategory);
                  }}
                  onPress={() => {
                    if (address) {
                      navigation.push('ServiceListNonService', {
                        subCategory: subCategory,
                        service: null,
                        path: [item.NAME],
                      })
                    }
                    else {
                      Toast("Please add an address to continue");
                      navigation.navigate('AddressBook', {
                        cartId: { id: null, type: null },
                      })
                    }
                  }
                  }
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    gap: 8,
                    borderColor: `#E7E6E6`,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    elevation: 2,
                  }}>
                  <View
                    style={{
                      height: 60,
                      width: 60,
                      borderRadius: 30,
                      backgroundColor: '#f4f9f5',
                      padding: 12,
                    }}>
                    <Image
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      defaultSource={_defaultImage}
                      source={
                        subCategory.IMAGE
                          ? {
                            uri:
                              IMAGE_URL + 'SubCategory/' + subCategory.IMAGE,
                            cache: 'default',
                          }
                          : _defaultImage
                      }
                    />
                  </View>

                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 10,
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: 500,
                      // lineHeight: 19.9,
                      color: colors.text,
                      opacity: 0.8,
                    }}>
                    {subCategory.NAME}
                  </Text>
                  <Icon
                    name="chevron-forward"
                    type="Ionicons"
                    size={20}
                    color={'#636363'}
                  />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
export default SubCategories;
const styles = StyleSheet.create({
  _headerText: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    // lineHeight: Size.lg,
    letterSpacing: 0.68,
    textAlign: 'left',
  },
  _divider: {
    height: 3,
    //backgroundColor: '#383838',
    backgroundColor: '#383838',
  },
});
