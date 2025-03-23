import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PermissionsAndroid,
  Image,
  ScrollView,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import Logout from "../../../components/owner/Logout";

const DHomeScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timer, setTimer] = useState(60);
  const [businessBalance, setBusinessBalance] = useState(0);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const storedDriver = await AsyncStorage.getItem("driverData");
      if (!storedDriver) {
        console.error("Driver data not found in AsyncStorage");
        return;
      }
      const parsedDriver = JSON.parse(storedDriver);
      const { driverId, phoneNumber } = parsedDriver;
      if (phoneNumber && driverId) {
        const driverDoc = await firestore().collection("drivers").doc(driverId).get();
        if (driverDoc.exists) {
          const driverData = { id: driverId, ...driverDoc.data() };
          setDriverData(driverData);
          requestLocationPermission();
          fetchBusinessBalance(driverData.companyId); // Fetch business balance
        } else {
          console.error("Driver not found in Firestore");
        }
      } else {
        console.error("Driver phone number or ID not found in AsyncStorage");
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const fetchBusinessBalance = async (companyId) => {
    try {
      const businessDoc = await firestore().collection("businesses").doc(companyId).get();
      if (businessDoc.exists) {
        const businessData = businessDoc.data();
        setBusinessBalance(businessData.balance || 0);
      } else {
        console.error("Business not found in Firestore");
      }
    } catch (error) {
      console.error("Error fetching business balance:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app requires access to your location.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        fetchCurrentLocation();
      } else {
        console.warn("Location permission denied");
      }
    } catch (err) {
      console.warn("Permission request error:", err);
    }
  };

  const fetchCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };
        setCurrentLocation(location);
        updateDriverLocationInFirestore(latitude, longitude);
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const updateDriverLocationInFirestore = async (latitude, longitude) => {
    if (!driverData || !driverData.assignedAmbulance) return;

    try {
      const ambulanceDoc = await firestore()
        .collection("ambulances")
        .doc(driverData.assignedAmbulance)
        .get();

      if (ambulanceDoc.exists) {
        const ambulanceData = ambulanceDoc.data();
        const ambulanceRegNo = ambulanceData?.registrationNumber || "N/A";

        await firestore()
          .collection("duty")
          .doc(driverData.id)
          .set(
            {
              name: driverData.name || "N/A",
              phone: driverData.phoneNumber || "N/A",
              ambulanceRegNo: ambulanceRegNo,
              latitude: latitude || 0,
              longitude: longitude || 0,
              status: isOnline ? "Online" : "Offline",
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        console.log("Driver location and status updated successfully!");
      } else {
        console.error("Ambulance not found in Firestore.");
      }
    } catch (error) {
      console.error("Error updating driver location in Firestore:", error);
    }
  };

  const updateDriverStatusInFirestore = async (status) => {
    if (!driverData || !currentLocation) return;

    try {
      const ambulanceDoc = await firestore()
        .collection("ambulances")
        .doc(driverData.assignedAmbulance)
        .get();

      if (ambulanceDoc.exists) {
        const ambulanceData = ambulanceDoc.data();
        const ambulanceRegNo = ambulanceData?.registrationNumber || "N/A";

        await firestore()
          .collection("duty")
          .doc(driverData.id)
          .set(
            {
              name: driverData.name || "N/A",
              phone: driverData.phoneNumber || "N/A",
              ambulanceRegNo: ambulanceRegNo,
              latitude: currentLocation.latitude || 0,
              longitude: currentLocation.longitude || 0,
              status: status ? "Online" : "Offline",
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        console.log("Driver status updated successfully!");
      } else {
        console.error("Ambulance not found in Firestore.");
      }
    } catch (error) {
      console.error("Error updating driver status in Firestore:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .where("status", "==", "Pending")
      .onSnapshot(
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(fetchedOrders);
          setLoading(false);
          if (fetchedOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(fetchedOrders[0]);
            setTimer(60);
          }
        },
        (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [isOnline, selectedOrder]);

  useEffect(() => {
    let interval;
    if (selectedOrder) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setSelectedOrder(null);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedOrder]);

  const toggleOnlineStatus = () => {
    setIsOnline((prev) => {
      const newStatus = !prev;
      updateDriverStatusInFirestore(newStatus);
      return newStatus;
    });
  };

  const acceptOrder = async (order) => {
    try {
      await firestore().collection("orders").doc(order.id).update({
        status: "In Progress",
        driverName: driverData.name,
        driverPhone: driverData.phoneNumber,
        ambulanceRegNo: driverData.assignedAmbulance,
        driverLocation: currentLocation,
        assignedDriverId: driverData.id,
      });
      navigation.navigate("DriverTrack", {
        orderId: order.id,
        orderDetails: {
          id: order.id,
          userName: order.user?.name || "N/A",
          userPhone: order.user?.phone || "N/A",
          originName: order.route?.origin?.name || "N/A",
          destinationName: order.route?.destination?.name || "N/A",
          pickupTime: order.pickupTime || "N/A",
          type: order.type || "N/A",
          price: order.vehicle?.price || "N/A",
          distance: order.route?.destination?.distance || "N/A",
          userPhoto: order.user?.photo || null,
        },
        driverDetails: {
          name: driverData.name,
          phone: driverData.phoneNumber,
          ambulanceRegNo: driverData.assignedAmbulance,
          location: currentLocation,
        },
      });
      setSelectedOrder(null);
      setTimer(60);
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  return (
    <View style={styles.container}>
      {isOnline ? (
        <View style={styles.onlineContainer}>
          {currentLocation ? (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
            >
              <Marker coordinate={currentLocation}>
                <Image
                  source={require("../../../assets/images/a3.png")}
                  style={styles.markerImage}
                />
              </Marker>
            </MapView>
          ) : (
            <Text style={styles.loadingText}>Fetching location...</Text>
          )}
          <ScrollView style={styles.orderList}>
            {orders.length === 0 ? (
              <Text style={styles.noOrdersText}>No pending orders</Text>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                <View style={styles.userInfoContainer}>
                  {order.user?.photo ? (
                    <Image
                      source={{ uri: order.user.photo }}
                      style={styles.userImage}
                    />
                  ) : (
                    <View style={[styles.userImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}
                  <Text style={styles.orderTitle}>
                    Name: {order.user?.name || "N/A"}
                  </Text>
                </View>
                <Text style={styles.orderDetails}>
                  Pickup: {order.route?.origin?.name || "N/A"}
                </Text>
                <Text style={styles.orderDetails}>
                  Drop-off: {order.route?.destination?.name || "N/A"}
                </Text>
                <Text style={styles.countPrice}>
                  Rs: {order.vehicle?.price?.toFixed(2) || "N/A"} {/* Format price to 2 decimal places */}
                </Text>
                <Text style={styles.orderDetails}>
                  Distance: {order.route?.distance?.toFixed(2) || "N/A"} km {/* Format distance to 2 decimal places */}
                </Text>
                <Text style={styles.countdownText}>{timer}s</Text>
                <Pressable
                  style={styles.orderCardButton}
                  onPress={() => acceptOrder(order)}
                >
                  <Text style={styles.orderCardButtonText}>Accept Order</Text>
                </Pressable>
              </View>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.offlineContainer}>
          <Image
            source={require("../../../assets/images/a3.png")}
            style={styles.ambulanceIcon}
          />
          <Text style={styles.offlineText}>
            You are offline. Go online to view orders.
          </Text>
        </View>
      )}
      <ToggleOnlineStatus isOnline={isOnline} toggleOnlineStatus={toggleOnlineStatus} />
      <Logout navigation={navigation} />
      <Text style={styles.balanceText}>Business Balance: Rs {businessBalance}</Text>
    </View>
  );
};

const ToggleOnlineStatus = ({ isOnline, toggleOnlineStatus }) => (
  <Pressable
    onPress={toggleOnlineStatus}
    style={[styles.toggleButton, !isOnline && styles.toggleButtonOffline]}
  >
    <Text style={styles.toggleText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  placeholderImage: {
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  onlineContainer: { flex: 1 },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  map: {
    flex: 1,
    height: 250,
    borderRadius: 16,
    margin: 16,
    overflow: "hidden",
  },
  orderList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  noOrdersText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 24,
    fontFamily: "Inter-Medium",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  orderTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  orderDetails: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter-Regular",
    marginVertical: 4,
  },
  countPrice: {
    fontSize: 16,
    color: "#2E7D32",
    fontFamily: "Inter-SemiBold",
    marginTop: 8,
  },
  countdownText: {
    fontSize: 14,
    color: "#D32F2F",
    fontFamily: "Inter-Bold",
    textAlign: "right",
    marginTop: 8,
  },
  orderCardButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#1976D2",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  orderCardButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontFamily: "Inter-Regular",
  },
  toggleButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    flexDirection: "row",
    justifyContent: "center",
  },
  toggleButtonOffline: {
    backgroundColor: "#666666",
  },
  toggleText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  ambulanceIcon: {
    width: 120,
    height: 120,
    opacity: 0.8,
    marginBottom: 24,
  },
  offlineText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Inter-Medium",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  balanceText: {
    textAlign: "center",
    fontSize: 16,
    color: "#2E7D32",
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
});

export default DHomeScreen;