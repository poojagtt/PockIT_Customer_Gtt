import React, {ReactNode, useState} from 'react';
import {View, Text, TextStyle, ViewStyle, TouchableOpacity} from 'react-native';
import moment from 'moment';
// import DateTimePicker from 'react-native-date-picker';
import DateTimePicker from 'react-native-modern-datepicker';
import Icon from './Icon';
import Modal from './Modal';
import {fontFamily, Size, useTheme} from '../modules';
interface DatePickerProps {
  value: string | Date;
  onChangeText: (text: string) => void;
  type?: 'date' | 'time' | 'datetime';
  label?: string;
  labelStyle?: TextStyle;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  error?: boolean;
  loading?: boolean;
  disable?: boolean;
  leftChild?: ReactNode;
  rightChild?: ReactNode;
  placeholder?: string;
  format?: string;
  maxDate?: string | Date;
  minDate?: string | Date;
  imp?: boolean;
  defaultDate?: string | Date;
}
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChangeText,
  type,
  label,
  labelStyle,
  containerStyle,
  style,
  error,
  disable,
  leftChild,
  rightChild,
  format = 'DD/MMM/YYYY',
  placeholder,
  maxDate,
  minDate,
  imp,
  defaultDate,
}) => {
  const Color = useTheme();
  const [show, setShow] = useState(false);
  return (
    <View>
      {label && (
        <Text
          style={{
            fontFamily: fontFamily,
            backgroundColor: '#00000000',
            color: Color.text,
            ...labelStyle,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {'' + label}
          {imp ? '*' : ''}
        </Text>
      )}
      <TouchableOpacity
        disabled={disable ? disable : false}
        onPress={() => {
          setShow(true);
        }}
        style={[
          {
            width: '100%',
            borderRadius: Size.radius,
            borderColor: disable
              ? Color.disable
              : error
              ? Color.error
              : Color.primary,
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            // backgroundColor: Color.white,
            backgroundColor: disable
              ? Color.disable + 20
              : error
              ? Color.error + 20
              : Color.white,
            shadowColor: Color.primary,
            height: Size.field,
          },
          {...containerStyle},
        ]}>
        {leftChild ? leftChild : null}
        <Text
          style={[
            {
              flex: 1,
              fontFamily: fontFamily,
              paddingHorizontal: Size.padding,
              // ...Font.Regular3,
              alignItems: 'center',
              textAlignVertical: 'center',
              justifyContent: 'center',
              color: !String(value)?.length
                ? Color.disable
                : error
                ? Color.error
                : Color.text,
              paddingVertical: 0,
            },
            {...style},
          ]}>
          {!String(value)?.length ? placeholder : moment(value).format(format)}
        </Text>
        {type == 'time' ? (
          <Icon
            name="clock"
            type="Feather"
            color={
              error ? Color.error : disable ? Color.disable : Color.primary
            }
            style={{marginRight: Size.padding}}
          />
        ) : (
          <Icon
            name="calendar-month-outline"
            type="MaterialCommunityIcons"
            color={
              error ? Color.error : disable ? Color.disable : Color.primary
            }
            style={{marginRight: Size.padding}}
          />
        )}
        {rightChild ? rightChild : null}
      </TouchableOpacity>
      <Modal show={show} onClose={() => setShow(false)}>
        <DateTimePicker
          selected={
            value
              ? moment(value).format('YYYY/MM/DD')
              : defaultDate
              ? moment(defaultDate).format('YYYY/MM/DD')
              : moment().format('YYYY/MM/DD')
          }
          current={
            value
              ? moment(value).format('YYYY/MM/DD')
              : defaultDate
              ? moment(defaultDate).format('YYYY/MM/DD')
              : moment().format('YYYY/MM/DD')
          }
          mode={type == 'time' ? 'time' : 'calendar'}
          onDateChange={date => {
            setShow(false);
            onChangeText(
              moment(date, 'YYYY/MM/DD').format('YYYY-MM-DD HH:mm:ss'),
            );
          }}
          minimumDate={
            minDate ? moment(minDate).format('YYYY-MM-DD') : undefined
          }
          maximumDate={
            maxDate ? moment(maxDate).format('YYYY-MM-DD') : undefined
          }
          onTimeChange={time => {
            setShow(false);
            onChangeText(moment(time, 'HH:mm').format('YYYY-MM-DD HH:mm:ss'));
          }}
          minuteInterval={1}
        />
      </Modal>
    </View>
  );
};
export default DatePicker;
