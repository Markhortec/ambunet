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

const GOOGLE_MAPS_APIKEY = "AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM";

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

const DriverTrack = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [orderData, setOrderData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [distanceToOrigin, setDistanceToOrigin] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("orders")
      .doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setOrderData(data);
          setRideStatus(data.status);

          if (data.driverLocation) {
            setCurrentLocation({
              latitude: data.driverLocation.latitude,
              longitude: data.driverLocation.longitude,
            });
          }

          if (data.route) {
            if (data.route.origin) {
              setOrigin({
                latitude: data.route.origin.latitude,
                longitude: data.route.origin.longitude,
                name: data.route.origin.name || "Pickup Location",
              });
            }
            if (data.route.destination) {
              setDestination({
                latitude: data.route.destination.latitude,
                longitude: data.route.destination.longitude,
                name: data.route.destination.name || "Destination",
              });
            }
          }
          setLoading(false);
        }
      });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    if (!currentLocation || !origin) return;

    const interval = setInterval(() => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        origin.latitude,
        origin.longitude
      );
      setDistanceToOrigin(distance);
      
      if (distance <= 50 && !hasArrived) {
        handleArrived();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, origin, hasArrived]);

  const handleArrived = async () => {
    try {
      setHasArrived(true);
      Alert.alert("Arrived", "You have reached the pickup location");
      
      await firestore().collection("orders").doc(orderId).update({
        status: "Arrived",
      });
    } catch (error) {
      console.error("Error updating ride status:", error);
    }
  };

  const handleCompleteRide = async () => {
    try {
      if (!currentLocation || !destination) return;
      
      const distanceToDest = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      
      if (distanceToDest > 50) {
        Alert.alert("Not at Destination", "You must be at the destination to complete the ride");
        return;
      }

      await firestore().collection("orders").doc(orderId).update({
        status: "Completed",
        completedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Ride Completed", "The ride has been marked as completed");
      navigation.goBack();
    } catch (error) {
      console.error("Error completing ride:", error);
    }
  };

  if (loading || !orderData || !currentLocation) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading ride data...</Text>
      </View>
    );
  }

  if (!origin || !destination) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Waiting for valid location data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>Ride Status: {rideStatus}</Text>
        {distanceToOrigin !== null && (
          <Text style={styles.distanceText}>
            Distance to pickup: {(distanceToOrigin / 1000).toFixed(2)} km
          </Text>
        )}
      </View>
      
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
        <Marker coordinate={currentLocation} title="Driver Location">
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>🚑</Text>
          </View>
        </Marker>
        
        {origin && (
          <Marker coordinate={origin} title="Pickup Location" pinColor="blue" />
        )}
        
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor="green" />
        )}
        
        {currentLocation && origin && (
          <MapViewDirections
            origin={currentLocation}
            destination={origin}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
        
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>
          <Text style={styles.detailText}>Name: {orderData.user?.name || "N/A"}</Text>
          <Text style={styles.detailText}>Phone: {orderData.user?.phone || "N/A"}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.detailText}>Pickup: {origin.name || "N/A"}</Text>
          <Text style={styles.detailText}>Destination: {destination.name || "N/A"}</Text>
          <Text style={styles.detailText}>Vehicle: {orderData.vehicle?.type || "N/A"}</Text>
          <Text style={styles.detailText}>Price: Rs. {orderData.vehicle?.price?.toFixed(2) || "N/A"}</Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {rideStatus === "In Progress" && !hasArrived && (
          <Button 
            title="I've Arrived" 
            onPress={handleArrived} 
            color="#4CAF50"
          />
        )}
        {rideStatus === "Arrived" && (
          <Button 
            title="Complete Ride" 
            onPress={handleCompleteRide} 
            color="#2196F3"
          />
        )}
      </View>
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
  map: {
    flex: 1,
    minHeight: 300,
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
  buttonContainer: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
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

export default DriverTrack;