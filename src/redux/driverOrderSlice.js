import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderId: null, // Only storing the order ID
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // Set the order ID
    setOrderData: (state, action) => {
      state.orderId = action.payload; // Expecting the payload to be the order ID
      console.log("Order ID set in Redux:", state.orderId);
    },

    // Reset the order ID
    resetOrderData: (state) => {
      state.orderId = null;
      console.log("Order ID reset in Redux");
    },
  },
});

export const { setOrderData, resetOrderData } = orderSlice.actions;
export default orderSlice.reducer;