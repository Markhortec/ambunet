// store/userSlice.js

import { createSlice } from '@reduxjs/toolkit';

// Initial State
const initialState = {
  uid: null,
  phoneNumber: null,
  name: null,
  email: null,
  role: null,
  location: null,
  outOfRange: null,
  onDuty: false,
  confirmResult: null,
  status: 'idle',
  error: null,
};

// Create the User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.uid = action.payload.uid;
      state.phoneNumber = action.payload.phoneNumber;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setOnDuty: (state, action) => {
      state.onDuty = action.payload;
    },
    clearData: (state) => {
      return initialState;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

// Export Actions and Reducer
export const { setUser, setLocation, setOnDuty, clearData, setError } = userSlice.actions;
export default userSlice.reducer;
