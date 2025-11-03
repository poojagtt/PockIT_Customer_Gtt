import {
  KeyboardTypeOptions,
  Text,
  TextInput as TextField,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {fontFamily, GlobalStyle, Size, useTheme} from '../modules';
interface INPUT_INTERFACE extends TextInputProps {
  leftChild?: any;
  rightChild?: any;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  disable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  labelStyle?: TextStyle;
  hidden?: boolean;
  imp?: boolean;
  infoMessage?: string;
  onPress?: () => void;
}
const TextInput: React.FC<INPUT_INTERFACE> = ({
  leftChild,
  rightChild,
  value,
  placeholder,
  onChangeText,
  disable,
  keyboardType = 'default',
  multiline = false,
  maxLength,
  style,
  textStyle,
  error,
  errorMessage,
  label,
  labelStyle,
  hidden,
  infoMessage,
  imp,
  onPress,
  ...rest
}: INPUT_INTERFACE) => {
  const colors = useTheme();
  return (
    <View style={{alignSelf: 'stretch', gap: 4}}>
      {label ? (
        <Text
          style={[GlobalStyle.fieldLabel, {color: colors.text}, labelStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + label}
          {imp ? (
            <Text style={{color: colors.error, fontFamily: fontFamily}}>
              {'*'}
            </Text>
          ) : null}
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
              : '#CBCBCB',
            backgroundColor: disable
              ? colors.disable + '20'
              : error
              ? colors.error + '20'
              : colors.background,
          },
          style,
        ]}>
        {leftChild ? leftChild : null}
        <TextField
          style={[
            GlobalStyle.input,
            GlobalStyle.inputText,

            {
              height: multiline ? Size.field * 3 : undefined,
              color: colors.text,
              paddingLeft: 8,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            textStyle,
          ]}
          secureTextEntry={hidden ? true : false}
          keyboardType={keyboardType}
          value={value}
          onChangeText={(text: string) => {
            disable ? null : onChangeText(text);
          }}
          editable={onPress ? true : !disable}
          placeholder={placeholder}
          placeholderTextColor={error ? colors.error + '80' : colors.disable}
          multiline={multiline}
          maxLength={maxLength}
          {...rest}
        />
        {rightChild ? rightChild : null}
      </View>
      {!error && infoMessage && (
        <Text
          style={{
            ...GlobalStyle.errorMessage,
            ...labelStyle,
            color: colors.info,
            fontFamily: fontFamily,
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
            fontFamily: fontFamily,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + errorMessage}
        </Text>
      )}
    </View>
  );
};

export default TextInput;
