import React, {useState, useEffect} from 'react';
import {View, Modal, StyleSheet, Dimensions, BackHandler} from 'react-native';
import Video from 'react-native-video';

interface FullScreenVideoProps {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
}

const FullScreenVideo: React.FC<FullScreenVideoProps> = ({
  visible,
  videoUri,
  onClose,
}) => {
  const [showControls, setShowControls] = useState(false);
  useEffect(() => {
    if (visible) {
      setShowControls(false);
      const timer = setTimeout(() => {
        setShowControls(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (visible) {
          onClose();
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.container}>
        <Video
          source={{uri: videoUri}}
          style={styles.video}
          controls={showControls}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const {width, height} = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },
});

export default FullScreenVideo;
