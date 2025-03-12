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
    status: 'idle',
    error: null,
  },
  reducers: {
    setConfirmResult: (state, action) => {
      state.confirmResult = action.payload.verificationId;
    },
    setUserInfo: (state, action) => {
      const { uid, phoneNumber, name, email, role } = action.payload;  // Destructure email as well
      state.uid = uid || state.uid;
      state.phoneNumber = phoneNumber || state.phoneNumber;
      state.name = name || state.name;
      state.email = email || state.email;  // Set email in state
      state.role = role || state.role;  // Set role in state
    },
    clearUserInfo: (state) => {
      state.uid = null;
      state.phoneNumber = null;
      state.name = null;
      state.email = null; 
      state.role = null;  
      state.confirmResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { name, uid, phoneNumber, email, role } = action.payload || {};  // Destructure email and role
        state.name = name || null;
        state.uid = uid || null;
        state.phoneNumber = phoneNumber || null;
        state.email = email || null;  
        state.role = role || null;  
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
