import axios from 'axios';
import {
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import app from './firebaseConfig';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

const auth = getAuth(app);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to refresh token before each request
// CRITICAL FIX: Ensure Authorization header is ALWAYS set for authenticated requests
api.interceptors.request.use(
  async (config) => {
    // CRITICAL: Always try to get fresh token from Firebase Auth
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        // Get fresh token from Firebase Auth (this ensures token is not expired)
        const token = await currentUser.getIdToken();
        
        // CRITICAL: Set Authorization header with Bearer token
        config.headers.Authorization = `Bearer ${token}`;
        setAuthToken(token);
        
        console.log(`✅ Request interceptor: Token set for ${config.url} (length: ${token.length})`);
      } catch (error) {
        console.error('❌ Error getting token from Firebase Auth:', error);
        // If token refresh fails, try to use stored token as fallback
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
          console.log(`⚠️ Using stored token as fallback for ${config.url}`);
        } else {
          console.error(`❌ No token available for ${config.url}`);
        }
      }
    } else {
      // If no current user, try to use stored token
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
        console.log(`⚠️ No current user, using stored token for ${config.url}`);
      } else {
        console.warn(`⚠️ No token available for ${config.url} - request may fail with 401`);
      }
    }
    
    // CRITICAL: Ensure Authorization header exists (for debugging)
    if (!config.headers.Authorization) {
      console.error(`❌ Authorization header missing for ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, try to refresh
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true); // Force refresh
          setAuthToken(token);
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, clear auth
          setAuthToken(null);
          await signOut(auth);
          window.location.href = '/';
        }
      } else {
        // No current user, clear token
        setAuthToken(null);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Firebase Authentication Functions
 */

/**
 * Login user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Firebase UserCredential
 */
export const loginUser = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting to login with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login successful:', userCredential.user.email);
    
    // Get ID token immediately after login
    const token = await userCredential.user.getIdToken();
    setAuthToken(token);
    console.log('✅ ID Token obtained and stored');
    
    return userCredential;
  } catch (error: any) {
    console.error('❌ Login failed:', error.code, error.message);
    
    // Enhanced error messages
    if (error.code === 'auth/invalid-credential') {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('ไม่พบผู้ใช้ในระบบ');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Firebase API Key ไม่ถูกต้อง กรุณาตรวจสอบไฟล์ .env');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('ไม่สามารถเชื่อมต่อกับ Firebase ได้');
    }
    
    throw error;
  }
};

/**
 * Register new user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Firebase UserCredential
 */
export const registerUser = async (email: string, password: string) => {
  try {
    console.log('📝 Attempting to register with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Registration successful:', userCredential.user.email);
    
    // Get ID token immediately after registration
    const token = await userCredential.user.getIdToken();
    setAuthToken(token);
    console.log('✅ ID Token obtained and stored');
    
    return userCredential;
  } catch (error: any) {
    console.error('❌ Registration failed:', error.code, error.message);
    
    // Enhanced error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Firebase API Key ไม่ถูกต้อง กรุณาตรวจสอบไฟล์ .env');
    }
    
    throw error;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    setAuthToken(null);
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * User Profile API Functions
 */

/**
 * Get current user's profile from Firestore
 * @returns User profile data
 */
export const getMyProfile = async () => {
  try {
    console.log('🔍 Fetching user profile...');
    const response = await api.get('/users/profile');
    console.log('✅ Profile fetched:', response.data.user?.email);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch profile:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Create user profile in Firestore
 * @param profileData - Profile data (name, farmName, role)
 * @returns Created user profile
 */
export const createProfile = async (profileData: {
  name: string;
  farmName?: string;
  role: 'user' | 'admin';
}) => {
  try {
    console.log('📝 Creating user profile...', profileData);
    const response = await api.post('/users/profile', profileData);
    console.log('✅ Profile created:', response.data.user?.email);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to create profile:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Product API Functions
 */

/**
 * Get all products from all users (for Marketplace)
 * This endpoint returns posts from ALL users combined
 * Used in: Marketplace page
 */
export const getAllProducts = () => {
  return api.get('/products/all');
};

/**
 * Get products for the current logged-in user only
 * This endpoint filters by userId - shows only posts belonging to the current user
 * Used in: Profile page, Dashboard
 */
export const getMyProducts = () => {
  return api.get('/products/my-posts');
};

/**
 * Legacy endpoint - kept for backward compatibility
 * Returns all products (same as getAllProducts)
 */
export const getProducts = () => {
  return api.get('/products');
};

export const getProductById = (id: string) => {
  return api.get(`/products/${id}`);
};

export const createProduct = (productData: any) => {
  return api.post('/products', productData);
};

export const updateProduct = (id: string, productData: any) => {
  return api.put(`/products/${id}`, productData);
};

export const deleteProduct = (id: string) => {
  return api.delete(`/products/${id}`);
};

/**
 * Chat API Functions
 */

export const getChatRooms = () => {
  return api.get('/chat');
};

export const getChatMessages = (chatId: string) => {
  return api.get(`/chat/${chatId}/messages`);
};

export const sendChatMessage = (chatId: string, text: string) => {
  return api.post(`/chat/${chatId}/messages`, { text });
};

export const createChatRoom = (productId: string) => {
  return api.post('/chat', { productId });
};

/**
 * Booking API Functions
 */

export const getUserBookings = (userId: string) => {
  return api.get(`/bookings/user/${userId}`);
};

export const createBooking = (bookingData: any) => {
  return api.post('/bookings', bookingData);
};

export const updateBookingStatus = (id: string, status: string) => {
  return api.put(`/bookings/${id}/status`, { status });
};

/**
 * Notification API Functions
 */

export const getNotifications = () => {
  return api.get('/notifications');
};

export const markNotificationAsRead = (id: string) => {
  return api.put(`/notifications/${id}/read`);
};

// Initialize token from localStorage on module load
const token = localStorage.getItem('authToken');
if (token) {
  setAuthToken(token);
}

export default api;
