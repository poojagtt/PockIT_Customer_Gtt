import React, {useState} from 'react';
import {View, Text, TouchableOpacity, FlatList, StyleSheet} from 'react-native';
import {fontFamily, Size, useTheme} from '../modules';
import Modal from './Modal';
import TextInput from './TextInput';
import Icon from './Icon';
import {useTranslation} from 'react-i18next';

interface CountryCode {
  value: string;
  label: string;
}

interface CountryCodeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryCode) => void;
  data: CountryCode[];
  selectedCountry: CountryCode;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  data,
  selectedCountry,
}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      show={visible}
      onClose={onClose}
      title={t('placeOrder.selectCountryCode')}
      containerStyle={{
        maxHeight: '60%',
        width: '90%',
        borderRadius: 12,
      }}>
      <View style={styles.container}>
        <TextInput
          placeholder={t('placeOrder.searchCountryCode')}
          value={searchQuery}
          onChangeText={(text)=>{
            
                const filteredText = text.replace(/[^a-zA-Z0-9 ]/g, '');
                setSearchQuery(filteredText);

          }
            }
          leftChild={
            <Icon
              name="search"
              type="Ionicons"
              size={20}
              color={colors.text}
              style={{marginLeft: 12}}
            />
          }
        />

        <View style={{height: '85%'}}>
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.countryItem,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}>
                <Text style={styles.countryLabel}>{item.label}</Text>
                {selectedCountry.value === item.value && (
                  <Icon
                    name="check"
                    type="MaterialIcons"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={EmptyStateView}
          />
        </View>
      </View>
    </Modal>
  );
};
const EmptyStateView = () => {
  const {t} = useTranslation();
  return (
    <View style={styles.emptyStateContainer}>
      <Icon
        name="search-off"
        type="MaterialIcons"
        size={60}
        color={'#CBCBCB'}
      />
      <Text style={styles.emptyStateTitle}>{t('search.empty.title')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 10,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  countryLabel: {
    fontSize: 16,
fontFamily: fontFamily  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  emptyStateTitle: {
fontFamily: fontFamily,    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default CountryCodeSelector;
