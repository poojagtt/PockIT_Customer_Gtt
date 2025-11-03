import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
    width: number | `${number}%`;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ width }) => {
  return (
    <View style={styles.main}>
      <View style={[styles.divider, { width }]} />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  main: {
    height: 3,
    // backgroundColor: '#383838',
  },
  divider: {
    height: 3,
    backgroundColor: '#F36631',
  },
});
