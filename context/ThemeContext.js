import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

// Define theme colors
const lightTheme = {
  background: "#f5f5f5",
  text: "#333333",
  secondaryText: "#666666",
  primary: "#4a80f5",
  secondary: "#e0e0e0",
  card: "#ffffff",
  border: "#cccccc",
};

const darkTheme = {
  background: "#121212",
  text: "#ffffff",
  secondaryText: "#aaaaaa",
  primary: "#5b9ef8",
  secondary: "#333333",
  card: "#1e1e1e",
  border: "#444444",
};

// Create context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');
  
  // Update theme when device theme changes
  useEffect(() => {
    setIsDarkMode(deviceColorScheme === 'dark');
  }, [deviceColorScheme]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Current theme colors
  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};