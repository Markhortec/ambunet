import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import useDispatch from "react-redux";
import MapViewDirections from "react-native-maps-directions";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
const GOOGLE_MAPS_APIKEY = "AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM";

// Same distance calculation function as in DriverTrack
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const UserTrack = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideStatus, setRideStatus] = useState("Accepted");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distanceToOrigin, setDistanceToOrigin] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();

            if (data.driverLocation?.latitude && data.driverLocation?.longitude) {
              setCurrentLocation(data.driverLocation);
            }

            if (data.route?.origin?.latitude && data.route?.origin?.longitude) {
              setOrigin({
                latitude: data.route.origin.latitude,
                longitude: data.route.origin.longitude,
                name: data.route.origin.name || "Pickup Location",
              });
            }

            if (data.route?.destination?.latitude && data.route?.destination?.longitude) {
              setDestination({
                latitude: data.route.destination.latitude,
                longitude: data.route.destination.longitude,
                name: data.route.destination.name || "Destination",
              });
            }

            setRideStatus(data.status || "Accepted");
            setOrderData(data);
            setLoading(false);

            if (data.driverLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: data.driverLocation.latitude,
                longitude: data.driverLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }

            if (data.status === "Arrived" && rideStatus !== "Arrived") {
              Alert.alert("Ambulance Arrived", "Your ambulance has arrived at the pickup location");
            }

            if (data.status === "Completed" && rideStatus !== "Completed") {
              Alert.alert("Ride Completed", "Your ride has been completed");
              (async () => {
                await AsyncStorage.clear();
                console.log("Order is completed");
                navigation.goBack();
              })();
            }
          } else {
            setError("No order found.");
            setLoading(false);
          }
        },
        (err) => {
          setError("Error fetching order data: " + err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [orderId, rideStatus]);

  // Calculate distance to origin
  useEffect(() => {
    if (!currentLocation || !origin) return;

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      origin.latitude,
      origin.longitude
    );
    setDistanceToOrigin(distance);
  }, [currentLocation, origin]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Log final state before render
  console.log("Final state:", { currentLocation, origin, destination });

  // Handle incomplete location data
  if (!currentLocation || !origin || !destination) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Waiting for valid location data...</Text>
        <Text style={styles.errorText}>
          Please ensure the origin and destination are set in the order.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <Text style={styles.statusText}>Ambulance Status: {rideStatus}</Text>
      </View>

      {/* Map Section */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Driver Marker */}
        <Marker
          coordinate={currentLocation}
          title="Ambulance Location"
          description="Real-time location of the ambulance"
          pinColor="#FF0000"
        />

        {/* Origin Marker */}
        <Marker
          coordinate={origin}
          title={origin.name || "Pickup Location"}
          pinColor="#007AFF"
        />

        {/* Destination Marker */}
        <Marker
          coordinate={destination}
          title={destination.name || "Destination"}
          pinColor="#34C759"
        />

        {/* Route from Ambulance to Pickup */}
        <MapViewDirections
          origin={currentLocation}
          destination={origin}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={4}
          strokeColor="#007AFF"
          onStart={(params) => console.log("Started routing from ambulance to pickup:", params)}
          onReady={(result) => console.log("Route ready from ambulance to pickup:", result)}
          onError={(err) => console.log("Route Error from ambulance to pickup:", err)}
        />

        {/* Route from Pickup to Destination */}
        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={4}
          strokeColor="#34C759"
          onStart={(params) => console.log("Started routing from pickup to destination:", params)}
          onReady={(result) => console.log("Route ready from pickup to destination:", result)}
          onError={(err) => console.log("Route Error from pickup to destination:", err)}
        />
      </MapView>

      {/* Details Section */}
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ambulance Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Driver Name:</Text>
            <Text style={styles.detailValue}>{orderData?.driverName || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailValue}>
              {orderData?.vehicle?.type || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>
              {orderData?.driverPhone || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {origin.name || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {destination.name || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>
              {orderData?.route?.distance ? `${orderData.route.distance} km` : "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fare:</Text>
            <Text style={styles.detailValue}>
              Rs {orderData?.vehicle?.price || "N/A"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 16,
    color: "#FF4444",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statusHeader: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  map: {
    height: Dimensions.get("window").height * 0.4,
  },
  detailsContainer: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});

export default UserTrack;