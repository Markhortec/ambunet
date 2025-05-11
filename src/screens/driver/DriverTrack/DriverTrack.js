import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
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
  const [distanceToOrigin, setDistanceToOrigin] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mapRef = useRef(null);

  // Track if driver has arrived at pickup
  const [hasArrivedAtPickup, setHasArrivedAtPickup] = useState(false);
  // Track if ride has started (after pickup)
  const [rideStarted, setRideStarted] = useState(false);

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

          // Update state flags based on status changes
          if (data.status === "Arrived" && rideStatus !== "Arrived") {
            setHasArrivedAtPickup(true);
            setRideStarted(false);
          } else if (data.status === "Started" && rideStatus !== "Started") {
            setRideStarted(true);
            setHasArrivedAtPickup(true);
          } else if (data.status === "Completed" && rideStatus !== "Completed") {
            // Handle completion
            handleRideCompletion();
          }

          setLoading(false);
        }
      });

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

  const handleArrived = async () => {
    try {
      setIsProcessing(true);
      await firestore().collection("orders").doc(orderId).update({
        status: "Arrived",
      });
      Alert.alert("Arrived", "You have reached the pickup location");
    } catch (error) {
      console.error("Error updating ride status:", error);
      Alert.alert("Error", "Failed to update arrival status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRide = async () => {
    try {
      setIsProcessing(true);
      await firestore().collection("orders").doc(orderId).update({
        status: "Started",
      });
      setRideStarted(true);
    } catch (error) {
      console.error("Error starting ride:", error);
      Alert.alert("Error", "Failed to start ride");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRide = async () => {
    setIsProcessing(true);
    try {
      if (!currentLocation || !destination || !orderData?.ambulanceRegNo) {
        Alert.alert("Error", "Missing required ride data");
        return;
      }

      const amount = orderData.calculatedPrice || 
                   (orderData.vehicle?.price * (orderData.pricePercentage || 18) / 100);

      const orderRef = firestore().collection("orders").doc(orderId);
      const ambulanceRef = firestore().collection("ambulances").doc(orderData.ambulanceRegNo);
      const earningsRef = firestore().collection("earnings").doc("8zX7cl2nm3v76i17FrJD");

      await firestore().runTransaction(async (transaction) => {
        const [orderDoc, ambulanceDoc, earningsDoc] = await Promise.all([
          transaction.get(orderRef),
          transaction.get(ambulanceRef),
          transaction.get(earningsRef)
        ]);

        if (!orderDoc.exists) throw new Error("Order document not found");
        if (!ambulanceDoc.exists) throw new Error("Ambulance document not found");

        const companyId = ambulanceDoc.data()?.companyId;
        if (!companyId) throw new Error("Company ID not found");

        const companyRef = firestore().collection("businesses").doc(companyId);
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists) throw new Error("Company account not found");

        const currentBalance = companyDoc.data()?.balance || 0;
        if (currentBalance < amount) {
          throw new Error(`Company has insufficient balance (Rs.${currentBalance} available)`);
        }

        if (!earningsDoc.exists) {
          transaction.set(earningsRef, {
            balance: 0,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            createdAt: firestore.FieldValue.serverTimestamp()
          });
        }

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

      Alert.alert(
        "Ride Completed",
        `Payment of Rs.${amount.toFixed(2)} processed successfully!`
      );

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

  const handleRideCompletion = async () => {
    await AsyncStorage.removeItem('driverOrderId');
    dispatch(resetOrderData());
    navigation.navigate("DHomeScreen");
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
  const showPickupRoute = !hasArrivedAtPickup && rideStatus === "In Progress";
  const showDestinationRoute = rideStarted || rideStatus === "Started";
//line 301 have this code
{/* <Text style={styles.distanceText}>
              Distance to you: {(distanceToOrigin / 1000).toFixed(2)} km
            </Text> */}
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>Ride Status: {rideStatus}</Text>
        
        {distanceToOrigin !== null && rideStatus === "In Progress" && (
          <>
          
            <Text style={[
              styles.distanceStatus,
              hasArrivedAtPickup ? styles.successText : styles.warningText
            ]}>
              {hasArrivedAtPickup ? "Within arrival range" : "Approaching pickup"}
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
                ? "Within completion range" 
                : "En route to destination"}
            </Text>
          </>
        )}
      </View>
      
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
        <Marker coordinate={currentLocation} title="Your Location">
          <View style={styles.markerContainer}>
            <Text style={styles.markerText}>🚑</Text>
          </View>
        </Marker>
        
        <Marker coordinate={origin} title="Pickup Location" pinColor="blue" />
        
        {(rideStarted || rideStatus === "Started") && (
          <Marker coordinate={destination} title="Destination" pinColor="green" />
        )}
        
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
            Final Price: Rs.{orderData.calculatedPrice?.toFixed(2) || 
              ((orderData.vehicle?.price * (orderData.pricePercentage || 18) / 100).toFixed(2))}
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {rideStatus === "In Progress" && (
          <Button 
            title={hasArrivedAtPickup ? "Confirm Arrival" : "Approaching Pickup"}
            onPress={handleArrived} 
            color="#4CAF50"
            disabled={!hasArrivedAtPickup || isProcessing}
          />
        )}
        
        {rideStatus === "Arrived" && (
          <Button 
            title={isProcessing ? "Starting Ride..." : "Start Ride"}
            onPress={handleStartRide} 
            color="#2196F3"
            disabled={isProcessing}
          />
        )}
        
        {(rideStatus === "Started" || rideStatus === "Arrived") && (
          <Button 
            title={isProcessing ? "Processing..." : "Complete Ride"}
            onPress={handleCompleteRide} 
            color="#FF5722"
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