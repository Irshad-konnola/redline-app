import { useRouter } from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,TextInput
} from "react-native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";



export default function Index() {
  const router = useRouter();

  // Get the current system theme (dark or light)
  const colorScheme = useColorScheme();

  // Apply the appropriate theme based on the system theme
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Background image for full screen with opacity */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("../assets/images/cars/MITSUBISHI LANCER EVO.jpg")}
          style={styles.backgroundImage}
        />
        <View style={[styles.overlay, { backgroundColor: "black" }]} />
      </View>

      <View style={styles.content}>
        {/* Logo Image */}
        <Image
          source={require("../assets/images/logo/world-wide-logo.png")}
          style={styles.logo}
        />

        <Text style={[styles.title, { color: "white" }]}>
          Welcome to <Text style={{ color: "red" }}>World</Text>Wide
        </Text>

        <Text style={[styles.title, { color: "white" }]}>Motor Works Garage</Text>
        <Text style={[styles.subtitle]}>
          Please proceed to log in to the staff app and access all the tools and
          resources you need to provide top-quality service.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#b90000" }]}
          onPress={goToLogin}
        >
          <Text style={styles.buttonText}>Continue to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8, 
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1,
  },
  logo: {
    width: 300, // Adjust the size of the logo as needed
    height: 300,
    marginBottom:1, // Add spacing between logo and title
    resizeMode: "contain", // Maintain aspect ratio of the logo
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    marginTop: 30,
    textAlign: "center",
    color: "#b7b7b7",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
