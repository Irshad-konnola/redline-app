// /* eslint-disable no-useless-catch */
// import { setTokenExpired } from "@/features/slices/authSlice";
// import store from "@/features/store";
import axios from "axios";

export const api = axios.create({
  baseURL: 'https://admin-worldwide-motogarage.up.railway.app',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response.status === 401 &&
      error.response.data.messages &&
      error.response.data.messages[0] &&
      error.response.data.messages[0].message === "Token is invalid or expired"
    ) {
      // Dispatch an action to show the token expiration modal
      store.dispatch(setTokenExpired(true));

      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);


export const login = async (credentials) => {
  const response = await api.post("/login/", credentials);
  if (response.data.access && response.data.refresh) {
    localStorage.setItem("token", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);
  }
  return response.data;
};

export const refreshToken = async (refresh) => {
  try {
    const response = await api.post("/refresh/", { refresh });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  const refresh_token = localStorage.getItem('refresh');
  try {
      await api.post("/logout/", { refresh_token });
  } catch (error) {
      console.error("Logout error:", error);
  } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
  }
};

export const fetchClientCompanies = async () => {
  const response = await api.get("/client-companies/");
  return response.data;
};

export const fetchUsers = async () => {
  const response = await api.get("/users/");
  return response.data;
};

export const fetchStoreProducts = async (page = 1, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.category && { category: filters.category }),
      ...(filters.page_size && { page_size: filters.page_size.toString() }),
    });

    const response = await api.get(`/products/`);
    return {
      results: response.data.results,
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchStoreProductsAll = async () => {
  const response = await api.get("/products/?page_size=1000000");
  return response.data;
};

export const searchProducts = async (searchQuery) => {
  try {
    const params = new URLSearchParams({
      search: searchQuery,
      page_size: '20' // Limit results for better performance
    });
    const response = await api.get(`/products/?${params}`);
    return response.data.results;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

export const fetchBranchProducts = async () => {
  const response = await api.get("/branch-products/");
  return response.data;
};

export const fetchStaff = async () => {
  const response = await api.get("/staff/");
  return response.data;
};

export const fetchManagers = async () => {
  const response = await api.get("/branch-managers/");
  return response.data;
};

export const fetchSuppliers = async () => {
  const response = await api.get("/suppliers/");
  return response.data;
};

export const fetchClients = async () => {
  const response = await api.get("/clients/");
  return response.data;
};

export const fetchBranches = async () => {
  const response = await api.get("/branches/");
  return response.data;
};

// Product Request API endpoints
export const fetchProductRequests = async () => {
  const response = await api.get("/product-requests/");
  return response.data;
};

export const refreshProductOutflows = async () => {
  const response = await api.get("/product-outflow/");
  return response.data;
};

// Employee API endpoints
export const fetchEmployees = async () => {
  const response = await api.get("/employees/");
  return response.data;
};

// VPTracking Details
export const fetchVPTrackingList = async () => {
  const response = await api.get("/vptracks/");
  return response.data;
};

// Purchase Request API endpoints
export const fetchPurchaseRequests = async () => {
  const response = await api.get("/purchase-requests/");
  return response.data;
};

export const fetchPurchaseRequest = async (id) => {
  const response = await api.get(`/purchase-requests/${id}/`);
  return response.data;
};

// Local Purchase Order API endpoints
export const fetchLPO = async (id) => {
  const response = await api.get(`/local-purchase-orders/${id}/`);
  return response.data;
};

// Comany Details
export const fetchCompanies = async () => {
  const response = await api.get("/company-details/");
  return response.data;
};

// Vehicle Details
export const fetchVehicles = async () => {
  const response = await api.get("/vehicles/");
  return response.data;
};

// Amc Details
export const fetchAmc = async () => {
  const response = await api.get("/amc/");
  return response.data;
};

// Account Details
export const fetchAccounts = async () => {
  const response = await api.get("/accounts/");
  return response.data;
};

export const fetchAccountGroups = async () => {
  const response = await api.get("/account-groups/");
  return response.data;
};

// Stock Adjustment API endpoints
export const createStockAdjustment = async (data) => {
  try {
    const response = await api.post("/stock-adjustments/", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateStockAdjustment = async (id, data) => {
  try {
    const response = await api.put(`/stock-adjustments/${id}/`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStockAdjustment = async (id) => {
  try {
    const response = await api.get(`/stock-adjustments/${id}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
