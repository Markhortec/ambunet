import React, { useRef, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions'; // for drawing directions

const OrderMap = ({ origin, destination, car, userLocation }) => {
  const mapRef = useRef(null);

  // Check if origin and destination have valid coordinates
  const isValidLocation = (location) => {
    return location && location.latitude !== 0 && location.longitude !== 0;
  };

  useEffect(() => {
    if (mapRef.current && origin && destination) {
      mapRef.current.fitToCoordinates([origin, destination], {

        animated: true,
      });
    }
  }, [origin, destination]);

  if (!isValidLocation(origin) || !isValidLocation(destination)) {
    return (
      <View style={styles.mapContainer}>
        <Text style={styles.statusText}>Invalid locations for the order</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        zoomEnabled
        scrollEnabled
      >
        {/* Origin Marker */}
        {origin && (
          <Marker coordinate={origin} pinColor="green">
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Pickup Location</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker coordinate={destination} pinColor="red">
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Drop-off Location</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Car Location */}
        {car && (
          <Marker coordinate={car} pinColor="blue">
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Ambulance</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker coordinate={userLocation} pinColor="purple">
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Your Location</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Directions Polyline */}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey="AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM"
            strokeWidth={4}
            strokeColor="#FF5733"
            // lineDashPattern={[1, 5]} // Dashed line effect
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    // borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 120,
    alignItems: 'center',
  },
  calloutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#ff4444',
  },
});

export default OrderMap;
