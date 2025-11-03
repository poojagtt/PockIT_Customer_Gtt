import React, {FC, useMemo, useState, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {Icon} from '../../components';
import {fontFamily, Size, useTheme} from '../../modules';
import {useTranslation} from 'react-i18next';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (filter: Filter) => void;
}

interface Filter {
  label: string;
  value: {
    // filter: string;
    sortKey: string;
    sortValue: string;
  };
}

const OtherFilterModal: FC<FilterModalProps> = ({visible, onClose, onSelect}) => {
  const colors = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const {t} = useTranslation();

  const filters: Filter[] = useMemo(
    () => [
      {
        label: t('shop.filter.latest'),
        value: {sortKey: 'ID', sortValue: 'DESC'},
      },
      {
        label: t('shop.filter.alphabetic'),
        value: {sortKey: 'ITEM_NAME', sortValue: 'ASC'},
      },
      {
        label: t('shop.filter.topRated'),
        value: {sortKey: 'RATING', sortValue: 'DESC'},
      },
      {
        label: t('shop.filter.priceLowToHigh'),
        value: {sortKey: 'DISCOUNTED_PRICE', sortValue: 'ASC'},
      },
      {
        label: t('shop.filter.priceHighToLow'),
        value: {sortKey: 'DISCOUNTED_PRICE', sortValue: 'DESC'},
      },
    ],
    [t],
  );

  const handleSelect = useCallback(
    (filter: Filter) => {
      if (filter.label !== selectedFilter?.label) {
        setSelectedFilter(filter);
        onSelect(filter);
      }
    },
    [onSelect, selectedFilter],
  );

  const renderItem = useCallback(
    ({item}: {item: Filter}) => (
      <TouchableOpacity
        style={[
          styles.filterItem,
          item.label === selectedFilter?.label && styles.selectedItem,
        ]}
        onPress={() => handleSelect(item)}>
        <Text
          style={[
            styles.filterText,
            {
              color:
                item.label === selectedFilter?.label ? '#2A3B8F' : colors.text,
            },
          ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ),
    [selectedFilter, colors.text, handleSelect],
  );

  return (
    
      <View style={{marginBottom:12}}>
        
        <FlatList
          data={filters}
          keyExtractor={item => item.label}
          renderItem={renderItem}
          removeClippedSubviews={false}
          initialNumToRender={5}
          windowSize={5}
        />
      </View>
   
  );
};

export default OtherFilterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#b094f550',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  selectedItem: {
    backgroundColor: '#F4F7F9',
    borderRadius: 8,
  },
  filterText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: fontFamily,
  },
});
