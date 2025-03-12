import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import driverReducer from './driverSlice';
import orderReducer from './orderSlice'
export const store = configureStore({
  reducer: {
    user: userReducer,
    order: orderReducer, 
    driver:driverReducer,
  },
});
