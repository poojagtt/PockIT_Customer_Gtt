import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {fontFamily, IMAGE_URL, Size, useTheme} from '../../modules';
import {Icon} from '../../components';
import {_defaultImage} from '../../assets';
import {Colors} from 'react-native/Libraries/NewAppScreen';

interface CatLogTilesProps {
  item: ServicesInterface;
  onPress: () => void;
}
const CatLogTiles: React.FC<CatLogTilesProps> = ({item, onPress}) => {
  console.log('item.SERVICE_IMAGE', item.SERVICE_IMAGE);
  console.log('item.SERVICE_IMAGE', item);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 24,
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
            borderRadius: 30,
            // backgroundColor: '#D9D9D9',
          }}
          defaultSource={_defaultImage}
          source={
            item.SERVICE_IMAGE
              ? {
                  uri: IMAGE_URL + 'Item/' + item.SERVICE_IMAGE,
                  cache: 'default',
                }
              : _defaultImage
          }
        />
      </View>
      <View
        style={{
          flex: 1,
          // alignItems: 'center',
          // justifyContent: 'center',
        }}>
        <Text
          style={{
            paddingHorizontal: 8,
            paddingVertical: 10,
            fontFamily: fontFamily,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 19.9,
            color: Colors.text,
            opacity: 0.8,
          }}>
          {item.SERVICE_NAME}
        </Text>
        {/* {item.SERVICE_DESCRIPTION ? (
          <Text
            style={{
              paddingHorizontal: 8,
              paddingVertical: 10,
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 19.9,
              color: '#333333',
              opacity: 0.8,
            }}
            numberOfLines={2}>
            {item.SERVICE_DESCRIPTION}
          </Text>
        ) : null} */}
      </View>
      <Icon type="Feather" name={'chevron-right'} size={23} color={'#636363'} />
    </TouchableOpacity>
  );
};
export default CatLogTiles;
const styles = StyleSheet.create({});
