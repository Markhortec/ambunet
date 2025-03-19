import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';

import styles from './styles.js';
import PlaceRow from './placeRow';

navigator.geolocation = require('react-native-geolocation-service');

const homePlace = {
  description: 'Home',
  geometry: { location: { lat: 33.6335, lng: 73.0699 } },
};

const workPlace = {
  description: 'Work',
  geometry: { location: { lat: 31.8492, lng: 79.0619 } },
};

const DestinationSearch = (props) => {
  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);

  const navigation = useNavigation();

  const checkNavigation = () => {
    if (originPlace && destinationPlace) {
      if (originPlace.data.place_id === destinationPlace.data.place_id) {
        Alert.alert('Please select different pickup and drop-off locations.');
      } else {
        navigation.navigate('SearchResults', {
          originPlace,
          destinationPlace,
        });
      }
    }
  };

  // The check should be done after both origin and destination are selected.
  useEffect(() => {
    if (originPlace && destinationPlace) {
      checkNavigation();
    }
  }, [originPlace, destinationPlace]);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* Origin Place */}
        <GooglePlacesAutocomplete
          placeholder="Where from?"
          onPress={(data, details = null) => {
            setOriginPlace({ data, details });
          }}
          enablePoweredByContainer={false}
          suppressDefaultStyles
          currentLocation={true}
          currentLocationLabel="Current location"
          styles={{
            textInput: styles.textInput,
            container: styles.autocompleteContainer,
            listView: styles.listView,
            separator: styles.separator,
          }}
          fetchDetails
          query={{
            key: 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM',
            language: 'en',
            components: 'country:pk',
          }}
          renderRow={(data) => <PlaceRow data={data} />}
          renderDescription={(data) => data.description || data.vicinity}
          predefinedPlaces={[homePlace, workPlace]}
        />

        {/* Destination Place */}
        <GooglePlacesAutocomplete
          placeholder="Where to?"
          onPress={(data, details = null) => {
            setDestinationPlace({ data, details });
          }}
          enablePoweredByContainer={false}
          suppressDefaultStyles
          styles={{
            textInput: styles.textInput,
            container: {
              ...styles.autocompleteContainer,
              top: 55,
            },
            separator: styles.separator,
          }}
          fetchDetails
          query={{
            key: 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM',
            language: 'en',
            components: 'country:pk',
          }}
          renderRow={(data) => <PlaceRow data={data} />}
        />

        {/* Circle near Origin input */}
        <View style={styles.circle} />

        {/* Line between dots */}
        <View style={styles.line} />

        {/* Square near Destination input */}
        <View style={styles.square} />
      </View>
    </SafeAreaView>
  );
};

export default DestinationSearch;
