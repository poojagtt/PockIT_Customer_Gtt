import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import EvilIconsIcon from 'react-native-vector-icons/EvilIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome5ProIcon from 'react-native-vector-icons/FontAwesome5Pro';
import FontistoIcon from 'react-native-vector-icons/Fontisto';
import FoundationIcon from 'react-native-vector-icons/Foundation';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIconsIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIconsIcon from 'react-native-vector-icons/MaterialIcons';
import OcticonsIcon from 'react-native-vector-icons/Octicons';
import SimpleLineIconsIcon from 'react-native-vector-icons/SimpleLineIcons';
import ZocialIcon from 'react-native-vector-icons/Zocial';
import React from 'react';
import {Size, useTheme} from '../modules';
export interface ICON_PROPS {
  name: string;
  type:
    | 'AntDesign'
    | 'Entypo'
    | 'EvilIcons'
    | 'Feather'
    | 'FontAwesome'
    | 'FontAwesome5'
    | 'FontAwesome5Pro'
    | 'Fontisto'
    | 'Foundation'
    | 'Ionicons'
    | 'MaterialCommunityIcons'
    | 'MaterialIcons'
    | 'Octicons'
    | 'SimpleLineIcons'
    | 'Zocial';
  color?: string;
  size?: number;
  onPress?: () => void;
  disable?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}
const IconComponent = ({name, type, color, size}: any) => {
  switch (type) {
    case 'AntDesign':
      return <AntDesignIcon name={name} size={size} color={color}  />;
    case 'Entypo':
      return <EntypoIcon name={name} size={size} color={color} />;
    case 'EvilIcons':
      return <EvilIconsIcon name={name} size={size} color={color} />;
    case 'Feather':
      return <FeatherIcon name={name} size={size} color={color} />;
    case 'FontAwesome':
      return <FontAwesomeIcon name={name} size={size} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5Icon name={name} size={size} color={color} />;
    case 'FontAwesome5Pro':
      return <FontAwesome5ProIcon name={name} size={size} color={color} />;
    case 'Fontisto':
      return <FontistoIcon name={name} size={size} color={color} />;
    case 'Foundation':
      return <FoundationIcon name={name} size={size} color={color} />;
    case 'Ionicons':
      return <IoniconsIcon name={name} size={size} color={color} />;
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIconsIcon name={name} size={size} color={color} />
      );
    case 'MaterialIcons':
      return <MaterialIconsIcon name={name} size={size} color={color} />;
    case 'Octicons':
      return <OcticonsIcon name={name} size={size} color={color} />;
    case 'SimpleLineIcons':
      return <SimpleLineIconsIcon name={name} size={size} color={color} />;
    case 'Zocial':
      return <ZocialIcon name={name} size={size} color={color} />;
    default:
      return null;
  }
};
const Icon = ({
  style,
  name,
  type,
  color,
  size = 20,
  onPress,
  disable,
  loading,
}: ICON_PROPS) => {
  const colors = useTheme();
  if (onPress) {
    return (
      <TouchableOpacity
        hitSlop={{
          bottom: Size.base,
          left: Size.base,
          right: Size.base,
          top: Size.base,
        }}
        onPress={onPress}
        activeOpacity={0.7}
        style={{...style}}
        disabled={disable || loading}>
        {loading ? (
          <ActivityIndicator color={color ? color : colors.primary} />
        ) : (
            <IconComponent
              
            name={name}
            type={type}
            color={color ? color : colors.primary}
            size={size}
          />
        )}
      </TouchableOpacity>
    );
  } else {
    return (
      <View
        hitSlop={{
          bottom: Size.base,
          left: Size.base,
          right: Size.base,
          top: Size.base,
        }}
        style={{...style}}>
        <IconComponent
          name={name}
          type={type}
          color={color ? color : colors.primary}
          size={size}
        />
      </View>
    );
  }
};
export default Icon;
