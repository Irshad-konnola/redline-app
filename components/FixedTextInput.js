import React from 'react';
import { TextInput, PixelRatio, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375; // iPhone X base width

const normalize = (size) => {
  const fontScale = PixelRatio.getFontScale();
  return Math.round((size * scale) / fontScale);
};

export const FixedTextInput = ({ style, fontSize = 14, ...props }) => {
  return (
    <TextInput
      {...props}
      style={[
        {
          fontSize: normalize(fontSize),
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        style,
      ]}
    />
  );
};
