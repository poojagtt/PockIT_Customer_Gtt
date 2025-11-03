import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {fontFamily, Size, useTheme} from '../modules';
import Icon from './Icon';
import ThreeDotMenu from '../screens/shop/ThreeDotMenu';
interface HeaderProps {
  label: string;
  onBack?: () => void;
  onFilter?: () => void;
  onSearch?: () => void;
  rightChild?: React.ReactNode;
  leftChild?: React.ReactNode;
}
const Header: React.FC<HeaderProps> = ({
  label,
  leftChild,
  onBack,
  onFilter,
  onSearch,
  rightChild,
}) => {
  const colors = useTheme();
  return (
    <View
      style={{
        height: 70,
        backgroundColor: colors.white,
        paddingHorizontal: Size.containerPadding,
        paddingVertical: 8,
        // gap: 5,
        alignItems: 'flex-start',
        maxHeight: 100,
      }}>
      <View style={{flexDirection: 'row'}}>
        {onBack ? (
      

            <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={24}
            color={'#0E0E0E'}
            onPress={onBack}
          />
        ) : null}
        {leftChild ? leftChild : null}

        {onFilter ? (
          <Icon
            name="filter"
            type="Feather"
            color={colors.background}
            onPress={onFilter}
          />
        ) : null}
        {onSearch ? (
          <Icon
            name="search"
            type="Ionicons"
            color={colors.background}
            onPress={onSearch}
          />
        ) : null}
      
      </View>
    <View
  style={{
    flexDirection: 'row',
    justifyContent: rightChild ? 'space-between' : 'center',
    alignItems: 'center',
  }}
>
  <Text
    numberOfLines={1}
    style={{
      flex: rightChild ? 1 : undefined,
      fontSize: 18,
      fontWeight: '500',
      fontFamily: fontFamily
    }}
  >
    {label}
  </Text>
  {rightChild && rightChild}
</View>

    </View>
  );
};
export default Header;
const styles = StyleSheet.create({
  container: {},
});
