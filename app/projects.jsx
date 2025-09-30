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
import React, { useState, useEffect } from "react";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Dropdown } from "react-native-element-dropdown";
import axiosInstance from "../api/api";
import { BlurView } from "expo-blur";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { FixedText } from "../components/FixedText";
const filterOptions = [
  { label: "Priority-Low", value: "low" },
  { label: "Priority-Medium", value: "medium" },
  { label: "Priority-High", value: "high" },
  { label: "Status - Pending", value: "pending" },
  { label: "Status - In Progress", value: "in_progress" },
  { label: "Status - Completed", value: "completed" },
];

const { width, height } = Dimensions.get("window");

const Projects = () => {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState("assign");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [workerAssignments, setWorkerAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [addingWorkerIndex, setAddingWorkerIndex] = useState(null);
  const [modalTab, setModalTab] = useState("assign");
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalJobStatus, setModalJobStatus] = useState("pending");
  const [statusLoading, setStatusLoading] = useState("");

  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  const extendedTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      bgTheme: colorScheme === "dark" ? "#000000" : "#f0f0f0",
      cardBg: colorScheme === "dark" ? "#212121" : "#ffffff",
      selectInputBg: colorScheme === "dark" ? "#212121" : "#dedede",
      borderColor: colorScheme === "dark" ? "#333333" : "#e0e0e0",
      textSecondary: colorScheme === "dark" ? "#b0b0b0" : "#666666",
      overlayBg:
        colorScheme === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.5)",
      modalBg: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
      buttonBg: "#000000",
      buttonText: "#ffffff",
      tabActiveBg: colorScheme === "dark" ? "#414141" : "#ffffff",
      tabInactiveBg: colorScheme === "dark" ? "#2c2c2c" : "#f0f0f0",
      inputBg: colorScheme === "dark" ? "#333333" : "#f5f6fa",
      workerRowBg: colorScheme === "dark" ? "#2a2a2a" : "#f5f6fa",
      workerRowBorder: colorScheme === "dark" ? "#444444" : "#e0e0e0",
      workerRowText: colorScheme === "dark" ? "#ffffff" : "#222222",
      workerRowSubText: colorScheme === "dark" ? "#aaaaaa" : "#b0b0b0",
      addWorkerBg: colorScheme === "dark" ? "#2a2a2a" : "#f5f6fa",
      addWorkerText: colorScheme === "dark" ? "#ffffff" : "#222222",
      addWorkerBorder: colorScheme === "dark" ? "#444444" : "#e0e0e0",
      dropdownBg: colorScheme === "dark" ? "#333333" : "#ffffff",
      dropdownItemBg: colorScheme === "dark" ? "#2a2a2a" : "#f5f6fa",
      dropdownItemText: colorScheme === "dark" ? "#ffffff" : "#222222",
      checkInButtonBg: colorScheme === "dark" ? "#333333" : "#ffffff",
      checkInButtonText: colorScheme === "dark" ? "#22c55e" : "#22c55e",
      checkInButtonBorder: colorScheme === "dark" ? "#22c55e" : "#22c55e",
      sectionTitleText: colorScheme === "dark" ? "#ffffff" : "#222222",
      modalBorder: colorScheme === "dark" ? "#5b5b5b" : "#e0e0e0",
      modalButtonBg: colorScheme === "dark" ? "#333333" : "#eeeeee",
      skeletonBg: colorScheme === "dark" ? "#333333" : "#f0f0f0",
      secondaryText: colorScheme === "dark" ? "#8b8b8b" : "#565656",
    },
  };

  useEffect(() => {
    setLoading(true);
    fetchJobs();
    fetchEmployees();
  }, [filterValue, searchQuery]);

  useEffect(() => {
    if (selectedJob) {
      setModalJobStatus(selectedJob.job_card_status);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      let url = "job-cards/simple-list/";
      const params = new URLSearchParams();

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
      // Filter out job cards where vehicle_out is true
      const filteredJobs = response.data.filter((job) => !job.vehicle_out);
      setJobs(filteredJobs);
      setError(null);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axiosInstance.get("employees/");
      setEmployees(response.data.results);
    } catch (err) {
      console.error("Error fetching employees:", err);
      Alert.alert("Error", "Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setFilterValue(null);
    fetchJobs().finally(() => setRefreshing(false));
  }, []);

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
      if (isNaN(date.getTime())) return dateString;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const fetchAssignedEmployees = async (jobCardId) => {
    try {
      const response = await axiosInstance.get(
        `job-cards/${jobCardId}/assigned-employees/`
      );
      setAssignedEmployees(response.data);
      // Convert assigned employees to worker assignments format
      const formattedAssignments = response.data.map((assignment) => ({
        id: assignment.id,
        worker: {
          employee: assignment.employee,
        },
        checkInTime: null,
        checkOutTime: null,
      }));
      setWorkerAssignments(formattedAssignments);
    } catch (err) {
      console.error("Error fetching assigned employees:", err);
      Alert.alert("Error", "Failed to load assigned employees");
    }
  };

  const fetchAttendanceData = async (jobCardId) => {
    try {
      const response = await axiosInstance.get(
        `job-cards/${jobCardId}/attendance/`
      );
      setAttendanceData(response.data);
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      Alert.alert("Error", "Failed to load attendance data");
    }
  };

  const handleJobPress = (job) => {
    setSelectedJob(job);
    setModalLoading(true);
    if (job.job_card_status === "completed") {
      setHistoryModalVisible(true);
    } else {
      setModalVisible(true);
      Promise.all([
        fetchAssignedEmployees(job.id),
        fetchAttendanceData(job.id),
      ]).finally(() => {
        setModalLoading(false);
      });
    }
  };

  const handleAddWorkerClick = () => {
    setShowEmployeeDropdown(true);
  };

  const handleEmployeeSelect = async (item) => {
    try {
      // First assign the employee to the job card
      const response = await axiosInstance.post(
        `job-cards/${selectedJob.id}/assign-employee/`,
        {
          employee: item.employee.id,
          is_primary: false,
        }
      );

      // Add the assigned employee to the worker assignments
      setWorkerAssignments((prev) => [
        ...prev,
        {
          id: response.data.id,
          worker: {
            employee: response.data.employee,
          },
          checkInTime: null,
          checkOutTime: null,
        },
      ]);

      // Refresh assigned employees list
      await fetchAssignedEmployees(selectedJob.id);

      setShowEmployeeDropdown(false);
      setEmployeeSearchQuery("");
    } catch (err) {
      console.error("Error assigning employee:", err);
      if (
        err.response?.data?.error ===
        "Employee is already assigned to this job card"
      ) {
        Alert.alert(
          "Error",
          "This employee is already assigned to this job card"
        );
      } else {
        Alert.alert("Error", "Failed to assign employee to job card");
      }
    }
  };

  const handleCheckIn = async (employeeId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await axiosInstance.post(`job-cards/${selectedJob.id}/check-in/`, {
        date: today,
        employee: employeeId,
      });
      // Refresh attendance data after check-in
      await fetchAttendanceData(selectedJob.id);
    } catch (err) {
      console.error("Error checking in:", err);
      if (
        err.response?.data?.detail ===
        "Employee is not assigned to this job card. Please assign them first."
      ) {
        Alert.alert(
          "Error",
          "Employee needs to be assigned to the job card first"
        );
      } else {
        Alert.alert("Error", "Failed to check in employee");
      }
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await axiosInstance.post(
        `job-cards/${selectedJob.id}/check-out/${attendanceId}/`
      );
      // Refresh attendance data after check-out
      await fetchAttendanceData(selectedJob.id);
    } catch (err) {
      console.error("Error checking out:", err);
      Alert.alert("Error", "Failed to check out employee");
    }
  };

  const handleSave = () => {
    console.log("Save the updated project details:", selectedJob);
    Alert.alert("Success", "Project Updated successfully", [
      { text: "OK", onPress: () => setModalVisible(false) },
    ]);
    setWorkerAssignments([]);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(employeeSearchQuery.toLowerCase())
  );

  const employeeOptions = filteredEmployees.map((employee) => ({
    label: `${employee.name} (${employee.employee_id})`,
    value: employee.id,
    employee: employee,
  }));

  const renderAddWorkerDropdown = () => (
    <View
      style={[
        styles.employeeDropdownContainer,
        {
          backgroundColor: extendedTheme.colors.dropdownBg,
          borderColor: extendedTheme.colors.workerRowBorder,
        },
      ]}
    >
      <View
        style={[
          styles.employeeSearchContainer,
          {
            backgroundColor: extendedTheme.colors.inputBg,
            borderColor: extendedTheme.colors.workerRowBorder,
          },
        ]}
      >
        <Icon
          name="search"
          size={18}
          color={extendedTheme.colors.workerRowSubText}
          style={styles.employeeSearchIcon}
        />
        <TextInput
          style={[
            styles.employeeSearchInput,
            { color: extendedTheme.colors.workerRowText },
          ]}
          placeholder="Search employees..."
          placeholderTextColor={extendedTheme.colors.workerRowSubText}
          value={employeeSearchQuery}
          onChangeText={setEmployeeSearchQuery}
        />
      </View>
      <View style={styles.employeeDropdownList}>
        {employeeOptions.length === 0 ? (
          <Text
            style={[
              styles.noEmployeesText,
              { color: extendedTheme.colors.workerRowSubText },
            ]}
          >
            No employees found
          </Text>
        ) : (
          <ScrollView>
            {employeeOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.employeeDropdownItem,
                  { backgroundColor: extendedTheme.colors.dropdownItemBg },
                ]}
                onPress={() => handleEmployeeSelect(item)}
              >
                <Icon
                  name="person"
                  size={18}
                  color={extendedTheme.colors.workerRowSubText}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.employeeDropdownName,
                    { color: extendedTheme.colors.dropdownItemText },
                  ]}
                >
                  {item.employee.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const handleRemoveAssignedEmployee = async (jobCardId, employeeId) => {
    try {
      // Check if employee is currently checked in
      const isCheckedIn = attendanceData.some(
        (att) => att.employee.id === employeeId && !att.is_checked_out
      );

      if (isCheckedIn) {
        Alert.alert(
          "Cannot Remove Employee",
          "This employee is currently checked in. Please check them out first before removing.",
          [{ text: "OK" }]
        );
        return;
      }

      await axiosInstance.delete(
        `job-cards/${jobCardId}/remove-employee/${employeeId}/`
      );
      setWorkerAssignments((prev) =>
        prev.filter((a) => a.worker.employee.id !== employeeId)
      );
    } catch (err) {
      Alert.alert("Error", "Failed to remove assigned employee");
    }
  };

  const renderRightActions = (progress, dragX, assignment) => {
    return (
      <TouchableOpacity
        style={styles.swipeDeleteButton}
        onPress={() =>
          handleRemoveAssignedEmployee(
            selectedJob.id,
            assignment.worker.employee.id
          )
        }
        activeOpacity={0.7}
      >
        <Icon name="delete" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderWorkerRow = (assignment, index) => {
    const latestAttendance = attendanceData.find(
      (att) =>
        att.employee.id === assignment.worker.employee.id && !att.is_checked_out
    );

    return (
      <Swipeable
        key={assignment.id}
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, assignment)
        }
        rightThreshold={40}
        overshootRight={false}
      >
        <View
          style={[
            styles.workerRow,
            {
              backgroundColor: extendedTheme.colors.workerRowBg,
              borderColor: extendedTheme.colors.workerRowBorder,
              overflow: "hidden",
            },
          ]}
        >
          <View style={styles.workerRowInfo}>
            <Text
              style={[
                styles.workerRowName,
                { color: extendedTheme.colors.workerRowText },
              ]}
            >
              {assignment.worker.employee.name}
            </Text>
            <Text
              style={[
                styles.workerRowId,
                { color: extendedTheme.colors.workerRowSubText },
              ]}
            >
              {assignment.worker.employee.employee_id}
            </Text>
          </View>
          {latestAttendance ? (
            <TouchableOpacity
              style={styles.checkOutButton}
              onPress={() => handleCheckOut(latestAttendance.id)}
            >
              <Icon
                name="logout"
                size={18}
                color="#fd1717"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.checkOutButtonText}>Check Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.checkInButton,
                {
                  backgroundColor: extendedTheme.colors.checkInButtonBg,
                  borderColor: extendedTheme.colors.checkInButtonBorder,
                },
              ]}
              onPress={() => handleCheckIn(assignment.worker.employee.id)}
            >
              <Icon
                name="login"
                size={18}
                color={extendedTheme.colors.checkInButtonText}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.checkInButtonText,
                  { color: extendedTheme.colors.checkInButtonText },
                ]}
              >
                Check In
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
    );
  };

  const renderJobCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.jobCard, { backgroundColor: extendedTheme.colors.cardBg }]}
      onPress={() => handleJobPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.customerName, { color: extendedTheme.colors.text }]}
        >
          {item.customer_name}
        </Text>
        <Text style={[styles.vehicleNo, { color: extendedTheme.colors.text }]}>
          Vehicle :{" "}
          <Text style={styles.highlightedVehicleNo}>{item.vehicle_number}</Text>
          {item.vehicle_name ? `, ${item.vehicle_name}` : ""}
        </Text>
      </View>

      <View style={styles.cardRow}>
<FixedText
                        fontSize={14}          style={[
            styles.infoTextNo,
            { color: extendedTheme.colors.secondaryText },
          ]}
        >
          Mobile No: {item.mobile_number}
        </FixedText>
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
            style={[styles.statusBadge, getStatusStyle(item.job_card_status)]}
          >
            <Text style={styles.statusText}>
              {formatStatus(item.job_card_status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <FixedText
          fontSize={14}
          style={[
            styles.infoTextNo,
            { color: extendedTheme.colors.secondaryText },
          ]}
        >
          Date In: {formatDate(item.service_date)}
        </FixedText>
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
              getPriorityStyle(item.priority_status),
            ]}
          >
            <Text style={styles.priorityText}>
              {formatPriority(item.priority_status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <FixedText
        fontSize={14}
          style={[
            styles.infoTextNo,
            { color: extendedTheme.colors.secondaryText },
          ]}
        >
          Estimate Delivery:{" "}
          {formatDate(item.estimated_date) || "Not specified"}
        </FixedText>
      </View>

      <View style={styles.cardFooter}>
<FixedText
          fontSize={14}          style={[
            styles.infoTextNo,
            { color: extendedTheme.colors.secondaryText },
          ]}
        >
          Date Out: {formatDate(item.date_out) || "Nill"}
        </FixedText>
      </View>
    </TouchableOpacity>
  );

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

      <View style={styles.cardRow}>
        <View
          style={[
            styles.skeletonItem,
            styles.skeletonText,
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
      </View>
    </View>
  );

  const renderSkeletonLoading = () => (
    <View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  const handleStatusChange = async (status) => {
    if (!selectedJob || statusLoading) return;
    setStatusLoading(status);
    try {
      await axiosInstance.post(`job-cards/${selectedJob.id}/job-card-status/`, {
        status,
      });
      setModalJobStatus(status);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id ? { ...j, job_card_status: status } : j
        )
      );
    } catch (err) {
      Alert.alert("Error", "Failed to update job card status");
    } finally {
      setStatusLoading("");
    }
  };

  const renderModalContent = () => (
    <View
      style={[
        styles.modalContent,
        {
          borderWidth: 1.5,
          borderColor: extendedTheme.colors.modalBorder,
          backgroundColor: extendedTheme.colors.modalBg,
          minHeight: height * 0.8,
        },
      ]}
    >
      <View
        style={[
          styles.tabsWrapper,
          { backgroundColor: extendedTheme.colors.tabInactiveBg },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modalTab,
            modalTab === "assign" && [
              styles.modalTabActive,
              { backgroundColor: extendedTheme.colors.tabActiveBg },
            ],
          ]}
          onPress={() => setModalTab("assign")}
        >
          <Text
            style={[
              styles.modalTabText,
              { color: extendedTheme.colors.text },
              modalTab === "assign" && styles.modalTabTextActive,
            ]}
          >
            Assign Workers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modalTab,
            modalTab === "records" && [
              styles.modalTabActive,
              { backgroundColor: extendedTheme.colors.tabActiveBg },
            ],
          ]}
          onPress={() => setModalTab("records")}
        >
          <Text
            style={[
              styles.modalTabText,
              { color: extendedTheme.colors.text },
              modalTab === "records" && styles.modalTabTextActive,
            ]}
          >
            Attendance History
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {modalTab === "assign" ? (
            <Text
              style={[styles.modalTitle, { color: extendedTheme.colors.text }]}
            >
              Assign Workers
            </Text>
          ) : (
            <Text
              style={[styles.modalTitle, { color: extendedTheme.colors.text }]}
            >
              Attendance History
            </Text>
          )}
          <View style={styles.jobDetails}>
            {selectedJob && (
              <>
                <View
                  style={[
                    styles.jobDetaillls,
                    {
                      backgroundColor: extendedTheme.colors.modalBg,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  {/* Left Section */}
                  <View>
                    <Text
                      style={[
                        styles.jobDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Customer: {selectedJob.customer_name}
                    </Text>
                    <Text
                      style={[
                        styles.jobDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Vehicle No: {selectedJob.vehicle_number}
                    </Text>
                  </View>

                  {/* Right Section */}
                  <View>
                    <Text
                      style={[
                        styles.jobDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Date In: {formatDate(selectedJob.service_date)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {modalTab === "assign" ? (
            <>
              <View style={styles.addWorkerHeader}>
                <Text
                  style={[
                    styles.addWorkerTitle,
                    { color: extendedTheme.colors.sectionTitleText },
                  ]}
                >
                  Add Worker
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addWorkerButton,
                    {
                      backgroundColor: extendedTheme.colors.buttonBg,
                      borderColor: extendedTheme.colors.addWorkerBorder,
                    },
                  ]}
                  onPress={() => {
                    if (showEmployeeDropdown) {
                      setShowEmployeeDropdown(false);
                      setEmployeeSearchQuery("");
                    } else {
                      setShowEmployeeDropdown(true);
                    }
                  }}
                  disabled={false}
                >
                  <Icon
                    name={showEmployeeDropdown ? "close" : "add"}
                    size={20}
                    color="#ffffff"
                    style={styles.addIcon}
                  />
                  <Text style={styles.addWorkerButtonText}>
                    {showEmployeeDropdown ? "Close" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
              {showEmployeeDropdown && renderAddWorkerDropdown()}
              {workerAssignments.length > 0 ? (
                <View style={styles.workersListContainer}>
                  <Text
                    style={[
                      styles.workersListTitle,
                      { color: extendedTheme.colors.sectionTitleText },
                    ]}
                  >
                    Assigned Workers
                  </Text>
                  <View style={styles.selectedWorkersList}>
                    {workerAssignments.map(renderWorkerRow)}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon
                    name="group"
                    size={60}
                    color={extendedTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: extendedTheme.colors.textSecondary },
                    ]}
                  >
                    No workers assigned yet
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateSubText,
                      { color: extendedTheme.colors.textSecondary },
                    ]}
                  >
                    Click the Add button to assign workers
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.recordsTabContent, { flex: 1 }]}>
              {modalLoading ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator
                    size="large"
                    color={extendedTheme.colors.text}
                  />
                </View>
              ) : attendanceData.length > 0 ? (
                <ScrollView
                  style={styles.attendanceListScroll}
                  contentContainerStyle={styles.attendanceListContent}
                  showsVerticalScrollIndicator={true}
                >
                  {attendanceData.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.attendanceRow,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#323232" : "#f1f1f1",
                        },
                      ]}
                    >
                      <View style={styles.attendanceLeft}>
                        <Text
                          style={[
                            styles.attendanceName,
                            { color: colorScheme === "dark" ? "#fff" : "#222" },
                          ]}
                        >
                          {item.employee.name}
                        </Text>
                        <Text
                          style={[
                            styles.attendanceId,
                            {
                              color:
                                colorScheme === "dark" ? "#b0b0b0" : "#888",
                            },
                          ]}
                        >
                          {item.employee.employee_id}
                        </Text>
                        <Text
                          style={[
                            styles.attendanceDate,
                            {
                              color:
                                colorScheme === "dark" ? "#b0b0b0" : "#888",
                            },
                          ]}
                        >
                          {item.date}
                        </Text>
                      </View>
                      <View style={styles.attendanceTimes}>
                        <Text
                          style={[
                            styles.attendanceTime,
                            {
                              color:
                                colorScheme === "dark" ? "#22c55e" : "#22c55e",
                            },
                          ]}
                        >
                          in:{" "}
                          {new Date(item.check_in_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                        <Text
                          style={[
                            styles.attendanceTime,
                            {
                              color:
                                colorScheme === "dark" ? "#f87171" : "#f0382c",
                            },
                          ]}
                        >
                          out:{" "}
                          {item.check_out_time
                            ? new Date(item.check_out_time).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : "--"}
                        </Text>
                      </View>
                      <View style={styles.attendanceRight}>
                        {!item.is_checked_out && (
                          <TouchableOpacity
                            style={styles.checkOutButton}
                            onPress={() => handleCheckOut(item.id)}
                          >
                            <Icon
                              name="logout"
                              size={16}
                              color="#fd1717"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.checkOutButtonText}>
                              Check Out
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text
                          style={[
                            styles.attendanceDuration,
                            {
                              color:
                                colorScheme === "dark" ? "#b0b0b0" : "#888",
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          Duration: {item.formatted_duration}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.emptyStateContainer, { flex: 1 }]}>
                  <Icon
                    name="history"
                    size={60}
                    color={extendedTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: extendedTheme.colors.textSecondary },
                    ]}
                  >
                    No attendance records yet
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateSubText,
                      { color: extendedTheme.colors.textSecondary },
                    ]}
                  >
                    Attendance records will appear here once workers check in
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomSection,
            { backgroundColor: extendedTheme.colors.modalBg },
          ]}
        >
          {selectedJob && (
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
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
                        modalJobStatus === status.value
                          ? status.value === "pending"
                            ? "#FF4444"
                            : status.value === "in_progress"
                            ? "#ffcd00"
                            : "#4CAF50"
                          : "#fff",
                      borderColor:
                        modalJobStatus === status.value
                          ? status.value === "pending"
                            ? "#FF4444"
                            : status.value === "in_progress"
                            ? "#ffcd00"
                            : "#4CAF50"
                          : "#e0e0e0",
                      borderWidth: 1.5,
                      flex: 1,
                      marginHorizontal: 4,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleStatusChange(status.value)}
                  disabled={!!statusLoading}
                >
                  {statusLoading === status.value ? (
                    <ActivityIndicator
                      size="small"
                      color={modalJobStatus === status.value ? "#fff" : "#222"}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color:
                            modalJobStatus === status.value
                              ? "#fff"
                              : extendedTheme.colors.cancelButtonText,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: extendedTheme.colors.borderColor,
                  backgroundColor: extendedTheme.colors.modalButtonBg,
                },
              ]}
              onPress={() => {
                setModalVisible(false);
                setWorkerAssignments([]);
                setShowEmployeeDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: extendedTheme.colors.text },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
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
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
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
             <FixedText
                           fontSize={28}
                           numberOfLines={1}
                           adjustsFontSizeToFit
                           minimumFontScale={0.8} style={styles.headerText}>Projects</FixedText>
            </View>
          </ImageBackground>
        </View>

        <SafeAreaView
          style={[
            styles.contentContainer,
            { backgroundColor: extendedTheme.colors.bgTheme },
          ]}
        >
          <View style={styles.filterContainer}>
            <View
              style={[
                styles.searchInputContainer,
                {
                  backgroundColor: extendedTheme.colors.selectInputBg,
                  flex: 0.48,
                },
              ]}
            >
              <Icon
                name="search"
                size={20}
                color={extendedTheme.colors.textSecondary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: extendedTheme.colors.text,
                  },
                ]}
                placeholder="Search..."
                placeholderTextColor={extendedTheme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Dropdown
              style={[
                styles.filterDropdown,
                {
                  backgroundColor: extendedTheme.colors.selectInputBg,
                  flex: 0.48,
                },
              ]}
              data={filterOptions}
              labelField="label"
              valueField="value"
              placeholder="Filter"
              value={filterValue}
              onChange={(item) => {
                setLoading(true);
                setFilterValue(item.value);
              }}
              placeholderStyle={{ color: extendedTheme.colors.textSecondary }}
              selectedTextStyle={{ color: extendedTheme.colors.text }}
            />
          </View>

          <FlatList
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
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
            ListEmptyComponent={
              loading ? (
                renderSkeletonLoading()
              ) : error ? (
                <View style={styles.emptyStateContainer}>
                  <Icon name="error-outline" size={80} color="red" />
                  <Text style={[styles.emptyStateText, { color: "red" }]}>
                    {error}
                  </Text>
                </View>
              ) : (
                renderEmptyState()
              )
            }
          />

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            {colorScheme === "dark" ? (
              <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
                {renderModalContent()}
              </BlurView>
            ) : (
              <View style={styles.modalOverlay}>{renderModalContent()}</View>
            )}
          </Modal>

          <Modal
            visible={historyModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setHistoryModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: extendedTheme.colors.modalBg },
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    { color: extendedTheme.colors.text },
                  ]}
                >
                  Project History
                </Text>

                {selectedJob && (
                  <View style={styles.historyDetails}>
                    <Text
                      style={[
                        styles.historyDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Customer: {selectedJob.customer_name}
                    </Text>
                    <Text
                      style={[
                        styles.historyDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Vehicle No: {selectedJob.vehicle_number}
                    </Text>
                    <Text
                      style={[
                        styles.historyDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Date In: {formatDate(selectedJob.service_date)}
                    </Text>
                    <Text
                      style={[
                        styles.historyDetailText,
                        { color: extendedTheme.colors.text },
                      ]}
                    >
                      Date Out: {formatDate(selectedJob.date_out)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: extendedTheme.colors.buttonBg },
                  ]}
                  onPress={() => setHistoryModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.bottomNavContainer}>
            <BottomNavBar />
          </View>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
};

export default Projects;

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
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
    paddingLeft: 20,
  },
  headerText: {
    color: "#fff",
    // fontSize: 28,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 16,
    gap: 5,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: "100%",
  },
  filterDropdown: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  tabsWrapper: {
    flexDirection: "row",
    marginHorizontal: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  jobCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#adadad ",
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
 infoTextNo: {
    // fontSize: 14,
    minHeight:35
  },
  infoText: {
    // fontSize: 14,
    // minHeight:35
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalScroll: {
    flexGrow: 0,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  addWorkerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  addWorkerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addWorkerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addIcon: {
    marginRight: 4,
  },
  addWorkerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  workersListContainer: {
    marginBottom: 16,
  },
  workersListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectedWorkersList: {
    marginBottom: 10,
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  workerRowInfo: {
    flex: 1,
  },
  workerRowName: {
    fontSize: 16,
    fontWeight: "500",
  },
  workerRowId: {
    fontSize: 12,
    marginTop: 4,
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  checkInButtonText: {
    fontWeight: "500",
    fontSize: 14,
  },
  checkOutButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderColor: "#fd1717",
  },
  checkOutButtonText: {
    fontWeight: "500",
    fontSize: 14,
    color: "#fd1717",
  },
  employeeDropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  employeeSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    height: 40,
  },
  employeeSearchIcon: {
    marginRight: 8,
  },
  employeeSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  employeeDropdownList: {
    maxHeight: 100,
    overflow: "hidden",
  },
  employeeDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  employeeDropdownName: {
    fontSize: 15,
    fontWeight: "500",
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
  noEmployeesText: {
    fontSize: 14,
    padding: 8,
    textAlign: "center",
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 16,
    marginTop: 16,
  },
  jobDetails: {
    marginBottom: 16,
  },
  jobDetailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 9,
    opacity: 0.5,
  },
  jobDetailText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 3,
    opacity: 0.5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyDetails: {
    marginBottom: 20,
  },
  historyDetailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
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
  recordsTabContent: {
    flex: 1,
    padding: 0,
  },
  recordsTabTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  attendanceListScroll: {
    width: "100%",
    maxHeight: height * 0.6,
    alignSelf: "stretch",
    minWidth: 0,
  },
  attendanceListContent: {
    width: "100%",
    paddingBottom: 16,
    minWidth: 0,
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginBottom: 10,
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    width: "100%",
    alignSelf: "stretch",
    overflow: "hidden",
  },
  attendanceLeft: {
    flex: 2,
    minWidth: 90,
  },
  attendanceName: {
    fontSize: 15,
    fontWeight: "600",
  },
  attendanceId: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  attendanceDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  attendanceTimes: {
    flex: 1.2,
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 60,
  },
  attendanceTime: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  attendanceRight: {
    flex: 1.2,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    minWidth: 80,
  },
  attendanceDuration: {
    fontSize: 12,
    color: "#888",
    marginTop: 7,
    marginBottom: -15,
    marginLeft: -80,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  modalTabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalTabTextActive: {
    fontWeight: "600",
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
    opacity: 0.8,
  },
  swipeDeleteButton: {
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: "85%",
    borderRadius: 10,
    marginVertical: 0,
    marginRight: 0,
    marginLeft: 7,
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignItems: "center",
    minHeight: 32,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomNavContainer: {
    paddingBottom: 1,
    backgroundColor: "transparent",
  },
});
