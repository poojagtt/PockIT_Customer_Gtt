import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useState } from 'react';
import { fontFamily, useTheme } from '../modules';

export const CustomRadioButton = ({ label, value, selected, onPress }) => {
      const colors = useTheme();
    
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
    >
      <View
        style={{
          height: 20,
          width: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ?colors.primary: '#ccc',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <View
            style={{
              height: 10,
              width: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
      </View>
      <Text style={{ marginLeft: 10,fontFamily: fontFamily }}>{label}</Text>
    </TouchableOpacity>
  );
};
