import { Text, View, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, useColorScheme, TouchableWithoutFeedback, Keyboard, ImageBackground, Image, KeyboardAvoidingView, ScrollView, Dimensions, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useState } from "react";
import axiosInstance from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { FixedText } from "../components/FixedText";
const { width, height } = Dimensions.get('window');

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/login/', {
        username,
        password
      });

      // Use the auth context to handle login
      await login(response.data.user, {
        access: response.data.access,
        refresh: response.data.refresh
      });

      // Navigate to home
      router.replace("/home");
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.detail || 'Invalid credentials');
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const colorScheme = useColorScheme();
  
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const extendedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      inputBackground: colorScheme === 'dark' ? '#333' : '#e8e8e8',
      inputText: colorScheme === 'dark' ? '#fff' : '#000',
      placeholder: colorScheme === 'dark' ? '#aaa' : '#888',
      secondaryText: colorScheme === 'dark' ? '#aaa' : '#666',
      bgTheme: colorScheme === 'dark' ? '#000000' : '#f0f0f0',
      error: '#ff6b6b'
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'none'
        }} 
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Full screen background image outside of SafeAreaView */}
          <View style={styles.backgroundContainer}>
            <ImageBackground 
              source={require('../assets/images/cars/LoginBanner-Porche.jpg')} 
              style={styles.backgroundImage}
            >
              <View style={styles.overlay}>
                <View style={styles.logoContentContainer}>
                  <Image 
                    source={require('../assets/images/logo/world-wide-logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </ImageBackground>
          </View>
          
          {/* Form content inside KeyboardAvoidingView and SafeAreaView */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.formSection}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <SafeAreaView style={styles.safeArea}>
              <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.formContainer, { backgroundColor: extendedTheme.colors.bgTheme }]}>
                  <Text style={[styles.title, { color: extendedTheme.colors.text }]}>Welcome Back</Text>
                  <Text style={[styles.subtitle, { color: extendedTheme.colors.secondaryText }]}>Sign in to continue</Text>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: errors.username ? extendedTheme.colors.error : extendedTheme.colors.border, 
                          color: extendedTheme.colors.inputText,
                          backgroundColor: extendedTheme.colors.inputBackground
                        }
                      ]} 
                      placeholder="Enter your username"
                      placeholderTextColor={extendedTheme.colors.placeholder}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (errors.username) {
                          setErrors({...errors, username: null});
                        }
                      }}
                      autoCapitalize="none"
                    />
                    {errors.username && (
                      <Text style={[styles.errorText, { color: extendedTheme.colors.error }]}>
                        {errors.username}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[
                          styles.input, 
                          { 
                            borderColor: errors.password ? extendedTheme.colors.error : extendedTheme.colors.border, 
                            color: extendedTheme.colors.inputText,
                            backgroundColor: extendedTheme.colors.inputBackground,
                            flex: 1,
                          }
                        ]}  
                        placeholder="Enter your password"
                        placeholderTextColor={extendedTheme.colors.placeholder}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) {
                            setErrors({...errors, password: null});
                          }
                        }}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={24} 
                          color={extendedTheme.colors.placeholder} 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={[styles.errorText, { color: extendedTheme.colors.error }]}>
                        {errors.password}
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: "#b90000" }]} 
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <FixedText 
                                 fontSize={16}
                                 numberOfLines={1}
                                  adjustsFontSizeToFit
                     minimumFontScale={0.8}style={styles.loginButtonText}>
                      {loading ? 'Logging in...' : 'Login'}
                    </FixedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height * 0.6, // Restored to 0.6
    zIndex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  logoContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  logo: {
    width: 350, // Restored to 350
    height: 350, // Restored to 350
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  formContainer: {
    padding: 24,
    paddingTop: 40,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "#fff",
    // fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerText: {},
  registerLink: {
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e8e8e8',
    backgroundColor: '#e8e8e8',
  },
  eyeIcon: {
    padding: 10,
    position: 'absolute',
    right: 0,
  },
});