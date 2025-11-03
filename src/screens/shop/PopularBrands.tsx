import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, Loader, Header} from '../../components';
import {ShopRoutes} from '../../routes/Shops';
import {apiCall, useTheme, IMAGE_URL, fontFamily} from '../../modules';
import {_defaultImage} from '../../assets';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  JumpingTransition,
} from 'react-native-reanimated';

interface PopularBrandsProps extends ShopRoutes<'PopularBrands'> {}

const PopularBrands: React.FC<PopularBrandsProps> = ({navigation}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [popularBrands, setPopularBrands] = useState<any[]>([]);
  const [loader, setLoader] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBrandData = async (pageNumber: number, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoader(true);
    }
    try {
      const response = await apiCall.post('brand/get', {
        filter: 'AND STATUS = 1',
        pageIndex: pageNumber,
        pageSize: 15,
         sortKey: 'SEQUENCE_NO',
        sortValue: 'asc',
      });
      if (response.status === 200 && response.data?.data) {
        const newData = response.data.data;
        if (newData.length === 0) {
          setHasMore(false);
        } else {
          setPopularBrands(prev => (isLoadMore ? [...prev, ...newData] : newData));
          setPage(pageNumber);
        }
      } else {
        Alert.alert(t('shop.popularBrands.error.fetch'));
      }
    } catch (error) {
      console.error('Error in fetchBrandData:', error);
      Alert.alert(t('shop.popularBrands.error.general'));
    } finally {
      setLoader(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchBrandData(1);
  }, []);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchBrandData(page + 1, true);
    }
  };

  const brandCardWidth = useMemo(
    () => (Dimensions.get('window').width - 32) / 3,
    [],
  );

  const renderBrandItem = ({item}: {item: any}) => (
    <View >
      <TouchableOpacity
        style={[styles.brandCard, {width: brandCardWidth}]}
        onPress={() => navigation.navigate('ProductList', {BRAND: item})}>
        <Animated.View
          layout={JumpingTransition}
          style={styles.brandLogoContainer}>
          <Image
            source={
              item.BRAND_IMAGE
                ? {
                    uri:
                      IMAGE_URL +
                      'BrandImages/' +
                      item.BRAND_IMAGE +
                      `?timestamp=${new Date().getTime()}`,
                    cache: 'default',
                  }
                : _defaultImage
            }
            resizeMode="contain"
            style={styles.brandLogo}
          />
        </Animated.View>
        <Text style={styles.brandName}>{item.BRAND_NAME.substring(0, 10)}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        // paddingHorizontal: 12,
        gap: 5,
        backgroundColor: '#FDFDFD',
      }}>
      <View>
        <Header
          label={t('shop.popularBrands.title')}
          onBack={() => navigation.goBack()}
        />
      </View>
      <View style={{flex: 1, paddingHorizontal: 12}}>
        <FlatList
          removeClippedSubviews={false}
          data={popularBrands}
          keyExtractor={item => item.ID.toString()}
          numColumns={3}
          columnWrapperStyle={{justifyContent: 'space-between'}}
          contentContainerStyle={{gap: 8, paddingBottom: 12}}
          showsVerticalScrollIndicator={false}
          renderItem={renderBrandItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            isLoadingMore ? (
              <View style={{paddingVertical: 10, alignItems: 'center'}}>
                <Loader show={true} />
              </View>
            ) : null
          }
        />
      </View>
      <Loader show={loader} />
    </SafeAreaView>
  );
};

export default PopularBrands;

const styles = StyleSheet.create({
  brandCard: {
    gap: 2,
    // height: 110,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F9',
    padding: 14,
    borderRadius: 13,
  },
  brandLogoContainer: {
    // flex: 1,
    width: '100%',
    aspectRatio: 1.1,
    // height: 63,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily,
    color: '#0E0E0E',
    paddingTop: 10,
  },
});
