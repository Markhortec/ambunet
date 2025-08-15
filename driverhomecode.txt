import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PermissionsAndroid,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import Logout from "../../../components/owner/Logout";
import { useDispatch } from 'react-redux';
import { setOrderData } from '../../../redux/driverOrderSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DHomeScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timer, setTimer] = useState(60);
  const [businessBalance, setBusinessBalance] = useState(0);
  const [priceRules, setPriceRules] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    fetchDriverData();
    fetchPriceRules();
  }, []);

  // Add this useEffect to log driver ID
  useEffect(() => {
    const fetchAndLogDriverId = async () => {
      try {
        const storedDriver = await AsyncStorage.getItem('driverData');
        if (storedDriver) {
          const driverData = JSON.parse(storedDriver);
          const driverId = driverData.driverId;
          console.log('Driver ID:', driverId);
        } else {
          console.log('No driver data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching driver ID:', error);
      }
    };

    fetchAndLogDriverId();
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
          setEditedInfo({
            name: driverData.name,
            email: driverData.email,
            phoneNumber: driverData.phoneNumber,
            address: driverData.address || '',
            cnicNumber: driverData.cnicNumber || ''
          });
          requestLocationPermission();
          fetchBusinessBalance(driverData.companyId);
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

  const updateDriverProfile = async () => {
    try {
      setLoading(true);
      const { id } = driverData;
      
      await firestore().collection('drivers').doc(id).update({
        name: editedInfo.name,
        email: editedInfo.email,
        phoneNumber: editedInfo.phoneNumber,
        address: editedInfo.address,
        cnicNumber: editedInfo.cnicNumber
      });
      
      // Update local state
      setDriverData(prev => ({
        ...prev,
        name: editedInfo.name,
        email: editedInfo.email,
        phoneNumber: editedInfo.phoneNumber,
        address: editedInfo.address,
        cnicNumber: editedInfo.cnicNumber
      }));
      
      setIsEditing(false);
      setLoading(false);
      
    } catch (error) {
      console.error("Error updating driver data:", error);
      Alert.alert("Error", "Failed to update profile");
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchPriceRules = async () => {
    try {
      const querySnapshot = await firestore().collection('priceRules').get();
      const rules = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      rules.sort((a, b) => a.distance - b.distance);
      setPriceRules(rules);
    } catch (error) {
      console.error("Error fetching price rules:", error);
    }
  };

  const calculatePriceBasedOnDistance = (distance) => {
    if (!priceRules.length) return 18;
    const applicableRule = priceRules.find(rule => distance <= rule.distance);
    return applicableRule ? applicableRule.percentage : 18;
  };

  const checkBusinessBalance = (orderPrice) => {
    return businessBalance >= orderPrice;
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
      const orderDistance = order.route?.distance || 0;
      const pricePercentage = calculatePriceBasedOnDistance(orderDistance);
      const basePrice = order.vehicle?.price || 0;
      const actualPrice = (basePrice * pricePercentage) / 100;
  
      if (!checkBusinessBalance(actualPrice)) {
        throw new Error("Business doesn't have sufficient balance to cover this order");
      }
  
      // Ensure all required fields have values
      const updateData = {
        status: "In Progress",
        driverName: driverData.name || "Unknown Driver",
        driverPhone: driverData.phoneNumber || "N/A",
        ambulanceRegNo: driverData.assignedAmbulance || "N/A",
        driverLocation: currentLocation || { latitude: 0, longitude: 0 },
        assignedDriverId: driverData.id || "N/A",
        calculatedPrice: actualPrice,
        pricePercentage: pricePercentage,
        pricingRuleApplied: pricePercentage === 18 ? "Fixed 18% (Exceeds max distance)" : "Distance-based",
        updatedAt: firestore.FieldValue.serverTimestamp() // Always include a timestamp
      };
  
      await firestore().runTransaction(async (transaction) => {
        const orderRef = firestore().collection("orders").doc(order.id);
        const orderDoc = await transaction.get(orderRef);
        
        if (orderDoc.exists && orderDoc.data().status === "Pending") {
          transaction.update(orderRef, updateData);
  
          dispatch(setOrderData(order.id));
          await AsyncStorage.setItem('driverOrderId', order.id);
        } else {
          throw new Error("Order has already been accepted.");
        }
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
          price: actualPrice,
          basePrice: basePrice,
          distance: order.route?.distance || "N/A",
          userPhoto: order.user?.photo || null,
          pricePercentage: pricePercentage,
          pricingRule: pricePercentage === 18 ? "Fixed 18% (Exceeds max distance)" : "Distance-based"
        },
        driverDetails: {
          name: driverData.name || "Unknown Driver",
          phone: driverData.phoneNumber || "N/A",
          ambulanceRegNo: driverData.assignedAmbulance || "N/A",
          location: currentLocation || { latitude: 0, longitude: 0 },
        },
      });
      setSelectedOrder(null);
      setTimer(60);
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("Error", error.message || "Failed to accept order");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Menu Button */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={toggleMenu}
      >
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>

      {/* Profile Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.modalContainer}>
            {/* Close button at top right */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={toggleMenu}
            >
              <Ionicons name="close" size={24} color="#F70000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Driver Profile</Text>
            
            {driverData && (
              <ScrollView style={styles.profileInfoContainer}>
                {isEditing ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Name:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedInfo.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email:</Text>
                      <Text style={styles.nonEditableField}>{driverData.email}</Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone:</Text>
                      <Text style={styles.nonEditableField}>{driverData.phoneNumber}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>CNIC Number:</Text>
                      <Text style={styles.nonEditableField}>{driverData.cnicNumber || 'N/A'}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Address:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedInfo.address}
                        onChangeText={(text) => handleInputChange('address', text)}
                        multiline
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Status:</Text>
                      <Text style={styles.nonEditableField}>{driverData.driverStatus}</Text>
                    </View>

             
                    
                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={updateDriverProfile}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsEditing(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {driverData.profilePhoto ? (
                      <Image
                        source={{ uri: driverData.profilePhoto }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profilePlaceholder}>
                        <Icon name="account" size={60} color="#666" />
                      </View>
                    )}
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoText}>{driverData.name}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoText}>{driverData.email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoText}>{driverData.phoneNumber}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>CNIC Number:</Text>
                      <Text style={styles.infoText}>{driverData.cnicNumber || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Address:</Text>
                      <Text style={styles.infoText}>{driverData.address || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={styles.infoText}>{driverData.driverStatus}</Text>
                    </View>

                  
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={handleEdit}
                    >
                      <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <Logout style={{paddingTop: 3, marginTop:9}} navigation={navigation} />
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
              orders.map((order) => {
                const orderDistance = order.route?.distance || 0;
                const pricePercentage = calculatePriceBasedOnDistance(orderDistance);
                const basePrice = order.vehicle?.price || 0;
                const actualPrice = (basePrice * pricePercentage) / 100;
                const hasSufficientBalance = checkBusinessBalance(actualPrice);
                const isFixedPercentage = pricePercentage === 18 && 
                  (priceRules.length > 0 && orderDistance > priceRules[priceRules.length - 1].distance);

                return (
                  <View key={order.id} style={[
                    styles.orderCard,
                    !hasSufficientBalance && styles.insufficientBalanceCard,
                    isFixedPercentage && styles.fixedPercentageCard
                  ]}>
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
                    <Text style={styles.orderDetails}>
                      Distance: {orderDistance.toFixed(2)} km
                    </Text>
                    <Text style={styles.orderDetails}>
                      Base Price: Rs {basePrice.toFixed(2)}
                    </Text>
                    <Text style={[
                      styles.orderDetails,
                      isFixedPercentage && styles.fixedPercentageText
                    ]}>
                      Applied Percentage: {pricePercentage}% 
                      {isFixedPercentage ? " (Fixed for long distance)" : ""}
                    </Text>
                    <Text style={styles.countPrice}>
                      Final Price: Rs {actualPrice.toFixed(2)}
                    </Text>
                    {!hasSufficientBalance && (
                      <Text style={styles.warningText}>
                        Warning: Business balance insufficient for this order
                      </Text>
                    )}
                    <Text style={styles.countdownText}>{timer}s</Text>
                    <Pressable
                      style={[
                        styles.orderCardButton,
                        !hasSufficientBalance && styles.disabledButton
                      ]}
                      onPress={() => acceptOrder(order)}
                      disabled={!hasSufficientBalance}
                    >
                      <Text style={styles.orderCardButtonText}>
                        {hasSufficientBalance ? "Accept Order" : "Insufficient Balance"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
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
      <Pressable
        onPress={toggleOnlineStatus}
        style={[styles.toggleButton, !isOnline && styles.toggleButtonOffline]}
      >
        <Text style={styles.toggleText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
      </Pressable>
    
      <Text style={styles.balanceText}>Business Balance: Rs {businessBalance.toFixed(2)}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
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
  onlineContainer: { 
    flex: 1,
    marginTop: 60 
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginTop: 60
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
  fixedPercentageCard: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD'
  },
  insufficientBalanceCard: {
    borderColor: '#FF5722',
    backgroundColor: '#FFF3E0'
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
  fixedPercentageText: {
    color: '#1976D2',
    fontWeight: 'bold'
  },
  countPrice: {
    fontSize: 16,
    color: "#2E7D32",
    fontFamily: "Inter-SemiBold",
    marginTop: 8,
  },
  warningText: {
    color: '#FF5722',
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    marginTop: 4
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
  disabledButton: {
    backgroundColor: '#9E9E9E'
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFF',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#F70000',
    textAlign: 'center',
  },
  profileInfoContainer: {
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEE',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
    maxWidth: '60%',
  },
  inputContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 8,
  },
  nonEditableField: {
    fontSize: 16,
    color: '#333',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: '#F70000',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    
  },
  saveButton: {
    backgroundColor: '#F70000',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#DDD',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DHomeScreen;