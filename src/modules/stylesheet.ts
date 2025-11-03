import {StyleSheet} from 'react-native';
import {Size} from './themes';

export const _styles = StyleSheet.create({
  separator: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'lightgray',
    marginVertical: Size.padding,
  },
  floatingBottomRight: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    bottom: Size.containerPadding,
    right: Size.containerPadding,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
