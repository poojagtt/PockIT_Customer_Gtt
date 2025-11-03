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
import {useTranslation} from 'react-i18next';

interface GuestOrderScreenProps {
  navigation: any;
}

const GuestOrderScreen: React.FC<GuestOrderScreenProps> = ({navigation}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.app);
  const {t} = useTranslation();

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
      <Header label={t('guestOrder.title')} onBack={onBack} />
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: colors.background,
          },
        ]}>
        <View style={styles.iconContainer}>
          <Icon
            name="shopping-bag"
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
          <Text style={[styles.title, {color: colors.primary}]}>
            {t('guestOrder.noOrders')}
          </Text>
          <Text style={[styles.subtitle, {color: colors.text}]}>
            {t('guestOrder.loginMessage')}
          </Text>
        </View>

        <Button
          label={t('guestOrder.signIn')}
          onPress={() => {
            handleLogin();
          }}
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default GuestOrderScreen;

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
