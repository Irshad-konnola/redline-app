import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  StatusBar,
  useColorScheme,
  ImageBackground,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import axiosInstance from "../api/api.js";
import { createStackNavigator } from "@react-navigation/stack";

const { width, height } = Dimensions.get("window"); // Get device width and height

const Stack = createStackNavigator();

const Home = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [allServicesModal, setAllServicesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isClickable, setIsClickable] = useState(true);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const dataLoadedRef = useRef(false);

  // Animation values for overlay
  const [serviceModalOpacity] = useState(new Animated.Value(0));
  const [allServicesModalOpacity] = useState(new Animated.Value(0));

  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const extendedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      inputBackground: colorScheme === "dark" ? "#333" : "#e8e8e8",
      inputText: colorScheme === "dark" ? "#fff" : "#000",
      placeholder: colorScheme === "dark" ? "#aaa" : "#888",
      secondaryText: colorScheme === "dark" ? "#aaa" : "#666",
      bgTheme: colorScheme === "dark" ? "#000000" : "#f0f0f0",
      bodalBg: colorScheme === "dark" ? "#212121" : "#ededed",
      navBarBg: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
      borderColor: colorScheme === "dark" ? "#1a1a1a" : "#eaeaea",
      modalborderColor: colorScheme === "dark" ? "#6b6b6b" : "#eaeaea",
      moreButtonBg: colorScheme === "dark" ? "#242424" : "#dcdcdc",
      moreButtontextColor: colorScheme === "dark" ? "#ffffff" : "#000000",
    },
  };

  // Fetch services when component mounts or when data is not loaded
  useEffect(() => {
    const fetchServices = async () => {
      if (dataLoadedRef.current) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get("/service-categories/");
        setServices(response.data);
        dataLoadedRef.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching services:", error);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Reset clickable state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsClickable(true);
      return () => {};
    }, [])
  );

  // Display only first 8 services (9th item is "More...")
  const displayServices = services.slice(0, 8);

  const handleServicePress = (service) => {
    // Clear any previously selected category when selecting from grid
    setSelectedCategory(null);
    setSelectedService(service);
    setModalVisible(true);
    // Fade in animation for the overlay
    Animated.timing(serviceModalOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleMorePress = () => {
    // Clear any previously selected service when opening "More" modal
    setSelectedService(null);
    setAllServicesModal(true);
    // Fade in animation for the overlay
    Animated.timing(allServicesModalOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleCategoryPress = (category) => {
    console.log("Category selected:", { id: category.id, name: category.name });
    // Clear any previously selected service when selecting from "All Services" modal
    setSelectedService(null);
    setSelectedCategory(category);
  };

  const handleBackPress = () => {
    console.log("Back button pressed - clearing selected category");
    setSelectedCategory(null);
  };

  const handleSubcategoryPress = (subcategory) => {
    if (!isClickable) return;
    setIsClickable(false);

    // Determine which service is active (from grid or "More..." modal)
    const activeServiceId = selectedService?.id || selectedCategory?.id;
    const activeServiceName = selectedService?.name || selectedCategory?.name;

    if (!activeServiceId) {
      console.error("No active service selected");
      setIsClickable(true);
      return;
    }

    console.log("Selected service:", {
      serviceId: activeServiceId,
      serviceName: activeServiceName,
      subServiceId: subcategory.id,
      subServiceName: subcategory.name,
      source: selectedService ? "grid" : "all services modal",
    });

    const serviceData = {
      serviceId: activeServiceId,
      serviceName: activeServiceName,
      subServiceId: subcategory.id,
      subServiceName: subcategory.name,
      isFromQuickService: true,
    };

    closeModal();
    closeAllServicesModal();

    // Navigate to the addNewJobCard screen
    router.push({
      pathname: "/addNewJobCard",
      params: serviceData,
    });

    // Reset isClickable after a short delay to allow for next selection
    setTimeout(() => {
      setIsClickable(true);
    }, 1000);
  };

  const closeModal = () => {
    // Fade out animation for the overlay
    Animated.timing(serviceModalOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      // Clear selected service when closing the modal
      console.log("Closing service modal - clearing selected service");
      setSelectedService(null);
    });
  };

  const closeAllServicesModal = () => {
    // Fade out animation for the overlay
    Animated.timing(allServicesModalOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAllServicesModal(false);
      // Always clear the selected category when closing the modal
      console.log("Closing all services modal - clearing selected category");
      setSelectedCategory(null);
    });
  };

  // Calculate content height (70% of screen height - bottom nav height)
  const contentMaxHeight = height * 0.7 - 60; // Assuming bottom nav is about 60px

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#d1d1d1" />
      </View>
    );
  }
  const goToSale = () => {
    router.push("/sale");
  };


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "none",
        }}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: extendedTheme.colors.bgTheme },
        ]}
      >
        <View style={styles.headerContainer}>
          <ImageBackground
            source={require("../assets/images/cars/Land Rover Defender Hd Wallpaper.jpg")}
            style={styles.backgroundImage}
          >
            <View style={styles.overlay}>
              <Text style={styles.headerText}>Welcome to RedLine</Text>
            </View>
          </ImageBackground>
        </View>

        <SafeAreaView style={styles.contentContainer}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />

          <ScrollView
            style={[styles.scrollView, { backgroundColor: extendedTheme.colors.bgTheme, maxHeight: contentMaxHeight }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.contentText, { color: extendedTheme.colors.text }]}>
              Select Quick Service
            </Text>

            <View style={styles.servicesGrid}>
              {displayServices.map((service, index) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceItem}
                  onPress={() => handleServicePress(service)}
                  activeOpacity={0.7}
                >
                  <ImageBackground 
                    source={service.image ? { uri: service.image } : require('../assets/images/cars/jobcardImage.jpeg')} 
                    style={styles.serviceImage}
                  >
                    <View style={styles.serviceOverlay}>
                      <Text style={styles.serviceText}>{service.name}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}

              {services.length > 8 && (
                <TouchableOpacity
                  style={styles.serviceItem}
                  onPress={handleMorePress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moreButton, { backgroundColor: extendedTheme.colors.moreButtonBg }]}>
                    <Text style={[styles.moreText,{ color: extendedTheme.colors.moreButtontextColor }]}>More...</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          {/* <ScrollView
            style={[
              styles.scrollView,
              {
                backgroundColor: extendedTheme.colors.bgTheme,
                maxHeight: contentMaxHeight,
              },
            ]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <View style={styles.placeholder} /> 
              <Text
                style={[
                  styles.contentText,
                  { color: extendedTheme.colors.text },
                ]}
              >
                Select Quick Service
              </Text>
              <TouchableOpacity
                style={[
                  styles.quickSaleButton,
                  { backgroundColor: extendedTheme.colors.primary },
                ]}
                onPress={goToSale}
                activeOpacity={0.7}
              >
                <Text style={styles.quickSaleText}>Quick Sale</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.servicesGrid}>
              {displayServices.map((service, index) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceItem}
                  onPress={() => handleServicePress(service)}
                  activeOpacity={0.7}
                >
                  <ImageBackground
                    source={
                      service.image
                        ? { uri: service.image }
                        : require("../assets/images/cars/jobcardImage.jpeg")
                    }
                    style={styles.serviceImage}
                  >
                    <View style={styles.serviceOverlay}>
                      <Text style={styles.serviceText}>{service.name}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}

              {services.length > 8 && (
                <TouchableOpacity
                  style={styles.serviceItem}
                  onPress={handleMorePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moreButton,
                      { backgroundColor: extendedTheme.colors.moreButtonBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.moreText,
                        { color: extendedTheme.colors.moreButtontextColor },
                      ]}
                    >
                      More...
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView> */}
          {/* Modal for service subcategories */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <Animated.View
              style={[styles.modalOverlay, { opacity: serviceModalOpacity }]}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPress={closeModal}
              >
                <View
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: extendedTheme.colors.bgTheme,
                      maxHeight: height * 0.7,
                      borderWidth: 1,
                      borderColor: extendedTheme.colors.modalborderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: extendedTheme.colors.text },
                    ]}
                  >
                    {selectedService?.name} Services
                  </Text>

                  <FlatList
                    data={selectedService?.services || []}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={[
                          styles.subcategoryItem,
                          {
                            borderBottomColor: extendedTheme.colors.borderColor,
                          },
                        ]}
                        onPress={() => handleSubcategoryPress(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.subcategoryText,
                            { color: extendedTheme.colors.text },
                          ]}
                        >
                          {index + 1}. {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={styles.subcategoryList}
                  />

                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: "#ff3b30" }]}
                    onPress={closeModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Modal>

          {/* Modal for all services */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={allServicesModal}
            onRequestClose={closeAllServicesModal}
          >
            <Animated.View
              style={[
                styles.modalOverlay,
                { opacity: allServicesModalOpacity },
              ]}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPress={closeAllServicesModal}
              >
                <View
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: extendedTheme.colors.bgTheme,
                      maxHeight: height * 0.7,
                      borderWidth: 1,
                      borderColor: extendedTheme.colors.modalborderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: extendedTheme.colors.text },
                    ]}
                  >
                    All Services
                  </Text>

                  {selectedCategory ? (
                    <>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.backButtonText,
                            { color: extendedTheme.colors.text },
                          ]}
                        >
                          ← Back
                        </Text>
                      </TouchableOpacity>

                      <FlatList
                        data={selectedCategory.services}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => (
                          <TouchableOpacity
                            style={[
                              styles.subcategoryItem,
                              {
                                borderBottomColor:
                                  extendedTheme.colors.borderColor,
                              },
                            ]}
                            onPress={() => handleSubcategoryPress(item)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.subcategoryText,
                                { color: extendedTheme.colors.text },
                              ]}
                            >
                              {index + 1}. {item.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        style={styles.subcategoryList}
                      />
                    </>
                  ) : (
                    <FlatList
                      data={services}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item, index }) => (
                        <TouchableOpacity
                          style={[
                            styles.categoryItem,
                            {
                              borderBottomColor:
                                extendedTheme.colors.borderColor,
                            },
                          ]}
                          onPress={() => handleCategoryPress(item)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              { color: extendedTheme.colors.text },
                            ]}
                          >
                            {index + 1}. {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                      style={styles.categoryList}
                    />
                  )}

                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: "#ff3b30" }]}
                    onPress={closeAllServicesModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Modal>

          <View style={styles.bottomNavContainer}>
            <BottomNavBar />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomNavContainer: {
    paddingBottom: 2,
    backgroundColor: "transparent",
  },
  headerContainer: {
    height: "35%",
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickSaleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quickSaleText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to ensure all content is visible
  },
  contentText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceItem: {
    width: "31%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  serviceOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.47)",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  moreButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  moreText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subcategoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  subcategoryText: {
    fontSize: 18,
  },
  categoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 18,
  },
  subcategoryList: {
    maxHeight: height * 0.5,
  },
  categoryList: {
    maxHeight: height * 0.5,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
