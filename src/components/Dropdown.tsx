import {Text, TextStyle, View, ViewStyle} from 'react-native';
import React, {ReactNode} from 'react';
import {fontFamily, GlobalStyle, Size, useTheme} from '../modules';
import {Dropdown as DropMenu} from 'react-native-element-dropdown';
interface DROPDOWN_INTERFACE {
  search?: boolean;
  leftChild?: ReactNode;
  rightChild?: ReactNode;
  data: any[];
  value: any;
  labelField: string;
  valueField: string;
  placeholder?: string;
  onChangeText: (text: any) => void;
  disable?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  labelStyle?: TextStyle;
  imp?: boolean;
  infoMessage?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}
const Dropdown: React.FC<DROPDOWN_INTERFACE> = ({
  leftChild,
  rightChild,
  search,
  data,
  value,
  placeholder,
  onChangeText,
  labelField = 'label',
  valueField = 'id',
  disable,
  multiline = false,
  style,
  error,
  errorMessage,
  label,
  labelStyle,
  infoMessage,
  imp,
  containerStyle,
  textStyle,
}) => {
  const colors = useTheme();
  return (
    <View style={[{alignSelf: 'stretch', gap: Size.base}, containerStyle]}>
      {label ? (
        <Text
          style={[GlobalStyle.fieldLabel, {color: colors.text}, labelStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + label}
          {imp ? <Text style={{color: colors.error}}>{'*'}</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          GlobalStyle.field,
          {
            borderColor: disable
              ? colors.disable
              : error
              ? colors.error
             // : colors.primary2,
              :'gray',
            backgroundColor: disable
              ? colors.disable + '20'
              : error
              ? colors.error + '20'
              : colors.background,
          },
          style,
        ]}>
          
        {leftChild ? leftChild : null}
        <DropMenu
          data={data}
          search={search}
          labelField={labelField}
          valueField={valueField}
          placeholder={placeholder}
          value={value}
          onChange={onChangeText}
          style={[
            GlobalStyle.input,
            GlobalStyle.inputText,
            {
              height: multiline ? Size.field * 3 : Size.field,
              color: colors.text,
            },
            textStyle,
          ]}
          containerStyle={{}}
          autoScroll={false}
        />
        {rightChild ? rightChild : null}
      </View>
      {!error && infoMessage && (
        <Text
          style={{
            ...GlobalStyle.errorMessage,
            ...labelStyle,
            color: colors.info,
            fontFamily: fontFamily
          }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + infoMessage}
        </Text>
      )}
      {error && errorMessage && (
        <Text
          style={{
            ...GlobalStyle.errorMessage,
            ...labelStyle,
            color: colors.error,
            fontFamily: fontFamily
          }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + errorMessage}
        </Text>
      )}
    </View>
  );
};

export default Dropdown;
