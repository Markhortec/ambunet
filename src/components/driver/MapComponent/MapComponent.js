// HomeMap.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Image } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const HomeMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [driverData, setDriverData] = useState(null);

  // Fetch driver details by phone number from Firestore
  const fetchDriverData = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem('driverPhoneNumber');
      if (phoneNumber) {
        const driverSnapshot = await firestore()
          .collection('drivers') // Assuming the collection name is 'drivers'
          .where('phoneNumber', '==', phoneNumber)
          .get();

        if (!driverSnapshot.empty) {
          const driverDoc = driverSnapshot.docs[0];
          setDriverData({ id: driverDoc.id, ...driverDoc.data() });
          requestLocationPermission(); // Start location tracking after fetching driver data
        } else {
          console.error('Driver not found in Firestore');
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app requires access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        fetchCurrentLocation();
      } else {
        console.warn('Location permission denied');
      }
    } catch (err) {
      console.warn('Permission request error:', err);
    }
  };

  // Fetch and update current location
  const fetchCurrentLocation = () => {
    Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        updateDriverLocationInFirestore(latitude, longitude);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
  };

  // Update driver location in Firestore
  const updateDriverLocationInFirestore = async (latitude, longitude) => {
    if (!driverData) return;

    try {
      await firestore()
        .collection('duty') // Assuming this is the collection for tracking duty status
        .doc(driverData.id) // Use driver ID to identify document
        .set(
          {
            name: driverData.name,
            phone: driverData.phoneNumber,
            ambulanceRegNo: driverData.assignedAmbulance,
            latitude,
            longitude,
            status: 'Online',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true } // Merge to avoid overwriting existing fields
        );
    } catch (error) {
      console.error('Error updating location in Firestore:', error);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchDriverData();
  }, []);

  return (
    <View style={styles.container}>
      {currentLocation ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          <Marker coordinate={currentLocation}>
            <Image source={require('../../../assets/images/a3.png')} style={styles.markerImage} />
          </Marker>
        </MapView>
      ) : (
        <Text style={styles.loadingText}>Fetching location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  markerImage: { width: 40, height: 40 },
});

export default HomeMap;
