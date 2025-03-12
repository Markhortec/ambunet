import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import firestore from "@react-native-firebase/firestore";

const GOOGLE_MAPS_APIKEY = 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM'; // Replace with your actual API key

const UserTrack = ({ route }) => {
  const { orderId } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideStatus, setRideStatus] = useState("Accepted");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            console.log("Order Data:", data);

            // Log full data for debugging
            console.log("Full order data:", JSON.stringify(data));

            // Update driver's current location
            if (data.driverLocation?.latitude && data.driverLocation?.longitude) {
              setCurrentLocation(data.driverLocation);
              console.log("Current location set:", data.driverLocation);
            } else {
              console.warn("driverLocation is missing or incomplete.");
            }

            // Extract origin from multiple possible paths
            if (data.origin && data.origin.lat && data.origin.lng) {
              const newOrigin = {
                latitude: data.origin.lat,
                longitude: data.origin.lng,
                name: data.origin.name || "Pickup Location",
              };
              setOrigin(newOrigin);
              console.log("Origin set from data.origin:", newOrigin);
            } else if (data.originPlace?.details?.geometry?.location?.lat && data.originPlace?.details?.geometry?.location?.lng) {
              const originCoords = data.originPlace.details.geometry.location;
              const newOrigin = {
                latitude: originCoords.lat,
                longitude: originCoords.lng,
                name: data.originPlace.name || "Pickup Location",
              };
              setOrigin(newOrigin);
              console.log("Origin set from data.originPlace:", newOrigin);
            } else if (data.route && data.route.origin && data.route.origin.lat && data.route.origin.lng) {
              // Fallback: if the origin is nested under a 'route' field
              const newOrigin = {
                latitude: data.route.origin.lat,
                longitude: data.route.origin.lng,
                name: data.route.origin.name || "Pickup Location",
              };
              setOrigin(newOrigin);
              console.log("Origin set from data.route.origin:", newOrigin);
            } else {
              console.warn("Origin data is missing.");
            }

            // Extract destination from multiple possible paths
            if (data.destination && data.destination.lat && data.destination.lng) {
              const newDestination = {
                latitude: data.destination.lat,
                longitude: data.destination.lng,
                name: data.destination.name || "Destination",
              };
              setDestination(newDestination);
              console.log("Destination set from data.destination:", newDestination);
            } else if (data.destinationPlace?.details?.geometry?.location?.lat && data.destinationPlace?.details?.geometry?.location?.lng) {
              const destCoords = data.destinationPlace.details.geometry.location;
              const newDestination = {
                latitude: destCoords.lat,
                longitude: destCoords.lng,
                name: data.destinationPlace.name || "Destination",
              };
              setDestination(newDestination);
              console.log("Destination set from data.destinationPlace:", newDestination);
            } else if (data.route && data.route.destination && data.route.destination.lat && data.route.destination.lng) {
              // Fallback: if the destination is nested under a 'route' field
              const newDestination = {
                latitude: data.route.destination.lat,
                longitude: data.route.destination.lng,
                name: data.route.destination.name || "Destination",
              };
              setDestination(newDestination);
              console.log("Destination set from data.route.destination:", newDestination);
            } else {
              console.warn("Destination data is missing.");
            }

            // Update status and order data
            setRideStatus(data.status || "Accepted");
            setOrderData(data);
            console.log("Ride status set to:", data.status || "Accepted");
            setLoading(false);

            // Animate map to driver's location when updated
            if (data.driverLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: data.driverLocation.latitude,
                longitude: data.driverLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
              console.log("Map animated to driver's location.");
            }
          } else {
            setError("No order found.");
            console.error("No order found for orderId:", orderId);
            setLoading(false);
          }
        },
        (err) => {
          setError("Error fetching order data: " + err.message);
          console.error("Firestore Error:", err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [orderId]);

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
  if (!currentLocation || !origin || !destination) {
    console.warn("Incomplete location data", { currentLocation, origin, destination });
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Waiting for valid location data...</Text>
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
            <Text style={styles.detailValue}>{orderData?.driverName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailValue}>
              {orderData?.vehicle?.type || orderData?.vehicleType || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>
              {orderData?.driverPhone || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {origin.name || orderData?.originName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {destination.name || orderData?.destinationName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>
              {orderData?.distance ? `${orderData.distance} km` : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fare:</Text>
            <Text style={styles.detailValue}>
              Rs {orderData?.vehicle?.price || orderData?.price || 'N/A'}
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
