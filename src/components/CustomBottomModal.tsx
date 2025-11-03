// components/CustomBottomModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from './Icon';

interface Props {
  show: boolean;
  title?: string;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

const screenHeight = Dimensions.get('window').height;

const CustomBottomModal: React.FC<Props> = ({
  show,
  title,
  onClose,
  onApply,
  onClear,
  children,
}) => {
  return (
    <Modal
      visible={show}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" type="AntDesign" size={20} color="#333" />
            </TouchableOpacity>

            {/* Title */}
            {title ? <Text style={styles.title}>{title}</Text> : null}

            {/* Scrollable content */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CustomBottomModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
   
    paddingTop:20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: screenHeight * 0.9,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: '#eee',
    padding: 8,
    marginTop:-50,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#3170DE',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  clearText: {
    textAlign: 'center',
    color: '#000',
  },
  applyText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});
