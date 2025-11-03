import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useDispatch, useSelector} from '../../context';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall, fontFamily, Size, useTheme} from '../../modules';
import {Button, Header, Icon} from '../../components';

interface HelpandSupportProps extends MenuRoutes<'HelpAndSupport'> {}
const HelpandSupport: React.FC<HelpandSupportProps> = ({navigation}) => {
  const colors = useTheme();
  const [faqs, setFaqs] = useState<{id: number; name: string}[]>([]);
  const {user, address} = useSelector(state => state.app);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [faqDetails, setFaqDetails] = useState<
    {id: number; question: string; answer: string}[]
  >([]);
  const [expandedFaqs, setExpandedFaqs] = useState<{[key: number]: boolean}>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailsOpened, setDetailsOpened] = useState(false);
  useEffect(() => {
    faqheads();
  }, []);
  const faqheads = async () => {
    setLoading(true);
    try {
      const res = await apiCall.post('/faqHead/get', {
        filter: ` AND STATUS = 1 AND FAQ_HEAD_TYPE = 'C' `,
        sortKey:'SEQUENCE_NO',
        sortValue:'asc'
      });
      if (res.data && Array.isArray(res.data.data)) {
        const formattedFaqs = res.data.data.map((item: any) => ({
          id: item.ID,
          name: item.NAME,
        }));

        setFaqs(formattedFaqs);
      } else {
        console.error('Unexpected API response format:', res.data);
      }
    } catch (error) {
      console.error('Error Fetching FAQs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqDetails = async (faqHeadId: number) => {
    setLoadingDetails(true);
    try {
      const res = await apiCall.post('/faq/get', {
        filter: ` AND STATUS = 1 AND FAQ_HEAD_ID = ${faqHeadId} AND FAQ_TYPE='C'`,
        sortKey:'SEQ_NO',
        sortValue:'asc'
      });
      if (res.data && Array.isArray(res.data.data)) {
        const formattedDetails = res.data.data.map((item: any) => ({
          id: item.ID,
          question: item.QUESTION,
          answer: item.ANSWER,
        }));
        setFaqDetails(formattedDetails);
        setExpandedFaqs({});
      } else {
        console.error('Unexpected FAQ details format:', res.data);
        setFaqDetails([]);
      }
    } catch (error) {
      console.error('Error Fetching FAQ Details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleFaqCategory = (id: number) => {
    if (selectedFaq === id) {
      setSelectedFaq(null);
      setFaqDetails([]);
    } else {
      setSelectedFaq(id);
      fetchFaqDetails(id);
    }
  };

  const toggleFaqItem = (faqId: number) => {
    setExpandedFaqs(prevState => ({
      ...prevState,
      [faqId]: !prevState[faqId],
    }));
  };

  return (
    <SafeAreaView style={styles._container}>
      <Header
        label={'Help & Support'}
        onBack={() => {
          if (isDetailsOpened) {
            setDetailsOpened(false);
            setSelectedFaq(null);
            setFaqDetails([]);
          } else {
            navigation.goBack();
          }
        }}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: Size.containerPadding,
          marginTop: 4,
        }}>
        <View
          style={{
            backgroundColor: colors.background,
            height: 20,
            marginHorizontal: -Size.containerPadding,
          }}
        />
        <Text
          style={[
            styles._headingTxt,
            {fontWeight: '600', marginTop: Size.sm, fontFamily: fontFamily},
          ]}>
          FAQs
        </Text>

        {loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator
              size="small"
              color={colors.primary2}
              style={styles._loading}
            />
          </View>
        ) : selectedFaq === null ? (
          <FlatList
            data={faqs}
            keyExtractor={item => item.id.toString()}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles._faqItem}
                onPress={() => {
                  setDetailsOpened(true);
                  toggleFaqCategory(item.id);
                }}>
                <View style={styles._faqRow}>
                  <Text style={styles._txt}>{item.name}</Text>
                  <Icon
                    type="Feather"
                    name={'chevron-right'}
                    size={23}
                    color={'#8F90A6'}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        ) : loadingDetails ? (
          <ActivityIndicator
            size="large"
            color="#007BFF"
            style={styles._loading}
          />
        ) : faqDetails.length === 0 ? (
          <View style={styles._noFaqContainer}>
            <Image
              source={require('../../assets/images/no-data.png')} // Adjust path as needed
              style={styles._noFaqImage}
              resizeMode="contain"
            />
            {/* <Text style={styles._noFaqText}>No FAQs available</Text> */}
          </View>
        ) : (
          <FlatList
            data={faqDetails}
            keyExtractor={item => item.id.toString()}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
              <View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles._faqItem}
                  onPress={() => toggleFaqItem(item.id)}>
                  <View style={styles._faqRow}>
                    <View style={styles._textContainer}>
                      <Text style={styles._txt}>{item.question}</Text>
                    </View>
                    <Icon
                      type="Feather"
                      name={
                        expandedFaqs[item.id] ? 'chevron-up' : 'chevron-down'
                      }
                      size={23}
                      color={'#8F90A6'}
                    />
                  </View>
                </TouchableOpacity>

                {expandedFaqs[item.id] && (
                  <View style={styles._faqAnswerContainer}>
                    <Text style={styles._faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}

        {/* {user?.ID !== 0 && address?.TERRITORY_ID && (
          <View style={{padding: 10}}>
            <Button
              label="Manage Support Tickets"
              onPress={() => navigation.navigate('ManageTickets')}
            />
          </View>
        )} */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  _container: {
    flex: 1,

    backgroundColor: '#ffffff',
  },
  _headingTxt: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  _faqItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  _faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  _txt: {
    fontSize: 16,
    fontFamily: fontFamily,
  },
  _faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  _faqAnswer: {
    fontSize: 14,
    color: '#555',
    fontFamily: fontFamily,
  },

  _textContainer: {
    flex: 1,
    marginRight: 10,
  },
  _loading: {
    marginTop: 20,
    alignSelf: 'center',
  },
  _noFaqContainer: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
    // marginTop: 50,
  },
  _noFaqImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  _noFaqText: {
    fontSize: 16,
    color: '#8F90A6',
  },
});

export default HelpandSupport;
