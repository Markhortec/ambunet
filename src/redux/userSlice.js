// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

// Async thunk to fetch user data from AsyncStorage
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async () => {
    try {
      const storedUserProfile = await AsyncStorage.getItem('userProfile');
      if (storedUserProfile) {
        return JSON.parse(storedUserProfile);
      }
      return null;
    } catch (error) {
      throw new Error('Failed to load user data');
    }
  }
);

// Async thunk to handle user sign out
export const signOutUser = createAsyncThunk(
  'user/signOutUser',
  async () => {
    try {
      await auth().signOut();
      await AsyncStorage.removeItem('userProfile');
      return true;
    } catch (error) {
      throw new Error('Failed to sign out');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    uid: null,
    phoneNumber: null,
    name: null,
    email: null,
    role: null,
    confirmResult: null,
    status: 'idle', // Loading state for async operations
    error: null,
    userStatus: 'active', // New field: User account status (default: 'active')
    message: '', // New field: Additional message (default: empty string)
  },
  reducers: {
    setConfirmResult: (state, action) => {
      state.confirmResult = action.payload.verificationId;
    },
    setUserInfo: (state, action) => {
      const { uid, phoneNumber, name, email, role, userStatus, message } = action.payload; // Destructure new fields
      state.uid = uid || state.uid;
      state.phoneNumber = phoneNumber || state.phoneNumber;
      state.name = name || state.name;
      state.email = email || state.email;
      state.role = role || state.role;
      state.userStatus = userStatus || 'active'; // Default to 'active' if not provided
      state.message = message || ''; // Default to empty string if not provided
    },
    clearUserInfo: (state) => {
      state.uid = null;
      state.phoneNumber = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.confirmResult = null;
      state.userStatus = 'active'; // Reset to default
      state.message = ''; // Reset to default
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { name, uid, phoneNumber, email, role, userStatus, message } = action.payload || {}; // Destructure new fields
        state.name = name || null;
        state.uid = uid || null;
        state.phoneNumber = phoneNumber || null;
        state.email = email || null;
        state.role = role || null;
        state.userStatus = userStatus || 'active'; // Default to 'active' if not provided
        state.message = message || ''; // Default to empty string if not provided
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.uid = null;
        state.phoneNumber = null;
        state.name = null;
        state.email = null;
        state.role = null;
        state.confirmResult = null;
        state.userStatus = 'active'; // Reset to default
        state.message = ''; // Reset to default
        state.status = 'idle';
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setConfirmResult, setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;