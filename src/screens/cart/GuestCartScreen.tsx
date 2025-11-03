import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Button, Header, Icon} from '../../components';
import {
  fontFamily,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {Reducers, useDispatch, useSelector} from '../../context';

interface GuestCartScreenProps {
  navigation: any;
}

const GuestCartScreen: React.FC<GuestCartScreenProps> = ({navigation}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.app);

  const onBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    if (user?.ID === 0) {
      useStorage.clearAll();
      tokenStorage.clearToken();
      dispatch(Reducers.setSplash(true));
      return;
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={{padding:16}}><Text style={{fontFamily:fontFamily,fontSize:18}}>Cart</Text></View>
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: colors.background,
          },
        ]}>
        <View style={styles.iconContainer}>
          <Icon
            name="shopping-cart"
            type="FontAwesome"
            size={80}
            color={colors.primary}
            style={{
              padding: Size['2xl'],
              borderRadius: 100,
              aspectRatio: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary + '15',
            }}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: colors.primary,fontFamily: fontFamily}]}>
            Empty Cart
          </Text>
          <Text style={[styles.subtitle, {color: colors.text}]}>
            Please login to your account to access your shopping cart and view
            your items
          </Text>
        </View>

        <Button
          label="Sign In"
          onPress={() => {
            handleLogin();
          }}
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default GuestCartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Size.lg,
  },
  iconContainer: {
    marginBottom: Size.xl,
  },
  icon: {
    padding: Size.lg,
    borderRadius: Size.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: Size.sm,
    marginBottom: Size.xl,
  },
  title: {
    fontSize: Size.xl * 1.5,
    fontWeight: 'bold',
    fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Size.md,
    fontFamily,
    textAlign: 'center',
    lineHeight: Size.md * 1.5,
  },
  button: {
    width: '100%',
    maxWidth: 300,
    marginTop: Size.lg,
  },
});
