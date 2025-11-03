import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BASE_URL, fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {useSelector} from '../../context';
import {HomeRoutes} from '../../routes/Home';
import {Header, Icon} from '../../components';
import {_defaultImage} from '../../assets';
import {useTranslation} from 'react-i18next';

interface CategoryProps extends HomeRoutes<'Category'> {}
const Category: React.FC<CategoryProps> = ({navigation, route}) => {
  const {t} = useTranslation();
  const colors = useTheme();
  const {item} = route.params;
  const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState<boolean>(true);
  const [Category, setCategory] = useState<TerritoryWiseCategoryInterface[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredCategory, setFilteredCategory] = useState<
    TerritoryWiseCategoryInterface[]
  >([]);

  useEffect(() => {
    if (loading)
      setTimeout(() => {
        setCategory(item);
        setFilteredCategory(item);
        setLoading(false);
      }, 300);
  }, [loading]);
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCategory(Category);
    } else {
      const filteredData = Category.filter(category =>
        category.NAME.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredCategory(filteredData);
    }
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
      ) : (
        <View style={{flex: 1}}>
          <Header
            label={t('dashboard.serviceCategories')}
            onBack={() => navigation.goBack()}
          />

          <View
            style={{
              marginVertical: 14,
              flexDirection: 'row',
              alignSelf: 'stretch',
              borderRadius: 6,
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
                color: 'black',
                top: 2,
              }}
              placeholder={t('dashboard.search')}
              value={searchQuery}
             onChangeText={(text) => {
    // Allow only letters, numbers, and spaces
    const filteredText = text.replace(/[^a-zA-Z0-9 ]/g, '');
    handleSearch(filteredText);
  }}
            />
          </View>

          <View style={{flex: 1, paddingHorizontal: Size.containerPadding}}>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 16,
                fontWeight: 500,
                color: colors.text,
                marginBottom: 16,
              }}>
              {t('category.title')}{' '}
            </Text>
            
            <FlatList
              data={filteredCategory}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={() => {
                    setLoading(true);
                  }}
                />
              }
              keyExtractor={(item, index) => `category_${item.ID}_${index}`}
              contentContainerStyle={{
                paddingBottom: 20, 
                gap: 8,
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              scrollEnabled={true}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('SubCategory', {item: item})
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
                      shadowOffset: {width: 0, height: 2},
                      shadowRadius: 6,
                      elevation: 2,
                    }}>
                    <View style={{}}>
                      <Image
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          position: 'relative',
                          // backgroundColor: '#D9D9D9',
                          backgroundColor: '#F4F7F9',
                        }}
                        defaultSource={_defaultImage}
                        source={
                          item.ICON
                            ? {
                                uri: IMAGE_URL + 'Category/' + item.ICON,
                                cache: 'default',
                              }
                            : _defaultImage
                        }
                      />
                    </View>
                    <Text
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
                      }}
                      numberOfLines={2}>
                      {item.NAME}
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
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
export default Category;
const styles = StyleSheet.create({
  categoryTitle: {
    fontSize: Size.xl,
    textAlign: 'center',
  },
  categoryDesc: {
    fontSize: Size.lg,
  },
});
