import React, { useCallback, useEffect, useState } from "react";
import { View, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import HomeMap from "../../../components/user/HomeMap";
import InitialMessage from "../../../components/user/InitialMessage";
import HomeSearch from "../../../components/user/HomeSearch";
import { useSelector, useDispatch } from "react-redux";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setOrderData, resetOrderData } from "../../../redux/orderSlice";
import {  setUserInfo } from "../../../redux/userSlice";


const HomeScreen = ({ navigation }) => {
  const orderId = useSelector((state) => state.order.orderId);
  const userId = useSelector((state) => state.user.uid);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("User ID from Redux state:", userId);
        if (userId) {
          const db = getFirestore();
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);
          // console.log("User document data:", userDoc.data());
          const userData = userDoc.data();
          // console.log("User data fetched:", userData);
          dispatch(setUserInfo({
            uid: userId,
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber, // Make sure this matches your Firestore field
            role: userData.role,
            userStatus: userData.userStatus,
            message: userData.message
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId, dispatch]);

  useEffect(() => {
    const fetchOrderIdFromStorage = async () => {
      const storedOrderId = await AsyncStorage.getItem("orderId");
      if (storedOrderId) {
        dispatch(setOrderData(storedOrderId));
      }
    };

    fetchOrderIdFromStorage();
  }, [dispatch]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      setLoading(true);
      try {
        const db = getFirestore();
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists) {
          const orderData = orderDoc.data();

          if (orderData.status === "Pending") {
            const originPlace = {
              details: {
                geometry: {
                  location: {
                    lat: orderData.route.origin.latitude,
                    lng: orderData.route.origin.longitude,
                  },
                },
                formatted_address: orderData.route.origin.name,
              },
            };

            const destinationPlace = {
              details: {
                geometry: {
                  location: {
                    lat: orderData.route.destination.latitude,
                    lng: orderData.route.destination.longitude,
                  },
                },
                formatted_address: orderData.route.destination.name,
              },
            };

            navigation.navigate("OrderScreen", {
              id: orderId,
              originPlace,
              destinationPlace,
              originName: orderData.route.origin.name,
              destinationName: orderData.route.destination.name,
              distance: orderData.route.distance,
              price: orderData.vehicle.price,
            });
          } else if (orderData.status === "In Progress") {
            navigation.navigate("UserTrack", { orderId: orderId });
          } else {
            await AsyncStorage.removeItem("orderId");
            dispatch(resetOrderData());
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigation, dispatch]);

  const openDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <HomeMap />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <View style={styles.bottomContainer}>
       
        <InitialMessage />
        <HomeSearch />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  mapContainer: {
    height: Dimensions.get("window").height - 400,
  },
  bottomContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});

export default HomeScreen;