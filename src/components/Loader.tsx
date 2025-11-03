import { View, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import React from 'react';

const Loader = ({ show }: { show: boolean }) => {
    return (
        <Modal visible={show} transparent>
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});

export default Loader;
