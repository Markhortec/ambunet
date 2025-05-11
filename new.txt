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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { resetOrderData } from "../../../redux/driverOrderSlice";

const GOOGLE_MAPS_APIKEY = "AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM";
const ARRIVAL_DISTANCE_THRESHOLD = 40; // meters
const COMPLETION_DISTANCE_THRESHOLD = 60; // meters

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
  const dispatch = useDispatch();
  const { orderId } = route.params;
  const [orderData, setOrderData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [distanceToOrigin, setDistanceToOrigin] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

      if (originDistance <= ARRIVAL_DISTANCE_THRESHOLD && !hasArrived) {
        setHasArrived(true);
      } else if (originDistance > ARRIVAL_DISTANCE_THRESHOLD) {
        setHasArrived(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, origin, destination, hasArrived]);

  const handleArrived = async () => {
    try {
      await firestore().collection("orders").doc(orderId).update({
        status: "Arrived",
      });
      Alert.alert("Arrived", "You have reached the pickup location");
    } catch (error) {
      console.error("Error updating ride status:", error);
      Alert.alert("Error", "Failed to update arrival status");
    }
  };

  const handleCompleteRide = async () => {
    setIsProcessing(true);
    try {
      // Validate required data
      if (!currentLocation || !destination || !orderData?.ambulanceRegNo) {
        Alert.alert("Error", "Missing required ride data");
        setIsProcessing(false);
        return;
      }
  
      // Calculate the transfer amount
      const amount = orderData.calculatedPrice || 
                   (orderData.vehicle?.price * (orderData.pricePercentage || 18) / 100);
  
      // Document references
      const orderRef = firestore().collection("orders").doc(orderId);
      const ambulanceRef = firestore().collection("ambulances").doc(orderData.ambulanceRegNo);
      const earningsRef = firestore().collection("earnings").doc("8zX7cl2nm3v76i17FrJD");
  
      await firestore().runTransaction(async (transaction) => {
        // Get all necessary documents with error handling
        const docs = await Promise.all([
          transaction.get(orderRef).catch(() => undefined),
          transaction.get(ambulanceRef).catch(() => undefined),
          transaction.get(earningsRef).catch(() => undefined)
        ]);
  
        const [orderDoc, ambulanceDoc, earningsDoc] = docs;
  
        // Validate documents exist
        if (!orderDoc || !orderDoc.exists) {
          throw new Error("Order document not found");
        }
        if (!ambulanceDoc || !ambulanceDoc.exists) {
          throw new Error(`Ambulance document (${orderData.ambulanceRegNo}) not found`);
        }
  
        // Get company reference
        const companyId = ambulanceDoc.data()?.companyId;
        if (!companyId) {
          throw new Error("Company ID not found in ambulance record");
        }
  
        const companyRef = firestore().collection("businesses").doc(companyId);
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists) {
          throw new Error("Company account not found");
        }
  
        // Check company balance
        const currentBalance = companyDoc.data()?.balance || 0;
        if (currentBalance < amount) {
          throw new Error(`Company has insufficient balance (Rs.${currentBalance} available)`);
        }
  
        // Initialize earnings if it doesn't exist
        if (!earningsDoc || !earningsDoc.exists) {
          transaction.set(earningsRef, {
            balance: 0,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            createdAt: firestore.FieldValue.serverTimestamp()
          });
        }
  
        // Perform the financial transactions
        transaction.update(companyRef, {
          balance: firestore.FieldValue.increment(-amount),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
  
        transaction.update(earningsRef, {
          balance: firestore.FieldValue.increment(amount),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
  
        transaction.update(orderRef, {
          status: "Completed",
          completedAt: firestore.FieldValue.serverTimestamp(),
          paymentStatus: "processed",
          financialDetails: {
            amountTransferred: amount,
            companyId: companyId,
            processedAt: firestore.FieldValue.serverTimestamp()
          }
        });
      });
  
      // On successful completion
      Alert.alert(
        "Ride Completed",
        `Payment of Rs.${amount.toFixed(2)} processed successfully!`
      );
  
      // Clean up and navigate
      await AsyncStorage.removeItem('driverOrderId');
      dispatch(resetOrderData());
      navigation.navigate("DHomeScreen");
  
    } catch (error) {
      console.error("Ride completion failed:", error);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to process payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
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

  const isWithinCompletionDistance = distanceToDestination <= COMPLETION_DISTANCE_THRESHOLD;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>Ride Status: {rideStatus}</Text>
        
        {distanceToOrigin !== null && (
          <>
            <Text style={styles.distanceText}>
              Distance to pickup: {(distanceToOrigin / 1000).toFixed(2)} km
            </Text>
            {rideStatus === "In Progress" && (
              <Text style={[
                styles.distanceStatus,
                hasArrived ? styles.successText : styles.warningText
              ]}>
                {hasArrived ? "Within arrival range (40m)" : "Not in arrival range yet"}
              </Text>
            )}
          </>
        )}

        {distanceToDestination !== null && rideStatus === "Arrived" && (
          <>
            <Text style={styles.distanceText}>
              Distance to destination: {(distanceToDestination / 1000).toFixed(2)} km
            </Text>
            <Text style={[
              styles.distanceStatus,
              isWithinCompletionDistance ? styles.successText : styles.warningText
            ]}>
              {isWithinCompletionDistance 
                ? "Within completion range (60m)" 
                : "Not in completion range yet"}
            </Text>
          </>
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
          <Text style={styles.detailText}>Base Price: Rs.{orderData.vehicle?.price?.toFixed(2) || "N/A"}</Text>
          <Text style={styles.detailText}>Applied Percentage: {orderData.pricePercentage || 18}%</Text>
          <Text style={[styles.detailText, styles.boldText]}>
            Final Price: RS.{orderData.calculatedPrice?.toFixed(2) || 
              ((orderData.vehicle?.price * (orderData.pricePercentage || 18) / 100).toFixed(2))}
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {rideStatus === "In Progress" && (
          <Button 
            title={hasArrived ? "I've Arrived" : "Approaching Pickup"}
            onPress={handleArrived} 
            color="#4CAF50"
            disabled={!hasArrived || isProcessing}
          />
        )}
        {rideStatus === "Arrived" && (
          <Button 
            title={isProcessing ? "Processing..." : "Complete Ride"}
            onPress={handleCompleteRide} 
            color="#2196F3"
            disabled={!isWithinCompletionDistance || isProcessing}
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
  distanceStatus: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  warningText: {
    color: "#FF5722",
  },
  successText: {
    color: "#4CAF50",
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
  boldText: {
    fontWeight: "bold",
    color: "#2E7D32",
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