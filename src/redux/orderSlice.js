import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ambulanceRegNo: null,
  assignedDriverId: null,
  orderStatus: 'pending',
  createdAt: null,
  driverLocation: {
    latitude: null,
    longitude: null,
  },
  driverName: '',
  driverPhone: '',
  destLatitude: null,
  destLongitude: null,
  destinationName: '',
  originLatitude: null,
  originLongitude: null,
  originName: '',
  routeDistance: null,
  routeDuration: null,
  vehicleType: '',
  vehiclePrice: null,
  userId: null,
  userName: '',
  userPhone: '',
  userPhoto: '', // Retained but not part of schema
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrderData: (state, action) => {
      const {
        ambulanceRegNo,
        assignedDriverId,
        createdAt,
        driverLocation,
        driverName,
        driverPhone,
        route,
        status,
        user,
        vehicle,
      } = action.payload;

      state.ambulanceRegNo = ambulanceRegNo;
      state.assignedDriverId = assignedDriverId;
      state.createdAt = createdAt;
      state.driverLocation.latitude = driverLocation?.latitude;
      state.driverLocation.longitude = driverLocation?.longitude;
      state.driverName = driverName;
      state.driverPhone = driverPhone;

      // Map route data
      if (route) {
        state.destLatitude = route.destination?.lat;
        state.destLongitude = route.destination?.lng;
        state.destinationName = route.destination?.name;
        state.routeDistance = route.destination?.distance;
        state.routeDuration = route.destination?.duration;

        state.originLatitude = route.origin?.lat;
        state.originLongitude = route.origin?.lng;
        state.originName = route.origin?.name;
      }

      // Map user data
      if (user) {
        state.userId = user.id;
        state.userName = user.name;
        state.userPhone = user.phone;
      }

      // Map vehicle data
      if (vehicle) {
        state.vehicleType = vehicle.type;
        state.vehiclePrice = vehicle.price;
      }

      state.orderStatus = status;
    },
    resetOrderData: (state) => {
      return { ...initialState };
    },
  },
});

export const { setOrderData, resetOrderData } = orderSlice.actions;
export default orderSlice.reducer;