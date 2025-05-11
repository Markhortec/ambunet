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
import MapViewDirections from "react-native-maps-directions";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOOGLE_MAPS_APIKEY = "AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM";
const ARRIVAL_DISTANCE_THRESHOLD = 50; // meters
const COMPLETION_DISTANCE_THRESHOLD = 50; // meters

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
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
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const mapRef = useRef(null);

  // Track if driver has arrived at pickup
  const [hasArrivedAtPickup, setHasArrivedAtPickup] = useState(false);
  // Track if ride has started (after pickup)
  const [rideStarted, setRideStarted] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setOrderData(data);
            setRideStatus(data.status || "Accepted");

            if (data.driverLocation) {
              const newLocation = {
                latitude: data.driverLocation.latitude,
                longitude: data.driverLocation.longitude,
              };
              setCurrentLocation(newLocation);
              
              // Animate map to driver location when it updates
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...newLocation,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 1000);
              }
            }

            if (data.route?.origin) {
              setOrigin({
                latitude: data.route.origin.latitude,
                longitude: data.route.origin.longitude,
                name: data.route.origin.name || "Pickup Location",
              });
            }

            if (data.route?.destination) {
              setDestination({
                latitude: data.route.destination.latitude,
                longitude: data.route.destination.longitude,
                name: data.route.destination.name || "Destination",
              });
            }

            // Update state flags based on status changes
            if (data.status === "Arrived" && rideStatus !== "Arrived") {
              setHasArrivedAtPickup(true);
              Alert.alert("Ambulance Arrived", "Your ambulance has arrived at the pickup location");
            } else if (data.status === "Started" && rideStatus !== "Started") {
              setRideStarted(true);
              setHasArrivedAtPickup(true);
            } else if (data.status === "Completed" && rideStatus !== "Completed") {
              handleRideCompletion();
            }

            setLoading(false);
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

  // Calculate distances and update arrival status
  useEffect(() => {
    if (!currentLocation || !origin || !destination) return;

    const interval = setInterval(() => {
      const originDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        origin.latitude,
        origin.longitude
      );
      setDistanceToOrigin(originDistance);

      const destDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      setDistanceToDestination(destDistance);

      // Auto-detect arrival at pickup location
      if (originDistance <= ARRIVAL_DISTANCE_THRESHOLD && !hasArrivedAtPickup && rideStatus === "In Progress") {
        setHasArrivedAtPickup(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, origin, destination, hasArrivedAtPickup, rideStatus]);

  const handleRideCompletion = async () => {
    Alert.alert("Ride Completed", "Your ride has been completed");
    await AsyncStorage.clear();
    navigation.navigate("HomeScreen");
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentLocation || !origin || !destination) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Waiting for valid location data...</Text>
      </View>
    );
  }

  const isWithinCompletionDistance = distanceToDestination <= COMPLETION_DISTANCE_THRESHOLD;
  const showPickupRoute = !hasArrivedAtPickup && (rideStatus === "In Progress" || rideStatus === "Accepted");
  const showDestinationRoute = rideStarted || rideStatus === "Started";

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.header}>
        <Text style={styles.statusText}>Ambulance Status: {rideStatus}</Text>
        
        {distanceToOrigin !== null && (rideStatus === "In Progress" || rideStatus === "Accepted") && (
          <>
           
            <Text style={[
              styles.distanceStatus,
              hasArrivedAtPickup ? styles.successText : styles.warningText
            ]}>
              {hasArrivedAtPickup ? "Ambulance has arrived" : "Ambulance is coming"}
            </Text>
          </>
        )}

        {distanceToDestination !== null && (rideStatus === "Arrived" || rideStatus === "Started") && (
          <>
            <Text style={styles.distanceText}>
              Distance to destination: {(distanceToDestination / 1000).toFixed(2)} km
            </Text>
            <Text style={[
              styles.distanceStatus,
              isWithinCompletionDistance ? styles.successText : styles.warningText
            ]}>
              {isWithinCompletionDistance 
                ? "Almost at destination" 
                : "En route to destination"}
            </Text>
          </>
        )}
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
        showsUserLocation={false}
      >
        {/* Ambulance Marker with custom icon */}
        <Marker coordinate={currentLocation} title="Ambulance Location">
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>🚑</Text>
          </View>
        </Marker>

        {/* Origin Marker */}
        <Marker coordinate={origin} title={origin.name || "Pickup Location"} pinColor="blue" />

        {/* Destination Marker - only show if ride has started */}
        {(rideStarted || rideStatus === "Started") && (
          <Marker coordinate={destination} title={destination.name || "Destination"} pinColor="green" />
        )}

        {/* Route from Ambulance to Pickup */}
        {showPickupRoute && (
          <MapViewDirections
            origin={currentLocation}
            destination={origin}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            onError={(error) => console.log("Pickup route error:", error)}
          />
        )}

        {/* Route from Pickup to Destination */}
        {showDestinationRoute && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="green"
            onError={(error) => console.log("Destination route error:", error)}
          />
        )}
      </MapView>

      {/* Details Section */}
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambulance Details</Text>
          <Text style={styles.detailText}>Driver: {orderData?.driverName || "N/A"}</Text>
          <Text style={styles.detailText}>Vehicle: {orderData?.vehicle?.type || "N/A"}</Text>
          <Text style={styles.detailText}>Contact: {orderData?.driverPhone || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.detailText}>Pickup: {origin.name || "N/A"}</Text>
          <Text style={styles.detailText}>Destination: {destination.name || "N/A"}</Text>
          <Text style={styles.detailText}>Distance: {orderData?.route?.distance ? `${orderData.route.distance} km` : "N/A"}</Text>
          <Text style={[styles.detailText, styles.boldText]}>
            Estimated Fare: Rs {orderData?.vehicle?.price || "N/A"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  distanceText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },
  distanceStatus: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    fontWeight: "500",
  },
  warningText: {
    color: "#FF5722",
  },
  successText: {
    color: "#4CAF50",
  },
  map: {
    height: Dimensions.get("window").height * 0.4,
  },
  markerContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  markerText: {
    fontSize: 30,
  },
  detailsContainer: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#444",
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
  },
});

export default UserTrack;