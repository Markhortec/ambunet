import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

// Replace with your valid API key
const GOOGLE_MAPS_APIKEY = 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM'; 

const RouteMap = ({ origin, destination }) => {
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  // Validate origin and destination
  if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
    console.error("Origin or Destination is missing or invalid");
    return null; // Don't render if data is missing or invalid
  }

  // Adjusted zoom level for the map
  const latitudeDelta = Math.abs(destination.latitude - origin.latitude) + 0.02; 
  const longitudeDelta = Math.abs(destination.longitude - origin.longitude) + 0.02; 

  const initialRegion = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta,
    longitudeDelta,
  };

  // Light map style
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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        initialRegion={initialRegion}
        showsTraffic={true}
        rotateEnabled={true}
        customMapStyle={lightMapStyle} // Apply custom map style here
      >
        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={3.5}
          strokeColor="black"
          precision="high"
          onReady={(result) => {
            setDistance(result.distance);
            setDuration(result.duration);
          }}
          onError={(errorMessage) => {
            console.error("Error fetching directions:", errorMessage);
            alert("Error fetching directions: " + errorMessage);
          }}
        />

        {/* Markers for Origin and Destination */}
        <Marker coordinate={origin} title="Origin" description="Starting point of the route" />
        <Marker coordinate={destination} title="Destination" description="Ending point of the route" />
      </MapView>

      {/* Distance and Duration Information */}
      {distance && duration && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Distance: {distance.toFixed(2)} km</Text>
          <Text style={styles.infoText}>Estimated Time: {Math.round(duration)} min</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  infoBox: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 15,
    borderRadius: 10,
    zIndex: 1,
  },
  infoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RouteMap;
