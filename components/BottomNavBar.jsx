// import React from 'react';
// import { StyleSheet, Text, View, TouchableOpacity, useColorScheme, SafeAreaView, Platform } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { DarkTheme, DefaultTheme } from '@react-navigation/native';
// import { useRouter, usePathname } from 'expo-router';
// import { FixedText } from './FixedText';
// import { RFValue, RFPercentage } from "react-native-responsive-fontsize";
// const BottomNavBar = () => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const colorScheme = useColorScheme();
  
//   const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

//   const extendedTheme = {
//     ...theme,
//     colors: {
//       ...theme.colors,
//       navBarBg: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
//       navBarActive: '#e30a0a',
//       navBarInactive: colorScheme === 'dark' ? '#888' : '#666',
//       borderColor: colorScheme === 'dark' ? '#1a1a1a' : '#eaeaea',
//       bgTheme: colorScheme === 'dark' ? '#000000' : '#f0f0f0',
//     }
//   };

//   const tabs = [
//     { id: '/home', icon: 'home', label: 'Home' },
//     { id: '/jobcard', icon: 'card', label: 'Job Card' },
//     { id: '/projects', icon: 'briefcase', label: 'Projects' },
//     { id: '/profile', icon: 'person', label: 'Profile' }
//   ];

//   const handleNavigation = (path) => {
//     router.push(path);
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <View style={[ 
//         styles.navigationBar, 
//         { 
//           backgroundColor: extendedTheme.colors.bgTheme,
//           borderTopColor: extendedTheme.colors.borderColor,
//           ...Platform.select({
//             android: {
//               elevation: 8,
//               shadowColor: '#000',
//             },
//             ios: {
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: -2 },
//               shadowOpacity: 0.1,
//               shadowRadius: 4,
//             },
//           }),
//         }
//       ]}>
//         {tabs.map((tab) => (
//           <TouchableOpacity 
//             key={tab.id}
//             style={[
//               styles.navItem,
//               Platform.select({
//                 android: {
//                   elevation: 0,
//                 },
//                 ios: {},
//               }),
//             ]}
//             onPress={() => handleNavigation(tab.id)}
//             activeOpacity={0.7}
//           >
//             <Ionicons 
//               name={tab.icon} 
//               size={24} 
//               color={pathname === tab.id ? extendedTheme.colors.navBarActive : extendedTheme.colors.navBarInactive} 
//             />
//             <Text 
//             allowFontScaling={false}
//               style={[ 
//                 styles.navText, 
//                 { 
//                   color: pathname === tab.id ? extendedTheme.colors.navBarActive : extendedTheme.colors.navBarInactive 
//                 }
//               ]}
//             >
//               {tab.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   navigationBar: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     height: 60,
//     borderTopWidth: 1,
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   navItem: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 8,
//     flex: 1,
//   },
//   navText: {
    
//     fontSize: RFValue(12),
//     marginTop: 4,
//   },
// });

// export default BottomNavBar;

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useColorScheme, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useRouter, usePathname } from 'expo-router';
import { FixedText } from './FixedText';

const BottomNavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const extendedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      navBarBg: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      navBarActive: '#e30a0a',
      navBarInactive: colorScheme === 'dark' ? '#888' : '#666',
      borderColor: colorScheme === 'dark' ? '#1a1a1a' : '#eaeaea',
      bgTheme: colorScheme === 'dark' ? '#000000' : '#f0f0f0',
    }
  };

  const tabs = [
    { id: '/home', icon: 'home', label: 'Home' },
    { id: '/jobcard', icon: 'card', label: 'Job Card' },
    { id: '/projects', icon: 'briefcase', label: 'Projects' },
    { id: '/profile', icon: 'person', label: 'Profile' }
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[ 
        styles.navigationBar, 
        { 
          backgroundColor: extendedTheme.colors.bgTheme,
          borderTopColor: extendedTheme.colors.borderColor,
          ...Platform.select({
            android: {
              elevation: 8,
              shadowColor: '#000',
            },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          }),
        }
      ]}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id}
            style={[
              styles.navItem,
              Platform.select({
                android: {
                  elevation: 0,
                },
                ios: {},
              }),
            ]}
            onPress={() => handleNavigation(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon} 
              size={24} 
              color={pathname === tab.id ? extendedTheme.colors.navBarActive : extendedTheme.colors.navBarInactive} 
            />
            {/* CHANGED: Replace Text with FixedText */}
            <FixedText 
              fontSize={12}
              numberOfLines={1}
              style={[ 
                styles.navText, 
                { 
                  color: pathname === tab.id ? extendedTheme.colors.navBarActive : extendedTheme.colors.navBarInactive 
                }
              ]}
            >
              {tab.label}
            </FixedText>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    flex: 1,
  },
  navText: {
    // Remove fontSize from here since we're using FixedText fontSize prop
    marginTop: 4,
    textAlign: 'center', // Added for better centering
  },
});

export default BottomNavBar;