import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
// import { axiosInstance } from '@/constants/api.config';
import axiosInstance from "../api/api";

const ValidationSchema = Yup.object().shape({
  customerName: Yup.string().required("Customer name is required"),
  mobileNumber: Yup.string()
    .required("Mobile number is required")
    .min(9, "Phone number is too short")
    .matches(/^[0-9]+$/, "Must contain only digits"),
  advanceAmount: Yup.number().nullable(),
  workStatus: Yup.string().nullable(),
  nextServiceDate: Yup.date().nullable(),
  dateIn: Yup.date().required("Date in is required"),
  deliveryDate: Yup.date().nullable(),
});

// Update product options to remove image
const productOptions = [
  { id: "1", name: "Engine Oil 5W-30 ", price: 45, quantity: 0 },
  { id: "2", name: "Brake Pads Set", price: 85, quantity: 0 },
  { id: "3", name: "Air Filter", price: 25, quantity: 0 },
  { id: "4", name: "Oil Filter", price: 15, quantity: 0 },
  { id: "5", name: "Wiper Blades", price: 35, quantity: 0 },
];

export default function AddNewJobCard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams();

  // Image states
  const [carImages, setCarImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [istimaraImages, setIstimaraImages] = useState({
    front: null,
    back: null,
  });
  const [additionalImages, setAdditionalImages] = useState([]);
  const [imageLoading, setImageLoading] = useState({
    carFront: false,
    carBack: false,
    carLeft: false,
    carRight: false,
    istimaraFront: false,
    istimaraBack: false,
    additional: false,
  });

  // Car data states
  const [carMakes, setCarMakes] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [filteredMakes, setFilteredMakes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMakesDropdown, setShowMakesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState(null);

  // Customer vehicle states
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showVehiclesDropdown, setShowVehiclesDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");

  // Add vehicle make/model modal states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newVehicleYear, setNewVehicleYear] = useState("");
  const [newVehicleKm, setNewVehicleKm] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [showVehicleNameDropdown, setShowVehicleNameDropdown] = useState(false);
  const [vehicleNameSearchQuery, setVehicleNameSearchQuery] = useState("");
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [filteredAvailableVehicles, setFilteredAvailableVehicles] = useState(
    []
  );
  const [newVehicleModel, setNewVehicleModel] = useState(null);
  const [showVehicleModelDropdown, setShowVehicleModelDropdown] =
    useState(false);
  const [selectedVehicleName, setSelectedVehicleName] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState({
    chaseNumber: "",
    vehicleKilometers: "",
  });
  // Service states
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showSubServiceDropdown, setShowSubServiceDropdown] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedMainService, setSelectedMainService] = useState(null);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [addedServices, setAddedServices] = useState([]);

  const [selectedModalProducts, setSelectedModalProducts] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Date states
  const [dateIn, setDateIn] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  console.log(deliveryDate);
  
  const [nextServiceDate, setNextServiceDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({
    dateIn: false,
    deliveryDate: false,
    nextServiceDate: false,
  });

  // Calculate totals
  const servicesTotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0
  );
  const productsTotal = selectedProducts.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  const grandTotal = servicesTotal + productsTotal;

  // Calculate selected subservices total
  const calculateSelectedTotal = () => {
    return selectedSubServices.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      return sum + price;
    }, 0);
  };

  // Handle subservice selection
  const toggleSubService = (subService) => {
    setSelectedSubServices((prev) => {
      const isSelected = prev.some((s) => s.id === subService.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== subService.id);
      } else {
        return [...prev, subService];
      }
    });
  };

  // Handle service addition
  const handleAddService = () => {
    if (selectedMainService && selectedSubServices.length > 0) {
      // Check if this main service already exists in addedServices
      const existingServiceIndex = addedServices.findIndex(
        (service) => service.mainService.id === selectedMainService.id
      );

      if (existingServiceIndex !== -1) {
        // If the main service exists, update it with the current selection
        const existingService = addedServices[existingServiceIndex];

        // Calculate total for the current selection
        const currentTotal = selectedSubServices.reduce((sum, sub) => {
          const price = parseFloat(sub.price) || 0;
          return sum + price;
        }, 0);

        const updatedService = {
          ...existingService,
          subServices: selectedSubServices,
          total: currentTotal,
        };

        setAddedServices((prev) => [
          ...prev.slice(0, existingServiceIndex),
          updatedService,
          ...prev.slice(existingServiceIndex + 1),
        ]);
      } else {
        // If it's a new main service, add it normally
        const newService = {
          id: Date.now(),
          mainService: selectedMainService,
          subServices: selectedSubServices,
          total: calculateSelectedTotal(),
        };
        setAddedServices((prev) => [...prev, newService]);
      }

      setShowServiceModal(false);
      setSelectedMainService(null);
      setSelectedSubServices([]);
    }
  };

  // Handle editing service
  const handleEditService = (service) => {
    setSelectedMainService(service.mainService);
    setSelectedSubServices(service.subServices);
    setShowServiceModal(true);
  };

  // Handle removing service
  const handleRemoveService = (serviceId, event) => {
    event.stopPropagation(); // Prevent triggering the edit modal
    setAddedServices((prev) =>
      prev.filter((service) => service.id !== serviceId)
    );
  };

  // Fetch car makes
  useEffect(() => {
    const fetchCarMakes = async () => {
      try {
        // Replace with your actual API endpoint
        // const response = await axiosInstance.get('/api/car-makes');
        // Fallback mock data in case API fails
        const mockCarMakes = [
          { id: 1, name: "Toyota" },
          { id: 2, name: "Honda" },
          { id: 3, name: "Nissan" },
          { id: 4, name: "BMW" },
          { id: 5, name: "Mercedes" },
          { id: 6, name: "Audi" },
          { id: 7, name: "Lexus" },
          { id: 8, name: "Ford" },
          { id: 9, name: "Hyundai" },
          { id: 10, name: "Kia" },
        ];

        // Use API data if available, otherwise use mock data
        const makes = mockCarMakes; // response?.data?.makes || mockCarMakes;
        setCarMakes(makes);
        setFilteredMakes(makes);
      } catch (error) {
        console.log("Error fetching car makes:", error);
        // Set mock data as fallback
        const mockCarMakes = [
          { id: 1, name: "Toyota" },
          { id: 2, name: "Honda" },
          { id: 3, name: "Nissan" },
          { id: 4, name: "BMW" },
          { id: 5, name: "Mercedes" },
          { id: 6, name: "Audi" },
          { id: 7, name: "Lexus" },
          { id: 8, name: "Ford" },
          { id: 9, name: "Hyundai" },
          { id: 10, name: "Kia" },
        ];
        setCarMakes(mockCarMakes);
        setFilteredMakes(mockCarMakes);
      }
    };

    fetchCarMakes();
  }, []);

  // Function to fetch car models based on selected make
  const fetchCarModels = async (makeId) => {
    try {
      // This function is no longer needed - we're using customer vehicles instead
    } catch (error) {
      console.log("Error fetching car models:", error);
    }
  };

  // Handle search for car make
  const handleSearchMake = (text) => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  // Handle selecting a car make
  const handleSelectMake = (make, setFieldValue) => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  // Handle selecting a car model
  const handleSelectModel = (model, setFieldValue) => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  const addModelField = () => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  const removeModel = (index) => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  const updateModel = (index, value) => {
    // This function is no longer needed - we're using customer vehicles instead
  };

  // Handle image picking
  const pickImage = async (type, position) => {
    const loadingKey =
      type === "car"
        ? `car${position.charAt(0).toUpperCase() + position.slice(1)}`
        : type === "istimara"
        ? `istimara${position.charAt(0).toUpperCase() + position.slice(1)}`
        : "additional";

    setImageLoading((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        setImageLoading((prev) => ({ ...prev, [loadingKey]: false }));
        return;
      }

      // Take the photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: false,
        aspect: [4, 3],
        presentationStyle: "fullScreen",
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Create the file object with the original image
        const file = {
          uri: imageUri,
          type: "image/jpeg",
          name: `${type}_${position}_${new Date().getTime()}.jpg`,
        };

        // Set the image based on type
        if (type === "car") {
          setCarImages((prev) => ({
            ...prev,
            [position]: file,
          }));
        } else if (type === "istimara") {
          setIstimaraImages((prev) => ({
            ...prev,
            [position]: file,
          }));
        } else if (type === "additional") {
          setAdditionalImages((prev) => [...prev, file]);
        }
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to capture image");
    } finally {
      setImageLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Remove additional image
  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // // Date picker handlers
  // const toggleDatePicker = (dateType, currentValue, setFieldValue) => {
  //   // Close all other date pickers first
  //   setShowDatePicker(prev => {
  //     const newState = { ...prev };
  //     Object.keys(newState).forEach(key => {
  //       newState[key] = false;
  //     });
  //     // Then open the selected one
  //     newState[dateType] = true;
  //     return newState;
  //   });
  // };

  // const onDateChange = (event, selectedDate, dateType, setFieldValue) => {
  //   // Only update the date if it's a complete selection
  //   if (event.type === 'set' && selectedDate) {
  //     const currentDate = selectedDate;

  //     if (dateType === 'dateIn') {
  //       setDateIn(currentDate);
  //     } else if (dateType === 'deliveryDate') {
  //       setDeliveryDate(currentDate);
  //     } else if (dateType === 'nextServiceDate') {
  //       setNextServiceDate(currentDate);
  //     }
  //   }
  // };

  // const handleCancelDatePicker = (dateType) => {
  //   setShowDatePicker(prev => ({ ...prev, [dateType]: false }));
  // };

  // const handleConfirmDate = (dateType, setFieldValue) => {
  //   if (dateType === 'dateIn') {
  //     setFieldValue('dateIn', dateIn);
  //   } else if (dateType === 'deliveryDate') {
  //     setFieldValue('deliveryDate', deliveryDate);
  //   } else if (dateType === 'nextServiceDate') {
  //     setFieldValue('nextServiceDate', nextServiceDate);
  //   }

  //   // Close the date picker
  //   setShowDatePicker(prev => ({ ...prev, [dateType]: false }));
  // };

  // Date picker handlers
  const toggleDatePicker = (dateType, currentValue, setFieldValue) => {
    setShowDatePicker((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = false;
      });
      newState[dateType] = true;
      return newState;
    });
  };

  const onDateChange = (event, selectedDate, dateType, setFieldValue) => {
    // For Android: immediate selection, so close the picker and set the value
    if (Platform.OS === "android") {
      setShowDatePicker((prev) => ({ ...prev, [dateType]: false }));

      if (selectedDate) {
        if (dateType === "dateIn") {
          setDateIn(selectedDate);
          setFieldValue("dateIn", selectedDate);
        } else if (dateType === "deliveryDate") {
          setDeliveryDate(selectedDate);
          setFieldValue("deliveryDate", selectedDate);
        } else if (dateType === "nextServiceDate") {
          setNextServiceDate(selectedDate);
          setFieldValue("nextServiceDate", selectedDate);
        }
      }
    } else {
      // For iOS: just update the state, let the OK button handle the final selection
      if (selectedDate) {
        if (dateType === "dateIn") {
          setDateIn(selectedDate);
        } else if (dateType === "deliveryDate") {
          setDeliveryDate(selectedDate);
        } else if (dateType === "nextServiceDate") {
          setNextServiceDate(selectedDate);
        }
      }
    }
  };

  const handleCancelDatePicker = (dateType) => {
    setShowDatePicker((prev) => ({ ...prev, [dateType]: false }));
  };

  const handleConfirmDate = (dateType, setFieldValue) => {
    // Set the form field value
    if (dateType === "dateIn") {
      setFieldValue("dateIn", dateIn);
    } else if (dateType === "deliveryDate") {
      setFieldValue("deliveryDate", deliveryDate);
    } else if (dateType === "nextServiceDate") {
      setFieldValue("nextServiceDate", nextServiceDate);
    }

    // Close the date picker
    setShowDatePicker((prev) => ({ ...prev, [dateType]: false }));
  };

  // Format date for display (dd/mm/yyyy)
  const formatDate = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Add this state near the other state declarations at the top
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Add these state variables near the other state declarations
  const [advanceAmountValue, setAdvanceAmountValue] = useState("");
  const [commonNoteValue, setCommonNoteValue] = useState("");

  // Add this state variable near the other state declarations
  const [workStatusValue, setWorkStatusValue] = useState("pending");

  // Update the handleSubmit function
  const handlejobcardSubmit = async (values) => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setShowLoadingModal(true);
    try {
      // Check if required images are uploaded
      if (
        !carImages.front ||
        !carImages.back ||
        !carImages.left ||
        !carImages.right
      ) {
        Alert.alert(
          "Missing Images",
          "Please upload all required vehicle images"
        );
        setIsSubmitting(false);
        setShowLoadingModal(false);
        return;
      }

      if (addedServices.length === 0) {
        Alert.alert("Missing Services", "Please select at least one service");
        setIsSubmitting(false);
        setShowLoadingModal(false);
        return;
      }

      if (!selectedCustomer || !selectedVehicle) {
        Alert.alert(
          "Missing Information",
          "Please select both customer and vehicle"
        );
        setIsSubmitting(false);
        setShowLoadingModal(false);
        return;
      }
      const formattedServices = addedServices.flatMap((service) =>
        service.subServices.map((sub) => ({
          id: sub.id || null, // keep id if exists
          category: service.mainService.id, // main service category ID
          service: sub.id, // subservice ID
          quantity: parseFloat(sub.quantity) || 1, // default 1 if not tracked
          price: parseFloat(sub.price) || 0,
          total: parseFloat(sub.price) * (parseFloat(sub.quantity) || 1),
          notes: sub.notes || "",
        }))
      );

      const formattedProducts = selectedProducts.map((prod) => ({
        id: null, // always null for new items
        product: String(prod.id), // API expects product ID as string
        quantity: parseFloat(prod.quantity) || 1,
        price: parseFloat(prod.price) || 0,
        total: (parseFloat(prod.price) || 0) * (parseFloat(prod.quantity) || 1),
      }));

      // Create form data for the entire payload
      const formData = new FormData();
console.log(formData,"form data");

      // Add all the regular fields
      formData.append("customer", selectedCustomer.id);
      formData.append("customer_vehicle", selectedVehicle.id);
      formData.append("job_card_description", "");
      formData.append("job_card_status", workStatusValue);
      formData.append("priority_status", priority);
      formData.append("common_notes", commonNoteValue || "");
      // formData.append("service_date", dateIn.toISOString().split("T")[0]);
      // formData.append(
      //   "estimated_date",
      //   deliveryDate ? deliveryDate.toISOString().split("T")[0] : ""
      // );
      // formData.append(
      //   "next_service_date",
      //   nextServiceDate ? nextServiceDate.toISOString().split("T")[0] : ""
      // );
      const today = new Date().toISOString().split("T")[0];

formData.append("service_date", dateIn ? dateIn.toISOString().split("T")[0] : today);
formData.append("estimated_date", deliveryDate ? deliveryDate.toISOString().split("T")[0] : today);
formData.append("next_service_date", nextServiceDate ? nextServiceDate.toISOString().split("T")[0] : today);

      formData.append("sub_total", calculateSubTotal().toString());
      formData.append("total_amount", calculateTotal().toString());
      formData.append("job_card_total_amount", calculateTotal().toString());
      formData.append("advance_amount", advanceAmountValue || "0");
      formData.append(
        "balance_amount",
        calculateBalance(advanceAmountValue).toString()
      );
      formData.append("chase_no", vehicleDetails.chaseNumber || "");
      formData.append("kilometers", vehicleDetails.vehicleKilometers || "");

      formData.append("discount_amount", discount || "0");
      formData.append("discount_type", "amount");
      formData.append("discount_value", discount || "0");

      formData.append("common_expense_amount", "0");
      formData.append("employee_cost_amount", "0");
      formData.append("vehicle_in", "false");
      formData.append("vehicle_out", "false");
      formData.append("date_out", "");

      formData.append("services", JSON.stringify(formattedServices));
      formData.append("products", JSON.stringify(formattedProducts));
      formData.append("expenses", JSON.stringify([]));

      // Add vehicle images with proper file structure
     Object.values(carImages).forEach((image) => {
  if (image) {
    formData.append("vehicle_images", image);
  }
});

// Istimara images (convert object -> array, filter nulls)
Object.values(istimaraImages).forEach((image) => {
  if (image) {
    formData.append("istimara_images", image);
  }
});
      // Add additional images
      additionalImages.forEach((image, index) => {
        formData.append(`additional_images[${index}]`, image);
      });

      console.log("Submitting job card with data:", {
        customer: selectedCustomer.id,
        vehicle: selectedVehicle.id,
        services: addedServices.length,
        products: selectedProducts.length,
        images: {
          vehicle: Object.keys(carImages).filter((k) => carImages[k]).length,
          istimara: Object.keys(istimaraImages).filter((k) => istimaraImages[k])
            .length,
          additional: additionalImages.length,
        },
      });

      // Send the formData to the API
      const response = await axiosInstance.post("/job-cards/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("Job card submission response:", response.data);

      // Handle successful response
      Alert.alert("Success", "Job card has been created successfully", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/jobcard");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating job card:", error);

      // Log more detailed error information
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      // Show appropriate error message
      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Timeout Error",
          "The request took too long to complete. Please try again."
        );
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message ||
            "Failed to create job card. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
      setShowLoadingModal(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF4444"; // Red
      case "in_progress":
        return "#ffcd00"; // Yellow
      case "completed":
        return "#4CAF50"; // Green
      default:
        return theme.cancelButtonBackground;
    }
  };

  // Generate theme styles based on color scheme
  const theme = {
    backgroundColor: isDark ? "#121212" : "#f5f5f5",
    cardBackground: isDark ? "#1e1e1e" : "#ffffff",
    textColor: isDark ? "#ffffff" : "#000000",
    placeholderColor: isDark ? "#888888" : "#aaaaaa",
    borderColor: isDark ? "#444444" : "#dddddd",
    dashedBorderColor: isDark ? "#555555" : "#cccccc",
    buttonBackground: isDark ? "#2F6FED" : "#007bff",
    buttonText: "#ffffff",
    cancelButtonBackground: isDark ? "#333333" : "#f5f5f5",
    cancelButtonText: isDark ? "#ffffff" : "#666666",
    secondaryBackground: isDark ? "#2a2a2a" : "#f8f8f8",
    errorColor: "#ff6b6b",
    modalBackground: isDark ? "#2f2f2f" : "#f4f4f4",
  };

  // Handle adding a new vehicle
  const handleAddNewVehicle = async (setFieldValue) => {
    if (!selectedVehicleName) {
      Alert.alert("Error", "Please select a vehicle name");
      return;
    }

    if (!newVehicleNumber.trim()) {
      Alert.alert("Error", "Please enter a vehicle number");
      return;
    }

    if (!newVehicleYear.trim()) {
      Alert.alert("Error", "Please enter a vehicle year");
      return;
    }

    if (!newVehicleKm.trim()) {
      Alert.alert("Error", "Please enter current kilometers");
      return;
    }

    setIsAddingVehicle(true);
    try {
      const response = await axiosInstance.post("/customer-vehicles/", {
        customer: selectedCustomer.id,
        vehicle: selectedVehicleName.id, // Pass the selected vehicle ID
        vehicle_model: newVehicleModel?.id,
        vehicle_number: newVehicleNumber.trim(),
        vehicle_year: parseInt(newVehicleYear.trim()),
        current_kilometers: parseInt(newVehicleKm.trim()),
      });

      // Add the new vehicle to the customer vehicles list
      const newVehicle = {
        ...response.data,
        vehicle_name: selectedVehicleName.vehicle_name, // Add the vehicle name from selectedVehicleName
      };
      setCustomerVehicles((prev) => [...prev, newVehicle]);
      setFilteredVehicles((prev) => [...prev, newVehicle]);

      // Select the newly created vehicle
      setSelectedVehicle(newVehicle);

      // Reset state
      setShowAddVehicleModal(false);
      setNewVehicleName("");
      setNewVehicleNumber("");
      setNewVehicleYear("");
      setNewVehicleKm("");
      setSelectedVehicleName(null);
    } catch (error) {
      console.error("Error adding vehicle:", error);
      Alert.alert("Error", "Failed to add vehicle");
    } finally {
      setIsAddingVehicle(false);
    }
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await axiosInstance.get("/products/");
        const products = response.data.results.map((product) => ({
          id: product.id.toString(),
          name: product.name,
          price: parseFloat(product.selling_price),
          availableQuantity: parseInt(product.quantity),
          quantity: 0,
        }));
        setProductsList(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to fetch products");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle product quantity change with validation
  const handleQuantityChange = (productId, change) => {
    setProductsList((prev) =>
      prev.map((product) => {
        if (product.id === productId) {
          const newQuantity = Math.max(
            1,
            Math.min(product.availableQuantity, product.quantity + change)
          );
          return { ...product, quantity: newQuantity };
        }
        return product;
      })
    );

    // Also update the quantity in selectedModalProducts
    setSelectedModalProducts((prev) =>
      prev.map((product) => {
        if (product.id === productId) {
          const newQuantity = Math.max(
            1,
            Math.min(product.availableQuantity, product.quantity + change)
          );
          return { ...product, quantity: newQuantity };
        }
        return product;
      })
    );
  };

  // Handle product selection
  const toggleProductSelection = (product) => {
    setSelectedModalProducts((prev) => {
      const isSelected = prev.some((p) => p.id === product.id);
      if (isSelected) {
        // Remove product and reset its quantity
        setProductsList((prevList) =>
          prevList.map((p) => (p.id === product.id ? { ...p, quantity: 1 } : p))
        );
        return prev.filter((p) => p.id !== product.id);
      } else {
        // Add product with quantity 1 if available
        if (product.availableQuantity > 0) {
          setProductsList((prevList) =>
            prevList.map((p) =>
              p.id === product.id ? { ...p, quantity: 1 } : p
            )
          );
          return [...prev, { ...product, quantity: 1 }];
        } else {
          Alert.alert("Out of Stock", "This product is currently out of stock");
          return prev;
        }
      }
    });
  };

  // Handle adding selected products
  const handleAddProducts = () => {
    const productsWithQuantities = selectedModalProducts.map((product) => {
      const productWithQty = productsList.find((p) => p.id === product.id);
      return { ...product, quantity: productWithQty.quantity };
    });
    setSelectedProducts(productsWithQuantities);
    setShowProductModal(false);
  };

  // Reset modal state when opening
  const openProductModal = () => {
    setShowProductModal(true);
    setIsLoadingProducts(true);
    axiosInstance
      .get("/products/")
      .then((response) => {
        const products = response.data.results.map((product) => ({
          id: product.id.toString(),
          name: product.name,
          price: parseFloat(product.selling_price),
          availableQuantity: parseInt(product.quantity),
          quantity: 1,
        }));

        // Initialize selected products and quantities
        setProductsList(
          products.map((product) => {
            const selectedProduct = selectedProducts.find(
              (p) => p.id === product.id
            );
            return selectedProduct
              ? { ...product, quantity: selectedProduct.quantity }
              : product;
          })
        );
        setSelectedModalProducts(selectedProducts);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to fetch products");
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  };

  // Calculate products total
  const calculateProductsTotal = (products) => {
    return products.reduce((sum, product) => {
      // Find the current quantity from productsList for modal products
      const currentProduct = productsList.find((p) => p.id === product.id);
      const quantity = currentProduct
        ? currentProduct.quantity
        : product.quantity;
      return sum + product.price * quantity;
    }, 0);
  };

  // Handle clearing all selected products
  const handleClearAllProducts = () => {
    setSelectedModalProducts([]);
    setProductsList((prev) =>
      prev.map((product) => ({ ...product, quantity: 0 }))
    );
  };

  // ... existing states ...
  const [serviceNotes, setServiceNotes] = useState({});
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentServiceNote, setCurrentServiceNote] = useState("");
  const [currentServiceId, setCurrentServiceId] = useState(null);
  const [commonNote, setCommonNote] = useState("");
  const [discount, setDiscount] = useState("");

  // Handle opening note modal
  const handleOpenNoteModal = (serviceId) => {
    setCurrentServiceId(serviceId);
    setCurrentServiceNote(serviceNotes[serviceId] || "");
    setShowNoteModal(true);
  };

  // Handle saving note
  const handleSaveNote = () => {
    if (currentServiceId) {
      setServiceNotes((prev) => ({
        ...prev,
        [currentServiceId]: currentServiceNote,
      }));
    }
    setShowNoteModal(false);
  };

  // Handle clearing note
  const handleClearNote = () => {
    if (currentServiceId) {
      setServiceNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[currentServiceId];
        return newNotes;
      });
    }
    setShowNoteModal(false);
  };

  // Calculate totals
  const calculateSubTotal = () => {
    const servicesTotal = addedServices.reduce(
      (sum, service) => sum + service.total,
      0
    );
    const productsTotal = selectedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    return servicesTotal + productsTotal;
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discountAmount = parseFloat(discount) || 0;
    return Math.max(0, subTotal - discountAmount);
  };

  // Calculate balance
  const calculateBalance = (advanceAmount) => {
    const total = calculateTotal();
    const advance = parseFloat(advanceAmount) || 0;
    return Math.max(0, total - advance);
  };

  // Add these state variables after the existing state declarations
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerMobile, setNewCustomerMobile] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Add these functions after the existing function declarations
  const handleCustomerSearch = async (text) => {
    setCustomerSearchQuery(text);
    if (text.length >= 2) {
      try {
        const response = await axiosInstance.get(
          `/clients/?customer_name_mobile=${text}`
        );
        setCustomers(response.data.results);
        setShowCustomerDropdown(true);
      } catch (error) {
        console.error("Error searching customers:", error);
        Alert.alert("Error", "Failed to search customers");
      }
    } else {
      setCustomers([]);
      setShowCustomerDropdown(false);
    }
  };

  const fetchCustomerVehicles = async (customerId) => {
    try {
      const response = await axiosInstance.get(
        `/customer-vehicles/?customer=${customerId}`
      );
      setCustomerVehicles(response.data.results);
      setFilteredVehicles(response.data.results);
    } catch (error) {
      console.error("Error fetching customer vehicles:", error);
      Alert.alert("Error", "Failed to fetch customer vehicles");
      setCustomerVehicles([]);
      setFilteredVehicles([]);
    }
  };

  const handleSelectCustomer = (customer, setFieldValue) => {
    setSelectedCustomer(customer);
    setFieldValue("customerName", customer.name);
    setFieldValue("mobileNumber", customer.mobile_number);
    setShowCustomerDropdown(false);
    setCustomerSearchQuery("");

    // Reset vehicle selection when customer changes
    setSelectedVehicle(null);
    setFieldValue("carMake", "");

    // Fetch customer vehicles
    fetchCustomerVehicles(customer.id);
  };

  // Function to handle vehicle search
  const handleVehicleSearch = (text) => {
    setVehicleSearchQuery(text);
    if (text) {
      const filtered = customerVehicles.filter(
        (vehicle) =>
          vehicle.vehicle_name.toLowerCase().includes(text.toLowerCase()) ||
          vehicle.vehicle_number.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(customerVehicles);
    }
  };

  // Function to handle vehicle selection
  const handleSelectVehicle = (vehicle, setFieldValue) => {
    setSelectedVehicle(vehicle);
    // Don't set the field value in the form payload, just for display
    setShowVehiclesDropdown(false);
    setVehicleSearchQuery("");
  };

  // Add loading state
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerMobile.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsAddingCustomer(true);
    try {
      const response = await axiosInstance.post("/clients/", {
        name: newCustomerName.trim(),
        mobile_number: newCustomerMobile.trim(),
        opening_balance: 0,
      });

      setSelectedCustomer(response.data);
      setShowAddCustomerModal(false);
      setNewCustomerName("");
      setNewCustomerMobile("");
      setCustomerSearchQuery(response.data.name); // Set the search query to the new customer's name
    } catch (error) {
      console.error("Error adding customer:", error);
      Alert.alert("Error", "Failed to add customer");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // Function to handle vehicle name search
  const handleVehicleNameSearch = async (text) => {
    setVehicleNameSearchQuery(text);
    if (text.length >= 2) {
      setIsSearchingVehicleName(true);
      try {
        const response = await axiosInstance.get(
          `/vehicles/?vehicle_name_model=${text}`
        );
        setAvailableVehicles(response.data.results);
        setFilteredAvailableVehicles(response.data.results);
      } catch (error) {
        console.error("Error searching vehicles:", error);
      } finally {
        setIsSearchingVehicleName(false);
      }
    } else {
      setAvailableVehicles([]);
      setFilteredAvailableVehicles([]);
    }
  };

  // Function to handle vehicle name selection
  const handleSelectVehicleName = (vehicle) => {
    setSelectedVehicleName(vehicle);
    setNewVehicleName(vehicle.vehicle_name);
    setShowVehicleNameDropdown(false);
    setVehicleNameSearchQuery("");
  };

  // Function to handle search input focus
  const handleSearchFocus = () => {
    setShowVehicleNameDropdown(true);
  };

  // Function to handle search input blur
  const handleSearchBlur = () => {
    // Remove the blur handler completely to prevent keyboard from closing
  };

  // Function to handle search input change
  const handleSearchChange = (text) => {
    setVehicleNameSearchQuery(text);
    if (text.length >= 2) {
      handleVehicleNameSearch(text);
    } else {
      setAvailableVehicles([]);
      setFilteredAvailableVehicles([]);
    }
  };

  // Function to handle dropdown item press
  const handleDropdownItemPress = (vehicle) => {
    return () => {
      handleSelectVehicleName(vehicle);
    };
  };

  // Add loading state for vehicles
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isSearchingVehicleName, setIsSearchingVehicleName] = useState(false);

  // Function to handle vehicle dropdown toggle
  const handleVehicleDropdownToggle = async () => {
    if (!selectedCustomer) {
      Alert.alert("Select Customer", "Please select or add a customer first");
      return;
    }

    setShowVehiclesDropdown(!showVehiclesDropdown);

    if (!showVehiclesDropdown) {
      setIsLoadingVehicles(true);
      try {
        await fetchCustomerVehicles(selectedCustomer.id);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        Alert.alert("Error", "Failed to fetch vehicles");
      } finally {
        setIsLoadingVehicles(false);
      }
    }
  };

  // Add priority state
  const [priority, setPriority] = useState("low");

  // Add priority color function
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "#4CAF50"; // Green
      case "medium":
        return "#ffcd00"; // Orange
      case "high":
        return "#FF4444"; // Red
      default:
        return theme.cancelButtonBackground;
    }
  };

  // Add new states for service categories
  const [serviceCategories, setServiceCategories] = useState([]);
  // console.log(serviceCategories,"service categories");

  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Add useEffect to fetch service categories
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await axiosInstance.get("/service-categories/");
        setServiceCategories(response.data);
        setIsLoadingServices(false);
      } catch (error) {
        console.error("Error fetching service categories:", error);
        setIsLoadingServices(false);
        Alert.alert("Error", "Failed to fetch service categories");
      }
    };

    fetchServiceCategories();
  }, []);

  // Add new loading states for buttons
  const [isServiceButtonLoading, setIsServiceButtonLoading] = useState(false);
  const [isProductButtonLoading, setIsProductButtonLoading] = useState(false);

  // Update the service modal open handler
  const handleOpenServiceModal = () => {
    setShowServiceModal(true);
    if (serviceCategories.length === 0) {
      setIsLoadingServices(true);
      axiosInstance
        .get("/service-categories/")
        .then((response) => {
          setServiceCategories(response.data);
        })
        .catch((error) => {
          console.error("Error fetching service categories:", error);
          Alert.alert("Error", "Failed to fetch service categories");
        })
        .finally(() => {
          setIsLoadingServices(false);
        });
    }
  };

  // Add new states for handling route params
  const routeParamsProcessed = useRef(false);

  // Add an extra state to track if params need processing
  const [routeParamsNeedProcessing, setRouteParamsNeedProcessing] =
    useState(false);

  // Check for route params before service categories load
  useEffect(() => {
    const { serviceId, subServiceId, isFromQuickService } = params;
    if (
      isFromQuickService &&
      serviceId &&
      subServiceId &&
      !routeParamsProcessed.current
    ) {
      setRouteParamsNeedProcessing(true);
    }
  }, [params]);

  // Process route params and select service/subservice
  useEffect(() => {
    const handleRouteParams = async () => {
      if (routeParamsProcessed.current) return;

      const { serviceId, subServiceId, isFromQuickService } = params;

      if (
        isFromQuickService &&
        serviceId &&
        subServiceId &&
        serviceCategories.length > 0
      ) {
        try {
          // Convert IDs to strings for comparison
          const serviceIdStr = String(serviceId);
          const subServiceIdStr = String(subServiceId);

          // Find selected main service by id with string comparison
          const mainService = serviceCategories.find(
            (service) => String(service.id) === serviceIdStr
          );

          console.log("Searching for service ID:", serviceIdStr);
          console.log(
            "Available service IDs:",
            serviceCategories.map((s) => String(s.id))
          );
          console.log(
            "Main service found:",
            mainService
              ? { id: mainService.id, name: mainService.name }
              : "Not found"
          );

          if (mainService) {
            console.log(
              `Setting selected main service: ${mainService.name} (ID: ${mainService.id})`
            );
            setSelectedMainService(mainService);

            // Find the subservice in the main service with string comparison
            const subService = mainService.services.find(
              (service) => String(service.id) === subServiceIdStr
            );

            console.log("Searching for subservice ID:", subServiceIdStr);
            console.log(
              "Available subservice IDs in",
              mainService.name,
              ":",
              mainService.services
                .map((s) => `${String(s.id)} (${s.name})`)
                .join(", ")
            );

            console.log(
              "Sub service found:",
              subService
                ? { id: subService.id, name: subService.name }
                : "Not found"
            );

            if (subService) {
              console.log(
                `Setting selected subservice: ${subService.name} (ID: ${subService.id})`
              );
              // Add to selected subservices
              setSelectedSubServices([subService]);

              // Add the service and subservice to added services
              const newService = {
                id: Date.now(),
                mainService: mainService,
                subServices: [subService],
                total: parseFloat(subService.price || 0),
              };

              setAddedServices((prev) => [...prev, newService]);
              console.log("Service added successfully");
            } else {
              console.warn(
                `Could not find subService with ID: ${subServiceIdStr} in service ${mainService.name}`
              );
            }
          } else {
            console.warn(`Could not find service with ID: ${serviceIdStr}`);
          }
        } catch (error) {
          console.error("Error processing route params:", error);
        }
        // Mark as processed regardless of success or failure to avoid repeated processing
        routeParamsProcessed.current = true;
        setRouteParamsNeedProcessing(false);
      }
    };

    if (
      serviceCategories.length > 0 &&
      (routeParamsNeedProcessing || !routeParamsProcessed.current)
    ) {
      handleRouteParams();
    }
  }, [params, serviceCategories, routeParamsNeedProcessing]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginTop: -30,
        backgroundColor: theme.backgroundColor,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[styles.card, { backgroundColor: theme.cardBackground }]}
          >
            <Text style={[styles.title, { color: theme.textColor }]}>
              Add New Job Card
            </Text>

            <Formik
              initialValues={{
                customerName: "",
                mobileNumber: "",
                advanceAmount: "",
                workStatus: "pending",
                dateIn: dateIn,
                deliveryDate: null,
                nextServiceDate: null,
                commonNote: "",
              }}
              validationSchema={ValidationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await handleSubmit(values);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                setFieldValue,
                isSubmitting,
              }) => (
                <View style={styles.formContainer}>
                  {/* Vehicle Images Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Vehicle Images{" "}
                    <Text style={{ color: theme.errorColor }}>*</Text>
                  </Text>
                  <View style={styles.imageGridContainer}>
                    {/* Front and Back images on first row */}
                    <View style={styles.imageRow}>
                      <TouchableOpacity
                        style={[
                          styles.imageContainer,
                          { borderColor: theme.dashedBorderColor },
                        ]}
                        onPress={() => pickImage("car", "front")}
                        disabled={imageLoading.carFront}
                      >
                        {imageLoading.carFront ? (
                          <ActivityIndicator size="small" color="#979797" />
                        ) : (
                          <>
                            {carImages.front ? (
                              <Image
                                source={{ uri: carImages.front.uri }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.imagePlaceholderContainer}>
                                <Ionicons
                                  name="camera"
                                  size={32}
                                  color={theme.placeholderColor}
                                />
                                <Text
                                  style={[
                                    styles.imagePlaceholderText,
                                    { color: theme.placeholderColor },
                                  ]}
                                >
                                  Front View
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.imageContainer,
                          { borderColor: theme.dashedBorderColor },
                        ]}
                        onPress={() => pickImage("car", "back")}
                        disabled={imageLoading.carBack}
                      >
                        {imageLoading.carBack ? (
                          <ActivityIndicator size="small" color="#979797" />
                        ) : (
                          <>
                            {carImages.back ? (
                              <Image
                                source={{ uri: carImages.back.uri }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.imagePlaceholderContainer}>
                                <Ionicons
                                  name="camera"
                                  size={32}
                                  color={theme.placeholderColor}
                                />
                                <Text
                                  style={[
                                    styles.imagePlaceholderText,
                                    { color: theme.placeholderColor },
                                  ]}
                                >
                                  Back View
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Left and Right images on second row */}
                    <View style={styles.imageRow}>
                      <TouchableOpacity
                        style={[
                          styles.imageContainer,
                          { borderColor: theme.dashedBorderColor },
                        ]}
                        onPress={() => pickImage("car", "left")}
                        disabled={imageLoading.carLeft}
                      >
                        {imageLoading.carLeft ? (
                          <ActivityIndicator size="small" color="#979797" />
                        ) : (
                          <>
                            {carImages.left ? (
                              <Image
                                source={{ uri: carImages.left.uri }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.imagePlaceholderContainer}>
                                <Ionicons
                                  name="camera"
                                  size={32}
                                  color={theme.placeholderColor}
                                />
                                <Text
                                  style={[
                                    styles.imagePlaceholderText,
                                    { color: theme.placeholderColor },
                                  ]}
                                >
                                  Left View
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.imageContainer,
                          { borderColor: theme.dashedBorderColor },
                        ]}
                        onPress={() => pickImage("car", "right")}
                        disabled={imageLoading.carRight}
                      >
                        {imageLoading.carRight ? (
                          <ActivityIndicator size="small" color="#979797" />
                        ) : (
                          <>
                            {carImages.right ? (
                              <Image
                                source={{ uri: carImages.right.uri }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.imagePlaceholderContainer}>
                                <Ionicons
                                  name="camera"
                                  size={32}
                                  color={theme.placeholderColor}
                                />
                                <Text
                                  style={[
                                    styles.imagePlaceholderText,
                                    { color: theme.placeholderColor },
                                  ]}
                                >
                                  Right View
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Istimara Images Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Istimara Images{" "}
                    <Text style={{ color: theme.errorColor }}></Text>
                  </Text>
                  <View style={styles.imageRow}>
                    <TouchableOpacity
                      style={[
                        styles.imageContainer,
                        { borderColor: theme.dashedBorderColor },
                      ]}
                      onPress={() => pickImage("istimara", "front")}
                      disabled={imageLoading.istimaraFront}
                    >
                      {imageLoading.istimaraFront ? (
                        <ActivityIndicator size="small" color="#979797" />
                      ) : (
                        <>
                          {istimaraImages.front ? (
                            <Image
                              source={{ uri: istimaraImages.front.uri }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.imagePlaceholderContainer}>
                              <Ionicons
                                name="camera"
                                size={32}
                                color={theme.placeholderColor}
                              />
                              <Text
                                style={[
                                  styles.imagePlaceholderText,
                                  { color: theme.placeholderColor },
                                ]}
                              >
                                Front Side
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.imageContainer,
                        { borderColor: theme.dashedBorderColor },
                      ]}
                      onPress={() => pickImage("istimara", "back")}
                      disabled={imageLoading.istimaraBack}
                    >
                      {imageLoading.istimaraBack ? (
                        <ActivityIndicator size="small" color="#979797" />
                      ) : (
                        <>
                          {istimaraImages.back ? (
                            <Image
                              source={{ uri: istimaraImages.back.uri }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.imagePlaceholderContainer}>
                              <Ionicons
                                name="camera"
                                size={32}
                                color={theme.placeholderColor}
                              />
                              <Text
                                style={[
                                  styles.imagePlaceholderText,
                                  { color: theme.placeholderColor },
                                ]}
                              >
                                Back Side
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Chase Number Field */}
                  <View style={{ marginTop: 16 }}>
                    <Text
                      style={[styles.sectionTitle, { color: theme.textColor }]}
                    >
                      Chase Number
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.dashedBorderColor,
                          color: theme.textColor,
                        },
                      ]}
                      placeholder="Enter Chase Number"
                      placeholderTextColor={theme.placeholderColor}
                      value={vehicleDetails.chaseNumber}
                      onChangeText={(text) =>
                        setVehicleDetails((prev) => ({
                          ...prev,
                          chaseNumber: text,
                        }))
                      }
                    />
                  </View>

                  {/* Vehicle Kilometers Field */}
                  <View style={{ marginTop: 16 }}>
                    <Text
                      style={[styles.sectionTitle, { color: theme.textColor }]}
                    >
                      Vehicle Kilometers
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.dashedBorderColor,
                          color: theme.textColor,
                        },
                      ]}
                      placeholder="Enter Vehicle Kilometers"
                      placeholderTextColor={theme.placeholderColor}
                      keyboardType="numeric"
                      value={vehicleDetails.vehicleKilometers}
                      onChangeText={(text) =>
                        setVehicleDetails((prev) => ({
                          ...prev,
                          vehicleKilometers: text,
                        }))
                      }
                    />
                  </View>

                  {/* Service Selection Section */}
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[styles.sectionTitle, { color: theme.textColor }]}
                    >
                      Add Service
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={handleOpenServiceModal}
                  >
                    <AntDesign
                      name="plus"
                      size={24}
                      color={theme.placeholderColor}
                    />
                    <Text
                      style={[
                        styles.addServiceButtonText,
                        { color: theme.placeholderColor },
                      ]}
                    >
                      Add Service
                    </Text>
                  </TouchableOpacity>

                  {/* Added Services List */}
                  {addedServices.length > 0 && (
                    <View style={styles.selectedItemsSection}>
                      {addedServices.map((service, index) => (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.addedServiceItem,
                            {
                              backgroundColor: isDark ? "#333" : "#ffffff",
                              borderColor: isDark ? "#444" : "#f1f1f1",
                            },
                          ]}
                          onPress={() => handleEditService(service)}
                        >
                          <View style={styles.addedServiceContent}>
                            <View style={styles.serviceMainInfo}>
                              <View style={styles.serviceNameRow}>
                                <Text
                                  style={[
                                    styles.serviceNumber,
                                    { color: theme.textColor },
                                  ]}
                                >
                                  {index + 1}.
                                </Text>
                                <Text
                                  style={[
                                    styles.addedServiceName,
                                    { color: theme.textColor },
                                  ]}
                                >
                                  {service.mainService.name}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.noteButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleOpenNoteModal(service.id);
                                }}
                              >
                                {!serviceNotes[service.id] && (
                                  <AntDesign
                                    name="plus"
                                    size={14}
                                    color={theme.placeholderColor}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.noteButtonText,
                                    {
                                      color: serviceNotes[service.id]
                                        ? "#2196F3"
                                        : theme.placeholderColor,
                                      marginLeft: serviceNotes[service.id]
                                        ? 0
                                        : 4,
                                    },
                                  ]}
                                >
                                  {serviceNotes[service.id]
                                    ? "See Note"
                                    : "Add Note"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.addedServiceActions}>
                            <Text
                              style={[
                                styles.addedServicePrice,
                                { color: theme.textColor },
                              ]}
                            >
                              QAR {service.total}
                            </Text>
                            <TouchableOpacity
                              style={styles.removeServiceButton}
                              onPress={(e) =>
                                handleRemoveService(service.id, e)
                              }
                            >
                              <AntDesign
                                name="delete"
                                size={20}
                                color="#FF6B6B"
                              />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Service Note Modal */}
                  <Modal
                    visible={showNoteModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowNoteModal(false)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.modalOverlay,
                        isDark && styles.modalOverlayDark,
                      ]}
                      activeOpacity={1}
                      onPress={() => setShowNoteModal(false)}
                    >
                      <View
                        style={[
                          styles.modalContent,
                          {
                            backgroundColor: isDark
                              ? "#1e1e1e"
                              : theme.cardBackground,
                            borderColor: isDark ? "#333" : theme.borderColor,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: theme.textColor },
                          ]}
                        >
                          Add Service Note
                        </Text>
                        <TextInput
                          style={[
                            styles.noteTextArea,
                            {
                              color: theme.textColor,
                              backgroundColor: isDark ? "#333" : "#f5f5f5",
                              borderColor: isDark ? "#444" : theme.borderColor,
                            },
                          ]}
                          multiline
                          numberOfLines={4}
                          placeholder="Enter note here..."
                          placeholderTextColor={
                            isDark ? "#888" : theme.placeholderColor
                          }
                          value={currentServiceNote}
                          onChangeText={setCurrentServiceNote}
                        />
                        <View style={styles.noteModalButtons}>
                          {serviceNotes[currentServiceId] && (
                            <TouchableOpacity
                              style={[
                                styles.modalButton,
                                { backgroundColor: "#FF6B6B" },
                              ]}
                              onPress={handleClearNote}
                            >
                              <Text style={styles.modalButtonText}>Clear</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              {
                                backgroundColor: isDark
                                  ? "#333"
                                  : theme.cancelButtonBackground,
                              },
                            ]}
                            onPress={() => setShowNoteModal(false)}
                          >
                            <Text
                              style={[
                                styles.modalButtonText,
                                {
                                  color: isDark
                                    ? "#fff"
                                    : theme.cancelButtonText,
                                },
                              ]}
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              { backgroundColor: theme.buttonBackground },
                            ]}
                            onPress={handleSaveNote}
                          >
                            <Text
                              style={[
                                styles.modalButtonText,
                                { color: theme.buttonText },
                              ]}
                            >
                              Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>

                  {/* Services Total */}
                  {addedServices.length > 0 && (
                    <View style={styles.servicesTotalContainer}>
                      <Text style={styles.servicesTotalText}>
                        Total: QAR{" "}
                        {addedServices.reduce(
                          (sum, service) => sum + service.total,
                          0
                        )}
                      </Text>
                    </View>
                  )}

                  {/* Service Selection Modal */}
                  <Modal
                    visible={showServiceModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowServiceModal(false)}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => setShowServiceModal(false)}
                    >
                      <View
                        style={[
                          styles.modalContent,
                          { backgroundColor: theme.cardBackground },
                        ]}
                      >
                        <View style={styles.modalHeader}>
                          <Text
                            style={[
                              styles.modalTitle,
                              { color: theme.textColor },
                            ]}
                          >
                            Select Service
                          </Text>
                          <Text
                            style={[
                              styles.modalTotal,
                              { color: theme.textColor },
                            ]}
                          >
                            Total: QAR {calculateSelectedTotal()}
                          </Text>
                        </View>

                        {/* Main Service Dropdown */}
                        <TouchableOpacity
                          style={[
                            styles.modalInput,
                            { borderColor: theme.borderColor },
                          ]}
                          onPress={() =>
                            setShowServiceDropdown(!showServiceDropdown)
                          }
                        >
                          <Text
                            style={{
                              color: selectedMainService
                                ? theme.textColor
                                : theme.placeholderColor,
                            }}
                          >
                            {selectedMainService
                              ? selectedMainService.name
                              : "Select Service"}
                          </Text>
                          <AntDesign
                            name={showServiceDropdown ? "up" : "down"}
                            size={16}
                            color={theme.placeholderColor}
                          />
                        </TouchableOpacity>

                        {showServiceDropdown && (
                          <View
                            style={[
                              styles.dropdown,
                              {
                                backgroundColor: theme.cardBackground,
                                borderColor: theme.borderColor,
                              },
                            ]}
                          >
                            {isLoadingServices ? (
                              <View style={styles.loadingContainer}>
                                <ActivityIndicator
                                  size="small"
                                  color={theme.buttonBackground}
                                />
                                <Text
                                  style={[
                                    styles.loadingText,
                                    { color: theme.textColor },
                                  ]}
                                >
                                  Loading services...
                                </Text>
                              </View>
                            ) : (
                              <ScrollView
                                style={styles.dropdownScroll}
                                nestedScrollEnabled={true}
                              >
                                {serviceCategories.map((category) => (
                                  <TouchableOpacity
                                    key={category.id}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                      setSelectedMainService(category);
                                      setShowServiceDropdown(false);
                                      setSelectedSubServices([]);
                                    }}
                                  >
                                    <Text style={{ color: theme.textColor }}>
                                      {category.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            )}
                          </View>
                        )}

                        {/* Sub-services List */}
                        {selectedMainService && (
                          <ScrollView style={styles.subServicesList}>
                            {selectedMainService.services.map(
                              (service, index) => (
                                <TouchableOpacity
                                  key={service.id}
                                  style={[
                                    styles.subServiceItem,
                                    {
                                      backgroundColor: isDark
                                        ? "#333"
                                        : "#F5F5F5",
                                    },
                                    selectedSubServices.some(
                                      (s) => s.id === service.id
                                    ) && [
                                      styles.subServiceItemSelected,
                                      isDark && { backgroundColor: "#1a365d" },
                                    ],
                                  ]}
                                  onPress={() => toggleSubService(service)}
                                >
                                  <View style={styles.subServiceContent}>
                                    <Text
                                      style={[
                                        styles.serviceNumber,
                                        { color: theme.textColor },
                                      ]}
                                    >
                                      {index + 1}.
                                    </Text>
                                    <Text
                                      style={[
                                        styles.subServiceName,
                                        { color: theme.textColor },
                                      ]}
                                    >
                                      {service.name}
                                    </Text>
                                  </View>
                                  <Text
                                    style={[
                                      styles.subServicePrice,
                                      { color: isDark ? "#63B3ED" : "#2196F3" },
                                    ]}
                                  >
                                    QAR {service.price}
                                  </Text>
                                </TouchableOpacity>
                              )
                            )}
                          </ScrollView>
                        )}

                        <View style={styles.modalButtons}>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              { backgroundColor: theme.cancelButtonBackground },
                            ]}
                            onPress={() => setShowServiceModal(false)}
                          >
                            <Text
                              style={[
                                styles.modalButtonText,
                                { color: theme.cancelButtonText },
                              ]}
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              { backgroundColor: theme.buttonBackground },
                            ]}
                            onPress={handleAddService}
                          >
                            <Text
                              style={[
                                styles.modalButtonText,
                                { color: theme.buttonText },
                              ]}
                            >
                              Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>

                  {/* Product Selection Section */}
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[styles.sectionTitle, { color: theme.textColor }]}
                    >
                      Add Products
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={openProductModal}
                  >
                    <AntDesign
                      name="plus"
                      size={24}
                      color={theme.placeholderColor}
                    />
                    <Text
                      style={[
                        styles.addServiceButtonText,
                        { color: theme.placeholderColor },
                      ]}
                    >
                      Add Products
                    </Text>
                  </TouchableOpacity>

                  {selectedProducts.length > 0 && (
                    <View style={styles.selectedItemsSection}>
                      <TouchableOpacity
                        style={styles.selectedProductsPreview}
                        onPress={openProductModal}
                      >
                        <Text
                          style={[
                            styles.previewTotal,
                            { color: theme.textColor },
                          ]}
                        >
                          Total: QAR {calculateProductsTotal(selectedProducts)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Products Selection Modal */}
                  <Modal
                    visible={showProductModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowProductModal(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setShowProductModal(false)}
                    >
                      <View
                        style={[
                          styles.modalOverlay,
                          isDark && styles.modalOverlayDark,
                        ]}
                      >
                        <TouchableWithoutFeedback onPress={() => {}}>
                          <View
                            style={[
                              styles.modalContent,
                              {
                                backgroundColor: isDark
                                  ? "#1e1e1e"
                                  : theme.cardBackground,
                                borderColor: isDark
                                  ? "#333"
                                  : theme.borderColor,
                                borderWidth: 1,
                              },
                            ]}
                          >
                            <View style={styles.modalHeader}>
                              <Text
                                style={[
                                  styles.modalTitle,
                                  { color: theme.textColor },
                                ]}
                              >
                                Select Products
                              </Text>
                              <Text
                                style={[
                                  styles.modalTotal,
                                  { color: theme.textColor },
                                ]}
                              >
                                Total: QAR{" "}
                                {calculateProductsTotal(selectedModalProducts)}
                              </Text>
                            </View>

                            {isLoadingProducts ? (
                              <View style={styles.loadingContainer}>
                                <ActivityIndicator
                                  size="large"
                                  color={theme.buttonBackground}
                                />
                                <Text
                                  style={[
                                    styles.loadingText,
                                    { color: theme.textColor },
                                  ]}
                                >
                                  Loading products...
                                </Text>
                              </View>
                            ) : (
                              <ScrollView style={styles.productsList}>
                                {productsList.length === 0 ? (
                                  <Text
                                    style={[
                                      styles.noDataText,
                                      { color: theme.placeholderColor },
                                    ]}
                                  >
                                    No products available
                                  </Text>
                                ) : (
                                  productsList.map((product) => {
                                    const isSelected =
                                      selectedModalProducts.some(
                                        (p) => p.id === product.id
                                      );
                                    return (
                                      <TouchableOpacity
                                        key={product.id}
                                        style={[
                                          styles.productItem,
                                          {
                                            backgroundColor: isDark
                                              ? "#333"
                                              : "#F5F5F5",
                                          },
                                          isSelected && [
                                            styles.productItemSelected,
                                            isDark && {
                                              backgroundColor: "#1a365d",
                                            },
                                          ],
                                          product.availableQuantity === 0 &&
                                            styles.productItemDisabled,
                                        ]}
                                        onPress={() =>
                                          toggleProductSelection(product)
                                        }
                                        disabled={
                                          product.availableQuantity === 0
                                        }
                                      >
                                        <View style={styles.productInfo}>
                                          <Text
                                            style={[
                                              styles.productName,
                                              {
                                                color: theme.textColor,
                                                opacity:
                                                  product.availableQuantity ===
                                                  0
                                                    ? 0.5
                                                    : 1,
                                              },
                                            ]}
                                            numberOfLines={1}
                                          >
                                            {product.name}
                                          </Text>
                                          <View style={styles.productDetails}>
                                            <Text
                                              style={[
                                                styles.productPrice,
                                                {
                                                  color: isDark
                                                    ? "#63B3ED"
                                                    : "#2196F3",
                                                },
                                              ]}
                                            >
                                              QAR {product.price}
                                            </Text>
                                            <Text
                                              style={[
                                                styles.availableQuantity,
                                                {
                                                  color: theme.placeholderColor,
                                                },
                                              ]}
                                            >
                                              Available:{" "}
                                              {product.availableQuantity}
                                            </Text>
                                          </View>
                                        </View>
                                        {isSelected && (
                                          <View
                                            style={[
                                              styles.quantityControl,
                                              {
                                                backgroundColor: isDark
                                                  ? "#1e1e1e"
                                                  : "#fff",
                                              },
                                            ]}
                                          >
                                            <TouchableOpacity
                                              style={[
                                                styles.quantityButton,
                                                {
                                                  backgroundColor:
                                                    theme.buttonBackground,
                                                },
                                              ]}
                                              onPress={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(
                                                  product.id,
                                                  -1
                                                );
                                              }}
                                            >
                                              <AntDesign
                                                name="minus"
                                                size={16}
                                                color="#fff"
                                              />
                                            </TouchableOpacity>
                                            <Text
                                              style={[
                                                styles.quantityText,
                                                { color: theme.textColor },
                                              ]}
                                            >
                                              {product.quantity}
                                            </Text>
                                            <TouchableOpacity
                                              style={[
                                                styles.quantityButton,
                                                {
                                                  backgroundColor:
                                                    theme.buttonBackground,
                                                },
                                              ]}
                                              onPress={(e) => {
                                                e.stopPropagation();
                                                if (
                                                  product.quantity <
                                                  product.availableQuantity
                                                ) {
                                                  handleQuantityChange(
                                                    product.id,
                                                    1
                                                  );
                                                }
                                              }}
                                            >
                                              <AntDesign
                                                name="plus"
                                                size={16}
                                                color="#fff"
                                              />
                                            </TouchableOpacity>
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                    );
                                  })
                                )}
                              </ScrollView>
                            )}

                            <View style={styles.modalButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.modalButton,
                                  {
                                    backgroundColor: isDark
                                      ? "#333"
                                      : theme.cancelButtonBackground,
                                  },
                                ]}
                                onPress={() => setShowProductModal(false)}
                              >
                                <Text
                                  style={[
                                    styles.modalButtonText,
                                    {
                                      color: isDark
                                        ? "#fff"
                                        : theme.cancelButtonText,
                                    },
                                  ]}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.modalButton,
                                  { backgroundColor: theme.buttonBackground },
                                ]}
                                onPress={handleAddProducts}
                              >
                                <Text
                                  style={[
                                    styles.modalButtonText,
                                    { color: theme.buttonText },
                                  ]}
                                >
                                  Add
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>

                  {/* Customer Information Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Customer Information
                  </Text>
                  <View style={styles.inputGroup}>
                    <View style={styles.selectWithButtonContainer}>
                      <View style={{ flex: 1, position: "relative" }}>
                        <View style={styles.searchInputContainer}>
                          <AntDesign
                            name="search1"
                            size={18}
                            color={theme.placeholderColor}
                            style={styles.searchIcon}
                          />
                          <TextInput
                            style={[
                              styles.searchInput,
                              {
                                borderColor: theme.borderColor,
                                color: theme.textColor,
                              },
                            ]}
                            placeholder="Search customer by name or mobile"
                            placeholderTextColor={theme.placeholderColor}
                            value={customerSearchQuery}
                            onChangeText={handleCustomerSearch}
                          />
                        </View>
                        {showCustomerDropdown && (
                          <View
                            style={[
                              styles.customerDropdown,
                              {
                                backgroundColor: theme.cardBackground,
                                borderColor: theme.borderColor,
                              },
                            ]}
                          >
                            <ScrollView
                              style={styles.customerDropdownScroll}
                              nestedScrollEnabled={true}
                              showsVerticalScrollIndicator={true}
                            >
                              {customers.map((customer) => (
                                <TouchableOpacity
                                  key={customer.id}
                                  style={styles.customerDropdownItem}
                                  onPress={() =>
                                    handleSelectCustomer(
                                      customer,
                                      setFieldValue
                                    )
                                  }
                                >
                                  <Text style={{ color: theme.textColor }}>
                                    {customer.name} - {customer.mobile_number}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              {customers.length === 0 && (
                                <Text
                                  style={[
                                    styles.noCustomersText,
                                    { color: theme.placeholderColor },
                                  ]}
                                >
                                  No customers found
                                </Text>
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          { backgroundColor: theme.buttonBackground },
                        ]}
                        onPress={() => setShowAddCustomerModal(true)}
                      >
                        <AntDesign name="plus" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {selectedCustomer && (
                      <View
                        style={[
                          styles.selectedCustomerContainer,
                          {
                            backgroundColor: isDark
                              ? "rgba(46, 90, 147, 0.08)"
                              : "rgba(0, 149, 255, 0.03)",
                            borderColor: isDark ? "#4680ee" : "#2196F3",
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={styles.selectedCustomerContent}>
                          <Text
                            style={[
                              styles.selectedCustomerName,
                              { color: theme.textColor },
                            ]}
                             numberOfLines={1}
        ellipsizeMode="tail"
                          >
                            {selectedCustomer.name}
                          </Text>
                          <Text
                            style={[
                              styles.selectedCustomerMobile,
                              { color: isDark ? "#63B3ED" : "#2196F3" },
                            ]}
                             numberOfLines={1}
        ellipsizeMode="tail"
                          >
                            {selectedCustomer.mobile_number}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Add Customer Modal */}
                  <Modal
                    visible={showAddCustomerModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAddCustomerModal(false)}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => setShowAddCustomerModal(false)}
                    >
                      <View
                        style={[
                          styles.modalContent,
                          { backgroundColor: theme.cardBackground },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: theme.textColor },
                          ]}
                        >
                          Add New Customer
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            {
                              borderColor: theme.borderColor,
                              color: theme.textColor,
                            },
                          ]}
                          placeholder="Customer Name"
                          placeholderTextColor={theme.placeholderColor}
                          value={newCustomerName}
                          onChangeText={setNewCustomerName}
                        />

                        <TextInput
                          style={[
                            styles.input,
                            {
                              borderColor: theme.borderColor,
                              color: theme.textColor,
                            },
                          ]}
                          placeholder="Mobile Number"
                          placeholderTextColor={theme.placeholderColor}
                          keyboardType="numeric"
                          value={newCustomerMobile}
                          onChangeText={setNewCustomerMobile}
                        />

                        <View style={styles.modalButtons}>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              { backgroundColor: theme.cancelButtonBackground },
                            ]}
                            onPress={() => {
                              setShowAddCustomerModal(false);
                              setNewCustomerName("");
                              setNewCustomerMobile("");
                            }}
                            disabled={isAddingCustomer}
                          >
                            <Text
                              style={[
                                styles.modalButtonText,
                                { color: theme.cancelButtonText },
                              ]}
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              { backgroundColor: theme.buttonBackground },
                            ]}
                            onPress={handleAddNewCustomer}
                            disabled={isAddingCustomer}
                          >
                            {isAddingCustomer ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text
                                style={[
                                  styles.modalButtonText,
                                  { color: theme.buttonText },
                                ]}
                              >
                                Save
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>

                  {/* Vehicle Information Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Vehicle Information
                  </Text>
                  <View style={styles.inputGroup}>
                    {/* Customer Vehicle Dropdown */}
                    <View style={styles.vehicleSelectContainer}>
                      <View style={styles.selectWithButtonContainer}>
                        <TouchableOpacity
                          onPress={handleVehicleDropdownToggle}
                          style={[
                            styles.selectInputWithButton,
                            {
                              borderColor: theme.borderColor,
                              opacity: selectedCustomer ? 1 : 0.7,
                            },
                          ]}
                        >
                          {selectedVehicle ? (
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 10,
                                width: "100%",
                              }}
                            >
                              <Text
                                style={{ color: "#367afb", fontWeight: "bold" }}
                              >
                                No: {selectedVehicle.vehicle_number}
                              </Text>
                              <Text
                                style={{
                                  color: theme.textColor,
                                  fontWeight: "bold",
                                }}
                              >
                                {selectedVehicle.vehicle_name}
                              </Text>
                            </View>
                          ) : (
                            <Text style={{ color: theme.placeholderColor }}>
                              Select Customer Vehicle
                            </Text>
                          )}
                          <AntDesign
                            name={showVehiclesDropdown ? "up" : "down"}
                            size={16}
                            style={{ marginLeft: -15 }}
                            color={theme.placeholderColor}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.addButton,
                            {
                              backgroundColor: theme.buttonBackground,
                              opacity: selectedCustomer ? 1 : 0.7,
                            },
                          ]}
                          onPress={() => {
                            if (!selectedCustomer) {
                              Alert.alert(
                                "Select Customer",
                                "Please select or add a customer first"
                              );
                            } else {
                              setShowAddVehicleModal(true);
                            }
                          }}
                        >
                          <AntDesign name="plus" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      {showVehiclesDropdown && selectedCustomer && (
                        <View
                          style={[
                            styles.vehicleDropdown,
                            {
                              backgroundColor: theme.modalBackground,
                              borderColor: theme.borderColor,
                            },
                          ]}
                        >
                          <View style={styles.searchInputContainer}>
                            <AntDesign
                              name="search1"
                              size={18}
                              color={theme.placeholderColor}
                              style={styles.searchIcon}
                            />
                            <TextInput
                              style={[
                                styles.vehicleSearchInput,
                                {
                                  color: theme.textColor,
                                  borderColor: theme.borderColor,
                                },
                              ]}
                              placeholder="Search vehicles..."
                              placeholderTextColor={theme.placeholderColor}
                              value={vehicleSearchQuery}
                              onChangeText={handleVehicleSearch}
                            />
                          </View>
                          {isLoadingVehicles ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator
                                size="small"
                                color={theme.buttonBackground}
                              />
                              <Text
                                style={[
                                  styles.loadingText,
                                  { color: theme.textColor },
                                ]}
                              >
                                Loading vehicles...
                              </Text>
                            </View>
                          ) : (
                            <ScrollView
                              style={styles.vehicleDropdownScroll}
                              nestedScrollEnabled={true}
                            >
                              {filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => (
                                  <TouchableOpacity
                                    key={vehicle.id}
                                    style={[
                                      styles.vehicleDropdownItem,
                                      {
                                        borderBottomColor: isDark
                                          ? "#444444"
                                          : "#eeeeee",
                                      },
                                    ]}
                                    onPress={() =>
                                      handleSelectVehicle(
                                        vehicle,
                                        setFieldValue
                                      )
                                    }
                                  >
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: theme.textColor,
                                          fontSize: 14,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {vehicle.vehicle_name}
                                      </Text>
                                      <Text
                                        style={{
                                          color: "#367afb",
                                          fontSize: 14,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        No: {vehicle.vehicle_number}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                ))
                              ) : (
                                <Text
                                  style={[
                                    styles.noDataText,
                                    {
                                      color: theme.placeholderColor,
                                      padding: 15,
                                      textAlign: "center",
                                    },
                                  ]}
                                >
                                  No vehicles found
                                </Text>
                              )}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Add Vehicle Make/Model Modal */}
                    <Modal
                      visible={showAddVehicleModal}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setShowAddVehicleModal(false)}
                    >
                      <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                      >
                        <TouchableOpacity
                          style={styles.datePickerModalOverlay}
                          activeOpacity={1}
                          onPress={() => setShowAddVehicleModal(false)}
                        >
                          <View
                            style={[
                              styles.modalContent,
                              {
                                backgroundColor: theme.modalBackground,
                                width: "95%",
                                maxHeight: "80%",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.modalTitle,
                                { color: theme.textColor },
                              ]}
                            >
                              Add New Customer Vehicle
                            </Text>

                            <ScrollView
                              style={styles.modalScrollView}
                              showsVerticalScrollIndicator={true}
                              nestedScrollEnabled={true}
                              keyboardShouldPersistTaps="handled"
                            >
                              <View style={styles.addVehicleForm}>
                                <View
                                  style={{
                                    position: "relative",
                                    marginBottom: 0,
                                  }}
                                >
                                  <TouchableOpacity
                                    style={[
                                      styles.input,
                                      {
                                        borderColor: theme.borderColor,
                                        color: theme.textColor,
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingRight: 12,
                                      },
                                    ]}
                                    onPress={() => {
                                      setShowVehicleNameDropdown(
                                        !showVehicleNameDropdown
                                      );
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: newVehicleName
                                          ? theme.textColor
                                          : theme.placeholderColor,
                                      }}
                                    >
                                      {newVehicleName || "Select Vehicle Name"}
                                    </Text>
                                    <AntDesign
                                      name={
                                        showVehicleNameDropdown ? "up" : "down"
                                      }
                                      size={16}
                                      color={theme.placeholderColor}
                                    />
                                  </TouchableOpacity>

                                  {showVehicleNameDropdown && (
                                    <TouchableWithoutFeedback
                                      onPress={() => {}}
                                    >
                                      <View
                                        style={[
                                          styles.vehicleNameDropdown,
                                          {
                                            backgroundColor:
                                              theme.cardBackground,
                                            borderColor: theme.borderColor,
                                          },
                                        ]}
                                      >
                                        <View
                                          style={
                                            styles.vehicleNameSearchContainer
                                          }
                                        >
                                          <AntDesign
                                            name="search1"
                                            size={18}
                                            color={theme.placeholderColor}
                                            style={styles.vehicleNameSearchIcon}
                                          />
                                          <TextInput
                                            style={[
                                              styles.vehicleNameSearchInput,
                                              {
                                                color: theme.textColor,
                                                borderColor: theme.borderColor,
                                              },
                                            ]}
                                            placeholder="Search vehicles..."
                                            placeholderTextColor={
                                              theme.placeholderColor
                                            }
                                            value={vehicleNameSearchQuery}
                                            onChangeText={handleSearchChange}
                                            onFocus={handleSearchFocus}
                                          />
                                        </View>
                                        <ScrollView
                                          style={
                                            styles.vehicleNameDropdownScroll
                                          }
                                          nestedScrollEnabled={true}
                                          keyboardShouldPersistTaps="always"
                                        >
                                          {isSearchingVehicleName ? (
                                            <View
                                              style={styles.loadingContainer}
                                            >
                                              <ActivityIndicator
                                                size="small"
                                                color="#979797"
                                              />
                                              <Text
                                                style={[
                                                  styles.loadingText,
                                                  { color: theme.textColor },
                                                ]}
                                              >
                                                Searching vehicles...
                                              </Text>
                                            </View>
                                          ) : filteredAvailableVehicles.length >
                                            0 ? (
                                            filteredAvailableVehicles.map(
                                              (vehicle) => (
                                                <TouchableOpacity
                                                  key={vehicle.id}
                                                  style={[
                                                    styles.vehicleNameDropdownItem,
                                                    {
                                                      borderBottomColor: isDark
                                                        ? "#444444"
                                                        : "#eeeeee",
                                                      backgroundColor:
                                                        selectedVehicleName?.id ===
                                                        vehicle.id
                                                          ? isDark
                                                            ? "#2a2a2a"
                                                            : "#f0f8ff"
                                                          : "transparent",
                                                    },
                                                  ]}
                                                  onPress={handleDropdownItemPress(
                                                    vehicle
                                                  )}
                                                  activeOpacity={0.7}
                                                >
                                                  <Text
                                                    style={{
                                                      color: theme.textColor,
                                                    }}
                                                  >
                                                    {vehicle.vehicle_name}
                                                  </Text>
                                                </TouchableOpacity>
                                              )
                                            )
                                          ) : (
                                            <Text
                                              style={[
                                                styles.noDataText,
                                                {
                                                  color: theme.placeholderColor,
                                                  padding: 15,
                                                  textAlign: "center",
                                                },
                                              ]}
                                            >
                                              No vehicles found
                                            </Text>
                                          )}
                                        </ScrollView>
                                      </View>
                                    </TouchableWithoutFeedback>
                                  )}
                                </View>
                                {/* Vehicle Model Dropdown - only visible after selecting a vehicle */}
                                {selectedVehicleName && (
                                  <View
                                    style={{
                                      position: "relative",
                                      marginBottom: 0,
                                    }}
                                  >
                                    <TouchableOpacity
                                      style={[
                                        styles.input,
                                        {
                                          borderColor: theme.borderColor,
                                          color: theme.textColor,
                                          flexDirection: "row",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          paddingRight: 12,
                                          opacity: selectedVehicleName
                                            ? 1
                                            : 0.5, // disable look if no vehicle
                                        },
                                      ]}
                                      onPress={() => {
                                        if (selectedVehicleName) {
                                          setShowVehicleModelDropdown(
                                            !showVehicleModelDropdown
                                          );
                                        }
                                      }}
                                      disabled={!selectedVehicleName}
                                    >
                                      <Text
                                        style={{
                                          color: newVehicleModel
                                            ? theme.textColor
                                            : theme.placeholderColor,
                                        }}
                                      >
                                        {newVehicleModel?.vehicle_model ||
                                          "Select Vehicle Model"}
                                      </Text>
                                      <AntDesign
                                        name={
                                          showVehicleModelDropdown
                                            ? "up"
                                            : "down"
                                        }
                                        size={16}
                                        color={theme.placeholderColor}
                                      />
                                    </TouchableOpacity>

                                    {showVehicleModelDropdown && (
                                      <TouchableWithoutFeedback
                                        onPress={() => {}}
                                      >
                                        <View
                                          style={[
                                            styles.vehicleNameDropdown,
                                            {
                                              backgroundColor:
                                                theme.cardBackground,
                                              borderColor: theme.borderColor,
                                            },
                                          ]}
                                        >
                                          <ScrollView
                                            style={
                                              styles.vehicleNameDropdownScroll
                                            }
                                            nestedScrollEnabled={true}
                                            keyboardShouldPersistTaps="always"
                                          >
                                            {selectedVehicleName?.models
                                              ?.length > 0 ? (
                                              selectedVehicleName.models.map(
                                                (model) => (
                                                  <TouchableOpacity
                                                    key={model.id}
                                                    style={[
                                                      styles.vehicleNameDropdownItem,
                                                      {
                                                        borderBottomColor:
                                                          isDark
                                                            ? "#444444"
                                                            : "#eeeeee",
                                                        backgroundColor:
                                                          newVehicleModel?.id ===
                                                          model.id
                                                            ? isDark
                                                              ? "#2a2a2a"
                                                              : "#f0f8ff"
                                                            : "transparent",
                                                      },
                                                    ]}
                                                    onPress={() => {
                                                      setNewVehicleModel(model); // store selected model
                                                      setShowVehicleModelDropdown(
                                                        false
                                                      );
                                                    }}
                                                    activeOpacity={0.7}
                                                  >
                                                    <Text
                                                      style={{
                                                        color: theme.textColor,
                                                      }}
                                                    >
                                                      {model.vehicle_model}
                                                    </Text>
                                                  </TouchableOpacity>
                                                )
                                              )
                                            ) : (
                                              <Text
                                                style={[
                                                  styles.noDataText,
                                                  {
                                                    color:
                                                      theme.placeholderColor,
                                                    padding: 15,
                                                    textAlign: "center",
                                                  },
                                                ]}
                                              >
                                                No models found
                                              </Text>
                                            )}
                                          </ScrollView>
                                        </View>
                                      </TouchableWithoutFeedback>
                                    )}
                                  </View>
                                )}

                                <TextInput
                                  style={[
                                    styles.input,
                                    {
                                      borderColor: theme.borderColor,
                                      color: theme.textColor,
                                    },
                                  ]}
                                  placeholder="Enter vehicle number"
                                  placeholderTextColor={theme.placeholderColor}
                                  value={newVehicleNumber}
                                  onChangeText={setNewVehicleNumber}
                                />

                                <TextInput
                                  style={[
                                    styles.input,
                                    {
                                      borderColor: theme.borderColor,
                                      color: theme.textColor,
                                    },
                                  ]}
                                  placeholder="Enter vehicle year"
                                  placeholderTextColor={theme.placeholderColor}
                                  keyboardType="numeric"
                                  value={newVehicleYear}
                                  onChangeText={setNewVehicleYear}
                                />

                                <TextInput
                                  style={[
                                    styles.input,
                                    {
                                      borderColor: theme.borderColor,
                                      color: theme.textColor,
                                    },
                                  ]}
                                  placeholder="Enter current kilometers"
                                  placeholderTextColor={theme.placeholderColor}
                                  keyboardType="numeric"
                                  value={newVehicleKm}
                                  onChangeText={setNewVehicleKm}
                                />
                              </View>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.modalButton,
                                  {
                                    backgroundColor:
                                      theme.cancelButtonBackground,
                                  },
                                ]}
                                onPress={() => {
                                  setNewVehicleName("");
                                  setNewVehicleNumber("");
                                  setNewVehicleYear("");
                                  setNewVehicleKm("");
                                  setShowAddVehicleModal(false);
                                }}
                                disabled={isAddingVehicle}
                              >
                                <Text
                                  style={[
                                    styles.modalButtonText,
                                    { color: theme.cancelButtonText },
                                  ]}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.modalButton,
                                  {
                                    backgroundColor: theme.buttonBackground,
                                    marginLeft: 12,
                                  },
                                ]}
                                onPress={() =>
                                  handleAddNewVehicle(setFieldValue)
                                }
                                disabled={isAddingVehicle}
                              >
                                {isAddingVehicle ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                  />
                                ) : (
                                  <Text
                                    style={[
                                      styles.modalButtonText,
                                      { color: theme.buttonText },
                                    ]}
                                  >
                                    Save
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </KeyboardAvoidingView>
                    </Modal>
                  </View>

                  {/* Service Information Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Service Information
                  </Text>
                  <View style={styles.inputGroup}>
                    <View style={styles.row}>
                      <Text
                        style={[styles.inputLabel, { color: theme.textColor }]}
                      >
                        Service Date
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dateInput,
                          { borderColor: theme.borderColor },
                        ]}
                        onPress={() =>
                          toggleDatePicker(
                            "dateIn",
                            values.dateIn,
                            setFieldValue
                          )
                        }
                      >
                        <Text style={{ color: theme.textColor }}>
                          {formatDate(dateIn)}
                        </Text>
                        <MaterialIcons
                          name="date-range"
                          size={20}
                          color={theme.placeholderColor}
                        />
                      </TouchableOpacity>
                    </View>
                    {showDatePicker.dateIn && (
                      <Modal
                        transparent={true}
                        animationType="fade"
                        visible={showDatePicker.dateIn}
                        onRequestClose={() => handleCancelDatePicker("dateIn")}
                      >
                        <TouchableOpacity
                          style={styles.datePickerModalOverlay}
                          activeOpacity={1}
                          onPress={() => handleCancelDatePicker("dateIn")}
                        >
                          <View
                            style={[
                              styles.datePickerContainer,
                              { backgroundColor: theme.cardBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePickerTitle,
                                { color: theme.textColor },
                              ]}
                            >
                              Select Service Date
                            </Text>
                            <DateTimePicker
                              value={dateIn}
                              mode="date"
                              display={
                                Platform.OS === "ios" ? "spinner" : "default"
                              }
                              onChange={(event, selectedDate) =>
                                onDateChange(
                                  event,
                                  selectedDate,
                                  "dateIn",
                                  setFieldValue
                                )
                              }
                              style={styles.datePicker}
                            />
                            <View style={styles.datePickerButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor:
                                      theme.cancelButtonBackground,
                                  },
                                ]}
                                onPress={() => handleCancelDatePicker("dateIn")}
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.cancelButtonText },
                                  ]}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor: theme.buttonBackground,
                                    marginLeft: 12,
                                  },
                                ]}
                                onPress={() =>
                                  handleConfirmDate("dateIn", setFieldValue)
                                }
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.buttonText },
                                  ]}
                                >
                                  OK
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    )}

                    <View style={styles.row}>
                      <Text
                        style={[styles.inputLabel, { color: theme.textColor }]}
                      >
                        Estimated Delivery Date
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dateInput,
                          { borderColor: theme.borderColor },
                        ]}
                        onPress={() =>
                          toggleDatePicker(
                            "deliveryDate",
                            values.deliveryDate,
                            setFieldValue
                          )
                        }
                      >
                        <Text
                          style={{
                            color: deliveryDate
                              ? theme.textColor
                              : theme.placeholderColor,
                          }}
                        >
                          {deliveryDate
                            ? formatDate(deliveryDate)
                            : "Select Date"}
                        </Text>
                        <MaterialIcons
                          name="date-range"
                          size={20}
                          color={theme.placeholderColor}
                        />
                      </TouchableOpacity>
                    </View>
                    {showDatePicker.deliveryDate && (
                      <Modal
                        transparent={true}
                        animationType="fade"
                        visible={showDatePicker.deliveryDate}
                        onRequestClose={() =>
                          handleCancelDatePicker("deliveryDate")
                        }
                      >
                        <TouchableOpacity
                          style={styles.datePickerModalOverlay}
                          activeOpacity={1}
                          onPress={() => handleCancelDatePicker("deliveryDate")}
                        >
                          <View
                            style={[
                              styles.datePickerContainer,
                              { backgroundColor: theme.cardBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePickerTitle,
                                { color: theme.textColor },
                              ]}
                            >
                              Select Delivery Date
                            </Text>
                            <DateTimePicker
                              value={deliveryDate || new Date()}
                              mode="date"
                              display={
                                Platform.OS === "ios" ? "spinner" : "default"
                              }
                              onChange={(event, selectedDate) =>
                                onDateChange(
                                  event,
                                  selectedDate,
                                  "deliveryDate",
                                  setFieldValue
                                )
                              }
                              style={styles.datePicker}
                            />
                            <View style={styles.datePickerButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor:
                                      theme.cancelButtonBackground,
                                  },
                                ]}
                                onPress={() =>
                                  handleCancelDatePicker("deliveryDate")
                                }
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.cancelButtonText },
                                  ]}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor: theme.buttonBackground,
                                    marginLeft: 12,
                                  },
                                ]}
                                onPress={() =>
                                  handleConfirmDate(
                                    "deliveryDate",
                                    setFieldValue
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.buttonText },
                                  ]}
                                >
                                  OK
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    )}

                    <View style={styles.row}>
                      <Text
                        style={[styles.inputLabel, { color: theme.textColor }]}
                      >
                        Next Service Date
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dateInput,
                          { borderColor: theme.borderColor },
                        ]}
                        onPress={() =>
                          toggleDatePicker(
                            "nextServiceDate",
                            values.nextServiceDate,
                            setFieldValue
                          )
                        }
                      >
                        <Text
                          style={{
                            color: nextServiceDate
                              ? theme.textColor
                              : theme.placeholderColor,
                          }}
                        >
                          {nextServiceDate
                            ? formatDate(nextServiceDate)
                            : "Select Date"}
                        </Text>
                        <MaterialIcons
                          name="date-range"
                          size={20}
                          color={theme.placeholderColor}
                        />
                      </TouchableOpacity>
                    </View>
                    {showDatePicker.nextServiceDate && (
                      <Modal
                        transparent={true}
                        animationType="fade"
                        visible={showDatePicker.nextServiceDate}
                        onRequestClose={() =>
                          handleCancelDatePicker("nextServiceDate")
                        }
                      >
                        <TouchableOpacity
                          style={styles.datePickerModalOverlay}
                          activeOpacity={1}
                          onPress={() =>
                            handleCancelDatePicker("nextServiceDate")
                          }
                        >
                          <View
                            style={[
                              styles.datePickerContainer,
                              { backgroundColor: theme.cardBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.datePickerTitle,
                                { color: theme.textColor },
                              ]}
                            >
                              Select Next Service Date
                            </Text>
                            <DateTimePicker
                              value={nextServiceDate || new Date()}
                              mode="date"
                              display={
                                Platform.OS === "ios" ? "spinner" : "default"
                              }
                              onChange={(event, selectedDate) =>
                                onDateChange(
                                  event,
                                  selectedDate,
                                  "nextServiceDate",
                                  setFieldValue
                                )
                              }
                              style={styles.datePicker}
                            />
                            <View style={styles.datePickerButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor:
                                      theme.cancelButtonBackground,
                                  },
                                ]}
                                onPress={() =>
                                  handleCancelDatePicker("nextServiceDate")
                                }
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.cancelButtonText },
                                  ]}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.datePickerButton,
                                  {
                                    backgroundColor: theme.buttonBackground,
                                    marginLeft: 12,
                                  },
                                ]}
                                onPress={() =>
                                  handleConfirmDate(
                                    "nextServiceDate",
                                    setFieldValue
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.datePickerButtonText,
                                    { color: theme.buttonText },
                                  ]}
                                >
                                  OK
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    )}

                    <View style={styles.row}>
                      <Text
                        style={[styles.inputLabel, { color: theme.textColor }]}
                      >
                        Work Status
                      </Text>
                      <View style={styles.statusContainer}>
                        {[
                          { value: "pending", label: "Pending" },
                          { value: "in_progress", label: "In Progress" },
                          { value: "completed", label: "Completed" },
                        ].map((status) => (
                          <TouchableOpacity
                            key={status.value}
                            style={[
                              styles.statusButton,
                              {
                                backgroundColor:
                                  workStatusValue === status.value
                                    ? getStatusColor(status.value)
                                    : theme.cancelButtonBackground,
                              },
                            ]}
                            onPress={() => setWorkStatusValue(status.value)}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                {
                                  color:
                                    workStatusValue === status.value
                                      ? theme.buttonText
                                      : theme.cancelButtonText,
                                },
                              ]}
                            >
                              {status.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Add this after the work status section */}
                    <View style={styles.row}>
                      <Text
                        style={[styles.inputLabel, { color: theme.textColor }]}
                      >
                        Priority
                      </Text>
                      <View style={styles.statusContainer}>
                        {["low", "medium", "high"].map((priorityOption) => (
                          <TouchableOpacity
                            key={priorityOption}
                            style={[
                              styles.statusButton,
                              {
                                backgroundColor:
                                  priority === priorityOption
                                    ? getPriorityColor(priorityOption)
                                    : theme.cancelButtonBackground,
                              },
                            ]}
                            onPress={() => setPriority(priorityOption)}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                {
                                  color:
                                    priority === priorityOption
                                      ? theme.buttonText
                                      : theme.cancelButtonText,
                                },
                              ]}
                            >
                              {priorityOption.charAt(0).toUpperCase() +
                                priorityOption.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Additional Images Section */}
                  <Text
                    style={[styles.sectionTitle, { color: theme.textColor }]}
                  >
                    Additional Images
                  </Text>
                  <View style={styles.additionalImagesContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.additionalImagesScroll}
                    >
                      {additionalImages.map((image, index) => (
                        <View key={index} style={styles.additionalImageWrapper}>
                          <Image
                            source={{ uri: image.uri }}
                            style={styles.additionalImage}
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => removeAdditionalImage(index)}
                            style={styles.removeImageButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={24}
                              color={theme.errorColor}
                            />
                          </Pressable>
                        </View>
                      ))}
                      {imageLoading.additional ? (
                        <ActivityIndicator size="small" color="#979797" />
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.addImageButton,
                            { borderColor: theme.dashedBorderColor },
                          ]}
                          onPress={() => pickImage("additional")}
                          disabled={imageLoading.additional}
                        >
                          <View style={styles.addImageButtonContent}>
                            <Ionicons
                              name="camera"
                              size={32}
                              color={theme.placeholderColor}
                            />
                            <Text
                              style={[
                                styles.addImageButtonText,
                                { color: theme.placeholderColor },
                              ]}
                            >
                              Add Photo
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>

                  {/* Common Note Section */}
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.textColor, marginTop: 16 },
                    ]}
                  >
                    Common Note
                  </Text>
                  <TextInput
                    style={[
                      styles.commonNoteInput,
                      {
                        color: theme.textColor,
                        borderColor: theme.borderColor,
                        backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                      },
                    ]}
                    multiline
                    placeholder="Add common note"
                    placeholderTextColor={theme.placeholderColor}
                    value={commonNoteValue}
                    onChangeText={setCommonNoteValue}
                  />

                  {/* Payment Information */}
                  <View
                    style={[
                      styles.paymentSection,
                      {
                        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                        borderColor: theme.borderColor,
                      },
                    ]}
                  >
                    <View style={styles.paymentRow}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: theme.textColor },
                        ]}
                      >
                        Subtotal:
                      </Text>
                      <Text
                        style={[
                          styles.paymentAmount,
                          { color: theme.textColor },
                        ]}
                      >
                        QAR {calculateSubTotal()}
                      </Text>
                    </View>

                    <View style={styles.paymentRow}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: theme.textColor },
                        ]}
                      >
                        Discount:
                      </Text>
                      <TextInput
                        style={[
                          styles.discountInput,
                          {
                            color: theme.textColor,
                            borderColor: theme.borderColor,
                          },
                        ]}
                        keyboardType="numeric"
                        placeholder="Enter discount"
                        placeholderTextColor={theme.placeholderColor}
                        value={discount}
                        onChangeText={setDiscount}
                      />
                    </View>

                    <View style={styles.paymentRow}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: theme.textColor },
                        ]}
                      >
                        Total Amount:
                      </Text>
                      <Text
                        style={[
                          styles.paymentAmount,
                          { color: theme.textColor },
                        ]}
                      >
                        QAR {calculateTotal()}
                      </Text>
                    </View>

                    <View style={styles.paymentRow}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: theme.textColor },
                        ]}
                      >
                        Advance Amount:
                      </Text>
                      <TextInput
                        style={[
                          styles.advanceInput,
                          {
                            color: theme.textColor,
                            borderColor: theme.borderColor,
                          },
                        ]}
                        keyboardType="numeric"
                        placeholder="Enter advance amount"
                        placeholderTextColor={theme.placeholderColor}
                        onChangeText={setAdvanceAmountValue}
                        value={advanceAmountValue}
                      />
                    </View>

                    <View style={styles.paymentRow}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: theme.textColor },
                        ]}
                      >
                        Balance Amount:
                      </Text>
                      <Text
                        style={[
                          styles.paymentAmount,
                          { color: theme.textColor },
                        ]}
                      >
                        QAR {calculateBalance(advanceAmountValue)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { backgroundColor: theme.cancelButtonBackground },
                      ]}
                      onPress={() => router.back()}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { color: theme.cancelButtonText },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        {
                          backgroundColor: theme.buttonBackground,
                          opacity: isSubmitting ? 0.7 : 1,
                        },
                      ]}
                      onPress={handlejobcardSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text
                          style={[
                            styles.submitButtonText,
                            { color: theme.buttonText },
                          ]}
                        >
                          Submit
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Modal */}
      <Modal
        visible={showLoadingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={[
            styles.loadingModalContainer,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.loadingModalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <ActivityIndicator size="large" color={theme.buttonBackground} />
            <Text
              style={[
                styles.loadingModalText,
                { color: theme.textColor, marginTop: 16 },
              ]}
            >
              Submitting job card...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  formContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  imageGridContainer: {
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  imageContainer: {
    width: "48%",
    height: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imagePlaceholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    textAlign: "center",
  },
  additionalImagesContainer: {
    marginBottom: 24,
  },
  additionalImagesScroll: {
    paddingVertical: 8,
  },
  additionalImageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  additionalImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButtonContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButtonText: {
    marginTop: 8,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    position: "absolute",
    width: "100%",
    top: 110,
    left: 20,
    right: 0,
    zIndex: 1,
    maxHeight: 300,
  },
  searchInput: {
    borderBottomWidth: 1,
    padding: 10,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
  },
  noModelsText: {
    padding: 12,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    borderRadius: 8,
    padding: 14,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 8,
    padding: 14,
    width: "48%",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(2px)",
  },
  modalOverlayDark: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
  },
  datePickerContainer: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  datePicker: {
    width: 300,
    height: 200,
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectWithButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  selectInputWithButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  addButton: {
    width: 46,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0,
  },
  addVehicleForm: {
    width: "100%",
    paddingHorizontal: 8,
  },
  addedModelsContainer: {
    marginBottom: 12,
  },
  addedModelItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addedModelInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  removeModelButton: {
    padding: 5,
    marginLeft: 8,
  },
  addModelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addModelInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 8,
  },
  addModelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    width: "100%",
    maxHeight: 400,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeButton: {
    padding: 4,
  },
  grandTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  grandTotalAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedProductsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    width: "100%",
    paddingVertical: 10,
  },
  selectedProductItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: "48%",
    minWidth: 150,
  },
  selectedProductText: {
    fontSize: 14,
    marginRight: 8,
    flex: 1,
  },
  removeProductButton: {
    padding: 4,
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#dddddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
  },
  addServiceButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
  addedServiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addedServiceContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  serviceNumber: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 8,
    minWidth: 25,
  },
  addedServiceName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  subServiceContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalTotal: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  subServicesList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  subServiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subServiceItemSelected: {
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  subServiceName: {
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  subServicePrice: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addedServiceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addedServicePrice: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 15,
  },
  removeServiceButton: {
    padding: 5,
  },
  servicesTotalContainer: {
    alignItems: "flex-end",
    paddingVertical: 10,
    marginBottom: 16,
  },
  servicesTotalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  selectedItemsSection: {
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
    padding: 8,
    marginBottom: 36,
    backgroundColor: "rgba(33, 150, 243, 0.05)",
  },
  selectedProductsPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
  },
  addedServiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  modalTotalContainer: {
    alignItems: "flex-end",
    marginBottom: 15,
  },
  noteButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  noteButtonText: {
    fontSize: 13,
    marginLeft: 4,
  },
  noteTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: "top",
    marginVertical: 16,
  },
  noteModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  commonNoteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  paymentSection: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  discountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: "right",
  },
  advanceInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: "right",
  },
  serviceMainInfo: {
    flex: 1,
  },
  serviceNameContainer: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  productsList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  productItemSelected: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  productItemDisabled: {
    opacity: 0.5,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#2196F3",
  },
  availableQuantity: {
    fontSize: 14,
    color: "#999999",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  previewText: {
    fontSize: 16,
    fontWeight: "500",
  },
  previewTotal: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedCustomerContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%', 
    maxWidth: '100%',
  },
  selectedCustomerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
     flex: 1,
    width: '100%',
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: "600",
     flexShrink: 1,
    width: '100%',
  },
  selectedCustomerMobile: {
    fontSize: 15,
    fontWeight: "500",
     flexShrink: 1,
    width: '100%',
  },
  customerDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  customerDropdownScroll: {
    maxHeight: 200,
  },
  customerDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noCustomersText: {
    padding: 12,
    textAlign: "center",
  },
  searchInputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "500",
    padding: 15,
    textAlign: "center",
  },
  vehicleSelectContainer: {
    position: "relative",
    zIndex: 2,
    marginBottom: 20,
  },
  vehicleDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: 300,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginTop: -7,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  vehicleDropdownScroll: {
    maxHeight: 240,
  },
  vehicleDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  vehicleSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    paddingLeft: 38,
    fontSize: 15,
    height: 40,
  },
  vehicleNameDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  vehicleNameDropdownScroll: {
    maxHeight: 150,
  },
  vehicleNameDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  vehicleNameSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    paddingLeft: 38,
    fontSize: 15,
    height: 40,
  },
  vehicleNameSearchContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    padding: 8,
  },
  vehicleNameSearchIcon: {
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  noDataText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  loadingModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingModalText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
