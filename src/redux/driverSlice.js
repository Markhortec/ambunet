import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async thunk to fetch driver data from AsyncStorage
export const fetchDriverData = createAsyncThunk(
  'driver/fetchDriverData',
  async () => {
    try {
      const storedDriverProfile = await AsyncStorage.getItem('driverProfile');
      if (storedDriverProfile) {
        return JSON.parse(storedDriverProfile);
      }
      return {}; // Return empty object instead of null to avoid overwriting state with null
    } catch (error) {
      throw new Error('Failed to load driver profile from AsyncStorage');
    }
  }
);

// Async thunk to save driver data to AsyncStorage
export const saveDriverData = createAsyncThunk(
  'driver/saveDriverData',
  async (driverData) => {
    try {
      await AsyncStorage.setItem('driverProfile', JSON.stringify(driverData));
      return driverData;
    } catch (error) {
      throw new Error('Failed to save driver data to AsyncStorage');
    }
  }
);

// Driver slice definition
const driverSlice = createSlice({
  name: 'driver',
  initialState: {
    driverId: null,
    phoneNumber: null,
    name: null,
    email: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    // Update driver information
    setDriverInfo: (state, action) => {
      const { driverId, phoneNumber, name, email } = action.payload;
      state.driverId = driverId || state.driverId;
      state.phoneNumber = phoneNumber || state.phoneNumber;
      state.name = name || state.name;
      state.email = email || state.email;
    },
    // Clear driver information
    clearDriverInfo: (state) => {
      state.driverId = null;
      state.phoneNumber = null;
      state.name = null;
      state.email = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriverData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDriverData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { driverId, phoneNumber, name, email } = action.payload || {};
        state.driverId = driverId || null;
        state.phoneNumber = phoneNumber || null;
        state.name = name || null;
        state.email = email || null;
      })
      .addCase(fetchDriverData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(saveDriverData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { driverId, phoneNumber, name, email } = action.payload;
        state.driverId = driverId;
        state.phoneNumber = phoneNumber;
        state.name = name;
        state.email = email;
      })
      .addCase(saveDriverData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setDriverInfo, clearDriverInfo } = driverSlice.actions;
export default driverSlice.reducer;
