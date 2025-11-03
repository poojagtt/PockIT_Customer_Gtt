import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
 
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {fontFamily, Size} from '../../modules';
import {MenuRoutes} from '../../routes/Menu';
import {Header, Icon} from '../../components';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import PrivacyPolicyComponent from '../../components/PrivacyPolicyComponent';
import TermsAndConditionsComponent from '../../components/TermsAndConditionsComponents';

interface AboutProps extends MenuRoutes<'About'> {}

const About: React.FC<AboutProps> = ({navigation}) => {
  const {t} = useTranslation();
  const [expanded, setExpanded] = useState<{[key: string]: boolean}>({
    terms: false,
    licenses: false,
    privacy: false,
  });
  const Duration = 500;

  const toggleSection = (section: string) => {
    setExpanded(prev => ({...prev, [section]: !prev[section]}));
  };

  const rotation = {
    terms: useDerivedValue(() =>
      expanded.terms
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
    licenses: useDerivedValue(() =>
      expanded.licenses
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
    privacy: useDerivedValue(() =>
      expanded.privacy
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
  };

  const termsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.terms.value}deg`}],
  }));

  const licensesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.licenses.value}deg`}],
  }));

  const privacyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.privacy.value}deg`}],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Header
            label={t('menu.about.title')}
            onBack={() => navigation.goBack()}
          />
        </View>

        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.card}>
          <TouchableOpacity
            onPress={() => toggleSection('terms')}
            style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terms of Service</Text>
            <Animated.View style={termsAnimatedStyle}>
              <Icon
                type="MaterialIcons"
                name="expand-more"
                size={24}
                color={'#636363'}
              />
            </Animated.View>
          </TouchableOpacity>
          {expanded.terms && (
            <Animated.View
              entering={FadeInUp.stiffness(45).duration(Duration)}
              exiting={FadeOutUp.stiffness(45)}
              style={styles.cardContent}>
             <TermsAndConditionsComponent/>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.card}>
          <TouchableOpacity
            onPress={() => toggleSection('privacy')}
            style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Privacy Policy</Text>
            <Animated.View style={privacyAnimatedStyle}>
              <Icon
                type="MaterialIcons"
                name="expand-more"
                size={24}
                color={'#636363'}
              />
            </Animated.View>
          </TouchableOpacity>
          {expanded.privacy && (
            <Animated.View
              entering={FadeInUp.stiffness(45)}
              exiting={FadeOutUp.stiffness(45)}
              style={styles.cardContent}>
              <PrivacyPolicyComponent/>
            </Animated.View>
          )}
        </Animated.View>

        {/* <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.card}>
          <TouchableOpacity
            onPress={() => toggleSection('licenses')}
            style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Licenses</Text>
            <Animated.View style={licensesAnimatedStyle}>
              <Icon
                type="MaterialIcons"
                name="expand-more"
                size={24}
                color={'#636363'}
              />
            </Animated.View>
          </TouchableOpacity>
          {expanded.licenses && (
            <Animated.View
              entering={FadeInUp.stiffness(45)}
              exiting={FadeOutUp.stiffness(45)}
              style={styles.cardContent}>
              <Text>
                Lorem ipsum dolor sit amet consectetur. A diam sed urna sed
                augue mi pellentesque eget. Odio mi facilisis tincidunt mi nisl
                sociis. Vel blandit neque quis non facilisi tempor et nibh.
                Massa amet quis risus auctor tellus ullamcorper vulputate
                tincidunt nisl.
              </Text>
            </Animated.View>
          )}
        </Animated.View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#F6F8FF',
  },
  heading: {
    fontSize: Size.xl,
    fontWeight: '700',
    color: '#1C1C28',
    marginBottom: 16,
    fontFamily: fontFamily,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    // marginBottom: 2,
    marginTop:15,
    borderWidth: 1,
    borderColor: '#CBCBCB',
    marginHorizontal: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Size.lg,
    fontWeight: '500',
    color: '#0E0E0E',
    fontFamily: fontFamily,
  },
  cardContent: {
    marginTop: 8,
    fontSize: 16,
    color: '#636363',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  boldText: {
    fontFamily: 'SF-Pro-Text-Bold',
    color: '#000',
    marginBottom: 8,
    marginTop: 8,
  },
});
