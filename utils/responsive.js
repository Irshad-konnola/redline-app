// utils/responsive.js

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11/XR as reference - adjust based on your primary test device)
const BASE_WIDTH = 414;
const BASE_HEIGHT = 896;

// Responsive width function
export const responsiveWidth = (size) => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Responsive height function
export const responsiveHeight = (size) => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

// Responsive font size with minimum size enforcement
export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  // Ensure minimum readable font size
  return Math.max(12, PixelRatio.roundToNearestPixel(newSize));
};

// Responsive spacing (padding, margin, etc.)
export const responsiveSpacing = (size) => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Get screen information for conditional rendering
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < 375,    // iPhone SE, small Android
  isMediumScreen: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,  // iPhone 12/13 mini
  isLargeScreen: SCREEN_WIDTH >= 414,   // iPhone 11/12/13 and larger
  isTablet: SCREEN_WIDTH >= 768,        // iPad and tablets
});

// Responsive border radius
export const responsiveBorderRadius = (size) => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Get responsive grid columns based on screen size
export const getGridColumns = (defaultColumns = 3) => {
  const screenData = getScreenDimensions();
  
  if (screenData.isTablet) return Math.min(defaultColumns + 2, 6);
  if (screenData.isSmallScreen) return Math.max(defaultColumns - 1, 2);
  return defaultColumns;
};

// Calculate responsive item width for grids
export const getGridItemWidth = (columns, spacing = 16) => {
  const screenData = getScreenDimensions();
  const totalSpacing = spacing * (columns + 1);
  return (screenData.width - totalSpacing) / columns;
};

// Helper for minimum touch target size (44px recommended)
export const getMinTouchTarget = () => responsiveHeight(44);