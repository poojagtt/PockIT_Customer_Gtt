import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {_defaultImage} from '../../assets';
import {fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {Button, Icon} from '../../components';
import {useTranslation} from 'react-i18next';
import RNFS from 'react-native-fs';
import {OrderFileName} from '../../Functions';
import DownloadProgressModal from '../../components/DownloadProgressModal';

interface CartProductCardProps {
  product: CartProduct;
  showWarrantyDownload: boolean;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
}

const CartProductCard: React.FC<CartProductCardProps> = ({
  product,
  showWarrantyDownload,
  onDecrease,
  onIncrease,
}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [loader, setLoader] = useState(false);

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to download files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };
const [downloadLoader,setDownloadLoader]=useState(false);
const [progress,setProgress]=useState(0);

  const downloadWarrantyCard = async () => {
    setDownloadLoader(true);
    setProgress(0);
    try {
      // const sanitizedFileName = OrderFileName(product.WARRANTY_CARD).replace(
      //   /[^a-zA-Z0-9.\-_]/g,
      //   '_',
      // );
      const WarrantyCardUrl =
        IMAGE_URL + 'WarrantyCard/' + product.WARRANTY_CARD;

      let downloadDest = '';

      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Denied',
            'Cannot download file without storage permission.',
          );
          return;
        }
        downloadDest = `${RNFS.DownloadDirectoryPath}/${product.WARRANTY_CARD}`;
      } else {
        downloadDest = `${RNFS.DocumentDirectoryPath}/${product.WARRANTY_CARD}`;
      }

      const download = RNFS.downloadFile({
        fromUrl: WarrantyCardUrl,
        toFile: downloadDest,
        background: true,
        progress: res => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          setProgress( Math.round(progressPercent));
        },
        begin: res => console.log('Download started', res),
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
         setDownloadLoader(false);
        Alert.alert('Success', `Warranty Card downloaded to:\n${downloadDest}`);
      } else {
          setDownloadLoader(false);
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
      setProgress(100);
     
    } catch (error) {
      setProgress(0);
        setDownloadLoader(false);
      console.warn('Download Error:', error);

      Alert.alert('Error', 'Download failed. Please try again.');
    }
  };
  return (
    <View style={{gap: 8, backgroundColor: colors.white}}>
      <View
        style={{
          width: '100%',
          height: 243,
          borderRadius: 8,
          alignSelf: 'center',
        }}>
        <Image
          source={
            product.INVENTORY_IMAGE
              ? {
                  uri:
                    IMAGE_URL +
                    'InventoryImages/' +
                    product.INVENTORY_IMAGE,
                  cache: 'default',
                }
              : _defaultImage
          }
          resizeMode={'cover'}
          style={{flex: 1, width: '100%', height: '100%'}}
        />
      </View>

      <TouchableOpacity style={{gap: 4, width: '100%'}}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            fontFamily: fontFamily,
          }}>
          {product.VARIANT_COMBINATION
            ? product.VARIANT_COMBINATION
            : product?.PRODUCT_NAME
            ? product?.PRODUCT_NAME
            : product.SERVICE_NAME
            ? product.SERVICE_NAME
            : ''}
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderRadius: 8,
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: '#636363',
            fontFamily: fontFamily,
          }}>
          {t('shop.cartProduct.quantity')}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <>
            {/* <TouchableOpacity onPress={() => { onDecrease(product.ID) }}>
                            <Icon name="minus" type="Entypo" color={colors.text} size={20} />
                        </TouchableOpacity> */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: colors.text,
                borderRadius: 6,
                // borderWidth: 1,
                // borderColor: colors.black,
                // height: 28,
                // width: 28,
                textAlign: 'center',
                lineHeight: 28,
                fontFamily: fontFamily,
              }}>
              {product.QUANTITY}
            </Text>

            {/* <TouchableOpacity onPress={() => { onIncrease(product.ID) }}>
                            <Icon name="plus" type="Entypo" color={colors.text} size={20} />
                        </TouchableOpacity> */}
          </>
        </View>
      </View>
      {showWarrantyDownload && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '400',
              color: colors.text,
              borderRadius: 6,
              textAlign: 'center',
              lineHeight: 28,
              fontFamily: fontFamily,
            }}>
            Warranty Card
          </Text>
          <TouchableOpacity
          
            onPress={() => downloadWarrantyCard()}
            style={{alignSelf: 'flex-end',paddingHorizontal:10}}>
            <Icon name="download" type="AntDesign"></Icon>
          </TouchableOpacity>
        </View>

        
      )}
      <View style={{borderColor: colors.disable, borderBottomWidth: 1}} />


       <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <DownloadProgressModal
          visible={downloadLoader}
          progress={progress}
          onClose={() => {
            
          }}
        />
      </View>
    </View>
  );
};

export default CartProductCard;

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // minHeight: 337,
    width: '100%',
    //maxWidth: 358,
    fontFamily: fontFamily,
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#092B9C',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#092B9C',
      },
    }),
  },
});
