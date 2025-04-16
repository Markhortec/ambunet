import React, { useState, useEffect } from "react";
import { StatusBar, TextInput, Text, View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useDispatch } from "react-redux";
import { setDriverInfo } from "../../../redux/driverSlice";
import { resetOrderData } from "../../../redux/driverOrderSlice";
const DriverLoginScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    useEffect(() => {
        const driverCheck = async () => {
            try {
                const storedDriver = await AsyncStorage.getItem('driverData');
                
                if (storedDriver) {
                    const driverData = JSON.parse(storedDriver);
                    const { driverId } = driverData;
    
                    if (driverId) {
                        const driverDoc = await firestore().collection('drivers').doc(driverId).get();
    
                        if (driverDoc.exists) {
                            dispatch(setDriverInfo(driverData));
    
                            // First check if navigation is available
                            if (navigation && navigation.replace) {
                                // Check for existing order in AsyncStorage
                                const storedOrderId = await AsyncStorage.getItem('driverOrderId');
                                
                                if (storedOrderId) {
                                    // Verify order status in Firestore
                                    const orderDoc = await firestore()
                                        .collection('orders')
                                        .doc(storedOrderId)
                                        .get();
                                    
                                    if (orderDoc.exists) {
                                        const orderData = orderDoc.data();
                                        // Check if order is still active
                                        if (orderData.status === 'In Progress' || orderData.status === 'Accepted' || orderData.status === 'Arrived') {
                                            console.log('Navigating to DriverTrack with existing order');
                                            navigation.replace('DriverTrack', {
                                                orderId: storedOrderId,
                                                orderDetails: {
                                                    id: storedOrderId,
                                                    userName: orderData.user?.name || "N/A",
                                                    userPhone: orderData.user?.phone || "N/A",
                                                    originName: orderData.route?.origin?.name || "N/A",
                                                    destinationName: orderData.route?.destination?.name || "N/A",
                                                    pickupTime: orderData.pickupTime || "N/A",
                                                    type: orderData.type || "N/A",
                                                    price: orderData.vehicle?.price || "N/A",
                                                    distance: orderData.route?.distance || "N/A",
                                                    userPhoto: orderData.user?.photo || null,
                                                },
                                                driverDetails: {
                                                    name: driverData.name,
                                                    phone: driverData.phoneNumber,
                                                    ambulanceRegNo: driverData.assignedAmbulance,
                                                    location: null, // Will be updated when online
                                                },
                                            });
                                            return;
                                        }
                                    }
                                }
                                
                                // If no active order found, go to home screen
                                //  await AsyncStorage.clear();
                                //  dispatch(resetOrderData());
                                console.log("Order is already completed");
                                console.log('Navigating to DHomeScreen');
                                navigation.replace('DHomeScreen');
                            } else {
                                console.error('Navigation object is not ready.');
                            }
                        } 
                    } 
                } 
            } catch (error) {
                console.error('Error during driver check:', error);
                Alert.alert('Error', 'An error occurred while verifying driver information.');
            }
        };
    
        driverCheck();
    }, [dispatch, navigation]);
    const handleLogin = async () => {
        setLoading(true);
        try {
            const role = await AsyncStorage.getItem('userRole');
            console.log(role)
            const driverSnapshot = await firestore()
                .collection('drivers')
                .where('phoneNumber', '==', phoneNumber)
                .get();

            if (driverSnapshot.empty) {
                Alert.alert("Error", "Phone number not found.");
                return;
            }

            let driverFound = false;

            for (const doc of driverSnapshot.docs) {
                const driverData = doc.data();
                const driverId = doc.id;

                if (driverData.password === password) {
                    
                    dispatch(setDriverInfo({
                        driverId,
                        phoneNumber: driverData.phoneNumber,
                        name: driverData.name,
                        email: driverData.email,
                        
                    }));

                 
                    await AsyncStorage.setItem('driverData', JSON.stringify({
                        driverId,
                        phoneNumber: driverData.phoneNumber,
                        name: driverData.name,
                        email: driverData.email,
                        role:driverData.role,
                    }));

                    navigation.replace('DHomeScreen');
                    driverFound = true;
                    break;
                }
            }

            if (!driverFound) {
                Alert.alert("Error", "Incorrect password. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            Alert.alert("Error", "Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={'light-content'} />
            <Icon name="car" size={100} color="#FF0000" style={styles.topIcon} />
            <View style={styles.overlayContent}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Driver Login</Text>
                </View>
                <View style={styles.inputsContainer}>
                    <View style={styles.inputContainer}>
                        <Icon name="phone" size={20} color="#FF0000" style={styles.icon} />
                        <TextInput
                            placeholder="Phone Number"
                            placeholderTextColor={'#B0B0B0'}
                            style={styles.textInput}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#FF0000" style={styles.icon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor={'#B0B0B0'}
                            secureTextEntry={true}
                            style={styles.textInput}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.loginButtonText}>{loading ? "Logging in..." : "Login"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    topIcon: {
        position: 'absolute',
        top: 60,
        zIndex: 2, 
    },
    overlayContent: {
        width: '80%',
        marginTop: 140,
        zIndex: 1,
        padding: 30,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        elevation: 5, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerText: {
        color: '#FF0000', 
        fontSize: 30,
        fontWeight: 'bold',
        fontFamily: 'Roboto-Bold',
    },
    inputsContainer: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    textInput: {
        color: '#212121',
        fontSize: 16,
        flex: 1,
        marginLeft: 10,
    },
    icon: {
        marginRight: 10,
    },
    loginButton: {
        backgroundColor: '#FF030D', 
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Roboto-Bold',
    },
});

export default DriverLoginScreen;
