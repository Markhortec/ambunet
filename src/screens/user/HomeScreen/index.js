

import React, { useCallback, useEffect, useState } from "react";
import { View, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import HomeMap from "../../../components/user/HomeMap";
import InitialMessage from "../../../components/user/InitialMessage";
import HomeSearch from "../../../components/user/HomeSearch";
import Logout from "../../../components/owner/Logout";
import { useSelector, useDispatch } from "react-redux";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setOrderData } from "../../../redux/orderSlice";
import { resetOrderData } from "../../../redux/orderSlice";
const HomeScreen = ({ navigation }) => {
  const orderId = useSelector((state) => state.order.orderId);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrderIdFromStorage = async () => {
      // await AsyncStorage.clear();
      const storedOrderId = await AsyncStorage.getItem('orderId');
      if (storedOrderId) {
        dispatch(setOrderData(storedOrderId));
      }
    };

    fetchOrderIdFromStorage();
  }, [dispatch]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        console.log("No Order ID found in Redux.");
        return;
      }
  
      setLoading(true);
      try {
        const db = getFirestore();
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);
  
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          console.log("Fetched Order Details from Firestore:", orderData);
  
          if (orderData.status === "Pending") {
            // Ensure the originPlace and destinationPlace are structured correctly
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
  
            // Log the structured data for debugging
            // console.log("Structured Origin Place:", originPlace);
            // console.log("Structured Destination Place:", destinationPlace);
  
            // Navigate to OrderScreen with the structured data
            navigation.navigate("OrderScreen", {
              id: orderId,
              originPlace: originPlace, // Pass the structured originPlace
              destinationPlace: destinationPlace, // Pass the structured destinationPlace
              originName: orderData.route.origin.name,
              destinationName: orderData.route.destination.name,
              distance: orderData.route.distance,
              price: orderData.vehicle.price,
            });
          }
          else if(orderData.status === "In Progress") {
            // Navigate to UserTrack if the order is accepted.
            navigation.navigate("UserTrack", { orderId: orderId });

          }
          else{
            await AsyncStorage.clear();
             dispatch(resetOrderData());
            console.log("Order is already completed");
          }
        } else {
          console.log("No order found with the given Order ID:", orderId);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrderDetails();
  }, [orderId, navigation]);

  const openDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <HomeMap />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <View style={styles.bottomContainer}>
        <Logout navigation={navigation} />
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