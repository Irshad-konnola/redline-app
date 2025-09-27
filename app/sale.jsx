import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  useColorScheme,
  Dimensions,Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { debounce } from 'lodash';
import { router } from 'expo-router';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { fetchAccounts,fetchAccountGroups,fetchStoreProductsAll } from '../api/api';
import axiosInstance from '../api/api';

const { width, height } = Dimensions.get('window');

const SalesScreen = ({ navigation }) => {
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
      error: '#ff6b6b',
      card: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
      border: colorScheme === 'dark' ? '#333' : '#E5E7EB',
    }
  };

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  
  const [products, setProducts] = useState([]);
  
  const [services, setServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [salesAccounts, setSalesAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
const [newCustomer, setNewCustomer] = useState({
  company_name: "",
  name: "",
  opening_balance: "",
  mobile_number: "",
  whatsapp_number: "",
  email: "",
  country: "qatar",
  city: "Doha",
});


  // Form state
  const [formData, setFormData] = useState({
    account: '',
    sales_account: '',
    date: new Date().toISOString().slice(0, 16),
    payment_method: 'cash',
    bank_account: '',
    notes: '',
    discount_amount: '0',
    paid_amount: '0',
    balance_amount: '0',
    items: [{
      product: '',
      quantity: '1',
      unit_price: '0',
      sku: '',
      description: '',
      sizes: []
    }],
    services: [],
    add_on_charges: '0'
  });
console.log(formData);

  // Modal states for pickers
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState({ show: false, index: -1 });
  const [showServiceCategoryPicker, setShowServiceCategoryPicker] = useState({ show: false, index: -1 });
  const [showServicePicker, setShowServicePicker] = useState({ show: false, index: -1 });

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  // Totals calculation
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    addOnCharges: 0,
    total: 0,
    paidAmount: 0,
    balanceAmount: 0
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [accountsData, accountGroupsData, productsData, servicesData, serviceCategoriesData] = 
        await Promise.all([
          fetchAccounts(),
          fetchAccountGroups(),
          fetchStoreProductsAll(),
          axiosInstance.get('/services/'),
          axiosInstance.get('/service-categories/')
        ]);

      // Filter relevant accounts
      const relevantGroupNames = ['Sundry Debtors'];
      const relevantGroups = accountGroupsData.results.filter(group => 
        relevantGroupNames.includes(group.name)
      );
      const filteredAccounts = accountsData.results.filter(account => 
        relevantGroups.some(group => group.id === account.group)
      );

      // Filter sales accounts
      const salesGroupNames = ['Sales Account'];
      const salesAccountGroupsData = accountGroupsData.results.filter(group => 
        salesGroupNames.includes(group.name)
      );
      const filteredSalesAccounts = accountsData.results.filter(account => 
        salesAccountGroupsData.some(group => group.id === account.group)
      );

      // Filter bank accounts
      const bankAccountNames = ['Bank Account'];
      const bankAccountGroupsData = accountGroupsData.results.filter(group => 
        bankAccountNames.includes(group.name)
      );
      const filteredBankAccounts = accountsData.results.filter(account => 
        bankAccountGroupsData.some(group => group.id === account.group)
      );

      setAccounts(filteredAccounts);
      setProducts(productsData.results);
      setServices(servicesData.data.results);
      setServiceCategories(serviceCategoriesData.data);
      setSalesAccounts(filteredSalesAccounts);
      setBankAccounts(filteredBankAccounts);

      // Set default sales account
      if (filteredSalesAccounts.length > 0) {
        updateFormData('sales_account', filteredSalesAccounts[0].id.toString());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update form data helper
  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateItem = (index, key, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [key]: value };
      const newFormData = { ...prev, items: newItems };
      return newFormData;
    });
  };
  
  // Update service in services array
  const updateService = (index, key, value) => {   
      setFormData(prev => {
          const newServices = [...prev.services];
          newServices[index] = { ...newServices[index], [key]: value };
          return { ...prev, services: newServices };
      });
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      product: '',
      quantity: '1',
      unit_price: '0',
      sku: '',
      description: '',
      sizes: []
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  // Add new service
  const addService = () => {
    const newService = {
      category: '',
      service: '',
      quantity: '1',
      unit_price: '0',
      notes: ''
    };
    setFormData(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  // Remove service
  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: newServices }));
  };

  // Handle product selection
  const handleProductChange = async (index, productId) => {
    try {
      const product = products.find(p => p.id.toString() === productId);
      if (product) {
        updateItem(index, 'product', productId);
        updateItem(index, 'unit_price', product.selling_price.toString());
        updateItem(index, 'sku', product.sku || '');
        const currentQuantity = formData.items[index]?.quantity;
        if (!currentQuantity || currentQuantity === "0") {
          updateItem(index, 'quantity', "1");
        }

        // Fetch product sizes
        try {
          const response = await axiosInstance.get(`/products/${productId}/sizes/`);
          setProductSizes(prev => ({
            ...prev,
            [productId]: response.data
          }));
        } catch (error) {
          console.error('Error fetching product sizes:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleProductChange:', error);
    }
  };

  // Handle service change
  const handleServiceChange = (index, serviceId) => {
    const service = services.find(s => s.id.toString() === serviceId);
    if (service) {
      updateService(index, 'service', serviceId);
      updateService(index, 'unit_price', service.price?.toString() || '0');
    }
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const itemsSubtotal = formData.items.reduce((total, item) => {
      return total + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);

    const servicesSubtotal = formData.services.reduce((total, service) => {
      return total + (parseFloat(service.quantity || 0) * parseFloat(service.unit_price || 0));
    }, 0);

    const subtotal = itemsSubtotal + servicesSubtotal;
    const totalDiscount = parseFloat(formData.discount_amount) || 0;
    const addOnCharges = parseFloat(formData.add_on_charges) || 0;
    const total = subtotal - totalDiscount + addOnCharges;
    const paidAmount = parseFloat(formData.paid_amount) || 0;
    const balanceAmount = Math.max(total - paidAmount, 0);

    setTotals({
      subtotal,
      totalDiscount,
      addOnCharges,
      total,
      paidAmount,
      balanceAmount
    });

    // Update balance amount in form data
    updateFormData('balance_amount', balanceAmount.toFixed(2));
  }, [formData]);

  // Recalculate totals when form data changes
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.services, formData.discount_amount, formData.add_on_charges, formData.paid_amount]);

  const handleSelectProduct = (index, productId) => {
    const selectedProduct = products.find(p => p.id.toString() === productId);
    if (selectedProduct) {
      updateItem(index, 'product', productId);
      updateItem(index, 'unit_price', selectedProduct.price?.toString() || "0.00");
      updateItem(index, 'quantity', item.quantity || "1"); // default to 1 if empty
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.account) {
        Alert.alert('Error', 'Please select a customer account');
        return;
      }
      if (!formData.sales_account) {
        Alert.alert('Error', 'Please select a sales account');
        return;
      }
      if (formData.items.some(item => !item.product)) {
        Alert.alert('Error', 'Please select products for all items');
        return;
      }
      if (formData.payment_method === 'bank' && !formData.bank_account) {
        Alert.alert('Error', 'Please select a bank account for bank payments');
        return;
      }

      setIsSubmitting(true);

      // Calculate totals for submission
      const itemsTotal = formData.items.reduce((total, item) => {
        return total + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      }, 0);

      const servicesTotal = formData.services.reduce((total, service) => {
        return total + (parseFloat(service.quantity) || 0) * (parseFloat(service.unit_price) || 0);
      }, 0);

      const totalAmount = itemsTotal + servicesTotal;
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const addOnCharges = parseFloat(formData.add_on_charges) || 0;
      const netTotal = totalAmount - discountAmount + addOnCharges;
      const paidAmount = formData.payment_method === 'credit' ? 0 : parseFloat(formData.paid_amount) || 0;

      // Determine payment status
      let paymentStatus = 'UNPAID';
      if (paidAmount === netTotal) {
        paymentStatus = 'PAID';
      } else if (paidAmount > 0 && paidAmount < netTotal) {
        paymentStatus = 'PARTIALLY_PAID';
      }

      const submissionData = {
        ...formData,
        status: 'COMPLETED',
        payment_status: paymentStatus,
        total_amount: totalAmount,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        })),
        services: formData.services.map(service => ({
          ...service,
          quantity: Number(service.quantity),
          unit_price: Number(service.unit_price)
        }))
      };

      const response = await axiosInstance.post('/sales/', submissionData);
      
      Alert.alert('Success', 'Sale created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to create sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search filter function
  const filterItems = (items, query, searchFields) => {
    if (!query) return items;
    return items.filter(item => 
      searchFields.some(field => 
        item[field]?.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  // Render picker modal
  const renderPickerModal = (visible, onClose, items, onSelect, titleKey = 'name', searchFields = ['name']) => {
    const filtered = filterItems(items, searchQuery, searchFields);
    
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.modalContainer, { backgroundColor: extendedTheme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: extendedTheme.colors.card, borderBottomColor: extendedTheme.colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={extendedTheme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: extendedTheme.colors.text }]}>Select Item</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <TextInput
            style={[styles.searchInput, { 
              borderColor: extendedTheme.colors.border, 
              color: extendedTheme.colors.inputText,
              backgroundColor: extendedTheme.colors.inputBackground
            }]}
            placeholder="Search..."
            placeholderTextColor={extendedTheme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { 
                  backgroundColor: extendedTheme.colors.card,
                  borderBottomColor: extendedTheme.colors.border 
                }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.pickerItemText, { color: extendedTheme.colors.text }]}>{item[titleKey]}</Text>
                {item.sku && <Text style={[styles.pickerItemSku, { color: extendedTheme.colors.secondaryText }]}>SKU: {item.sku}</Text>}
                {item.selling_price && (
                  <Text style={[styles.pickerItemPrice, { color: '#059669' }]}>Price: QAR {item.selling_price}</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: extendedTheme.colors.background }]}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={[styles.loadingText, { color: extendedTheme.colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: extendedTheme.colors.background }}>
      <ScrollView style={[styles.container, { backgroundColor: extendedTheme.colors.background }]}>
        <View style={[styles.header, { 
          backgroundColor: extendedTheme.colors.card, 
          borderBottomColor: extendedTheme.colors.border 
        }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color="#6B46C1" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: extendedTheme.colors.text }]}>New Sale</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.form, { backgroundColor: extendedTheme.colors.background }]}>
          {/* Customer Account Selection */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Customer Account *</Text>
            <TouchableOpacity
              style={[styles.picker, { 
                borderColor: extendedTheme.colors.border,
                backgroundColor: extendedTheme.colors.inputBackground
              }]}
              onPress={() => setShowAccountPicker(true)}
            >
              <Text style={[styles.pickerText, { color: extendedTheme.colors.inputText }]}>
                {formData.account 
                  ? (() => {
                      const account = accounts.find(a => a.id.toString() === formData.account);
                      return account 
                        ? `${account.name} (${account.client.mobile_number})` 
                        : 'Select account';
                    })()
                  : 'Select customer account'
                }
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color={extendedTheme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
      style={styles.addCustomerButton}
      onPress={() => setShowAddCustomerModal(true)}
    >
      <Icon name="add" size={22} color="#fff" />
    </TouchableOpacity>
   <Modal
  visible={showAddCustomerModal}
  animationType="slide"
  onRequestClose={() => setShowAddCustomerModal(false)}
>
  <ScrollView 
    contentContainerStyle={[
      styles.modalContainer, 
      { backgroundColor: extendedTheme.colors.background }
    ]}
  >
    {/* Header */}
    <View style={[styles.modalHeader, { backgroundColor: extendedTheme.colors.card }]}>
      <Text style={[styles.modalTitle, { color: extendedTheme.colors.text }]}>
        Add Customer
      </Text>
      <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
        <Icon name="close" size={24} color={extendedTheme.colors.text} />
      </TouchableOpacity>
    </View>

    {/* Company Name */}
    {/* <TextInput
      placeholder="Company Name"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.company_name}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, company_name: text }))}
    /> */}

    {/* Customer Name */}
    <TextInput
      placeholder="Customer Name *"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.name}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, name: text }))}
    />

    {/* Opening Balance */}
    <TextInput
      placeholder="Opening Balance"
      keyboardType="numeric"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.opening_balance}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, opening_balance: text }))}
    />

    {/* Mobile Number */}
    <TextInput
      placeholder="Mobile Number *"
      keyboardType="phone-pad"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.mobile_number}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, mobile_number: text }))}
    />

    {/* WhatsApp Number */}
    <TextInput
      placeholder="WhatsApp Number"
      keyboardType="phone-pad"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.whatsapp_number}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, whatsapp_number: text }))}
    />

    {/* Email */}
    <TextInput
      placeholder="Email"
      keyboardType="email-address"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.email}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, email: text }))}
    />

    {/* Country */}
    <TextInput
      placeholder="Country *"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.country}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, country: text }))}
    />

    {/* City */}
    <TextInput
      placeholder="City *"
      placeholderTextColor={extendedTheme.colors.placeholder}
      style={[styles.input, { backgroundColor: extendedTheme.colors.inputBackground, color: extendedTheme.colors.inputText }]}
      value={newCustomer.city}
      onChangeText={(text) => setNewCustomer((prev) => ({ ...prev, city: text }))}
    />

    {/* Submit Button */}
    <TouchableOpacity
      style={styles.submitButtonC}
      onPress={async () => {
        try {
          if (!newCustomer.name || !newCustomer.mobile_number || !newCustomer.country || !newCustomer.city) {
            Alert.alert("Error", "Please fill all required fields");
            return;
          }

         const response = await axiosInstance.post("/clients/", {
  company_name: newCustomer.company_name || "",
  name: newCustomer.name,
  opening_balance: newCustomer.opening_balance || 0,
  mobile_number: newCustomer.mobile_number,
  whatsapp_number: newCustomer.whatsapp_number || "",
  email: newCustomer.email || "",
  country: newCustomer.country || "qatar",
  city: newCustomer.city || "Doha",
  group: accounts[0]?.group, // default group
  is_automotive: true,
  vehicle_model: "N/A",
  vehicle_number: "N/A",
});


          await loadData();
          updateFormData("account", response.data.id.toString());
          setShowAddCustomerModal(false);
          setNewCustomer({
            company_name: "",
            name: "",
            opening_balance: "",
            mobile_number: "",
            whatsapp_number: "",
            email: "",
            country: "qatar",
            city: "Doha",
          });
          Alert.alert("Success", "Customer added successfully");
        } catch (error) {
          console.error("Error adding customer:", error.response?.data || error);
          Alert.alert("Error", "Failed to add customer");
        }
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "600" }}>Save Customer</Text>
    </TouchableOpacity>
  </ScrollView>
</Modal>


          </View>
{/* Date and Time Selection */}
<View style={styles.fieldContainer}>
  <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Sale Date & Time *</Text>
  
  {/* Date Selection */}
  <TouchableOpacity
    style={[styles.picker, { 
      borderColor: extendedTheme.colors.border,
      backgroundColor: extendedTheme.colors.inputBackground,
      marginBottom: 10
    }]}
    onPress={() => setShowDatePicker(true)}
  >
    <Icon name="event" size={20} color={extendedTheme.colors.text} style={{ marginRight: 8 }} />
    <Text style={[styles.pickerText, { color: extendedTheme.colors.inputText, flex: 1 }]}>
      {new Date(formData.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })}
    </Text>
    <Icon name="keyboard-arrow-down" size={24} color={extendedTheme.colors.text} />
  </TouchableOpacity>

  {/* Time Selection */}
  <TouchableOpacity
    style={[styles.picker, { 
      borderColor: extendedTheme.colors.border,
      backgroundColor: extendedTheme.colors.inputBackground
    }]}
    onPress={() => setShowTimePicker(true)}
  >
    <Icon name="access-time" size={20} color={extendedTheme.colors.text} style={{ marginRight: 8 }} />
    <Text style={[styles.pickerText, { color: extendedTheme.colors.inputText, flex: 1 }]}>
      {new Date(formData.date).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}
    </Text>
    <Icon name="keyboard-arrow-down" size={24} color={extendedTheme.colors.text} />
  </TouchableOpacity>

  {/* Date Picker Modal */}
  {showDatePicker && (
    <DateTimePicker
      value={new Date(formData.date)}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate && event.type !== 'dismissed') {
          // Get the current time part from formData
          const currentDateTime = new Date(formData.date);
          
          // Create new date with new date but current time
          const newDateTime = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            currentDateTime.getHours(),
            currentDateTime.getMinutes()
          );
          
          // Format to YYYY-MM-DDTHH:MM in local time (not UTC)
          const year = newDateTime.getFullYear();
          const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
          const day = String(newDateTime.getDate()).padStart(2, '0');
          const hours = String(newDateTime.getHours()).padStart(2, '0');
          const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
          const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
          updateFormData('date', formattedDateTime);
        }
      }}
    />
  )}

  {/* Time Picker Modal */}
  {showTimePicker && (
    <DateTimePicker
      value={new Date(formData.date)}
      mode="time"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime && event.type !== 'dismissed') {
          // Get the current date part from formData
          const currentDateTime = new Date(formData.date);
          
          // Create new date with current date but new time
          const newDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes()
          );
          
          // Format to YYYY-MM-DDTHH:MM in local time (not UTC)
          const year = newDateTime.getFullYear();
          const month = String(newDateTime.getMonth() + 1).padStart(2, '0');
          const day = String(newDateTime.getDate()).padStart(2, '0');
          const hours = String(newDateTime.getHours()).padStart(2, '0');
          const minutes = String(newDateTime.getMinutes()).padStart(2, '0');
          const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
          updateFormData('date', formattedDateTime);
        }
      }}
    />
  )}
</View>
          {/* Sales Account Selection */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Sales Account *</Text>
            <View style={[styles.pickerContainer, { 
              borderColor: extendedTheme.colors.border,
              backgroundColor: extendedTheme.colors.inputBackground
            }]}>
              <Picker
                selectedValue={formData.sales_account}
                onValueChange={(value) => updateFormData('sales_account', value)}
                style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                dropdownIconColor={extendedTheme.colors.text}
              >
                <Picker.Item label="Select sales account" value="" />
                {salesAccounts.map((account) => (
                  <Picker.Item
                    key={account.id}
                    label={account.name}
                    value={account.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Payment Method</Text>
            <View style={[styles.pickerContainer, { 
              borderColor: extendedTheme.colors.border,
              backgroundColor: extendedTheme.colors.inputBackground
            }]}>
              <Picker
                selectedValue={formData.payment_method}
                onValueChange={(value) => updateFormData('payment_method', value)}
                style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                dropdownIconColor={extendedTheme.colors.text}
              >
                <Picker.Item label="Cash" value="cash" />
                <Picker.Item label="Bank" value="bank" />
                <Picker.Item label="Credit" value="credit" />
              </Picker>
            </View>
          </View>

          {/* Bank Account (if bank payment) */}
          {formData.payment_method === 'bank' && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Bank Account *</Text>
              <View style={[styles.pickerContainer, { 
                borderColor: extendedTheme.colors.border,
                backgroundColor: extendedTheme.colors.inputBackground
              }]}>
                <Picker
                  selectedValue={formData.bank_account}
                  onValueChange={(value) => updateFormData('bank_account', value)}
                  style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                  dropdownIconColor={extendedTheme.colors.text}
                >
                  <Picker.Item label="Select bank account" value="" />
                  {bankAccounts.map((account) => (
                    <Picker.Item
                      key={account.id}
                      label={account.name}
                      value={account.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Products Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: extendedTheme.colors.text }]}>Products</Text>

            {formData.items.map((item, index) => (
              <View key={index} style={[styles.itemContainer, { 
                backgroundColor: extendedTheme.colors.card,
                borderColor: extendedTheme.colors.border 
              }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, { color: extendedTheme.colors.text }]}>Product {index + 1}</Text>
                  {formData.items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Icon name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Product Selection */}
                <TouchableOpacity
                  style={[styles.picker, { 
                    borderColor: extendedTheme.colors.border,
                    backgroundColor: extendedTheme.colors.inputBackground
                  }]}
                  onPress={() => setShowProductPicker({ show: true, index })}
                >
                  <Text style={[styles.pickerText, { color: extendedTheme.colors.inputText }]}>
                    {item.product
                      ? products.find(p => p.id.toString() === item.product)?.name || 'Select product'
                      : 'Select product'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color={extendedTheme.colors.text} />
                </TouchableOpacity>

                {/* Product Size Selection (if applicable) */}
                {item.product && productSizes[item.product]?.length > 0 && (
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Size *</Text>
                    <View style={[styles.pickerContainer, { 
                      borderColor: extendedTheme.colors.border,
                      backgroundColor: extendedTheme.colors.inputBackground
                    }]}>
                      <Picker
                        selectedValue={item.sizes[0]?.product_size?.toString() || ''}
                        onValueChange={(value) => {
                          if (value) {
                            updateItem(index, 'sizes', [{
                              product_size: parseInt(value),
                              quantity: item.quantity
                            }]);
                          }
                        }}
                        style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                        dropdownIconColor={extendedTheme.colors.text}
                      >
                        <Picker.Item label="Select size" value="" />
                        {productSizes[item.product].map((size) => (
                          <Picker.Item
                            key={size.id}
                            label={size.size_name}
                            value={size.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}

                <View style={styles.rowContainer}>
                  {/* Quantity */}
                  <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Quantity</Text>
                    <TextInput
                      style={[styles.input, { 
                        borderColor: extendedTheme.colors.border,
                        color: extendedTheme.colors.inputText,
                        backgroundColor: extendedTheme.colors.inputBackground
                      }]}
                      value={item.quantity?.toString() || ''}
                      onChangeText={(value) => updateItem(index, 'quantity', value)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={extendedTheme.colors.placeholder}
                    />
                  </View>

                  {/* Unit Price */}
                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Unit Price</Text>
                    <TextInput
                      style={[styles.input, { 
                        borderColor: extendedTheme.colors.border,
                        color: extendedTheme.colors.inputText,
                        backgroundColor: extendedTheme.colors.inputBackground
                      }]}
                      value={item.unit_price?.toString() || ''}
                      onChangeText={(value) => updateItem(index, 'unit_price', value)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={extendedTheme.colors.placeholder}
                    />
                  </View>
                </View>

                {/* Item Total */}
                <Text style={[styles.itemTotal, { color: '#6B46C1' }]}>
                  Total: QAR {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                </Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.addButton, { 
              borderColor: '#6B46C1',
              backgroundColor: extendedTheme.colors.card
            }]} onPress={addItem}>
              <Icon name="add" size={20} color="#6B46C1" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {/* Services Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: extendedTheme.colors.text }]}>Services</Text>
            {formData.services.map((service, index) => (
              <View key={index} style={[styles.itemContainer, { 
                backgroundColor: extendedTheme.colors.card,
                borderColor: extendedTheme.colors.border 
              }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, { color: extendedTheme.colors.text }]}>Service {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeService(index)}>
                    <Icon name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Service Category */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Category *</Text>
                  <View style={[styles.pickerContainer, { 
                    borderColor: extendedTheme.colors.border,
                    backgroundColor: extendedTheme.colors.inputBackground
                  }]}>
                    <Picker
                      selectedValue={service.category}
                      onValueChange={(value) => {
                        updateService(index, 'category', value);
                        updateService(index, 'service', ''); // Reset service when category changes
                      }}
                      style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                      dropdownIconColor={extendedTheme.colors.text}
                    >
                      <Picker.Item label="Select category" value="" />
                      {serviceCategories.map((category) => (
                        <Picker.Item
                          key={category.id}
                          label={category.name}
                          value={category.id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Service */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Service *</Text>
                  <View style={[styles.pickerContainer, { 
                    borderColor: extendedTheme.colors.border,
                    backgroundColor: extendedTheme.colors.inputBackground
                  }]}>
                    <Picker
                      selectedValue={service.service}
                      onValueChange={(value) => handleServiceChange(index, value)}
                      style={[styles.nativePicker, { color: extendedTheme.colors.text }]}
                      enabled={!!service.category}
                      dropdownIconColor={extendedTheme.colors.text}
                    >
                      <Picker.Item label="Select service" value="" />
                      {services
                        .filter(s => s.service_category?.toString() === service.category)
                        .map((serviceItem) => (
                          <Picker.Item
                            key={serviceItem.id}
                            label={serviceItem.name}
                            value={serviceItem.id.toString()}
                          />
                        ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.rowContainer}>
                  {/* Quantity */}
                  <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Quantity</Text>
                    <TextInput
                      style={[styles.input, { 
                        borderColor: extendedTheme.colors.border,
                        color: extendedTheme.colors.inputText,
                        backgroundColor: extendedTheme.colors.inputBackground
                      }]}
                      value={service.quantity}
                      onChangeText={(value) => updateService(index, 'quantity', value)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={extendedTheme.colors.placeholder}
                    />
                  </View>

                  {/* Unit Price */}
                  <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Unit Price</Text>
                    <TextInput
                      style={[styles.input, { 
                        borderColor: extendedTheme.colors.border,
                        color: extendedTheme.colors.inputText,
                        backgroundColor: extendedTheme.colors.inputBackground
                      }]}
                      value={service.unit_price}
                      onChangeText={(value) => updateService(index, 'unit_price', value)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={extendedTheme.colors.placeholder}
                    />
                  </View>
                </View>

                {/* Service Notes */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { 
                      borderColor: extendedTheme.colors.border,
                      color: extendedTheme.colors.inputText,
                      backgroundColor: extendedTheme.colors.inputBackground
                    }]}
                    value={service.notes}
                    onChangeText={(value) => updateService(index, 'notes', value)}
                    placeholder="Optional notes"
                    placeholderTextColor={extendedTheme.colors.placeholder}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <Text style={[styles.itemTotal, { color: '#6B46C1' }]}>
                  Total: QAR {((parseFloat(service.quantity) || 0) * (parseFloat(service.unit_price) || 0)).toFixed(2)}
                </Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.addButton, { 
              borderColor: '#6B46C1',
              backgroundColor: extendedTheme.colors.card
            }]} onPress={addService}>
              <Icon name="add" size={20} color="#6B46C1" />
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Fields */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Discount Amount</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: extendedTheme.colors.border,
                color: extendedTheme.colors.inputText,
                backgroundColor: extendedTheme.colors.inputBackground
              }]}
              value={formData.discount_amount}
              onChangeText={(value) => updateFormData('discount_amount', value)}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={extendedTheme.colors.placeholder}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Paid Amount</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: extendedTheme.colors.border,
                color: extendedTheme.colors.inputText,
                backgroundColor: extendedTheme.colors.inputBackground
              }]}
              value={formData.payment_method === 'credit' ? '0' : formData.paid_amount}
              onChangeText={(value) => updateFormData('paid_amount', value)}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={extendedTheme.colors.placeholder}
              editable={formData.payment_method !== 'credit'}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: extendedTheme.colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: extendedTheme.colors.border,
                color: extendedTheme.colors.inputText,
                backgroundColor: extendedTheme.colors.inputBackground
              }]}
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="Enter any additional notes"
              placeholderTextColor={extendedTheme.colors.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Totals Summary */}
          <View style={[styles.totalsContainer, { 
            backgroundColor: extendedTheme.colors.card,
            borderColor: extendedTheme.colors.border 
          }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: extendedTheme.colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: extendedTheme.colors.text }]}>QAR {totals.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: extendedTheme.colors.text }]}>Discount:</Text>
              <Text style={[styles.totalValue, { color: extendedTheme.colors.text }]}>QAR {totals.totalDiscount.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: extendedTheme.colors.text }]}>Add-on Charges:</Text>
              <Text style={[styles.totalValue, { color: extendedTheme.colors.text }]}>QAR {totals.addOnCharges.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowBold]}>
              <Text style={[styles.totalLabel, styles.totalLabelBold, { color: extendedTheme.colors.text }]}>Total:</Text>
              <Text style={[styles.totalValue, styles.totalValueBold, { color: extendedTheme.colors.text }]}>QAR {totals.total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: extendedTheme.colors.text }]}>Paid Amount:</Text>
              <Text style={[styles.totalValue, { color: extendedTheme.colors.text }]}>QAR {totals.paidAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowBold]}>
              <Text style={[styles.totalLabel, styles.totalLabelBold, { color: extendedTheme.colors.text }]}>Balance:</Text>
              <Text style={[styles.totalValue, styles.totalValueBold, { color: extendedTheme.colors.text }]}>QAR {totals.balanceAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Sale</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modals */}
        {renderPickerModal(
          showAccountPicker,
          () => setShowAccountPicker(false),
          accounts,
          (account) => updateFormData('account', account.id.toString()),
          'name',
          ['name']
        )}

        {renderPickerModal(
          showProductPicker.show,
          () => setShowProductPicker({ show: false, index: -1 }),
          products,
          (product) => handleProductChange(showProductPicker.index, product.id.toString()),
          'name',
          ['name', 'sku']
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:38,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  nativePicker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B46C1',
  },
  totalsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalRowBold: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
  },
  totalLabelBold: {
    fontWeight: '600',
  },
  totalValueBold: {
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemSku: {
    fontSize: 12,
    marginTop: 2,
  },
  pickerItemPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  addCustomerButton: {
  backgroundColor: "#6B46C1",
  padding: 10,
  borderRadius: 8,
  marginTop:4,
},

input: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 12,
  marginVertical: 8,
  fontSize: 16,
},

submitButtonC: {
  marginTop: 16,
  backgroundColor: "#6B46C1",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
},

});

export default SalesScreen;