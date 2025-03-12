import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderId: null,
  orderStatus: 'pending', 
  createdAt: null,
  destLatitude: null,
  destLongitude: null,
  destinationName: '',
  originLatitude: null,
  originLongitude: null,
  originName: '',
  type: '',
  userId: null,
  userName: '',
  userPhone: '',
  userPhoto: '',
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrderData: (state, action) => {
      // Set all order fields from payload
      const {
        orderId,
        status,
        createdAt,
        destLatitude,
        destLongitude,
        destinationName,
        originLatitude,
        originLongitude,
        originName,
        type,
        userId,
        userName,
        userPhone,
        userPhoto,
      } = action.payload;

      state.orderId = orderId;
      state.orderStatus = status;
      state.createdAt = createdAt;
      state.destLatitude = destLatitude;
      state.destLongitude = destLongitude;
      state.destinationName = destinationName;
      state.originLatitude = originLatitude;
      state.originLongitude = originLongitude;
      state.originName = originName;
      state.type = type;
      state.userId = userId;
      state.userName = userName;
      state.userPhone = userPhone;
      state.userPhoto = userPhoto;
    },
    resetOrderData: (state) => {
      
      return { ...initialState };
    },
  },
});

export const { setOrderData, resetOrderData } = orderSlice.actions;
export default orderSlice.reducer;
