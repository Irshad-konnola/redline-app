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
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import { useNavigation } from "@react-navigation/native";
import { Dropdown } from "react-native-element-dropdown";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import axiosInstance from "../api/api";
import { Animated } from "react-native";

const filterOptions = [
  { label: "Priority-Low", value: "low" },
  { label: "Priority-Medium", value: "medium" },
  { label: "Priority-High", value: "high" },
  { label: "Status - Pending", value: "pending" },
  { label: "Status - In Progress", value: "in_progress" },
  { label: "Status - Completed", value: "completed" },
];

const { width } = Dimensions.get("window");

// Custom Delete Confirmation Modal
const DeleteJobCardModal = ({
  visible,
  onCancel,
  onConfirm,
  jobCardNo,
  loading,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 28,
          width: 380,
          maxWidth: "90%",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 20,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Are you sure you want to delete this job card?
        </Text>
        <Text
          style={{
            color: "#666",
            fontSize: 15,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          This action cannot be undone. This will permanently delete job card{" "}
          <Text style={{ fontWeight: "bold", color: "#1a3e6e" }}>
            {jobCardNo}
          </Text>{" "}
          and all associated data.
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 22,
              borderRadius: 6,
              backgroundColor: "#f5f5f5",
              marginRight: 12,
            }}
            disabled={loading}
          >
            <Text style={{ color: "#222", fontWeight: "500", fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 22,
              borderRadius: 6,
              backgroundColor: "#e53935",
            }}
            disabled={loading}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              {loading ? "Deleting..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const VehicleOutModal = ({ visible, onCancel, onConfirm, loading }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 28,
          width: 380,
          maxWidth: "90%",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 20,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Are you sure you want to mark this vehicle as out?
        </Text>
        <Text
          style={{
            color: "#666",
            fontSize: 15,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          This will set the vehicle as out and record the current date.
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 22,
              borderRadius: 6,
              backgroundColor: "#f5f5f5",
              marginRight: 12,
            }}
            disabled={loading}
          >
            <Text style={{ color: "#222", fontWeight: "500", fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 22,
              borderRadius: 6,
              backgroundColor: "#4287f5",
            }}
            disabled={loading}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              {loading ? "Processing..." : "Confirm"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const JobCard = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [filterValue, setFilterValue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobCards, setJobCards] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = useRef(new Animated.Value(-60)).current; // Start above the screen
  const [vehicleOutModalVisible, setVehicleOutModalVisible] = useState(false);
  const [jobToVehicleOut, setJobToVehicleOut] = useState(null);
  const [vehicleOutLoading, setVehicleOutLoading] = useState(false);

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
      cardBg: colorScheme === "dark" ? "#212121" : "#F2F2F2",
      navBarBg: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
      borderColor: colorScheme === "dark" ? "#6e6e6e" : "#b4b4b4",
      addbuttonBg: colorScheme === "dark" ? "#0e0e0e" : "#000000",
      overlayBg:
        colorScheme === "dark" ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.6)",
      skeletonBg: colorScheme === "dark" ? "#333" : "#e0e0e0",
      skeletonHighlight: colorScheme === "dark" ? "#444" : "#f0f0f0",
      deleteButtonBg: colorScheme === "dark" ? "#404040" : "#e0e0e0",
      editButtonBg: colorScheme === "dark" ? "#404040" : "#e0e0e0",
      deleteButtonText: colorScheme === "dark" ? "#ff0c0c" : "#ff0c0c",
      editButtonText: colorScheme === "dark" ? "#0c91ff" : "#0c91ff",
    },
  };

  useEffect(() => {
    fetchJobCards();
  }, [filterValue, searchQuery]);

  useEffect(() => {
    if (toastVisible) {
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 60,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(3000),
        Animated.timing(toastAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => setToastVisible(false));
    }
  }, [toastVisible]);

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      let url = "job-cards/simple-list/";
      const params = new URLSearchParams();

          params.append("is_estimated", "False");

      if (filterValue) {
        if (["pending", "in_progress", "completed"].includes(filterValue)) {
          params.append("status", filterValue);
        } else if (["low", "medium", "high"].includes(filterValue)) {
          params.append("priority", filterValue);
        }
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await axiosInstance.get(url);
      // Ensure vehicle_out is boolean
      const processedData = response.data.map((job) => ({
        ...job,
        vehicle_out: Boolean(job.vehicle_out),
      }))
       .sort(
        (a, b) => new Date(b.date_in).getTime() - new Date(a.date_in).getTime()
      );

      setJobCards(processedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching job cards:", err);
      setError("Failed to load job cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    console.log("Navigate to AddNewCard");
    router.push("/addNewJobCard");
  };
  const handleQuickSale = () => {
    console.log("Navigate to Quick sale");
    router.push("/sale");
  };

  const handleDelete = (job) => {
    setJobToDelete(job);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/job-cards/${jobToDelete.id}/`);
      setJobCards((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      setDeleteModalVisible(false);
      setJobToDelete(null);
      showToast("Job card deleted successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to delete job card.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (id) => {
    console.log("Edit job card with ID:", id);
    router.push({
      pathname: "/editJobcard",
      params: { id: id },
    });
  };

  const handleVehicleOut = (job) => {
    setJobToVehicleOut(job);
    setVehicleOutModalVisible(true);
  };

  const confirmVehicleOut = async () => {
    if (!jobToVehicleOut) return;
    setVehicleOutLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateOut = `${yyyy}-${mm}-${dd}`;
      await axiosInstance.patch(`/job-cards/${jobToVehicleOut.id}/`, {
        vehicle_out: true,
        date_out: dateOut,
      });
      // Do NOT update local state here, just refetch from backend for true source of truth
      fetchJobCards();
      setVehicleOutModalVisible(false);
      setJobToVehicleOut(null);
      showToast("Vehicle marked as out successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to mark vehicle as out.");
    } finally {
      setVehicleOutLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return { backgroundColor: "limegreen" };
      case "pending":
        return { backgroundColor: "#f0382c" };
      case "in_progress":
        return { backgroundColor: "#FFA500" };
      default:
        return { backgroundColor: "#D9D9D9" };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "high":
        return { backgroundColor: "#E86161" };
      case "medium":
        return { backgroundColor: "#FFA500" };
      case "low":
        return { backgroundColor: "#26da44" };
      default:
        return { backgroundColor: "#D9D9D9" };
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Unknown";
    }
  };

  const formatPriority = (priority) => {
    return priority
      ? priority.charAt(0).toUpperCase() + priority.slice(1)
      : "Normal";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if any error occurs
    }
  };

  const filterJobs = () => {
    if (loading) return [];

    let filteredJobs = [...jobCards];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.customer_name.toLowerCase().includes(query) ||
          job.vehicle_number.includes(query) ||
          job.mobile_number.includes(query)
      );
    }

    // Apply dropdown filter
    if (filterValue) {
      switch (filterValue) {
        case "name":
          filteredJobs = filteredJobs.sort((a, b) =>
            a.customer_name.localeCompare(b.customer_name)
          );
          break;
        case "dateIn":
          filteredJobs = filteredJobs.sort(
            (a, b) => new Date(a.date_in) - new Date(b.date_in)
          );
          break;
        case "pending":
          filteredJobs = filteredJobs.filter(
            (job) => job.job_card_status === "pending"
          );
          break;
        case "in_progress":
          filteredJobs = filteredJobs.filter(
            (job) => job.job_card_status === "in_progress"
          );
          break;
        case "completed":
          filteredJobs = filteredJobs.filter(
            (job) => job.job_card_status === "completed"
          );
          break;
        default:
          break;
      }
    }

    return filteredJobs;
  };

  const SkeletonCard = () => (
    <View
      style={[styles.jobCard, { backgroundColor: extendedTheme.colors.cardBg }]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonName,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonVehicle,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
      </View>

      <View style={styles.cardRow}>
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonText,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonBadge,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
      </View>

      <View style={styles.cardRow}>
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonText,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonBadge,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
      </View>

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonText,
            { backgroundColor: extendedTheme.colors.skeletonBg },
          ]}
        />
        <View style={styles.actionButtons}>
          <View
            style={[
              styles.skeletonItem,
              styles.skeletonButton,
              { backgroundColor: extendedTheme.colors.skeletonBg },
            ]}
          />
          <View
            style={[
              styles.skeletonItem,
              styles.skeletonButton,
              { backgroundColor: extendedTheme.colors.skeletonBg },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const renderSkeletonLoading = () => (
    <>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </>
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setFilterValue(null);
    setSearchQuery("");
    fetchJobCards()
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const renderJobCard = (job) => {
    return (
      <View
        key={job.id}
        style={[
          styles.jobCard,
          { backgroundColor: extendedTheme.colors.cardBg },
          job.vehicle_out && styles.fadedCard,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.customerName, { color: extendedTheme.colors.text }]}
          >
            {job.customer_name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              position: "absolute",
              right: 0,
              top: 0,
            }}
          >
            {job.vehicle_out === true ? (
              <View
                style={[
                  styles.vehicleOutStatus,
                  { backgroundColor: "#4CAF50" },
                ]}
              >
                <Icon
                  name="check-circle"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.vehicleOutStatusText}>Vehicle Out</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.vehicleOutButton}
                onPress={() => handleVehicleOut(job)}
                activeOpacity={0.7}
              >
                <Icon
                  name="logout"
                  size={18}
                  color="#4287f5"
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.vehicleOutText}>Vehicle Out</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            style={[styles.vehicleNo, { color: extendedTheme.colors.text }]}
          >
            Vehicle :{" "}
            <Text style={styles.highlightedVehicleNo}>
              {job.vehicle_number}
            </Text>
            {job.vehicle_name ? `, ${job.vehicle_name}` : ""}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text
            style={[
              styles.infoText,
              { color: extendedTheme.colors.secondaryText },
            ]}
          >
            Mobile No: {job.mobile_number}
          </Text>
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.infoText,
                { color: extendedTheme.colors.secondaryText },
              ]}
            >
              Status:
            </Text>
            <View
              style={[styles.statusBadge, getStatusStyle(job.job_card_status)]}
            >
              <Text style={styles.statusText}>
                {formatStatus(job.job_card_status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Text
            style={[
              styles.infoText,
              { color: extendedTheme.colors.secondaryText },
            ]}
          >
            Date In: {formatDate(job.date_in)}
          </Text>
          <View style={styles.priorityContainer}>
            <Text
              style={[
                styles.infoText,
                { color: extendedTheme.colors.secondaryText },
              ]}
            >
              Priority:
            </Text>
            <View
              style={[
                styles.priorityBadge,
                getPriorityStyle(job.priority_status),
              ]}
            >
              <Text style={styles.priorityText}>
                {formatPriority(job.priority_status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Text
            style={[
              styles.infoText,
              { color: extendedTheme.colors.secondaryText },
            ]}
          >
            Estimate Delivery:{" "}
            {formatDate(job.estimated_date) || "Not specified"}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text
            style={[
              styles.infoText,
              { color: extendedTheme.colors.secondaryText },
            ]}
          >
            Date Out: {formatDate(job.date_out) || "Nill"}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: extendedTheme.colors.deleteButtonBg },
              ]}
              onPress={() => handleDelete(job)}
              activeOpacity={0.7}
            >
              <Icon
                name="delete"
                size={16}
                color="#000"
                style={[
                  styles.buttonIcon,
                  { color: extendedTheme.colors.deleteButtonText },
                ]}
              />
              <Text
                style={[
                  styles.deleteButtonText,
                  { color: extendedTheme.colors.deleteButtonText },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
            {/* {!job.vehicle_out && (
              <TouchableOpacity
                style={[styles.editButton, {backgroundColor: extendedTheme.colors.editButtonBg}]}
                onPress={() => handleEdit(job.id)}
                activeOpacity={0.7}
              >
                <Icon name="edit" size={16} color="#000" style={[styles.buttonIcon, {color: extendedTheme.colors.editButtonText}]} />
                <Text style={[styles.editButtonText, {color: extendedTheme.colors.editButtonText}]}>Edit</Text>
              </TouchableOpacity>
            )} */}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      <Animated.View style={[styles.toastContainer, { top: toastAnim }]}>
        {toastVisible && (
          <View style={styles.toastContent}>
            <View style={styles.toastIconWrapper}>
              <Icon name="check" size={16} color="#fff" />
            </View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </Animated.View>
      <View style={styles.headerContainer}>
        <ImageBackground
          source={require("../assets/images/cars/jobcardImage.jpeg")}
          style={styles.backgroundImage}
        >
          <View
            style={[
              styles.overlay,
              { backgroundColor: extendedTheme.colors.overlayBg },
            ]}
          >
            <Text style={[styles.headerText]}>Job Cards</Text>
          </View>
        </ImageBackground>
      </View>
      <SafeAreaView style={styles.contentContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: extendedTheme.colors.bgTheme },
          ]}
        >
          <View style={styles.inputWrapper}>
            <Icon
              name="search"
              size={20}
              color={extendedTheme.colors.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: extendedTheme.colors.inputBackground,
                  color: extendedTheme.colors.inputText,
                  paddingLeft: 30,
                },
              ]}
              placeholder="Search by name, vehicle number or mobile number"
              placeholderTextColor={extendedTheme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View
          style={[
            styles.filterContainer,
            {
              backgroundColor: extendedTheme.colors.bgTheme,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          {/* Dropdown */}
          <View style={{ flex: 1 }}>
            <Dropdown
              data={filterOptions}
              labelField="label"
              valueField="value"
              onChange={(item) => {
                setFilterValue(item.value);
              }}
              placeholder="Filter by"
              style={[
                styles.dropdown,
                {
                  backgroundColor: extendedTheme.colors.inputBackground,
                  width: "100%",
                },
              ]}
              placeholderStyle={{ color: extendedTheme.colors.placeholder }}
              selectedTextStyle={{ color: extendedTheme.colors.inputText }}
            />
          </View>

          {/* Add New Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: extendedTheme.colors.addbuttonBg,
                borderWidth: 1,
                borderColor: extendedTheme.colors.borderColor,
                marginLeft: 8,
              },
            ]}
            onPress={handleAddNew}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Add New</Text>
          </TouchableOpacity>

          {/* Quick Sale Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor:
                  extendedTheme.colors.quickSaleBg ||
                  extendedTheme.colors.addbuttonBg,
                borderWidth: 1,
                borderColor: extendedTheme.colors.borderColor,
                marginLeft: 8,
              },
            ]}
            onPress={handleQuickSale}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Sale</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[
            styles.scrollView,
            { backgroundColor: extendedTheme.colors.bgTheme },
          ]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4287f5"]}
              tintColor={colorScheme === "dark" ? "#fff" : "#b6b6b6"}
              title="Refreshing..."
              titleColor={extendedTheme.colors.text}
            />
          }
        >
          {loading && !refreshing ? (
            renderSkeletonLoading()
          ) : error ? (
            <Text
              style={[styles.errorText, { color: extendedTheme.colors.text }]}
            >
              {error}
            </Text>
          ) : filterJobs().length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon
                name="car-repair"
                size={80}
                color={extendedTheme.colors.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: extendedTheme.colors.text, opacity: 0.5 },
                ]}
              >
                No Job Cards Found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubText,
                  { color: extendedTheme.colors.textSecondary, opacity: 0.4 },
                ]}
              >
                There are no vehicles in the garage at the moment
              </Text>
            </View>
          ) : (
            filterJobs().map((job) => renderJobCard(job))
          )}
        </ScrollView>

        <View style={styles.bottomNavContainer}>
          <BottomNavBar />
        </View>
      </SafeAreaView>
      <DeleteJobCardModal
        visible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setJobToDelete(null);
        }}
        onConfirm={confirmDelete}
        jobCardNo={jobToDelete?.job_card_no}
        loading={deleteLoading}
      />
      <VehicleOutModal
        visible={vehicleOutModalVisible}
        onCancel={() => {
          setVehicleOutModalVisible(false);
          setJobToVehicleOut(null);
        }}
        onConfirm={confirmVehicleOut}
        loading={vehicleOutLoading}
      />
    </View>
  );
};

export default JobCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: "25%",
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  bottomNavContainer: {
    paddingBottom: 1,
    backgroundColor: "transparent",
  },
  noJobsText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    color: "red",
    fontWeight: "bold",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: 20,
    paddingLeft: 30,
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
  searchContainer: {
    paddingHorizontal: 5,
    paddingVertical: 16,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dropdown: {
    height: 40,
    width: "48%",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  addButton: {
    height: 40,
    width: "25%",
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  jobCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  vehicleNo: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 5,
  },
  highlightedVehicleNo: {
    fontWeight: "bold",
    color: "#4287f5",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 8,
  },
  priorityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
  },
  deleteButton: {
    backgroundColor: "#686868",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: "#c5d6f0",
    color: "#000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  buttonIcon: {
    marginRight: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    zIndex: 20, // Adjust based on your design
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    // Additional styling
  },
  // Skeleton loading styles
  skeletonItem: {
    borderRadius: 4,
  },
  skeletonName: {
    height: 22,
    width: "40%",
  },
  skeletonVehicle: {
    height: 18,
    width: "30%",
  },
  skeletonText: {
    height: 16,
    width: "40%",
  },
  skeletonBadge: {
    height: 24,
    width: "30%",
    borderRadius: 15,
  },
  skeletonButton: {
    height: 30,
    width: 60,
    marginLeft: 8,
    borderRadius: 8,
  },
  toastContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#27ae60",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  toastText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "500",
  },
  vehicleOutButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4287f5",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  vehicleOutText: {
    color: "#222",
    fontWeight: "500",
    fontSize: 15,
  },
  vehicleOutDoneButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4287f5",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    marginLeft: 8,
  },
  vehicleOutDoneText: {
    color: "#4287f5",
    fontWeight: "500",
    fontSize: 15,
  },
  fadedCard: {
    opacity: 0.5,
  },
  vehicleOutStatus: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  vehicleOutStatusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
});
