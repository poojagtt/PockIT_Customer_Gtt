import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Icon, EmptyList, Loader, TextInput, Button} from '../../components';
import {useTheme, apiCall, fontFamily} from '../../modules';
import {_defaultImage} from '../../assets';
import ProductCard from './ProductCard';
import FilterModal from './FilterModal';
import {ShopRoutes} from '../../routes/Shops';
import {useTranslation} from 'react-i18next';
import Toast from '../../components/Toast';
import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';
import OtherFilterModal from './OtherFilterModal';
import CustomBottomModal from '../../components/CustomBottomModal';

interface ProductListProps extends ShopRoutes<'ProductList'> {}

const ProductList: React.FC<ProductListProps> = ({navigation, route}) => {
  console.log("navigation in list",navigation)
  const {BRAND} = route.params || {};
  const colors = useTheme();
  const {t} = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Move getEffectivePrice function outside
  const getEffectivePrice = useCallback((product: Product) => {
    if (
      product.DISCOUNT_ALLOWED === 1 &&
      product.DISCOUNTED_PRICE > 0 &&
      product.DISCOUNTED_PRICE < product.SELLING_PRICE
    ) {
      return product.DISCOUNTED_PRICE;
    }
    return product.SELLING_PRICE;
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loader, setLoader] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState(() => ({
    isVisible: false,
    value: {
      filter: ` AND STATUS = 1 AND IS_HAVE_VARIANTS = 0 ${
        BRAND ? ' AND BRAND_ID = ' + BRAND.ID : ''
      } AND INVENTORY_TYPE IN ("B", "P")`,
      sortKey: '',
      sortValue: '',
    },
    label: '',
  }));
  const [filterIndex, setFilterIndex] = useState(1);
  const sortedProducts = useMemo(() => {
    if (!filter.value.sortKey) return products;

    return [...products].sort((a, b) => {
      switch (filter.value.sortKey) {
        case 'ID':
          return filter.value.sortValue === 'DESC' ? b.ID - a.ID : a.ID - b.ID;
        case 'ITEM_NAME':
          return filter.value.sortValue === 'DESC'
            ? b.ITEM_NAME.localeCompare(a.ITEM_NAME)
            : a.ITEM_NAME.localeCompare(b.ITEM_NAME);
        case 'RATING':
          return filter.value.sortValue === 'DESC'
            ? (b.RATING || 0) - (a.RATING || 0)
            : (a.RATING || 0) - (b.RATING || 0);
        case 'DISCOUNTED_PRICE':
          const priceA = getEffectivePrice(a);
          const priceB = getEffectivePrice(b);

          // Sort based on the effective price, use ID as secondary sort to prevent duplicates
          if (filter.value.sortValue === 'DESC') {
            // High to Low
            return priceB === priceA
              ? a.ID - b.ID
              : Number(priceB) - Number(priceA);
          } else {
            // Low to High
            return priceA === priceB
              ? a.ID - b.ID
              : Number(priceA) - Number(priceB);
          }
        default:
          return 0;
      }
    });
  }, [
    products,
    filter.value.sortKey,
    filter.value.sortValue,
    getEffectivePrice,
  ]);

  const memoizedFilter = useMemo(() => filter, [filter]);

//   const fetchInitialProducts = useCallback(
//     async (isSearch: boolean = false) => {
//       setLoader(true);
//       setProducts([]);
//       try {
//        let body = {
//   ...memoizedFilter.value,
//   pageIndex: 1,
//   pageSize: 10,
// };

// if (selectedCategory.length) {
//   const categoryFilter = `AND INVENTORY_CATEGORY_NAME IN (${selectedCategory
//     .map(cat => `"${cat}"`)
//     .join(',')})`;

//   body.filter = (body.filter || '') + ` ${categoryFilter}`;
// }

//         const response = await apiCall.post('inventory/getForCart', body);

//         if (response.status === 200) {
//           const data = response.data.data;
//           setProducts(data);
//           setPageIndex(2);
//           setHasMore(data?.length >= 10);
//         } else {
//           Alert.alert(t('shop.productList.alerts.error'));
//         }
//       } catch (error) {
//         console.error('Error in fetchInitialProducts:', error);
//       } finally {
//         setLoader(false);
//       }
//     },
//     [memoizedFilter, t],
//   );



const fetchInitialProducts = useCallback(
  async (isSearch: boolean = false, categoriesArg?: string[]) => {
    setLoader(true);
    setProducts([]);
    try {
      let body = {
        ...memoizedFilter.value,
        pageIndex: 1,
        pageSize: 10,
         sortKey:'ID',
        sortValue:'asc'
      };

      const categoriesToUse = categoriesArg ?? selectedCategory;

      if (categoriesToUse.length) {
        const categoryFilter = `AND INVENTORY_CATEGORY_NAME IN (${categoriesToUse
          .map(cat => `"${cat}"`)
          .join(',')})`;
        body.filter += ` ${categoryFilter}`;
      }

      const response = await apiCall.post('inventory/getForCart', body,
         
      );

      if (response.status === 200) {
        const data = response.data.data;
        setProducts(data);
        setPageIndex(2);
        setHasMore(data?.length >= 10);
      } else {
        Alert.alert(t('shop.productList.alerts.error'));
      }
    } catch (error) {
      console.error('Error in fetchInitialProducts:', error);
    } finally {
      setLoader(false);
    }
  },
  [memoizedFilter, selectedCategory, t],
);

  useEffect(() => {
    fetchInitialProducts(false);
  }, [fetchInitialProducts]);

  const fetchMoreProducts = useCallback(async () => {
    if (loader || !hasMore) return;

    setLoader(true);
    try {
      let body = {
        ...memoizedFilter.value,
        pageIndex: pageIndex,
        pageSize: 10,
          sortKey:'ID',
        sortValue:'asc'
      };

      if (selectedCategory.length) {
        const categoryFilter = `AND INVENTORY_CATEGORY_NAME IN (${selectedCategory
          .map(cat => `"${cat}"`)
          .join(',')})`;

        body.filter += ` ${categoryFilter}`;
      }

      const response = await apiCall.post('inventory/getForCart', body,
        
      );

      if (response.status === 200) {
        const data = response.data.data;
        if (data.length > 0) {
          setProducts(prev => [...prev, ...data]);
          setPageIndex(prev => prev + 1);
          setHasMore(data.length >= 10);
        } else {
          setHasMore(false);
        }
      } else {
        Alert.alert(t('shop.productList.alerts.error'));
      }
    } catch (error) {
      console.error('Error in fetchMoreProducts:', error);
    } finally {
      setLoader(false);
    }
  }, [loader, memoizedFilter.value, pageIndex, hasMore, selectedCategory, t]);

  const renderProduct = useCallback(
    ({item}: {item: Product}) => (
      <ProductCard
        navigation={navigation}
        product={item}
        onPress={() => {
          navigation.navigate('ProductDetails', {item});
        }}
        goToCart={() => navigation.navigate('Cart',{screen:'CartList'})}
        goToOrder={(cartID: number) =>
          navigation.navigate('PlaceOrder', {cartId: cartID})
        }
        refresh={fetchInitialProducts}
      />
    ),
    [navigation, fetchInitialProducts],
  );
  const fetchCategories = async () => {
    try {
      const response = await apiCall.post('app/getinventoryCategory', {
        filter: 'AND IS_ACTIVE=1',
         sortkey:'SEQ_NO',
        sortValue:'asc'
      });
      if (response.data.code === 200) {
        const uniqueByName = response.data.data.filter(
          (item, index, self) =>
            index ===
            self.findIndex(obj => obj.CATEGORY_NAME === item.CATEGORY_NAME),
        );
        setCategories(uniqueByName);
      } else {
        Toast('No categories found');
      }
    } catch (error) {
    } finally {
      setLoader(false);
    }
  };
  const filteredCategories = useMemo(() => {
    return categories.filter(item =>
      item.CATEGORY_NAME.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText, categories]);
  return (
    <SafeAreaView style={{flex: 1, gap: 8, backgroundColor: colors.white}}>
      <View style={styles.header}>
        <View style={{flex: 1, marginRight: 16}}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon
              name="arrow-back"
              type="Ionicons"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text numberOfLines={1} style={[styles.title, {color: colors.text}]}>
            {BRAND.BRAND_NAME}
          </Text>
        </View>
        <View style={{marginTop: 20}}>
          <TouchableOpacity
            onPress={() => {
              fetchCategories();
              setShowFilterModal(true);
              // setFilter(prev => ({...prev, isVisible: true}))
            }}>
            <Icon
              name="filter"
              type="AntDesign"
              size={26}
              color={colors.text}
            />
             {selectedCategory.length>0&&<View style={{height:10,width:10,backgroundColor:colors.primary,position:'absolute',right:0,borderRadius:5}}></View>}
                     
          </TouchableOpacity>
        </View>
      </View>

      {filter.label && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>{filter.label}</Text>
          <Icon
            onPress={() =>
              setFilter({
                isVisible: false,
                value: {
                  filter: ` AND STATUS = 1 AND IS_HAVE_VARIANTS = 0 ${
                    BRAND ? ' AND BRAND_ID = ' + BRAND.ID : ''
                  } AND INVENTORY_TYPE IN ("B", "P") `,
                  sortKey: '',
                  sortValue: '',
                },
                label: '',
              })
            }
            name="close"
            type="AntDesign"
            size={24}
            color={colors.text}
          />
        </View>
      )}

      <FilterModal
        visible={filter.isVisible}
        onClose={() => setFilter(prev => ({...prev, isVisible: false}))}
        onSelect={selectedFilter => {
          setFilter({
            isVisible: false,
            value: {...filter.value, ...selectedFilter.value},
            label: selectedFilter.label,
          });
        }}
      />

      <View style={{flex: 1}}>
        <FlatList
          removeClippedSubviews={false}
          data={sortedProducts}
          keyExtractor={item => `${item.ID}_${getEffectivePrice(item)}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                setFilter({
                  isVisible: false,
                  value: {
                    filter: ` AND STATUS = 1 AND IS_HAVE_VARIANTS = 0 ${
                      BRAND ? ' AND BRAND_ID = ' + BRAND.ID : ''
                    }  `,
                    sortKey: '',
                    sortValue: '',
                  },
                  label: '',
                });
                setProducts([]);
                setPageIndex(1);
                setHasMore(true);
              }}
            />
          }
          contentContainerStyle={{
            gap: 16,
            paddingBottom: 16,
            marginHorizontal: 16,
          }}
          renderItem={renderProduct}
          ListEmptyComponent={
            !loader ? <EmptyList title={t('shop.productList.empty')} /> : null
          }
          onEndReached={fetchMoreProducts}
          onEndReachedThreshold={0.5}
        />
      </View>
      <Loader show={loader} />

    
 {showFilterModal && (
  <CustomBottomModal
    show={showFilterModal}
    title="Filter"
    onClose={() => setShowFilterModal(false)}
   onClear={() => {
  setSelectedCategory([]);
  setTimeout(() => {
    setShowFilterModal(false);
  }, 100); // delay unmount slightly
}}
    onApply={async () => {
      await fetchInitialProducts(true);
      setShowFilterModal(false);
    }}
  >
    <View style={{ maxHeight: '90%' }}>
      {/* Toggle Buttons */}
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => setFilterIndex(1)}
          style={{
            backgroundColor: filterIndex === 1 ? colors.primary2 : 'white',
            flex: 1,
            borderWidth: 0.5,
            borderColor: colors.primary,
            padding: 8,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: filterIndex === 1 ? 'white' : 'black', fontFamily }}>
            Category
          </Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity
          onPress={() => setFilterIndex(2)}
          style={{
            backgroundColor: filterIndex === 2 ? colors.primary2 : 'white',
            flex: 1,
            borderWidth: 0.5,
            borderColor: colors.primary,
            padding: 8,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: filterIndex === 2 ? 'white' : 'black', fontFamily }}>
            Other
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {filterIndex === 1 && (
        <View>
                 <View style={{ marginVertical: 10 }}>
                   <TextInput
                     placeholder="Search category"
                     placeholderTextColor="#999"
                     value={searchText}
                     onChangeText={setSearchText}
                     rightChild={<Icon name="search" type="EvilIcons" />}
                   />
                 </View>
       
                 {filteredCategories?.length > 0 ? (
                   <View style={{ flexWrap: 'wrap', flexDirection: 'row' }}>
                     {filteredCategories.map(item => {
                       const isSelected = selectedCategory.includes(
                         item.CATEGORY_NAME
                       );
                       return (
                         <TouchableOpacity
                           key={item.CATEGORY_NAME}
                           onPress={() => {
                             setSelectedCategory(prev =>
                               isSelected
                                 ? prev.filter(cat => cat !== item.CATEGORY_NAME)
                                 : [...prev, item.CATEGORY_NAME]
                             );
                           }}
                           style={{
                             backgroundColor: isSelected ? colors.primary2 : '#fff',
                             paddingHorizontal: 12,
                             paddingVertical: 6,
                             borderWidth: 0.5,
                             borderColor: isSelected
                               ? colors.primary2
                               : colors.description,
                             margin: 6,
                             borderRadius: 8,
                           }}
                         >
                           <Text
                             style={{
                               fontFamily,
                               color: isSelected ? '#fff' : '#000',
                             }}
                           >
                             {item.CATEGORY_NAME}
                           </Text>
                         </TouchableOpacity>
                       );
                     })}
                   </View>
                 ) : (
                   <Text
                     style={{
                       textAlign: 'center',
                       color: '#999',
                       marginVertical: 20,
                     }}
                   >
                     No categories found
                   </Text>
                 )}
               </View>
      )}

      {/* Other Filter Tab */}
      {filterIndex === 2 && (
        <OtherFilterModal
          visible={filterIndex === 2}
          onClose={() => setFilter(prev => ({ ...prev, isVisible: false }))}
          onSelect={selectedFilter => {
            setFilter({
              isVisible: false,
              value: { ...filter.value, ...selectedFilter.value },
              label: selectedFilter.label,
            });
          }}
        />
      )}
    </View>
  </CustomBottomModal>
)}

    </SafeAreaView>
  );
};

export default ProductList;

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    height: 40,
    // backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  header: {
    marginTop: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
fontFamily: fontFamily,    fontSize: 20,
    fontWeight: '500',
  },
  filterLabel: {
    fontWeight: '500',
    fontSize: 18,
    fontFamily: fontFamily,
    color: '#636363',
  },
});
