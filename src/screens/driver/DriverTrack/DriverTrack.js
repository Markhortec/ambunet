import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import firestore from "@react-native-firebase/firestore";

const GOOGLE_MAPS_APIKEY = "AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM"; // Replace with your valid API key

const DriverTrack = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [orderData, setOrderData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the order document in the "orders" collection
    const unsubscribe = firestore()
      .collection("orders")
      .doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setOrderData(data);
          setCurrentLocation(data.driverLocation); // Expected to be a map with { latitude, longitude }
          setRideStatus(data.status);
          // Extract origin and destination from the nested route object
          if (data.route) {
            if (data.route.origin) {
              setOrigin({
                latitude: data.route.origin.lat,
                longitude: data.route.origin.lng,
              });
            }
            if (data.route.destination) {
              setDestination({
                latitude: data.route.destination.lat,
                longitude: data.route.destination.lng,
              });
            }
          }
          setLoading(false);
        }
      });

    return () => unsubscribe();
  }, [orderId]);

  const handleArrived = async () => {
    try {
      Alert.alert("Your ambulance has arrived");
      // Optionally update the order status in Firestore:
      // await firestore().collection("orders").doc(orderId).update({ status: "Arrived" });
      // navigation.goBack();
    } catch (error) {
      console.error("Error updating ride status:", error);
    }
  };

  if (loading || !orderData || !currentLocation) {
    return (
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>Ride Status: {rideStatus}</Text>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
        showsUserLocation
      >
        {/* Driver Location Marker */}
        <Marker coordinate={currentLocation} title="Driver Location">
          <Text style={styles.marker}>🚑</Text>
        </Marker>
        {/* Pickup Marker */}
        {origin && (
          <Marker coordinate={origin} title="Pickup Location" pinColor="blue" />
        )}
        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="green"
          />
        )}
        {/* Directions from Driver to Pickup */}
        {currentLocation && origin && (
          <MapViewDirections
            origin={currentLocation}
            destination={origin}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
        {/* Directions from Pickup to Destination */}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="green"
          />
        )}
      </MapView>
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.detailTitle}>User Details</Text>
        <Text style={styles.detailText}>
          Name: {orderData.user?.name || "N/A"}
        </Text>
        <Text style={styles.detailText}>
          Phone: {orderData.user?.phone || "N/A"}
        </Text>
        <Text style={styles.detailTitle}>Trip Details</Text>
        <Text style={styles.detailText}>
          Pickup Location: {orderData.route?.origin?.name || "N/A"}
        </Text>
        <Text style={styles.detailText}>
          Drop-off Location: {orderData.route?.destination?.name || "N/A"}
        </Text>
        <Text style={styles.detailText}>
          Vehicle Type: {orderData.vehicle?.type || "N/A"}
        </Text>
        <Text style={styles.detailText}>
          Price: Rs. {orderData.vehicle?.price || "N/A"}
        </Text>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Arrived" onPress={handleArrived} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  map: {
    flex: 1.5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
  },
  marker: {
    fontSize: 20,
    color: "red",
  },
  detailsContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
    color: "#444",
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  buttonContainer: {
    padding: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DriverTrack;
