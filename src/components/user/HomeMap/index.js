import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Image } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import 'react-native-get-random-values';

import cars from '../../../assets/data/cars'; // Adjust the path as per your project structure

const GOOGLE_MAPS_API_KEY = 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM'; // Example API key

const HomeMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);

  const getImage = (type) => {
    if (type === 'UberX') {
      return require('../../../assets/images/top-UberX.png');
    }
    if (type === 'Comfort') {
      return require('../../../assets/images/top-Comfort.png');
    }
    return require('../../../assets/images/top-UberXL.png');
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app requires access to your location to show your position on the map.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        fetchCurrentLocation();
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
      },
      (error) => {
        console.error('Geolocation error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Example of a light map style suitable for rider apps
  const lightMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#eeeeee' }],
    },
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'poi.business',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f2f2f2' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#f2f2f2' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#b3cbe4' }],
    },
  ];

  return (
    <View style={styles.container}>
      {currentLocation ? (
        console.log(currentLocation),
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation
          showsTraffic={true} // Enable traffic display
          // customMapStyle={customMapStyle} // Apply custom map style
        >
          {cars.map((car) => (
            <Marker
              key={car.id}
              coordinate={{ latitude: car.latitude, longitude: car.longitude }}
            >
             <Image
              style={{
                width: 40,
                height: 40,
                resizeMode: 'contain',
                transform: [{ rotate: `${car.heading}deg` }],
              }}
              source={getImage(car.type)}
            />
            </Marker>
          ))}
        </MapView>
      ) : (
        <Text style={styles.loadingText}>Fetching current location...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default HomeMap;
