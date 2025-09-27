// import { Stack } from 'expo-router';
// import { AuthProvider, useAuth } from '../context/AuthContext';
// import { useEffect, useState } from 'react';
// import { router } from 'expo-router';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   useColorScheme,
//   Modal,
//   Pressable,
//   SafeAreaView,
//   StatusBar,
//   Platform,
//   TextInput,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import SessionExpiredModal from '../components/SessionExpiredModal';
// import { setSessionExpiredModalHandler } from '../api/api';

// if (Text.defaultProps == null) Text.defaultProps = {};
// if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// Text.defaultProps.allowFontScaling = false;
// TextInput.defaultProps.allowFontScaling = false;

// // Profile Modal Component
// const ProfileModal = ({ visible, onClose, userData, handleLogout, theme }) => (
//   <Modal
//     animationType="slide"
//     transparent={true}
//     visible={visible}
//     onRequestClose={onClose}
//   >
//     <Pressable
//       style={styles.modalOverlay}
//       onPress={onClose}
//     >
//       <View
//         style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
//         onStartShouldSetResponder={() => true}
//       >
//         <View style={styles.modalHeader}>
//           <Ionicons
//             name="person-circle"
//             size={60}
//             color={theme.colors.primary}
//           />
//           <Text style={[styles.userName, { color: theme.colors.text }]}>
//             {userData.name}
//           </Text>
//           <Text style={[styles.userEmail, { color: theme.colors.text }]}>
//             {userData.email}
//           </Text>
//         </View>

//         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//           <Text style={[styles.logoutText, { color: theme.colors.text }]}>
//             Logout
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </Pressable>
//   </Modal>
// );

// // Profile Icon Component
// const ProfileIcon = ({ onPress, theme }) => (
//   <SafeAreaView style={styles.profileIconContainer}>
//     <TouchableOpacity
//       onPress={onPress}
//       style={[styles.profileIcon, { backgroundColor: theme.colors.card }]}
//     >
//       <Ionicons
//         name="person-circle-outline"
//         size={28}
//         color={theme.colors.text}
//       />
//     </TouchableOpacity>
//   </SafeAreaView>
// );

// function RootLayoutNav() {
//   const { user, loading, logout: authLogout } = useAuth();
//   const [showSessionExpired, setShowSessionExpired] = useState(false);
//   const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

//   useEffect(() => {
//     setSessionExpiredModalHandler(() => setShowSessionExpired(true));
//   }, []);

//   useEffect(() => {
//     if (!loading) {
//       if (user) {
//         router.replace('/home');
//       } else {
//         router.replace('/login');
//       }
//     }
//   }, [user, loading]);

//   const handleLogout = async () => {
//     await authLogout();
//     router.replace('/login');
//     setIsProfileModalVisible(false);
//   };

//   if (loading) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <ThemeProvider value={theme}>
//         <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
//           <StatusBar
//             barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
//             backgroundColor={theme.colors.background}
//           />
//           <Stack screenOptions={{ headerShown: false }}>
//             <Stack.Screen name="login" />
//             <Stack.Screen name="home" />
//             <Stack.Screen 
//               name="addNewJobCard" 
//               options={{
//                 headerShown: true,
//                 title: 'Add New Job Card',
//                 headerBackTitle: 'Back',
//               }}
//             />
//             <Stack.Screen 
//               name="editJobcard" 
//               options={{
//                 headerShown: true,
//                 title: 'Edit Job Card',
//                 headerBackTitle: 'Back',
//               }}
//             />
//           </Stack>
//           <SessionExpiredModal 
//             visible={showSessionExpired} 
//             onClose={() => setShowSessionExpired(false)} 
//           />
//           <ProfileModal
//             visible={isProfileModalVisible}
//             onClose={() => setIsProfileModalVisible(false)}
//             userData={{
//               name: user?.name || "User",
//               email: user?.email || "user@example.com"
//             }}
//             handleLogout={handleLogout}
//             theme={theme}
//           />
//           <ProfileIcon 
//             onPress={() => setIsProfileModalVisible(true)}
//             theme={theme}
//           />
//         </View>
//       </ThemeProvider>
//     </GestureHandlerRootView>
//   );
// }

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <RootLayoutNav />
//     </AuthProvider>
//   );
// }

// const styles = StyleSheet.create({
//   profileIconContainer: {
//     position: "absolute",
//     top: Platform.OS === "android" ? 40 : 10,
//     right: 20,
//     zIndex: 100,
//   },
//   profileIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: -3,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalHeader: {
//     alignItems: "center",
//     marginBottom: 20,
//     paddingVertical: 20,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginTop: 10,
//   },
//   userEmail: {
//     fontSize: 16,
//     marginTop: 5,
//     opacity: 0.7,
//   },
//   logoutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     width: "60%",
//     justifyContent: "center",
//     backgroundColor: "#b90000",
//     marginBottom: 30,
//   },
//   logoutText: {
//     fontSize: 16,
//     marginLeft: 10,
//     fontWeight: "600",
//     color: "#ffffff",
//   },
// });

import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";



import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SessionExpiredModal from '../components/SessionExpiredModal';
import { setSessionExpiredModalHandler } from '../api/api';


// Profile Modal Component
const ProfileModal = ({ visible, onClose, userData, handleLogout, theme }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable
      style={styles.modalOverlay}
      onPress={onClose}
    >
      <View
        style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
        onStartShouldSetResponder={() => true}
      >
        <View style={styles.modalHeader}>
          <Ionicons
            name="person-circle"
            size={60}
            color={theme.colors.primary}
          />
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userData.name}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.text }]}>
            {userData.email}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: theme.colors.text }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

// Profile Icon Component
const ProfileIcon = ({ onPress, theme }) => (
  <SafeAreaView style={styles.profileIconContainer}>
    <TouchableOpacity
      onPress={onPress}
      style={[styles.profileIcon, { backgroundColor: theme.colors.card }]}
    >
      <Ionicons
        name="person-circle-outline"
        size={28}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  </SafeAreaView>
);

function RootLayoutNav() {
  const { user, loading, logout: authLogout } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

   useEffect(() => {
    console.log('Font scaling disabled:', {
      text: Text.defaultProps?.allowFontScaling,
      textInput: TextInput.defaultProps?.allowFontScaling
    });
  }, []);

  useEffect(() => {
    setSessionExpiredModalHandler(() => setShowSessionExpired(true));
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await authLogout();
    router.replace('/login');
    setIsProfileModalVisible(false);
  };

  if (loading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <ThemeProvider value={theme}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <StatusBar
            barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.background}
          />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="home" />
      
            <Stack.Screen 
              name="addNewJobCard" 
              options={{
                headerShown: true,
                title: 'Add New Job Card',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="editJobcard" 
              options={{
                headerShown: true,
                title: 'Edit Job Card',
                headerBackTitle: 'Back',
              }}
            />
          </Stack>
          <SessionExpiredModal 
            visible={showSessionExpired} 
            onClose={() => setShowSessionExpired(false)} 
          />
          <ProfileModal
            visible={isProfileModalVisible}
            onClose={() => setIsProfileModalVisible(false)}
            userData={{
              name: user?.name || "User",
              email: user?.email || "user@example.com"
            }}
            handleLogout={handleLogout}
            theme={theme}
          />
          <ProfileIcon 
            onPress={() => setIsProfileModalVisible(true)}
            theme={theme}
          />
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 10,
    right: 20,
    zIndex: 100,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    marginTop: 5,
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "60%",
    justifyContent: "center",
    backgroundColor: "#b90000",
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
});
