import {Dimensions, StyleSheet, useColorScheme} from 'react-native';

type colorTheme = {
  primary: string;
  primary2: string;
  secondary: string;
  secondary2: string;
  background: string;
  text: string;
  heading: string;
  subHeading: string;
  description: string;
  disable: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  white: string;
  black: string;
  modalBackground: string;
  border: string;
  shadow: string;
  onBack: string;
  buttonbackground: string;
  textColor: string;
};

const LightTheme: colorTheme = {
  primary: '#092B9C',
  primary2: '#3170DE',
  secondary: '#F05A28',
  secondary2: '#50C1FF',
  background: '#F6F8FF',
  text: '#000000',
  heading: '#333333',
  subHeading: '#CCCCCC',
  description: '#666666',
  disable: '#cccccc',
  error: '#ff0000',
  success: '#00ff00',
  warning: '#ffff00',
  info: '#0000ff',
  white: '#ffffff',
  black: '#000000',
  modalBackground: 'rgba(0,0,0,.25)',
  border: '#E5E5E5',
  shadow: '#000000',
  onBack: '#636363',
  buttonbackground: '#3170DE',
  textColor: '#636363',
};
const darkTheme: colorTheme = {
  primary: '#092B9C',
  primary2: '#3170DE',
  secondary: '#F05A28',
  secondary2: '#50C1FF',
  background: '#F6F8FF',
  text: '#000000',
  heading: '#333333',
  subHeading: '#CCCCCC',
  description: '#666666',
  disable: '#cccccc',
  error: '#ff0000',
  success: '#00ff00',
  warning: '#ffff00',
  info: '#0000ff',
  white: '#ffffff',
  black: '#000000',
  modalBackground: 'rgba(0,0,0,.25)',
  border: '#E5E5E5',
  shadow: '#000000',
  onBack: '#636363',
  buttonbackground: '#3170DE',
  textColor: '#636363',
};
export const useTheme = () =>
  useColorScheme() === 'light' ? LightTheme : darkTheme;
export const Size = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  base: 4,
  paddingY: 6,
  padding: 8,
  paddingX: 12,
  radius: 16,
  containerPadding: 18,
  field: 40,
  button: 35,
};
export const fontFamily = 'SF-Pro-Text-Regular';
export const GlobalStyle = StyleSheet.create({
  fieldLabel: {
    fontFamily: 'SF-Pro-Text-Bold',
    fontSize: 13,
    fontWeight: '400',
    paddingLeft: 8,
    lineHeight: 16,
    color: '#636363',

  },
  errorMessage: {
    fontFamily: fontFamily,
    fontSize: Size.sm,
    left: Size.sm,
  },
  field: {
    borderRadius: 8,
    flexDirection: 'row',
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    // gap: 10,
    paddingHorizontal: 8,
    minHeight: 46,
    // elevation: 5,
    // shadowColor: '#000',
    // shadowOpacity: 0.5,
    // shadowOffset: {width: 0, height: 0},
    // shadowRadius: 5,
  },
  input: {
    flex: 1,
    borderRadius: Size.radius,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  inputText: {
    fontSize: 15,
    fontFamily,
    fontWeight: '400',
    // lineHeight: 22.5,
    alignItems: 'center',
    textAlign: 'left',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    fontFamily: fontFamily
  },
});
