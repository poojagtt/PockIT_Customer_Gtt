// import {View, Text, Alert, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
// import React, {useEffect, useMemo, useState} from 'react';
// import {SafeAreaView} from 'react-native-safe-area-context';
// import {Button, Header, Icon, Loader, TextInput} from '../../components';
// import {useTranslation} from 'react-i18next';
// import {ShopRoutes} from '../../routes/Shops';
// import {apiCall, fontFamily, useTheme} from '../../modules';
// import ProductCard from './ProductCard';
// import Modal from '../../components/Modal';
// import Toast from '../../components/Toast';
// import BottomModalWithCloseButton from '../../components/BottomModalWithCloseButton';
// import CustomBottomModal from '../../components/CustomBottomModal';

// interface LatesALlProductProps extends ShopRoutes<'PopularBrands'> {}
// const LatestAllProduct: React.FC<LatesALlProductProps> = ({
//   navigation,
//   route,
// }) => {
//   const {type} = route.params;
//   console.log('type', type);
//   const {t} = useTranslation();
//   const [loader, setLoader] = useState<boolean>(false);
//   const [latestProducts, setLatestProducts] = useState<Product[]>([]);
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
//   const [hasMoreData, setHasMoreData] = useState<boolean>(true);
//   const [selectedCategory, setSelectedCategory] = useState([]);
//   const [categories, setCategories] = useState<string[]>([]);
//   const PAGE_SIZE = 10;
//   const colors = useTheme();
//   const [searchText, setSearchText] = useState('');

//   useEffect(() => {
//     fetchLatestProducts();
//     fetchCategories();
//   }, []);

//   const fetchLatestProducts = async (
//     page: number = 1,
//     isLoadMore: boolean = false,
//   ) => {
//     if (isLoadMore) {
//       setIsLoadingMore(true);
//     } else {
//       setLoader(true);
//     }

//     try {
//       const extraFilter =
//         type == 'R' ? 'AND IS_REFURBISHED = 1' : 'AND IS_REFURBISHED = 0';
//       const categoryFilter = selectedCategory.length
//         ? `AND INVENTORY_CATEGORY_NAME IN (${selectedCategory
//             .map(cat => `"${cat}"`)
//             .join(',')})`
//         : '';
//       const response = await apiCall.post('inventory/getForCart', {
//         filter: `AND STATUS = 1 ${extraFilter} ${categoryFilter} AND IS_HAVE_VARIANTS = 0 AND INVENTORY_TYPE IN ("B", "P")`,
//         pageIndex: page,
//         pageSize: PAGE_SIZE,
//       });
//       console.log('data@@@', response.data);
//       if (response.data.code === 200) {
//         const newProducts = response.data.data;
//         if (isLoadMore) {
//           setLatestProducts(prev => [...prev, ...newProducts]);
//         } else {
//           setLatestProducts(newProducts);
//         }

//         // Check if we have more data to load
//         setHasMoreData(newProducts.length === PAGE_SIZE);
//       } else {
//         Alert.alert(t('shop.productList.alerts.error'));
//       }
//     } catch (error) {
//       console.error('Error in fetchLatestProducts:', error);
//     } finally {
//       setLoader(false);
//       setIsLoadingMore(false);
//     }
//   };
//   const filteredCategories = useMemo(() => {
//     return categories.filter(item =>
//       item.CATEGORY_NAME.toLowerCase().includes(searchText.toLowerCase()),
//     );
//   }, [searchText, categories]);
//   const fetchCategories = async () => {
//     try {
//       const response = await apiCall.post('app/getinventoryCategory', {
//         filter:'AND IS_ACTIVE=1'
//       });
//       console.log('categories', response.data);
//       if (response.data.code === 200) {
//         const uniqueByName = response.data.data.filter(
//           (item, index, self) =>
//             index ===
//             self.findIndex(obj => obj.CATEGORY_NAME === item.CATEGORY_NAME),
//         );
//         setCategories(uniqueByName);
//         console.log('categories', response.data.data);
//       } else {
//         Toast('No categories found');
//       }
//     } catch (error) {
//     } finally {
//       setLoader(false);
//       setIsLoadingMore(false);
//     }
//   };

//   const handleLoadMore = () => {
//     if (!isLoadingMore && hasMoreData) {
//       const nextPage = currentPage + 1;
//       setCurrentPage(nextPage);
//       fetchLatestProducts(nextPage, true);
//     }
//   };
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   return (
//     <SafeAreaView
//     pointerEvents="box-none"
//       style={{
//         flex: 1,
//         gap: 5,
//         backgroundColor: '#FDFDFD',
//       }}>
//       <View>
//         <Header
//           label={
//             type == 'R'
//               ? t('shop.refurbished.allProduct')
//               : t('shop.latest.allProduct')
//           }
//           onBack={() => navigation.goBack()}
//           rightChild={
//             <TouchableOpacity
//               onPress={() => {
//                 console.log('here');
//                 setShowFilterModal(true);
//               }}>
//               <Icon color={colors.text} size={26} name="filter" type="AntDesign"></Icon>
//             </TouchableOpacity>
//           }
//         />
//       </View>
//       <View style={{flex: 1, paddingHorizontal: 14}}>
//         <FlatList
//           data={latestProducts}
//           showsVerticalScrollIndicator={false}
//           ItemSeparatorComponent={() => <View style={{height: 17}} />}
//           renderItem={({item, index}) => {
//             return (
//               <ProductCard
//                 key={`${item.ID}-${index}`}
//                 product={item}
//                 onPress={() => {
//                   console.log('item!!!!!!!!!!', item);
//                   navigation.navigate('ProductDetails', {item});
//                 }}
//                 goToCart={() => navigation.navigate('CartList')}
//                 goToOrder={(cartID: number) =>
//                   navigation.navigate('PlaceOrder', {cartId: cartID})
//                 }
//                 refresh={() => {
//                   setCurrentPage(1);
//                   fetchLatestProducts(1);
//                 }}
//               />
//             );
//           }}
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={() =>
//             isLoadingMore ? (
//               <View style={{paddingVertical: 20}}>
//                 <Loader show={true} />
//               </View>
//             ) : null
//           }
//         />
//       </View>
//       <Loader show={loader} />

     
     
// <CustomBottomModal
//   show={showFilterModal}
//   title="Categories"
//   onClose={() => setShowFilterModal(false)}
//   onClear={async () => {
//     setSelectedCategory([]);
//     await fetchLatestProducts();
//     setShowFilterModal(false);
//   }}
//   onApply={async () => {
//     await fetchLatestProducts();
//     setShowFilterModal(false);
//   }}
// >
//   {/* Your search input and category chips */}
//   <View>
//     <View style={{ marginVertical: 10 }}>
//       <TextInput
//         placeholder="Search category"
//         placeholderTextColor="#999"
//         value={searchText}
//         onChangeText={setSearchText}
//         rightChild={<Icon name="search" type="EvilIcons" />}
//       />
//     </View>

//     {filteredCategories?.length > 0 ? (
//       <View style={{ flexWrap: 'wrap', flexDirection: 'row' }}>
//         {filteredCategories.map(item => {
//           const isSelected = selectedCategory.includes(item.CATEGORY_NAME);
//           return (
//             <TouchableOpacity
//               key={item.CATEGORY_NAME}
//               onPress={() => {
//                 if (isSelected) {
//                   setSelectedCategory(prev =>
//                     prev.filter(cat => cat !== item.CATEGORY_NAME),
//                   );
//                 } else {
//                   setSelectedCategory(prev => [
//                     ...prev,
//                     item.CATEGORY_NAME,
//                   ]);
//                 }
//               }}
//               style={{
//                 backgroundColor: isSelected ? colors.primary2 : '#fff',
//                 paddingHorizontal: 12,
//                 paddingVertical: 6,
//                 borderWidth: 0.5,
//                 borderColor: isSelected
//                   ? colors.primary2
//                   : colors.description,
//                 margin: 6,
//                 borderRadius: 8,
//               }}
//             >
//               <Text
//                 style={{
//                   fontFamily,
//                   color: isSelected ? '#fff' : '#000',
//                 }}
//               >
//                 {item.CATEGORY_NAME}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     ) : (
//       <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>
//         No categories found
//       </Text>
//     )}
//   </View>
// </CustomBottomModal>
     
//     </SafeAreaView>
//   );
// };

// export default LatestAllProduct;


import {
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Icon, Loader, TextInput } from '../../components';
import { useTranslation } from 'react-i18next';
import { ShopRoutes } from '../../routes/Shops';
import { apiCall, fontFamily, useTheme } from '../../modules';
import ProductCard from './ProductCard';
import Toast from '../../components/Toast';
import CustomBottomModal from '../../components/CustomBottomModal';

interface LatesALlProductProps extends ShopRoutes<'PopularBrands'> {}
const LatestAllProduct: React.FC<LatesALlProductProps> = ({
  navigation,
  route,
}) => {
  const { type } = route.params;
  const { t } = useTranslation();
  const [loader, setLoader] = useState(false);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const PAGE_SIZE = 10;
  const colors = useTheme();

  useEffect(() => {
    fetchLatestProducts(1, false, selectedCategory);
    fetchCategories();
  }, []);

  const fetchLatestProducts = async (
    page: number = 1,
    isLoadMore: boolean = false,
    categoryList: string[] = selectedCategory
  ) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoader(true);
    }

    try {
      const extraFilter =
        type === 'R' ? 'AND IS_REFURBISHED = 1' : 'AND IS_REFURBISHED = 0';
      const categoryFilter = categoryList.length
        ? `AND INVENTORY_CATEGORY_NAME IN (${categoryList
            .map(cat => `"${cat}"`)
            .join(',')})`
        : '';

      const response = await apiCall.post('inventory/getForCart', {
        filter: `AND STATUS = 1 ${extraFilter} ${categoryFilter} AND IS_HAVE_VARIANTS = 0 AND INVENTORY_TYPE IN ("B", "P")`,
        pageIndex: page,
        pageSize: PAGE_SIZE,
         sortKey:'ID',
        sortValue:'asc'
      });

      if (response.data.code === 200) {
        const newProducts = response.data.data;
        if (isLoadMore) {
          setLatestProducts(prev => [...prev, ...newProducts]);
        } else {
          setLatestProducts(newProducts);
        }

        setHasMoreData(newProducts.length === PAGE_SIZE);
      } else {
        Alert.alert(t('shop.productList.alerts.error'));
      }
    } catch (error) {
      console.error('Error in fetchLatestProducts:', error);
    } finally {
      setLoader(false);
      setIsLoadingMore(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiCall.post('app/getinventoryCategory', {
        filter: 'AND IS_ACTIVE=1',
        sortkey:'SEQ_NO',
        sortValue:'asc'
      });

      if (response.data.code === 200) {
        console.log("categories",response.data.data)
        const uniqueByName = response.data.data.filter(
          (item, index, self) =>
            index ===
            self.findIndex(obj => obj.CATEGORY_NAME === item.CATEGORY_NAME)
        );
        setCategories(uniqueByName);
      } else {
        Toast('No categories found');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(item =>
      item.CATEGORY_NAME.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, categories]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchLatestProducts(nextPage, true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
      <Header
        label={
          type === 'R'
            ? t('shop.refurbished.allProduct')
            : t('shop.latest.allProduct')
        }
        onBack={() => navigation.goBack()}
        rightChild={
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Icon
              color={colors.text}
              size={26}
              name="filter"
              type="AntDesign"
            />
            {selectedCategory.length>0&&<View style={{height:10,width:10,backgroundColor:colors.primary,position:'absolute',right:0,borderRadius:5}}></View>}
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1, paddingHorizontal: 14 }}>
        <FlatList
        ListEmptyComponent={<View style={{flex:1,alignItems:'center',justifyContent:'center',marginTop:'50%'}}>
          <Text> No Data Found</Text>
         </View>}
          data={latestProducts}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 17 }} />}
          renderItem={({ item, index }) => (
            <ProductCard
            navigation={navigation}
              key={`${item.ID}-${index}`}
              product={item}
              onPress={() => {
                navigation.navigate('ProductDetails', { item });
              }}
              goToCart={() => navigation.navigate('CartList')}
              goToOrder={(cartID: number) =>
                navigation.navigate('PlaceOrder', { cartId: cartID })
              }
              refresh={() => {
                setCurrentPage(1);
                fetchLatestProducts(1, false, selectedCategory);
              }}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <Loader show={true} />
              </View>
            ) : null
          }
        />
      </View>

      <Loader show={loader} />

      <CustomBottomModal
        show={showFilterModal}
        title="Categories"
        onClose={() => setShowFilterModal(false)}
        onClear={async () => {
          setSelectedCategory([]);
          setCurrentPage(1);
          await fetchLatestProducts(1, false, []);
          setShowFilterModal(false);
        }}
        onApply={async () => {
          setCurrentPage(1);
          await fetchLatestProducts(1, false, selectedCategory);
          setShowFilterModal(false);
        }}
      >
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
      </CustomBottomModal>
    </SafeAreaView>
  );
};

export default LatestAllProduct;
