// @ts-ignore
import MathJax from 'react-native-mathjax';
import React from 'react';
import { fontFamily } from '../modules';

interface MathJaxProps {
  text: string;
}

const MathJaxComponent: React.FC<MathJaxProps> = ({text}) => {
  return (
    <MathJax
      horizontal={false}
      showsVerticalScrollIndicator={false}
      color={'#333333'}
      style={{
        backgroundColor: 'transparent',
         fontFamily:fontFamily
      }}
      fontSize={'huge'}
      fontCache={true}
     
html={`<div style="font-size: 14px; color: #333333; font-family: 'SF-Pro-Text-Regular';">${text}</div>`}
    />
  );
};

export default MathJaxComponent;
