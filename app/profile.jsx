import { StyleSheet, Text, View, SafeAreaView, Platform, StatusBar, useColorScheme, TouchableOpacity, ImageBackground } from 'react-native';
import React from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const extendedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      bgTheme: colorScheme === 'dark' ? '#000000' : '#f0f0f0',
      cardBg: colorScheme === 'dark' ? '#000000' : '#f0f0f0',
      selectInputBg: colorScheme === 'dark' ? '#212121' : '#eaeaea',
      borderColor: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
      textSecondary: colorScheme === 'dark' ? '#b0b0b0' : '#666666',
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: extendedTheme.colors.bgTheme }}>
      <View style={styles.headerContainer}>
        <ImageBackground
          source={require('../assets/images/cars/BMW MK4 .jpg')}
          style={styles.backgroundImage}
        >
          <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
            <Text style={styles.headerText}>Profile</Text>
          </View>
        </ImageBackground>
      </View>
      <SafeAreaView style={styles.container}>
        <View style={[styles.mainContainer, { backgroundColor: extendedTheme.colors.bgTheme }]}>
          <View style={[styles.profileCard, { backgroundColor: extendedTheme.colors.cardBg }]}>
            <Text style={[styles.label, { color: extendedTheme.colors.textSecondary }]}>Username</Text>
            <Text style={[styles.username, { color: extendedTheme.colors.text }]}>
              {user?.username || 'Not available'}
            </Text>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomNavContainer}>
          <BottomNavBar />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: '30%',
    overflow: 'hidden',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingLeft: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  profileCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#b90000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNavContainer: {
    paddingBottom: 2,
    backgroundColor: 'transparent',
  },
});