import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Dimensions, 
  Alert, 
  ScrollView, 
  Text, 
  StyleSheet, 
  Image, 
  Pressable, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import haversine from 'haversine-distance';
import Geocoding from 'react-native-geocoding';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { setOrderData } from '../../../redux/orderSlice';
import typesData from '../../../assets/data/types';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

// Initialize Geocoding with your API key
Geocoding.init('AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM');
const GOOGLE_MAPS_APIKEY = 'AIzaSyDxwhQhfS4d_Rn6D32QsiUoAVLkoXCTWmM';
const { width, height } = Dimensions.get('window');

const SearchResults = () => {
  const [type, setType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [originName, setOriginName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState(null);

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const animatedButtonScale = useRef(new Animated.Value(1)).current;

  // Destructure origin & destination details from route params
  const { originPlace, destinationPlace } = route.params;
  const origin = originPlace.details.geometry.location;
  const destination = destinationPlace.details.geometry.location;

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        console.log("Initializing SearchResults Screen...");
        console.log("Route Params:", route.params);

        if (!origin || !destination) {
          const errorMessage = 'Origin or destination is missing.';
          console.error(errorMessage);
          Alert.alert('Error', errorMessage);
          setLoading(false);
          return;
        }

        // Fetch formatted addresses for origin and destination
        console.log("Fetching formatted addresses...");
        const [originRes, destinationRes] = await Promise.all([
          Geocoding.from(origin.lat, origin.lng),
          Geocoding.from(destination.lat, destination.lng)
        ]);
        
        console.log("Origin Geocoding Result:", originRes);
        console.log("Destination Geocoding Result:", destinationRes);

        setOriginName(originRes.results[0]?.formatted_address || 'Unknown Location');
        setDestinationName(destinationRes.results[0]?.formatted_address || 'Unknown Location');

        // Get the current user's data
        console.log("Fetching user data...");
        const user = auth().currentUser;
        if (!user) {
          const errorMessage = 'User not authenticated.';
          console.error(errorMessage);
          Alert.alert('Error', errorMessage);
          setLoading(false);
          navigation.goBack();
          return;
        }
        
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          const errorMessage = 'User data not found.';
          console.error(errorMessage);
          Alert.alert('Error', errorMessage);
          setLoading(false);
          navigation.goBack();
          return;
        }
        
        console.log("User Data:", userDoc.data());
        setUserData(userDoc.data());
        setLoading(false);
      } catch (error) {
        console.error("Error during initialization:", error);
        Alert.alert('Error', `An error occurred: ${error.message}`);
        setLoading(false);
        navigation.goBack();
      }
    };

    initializeScreen();
  }, [navigation, origin, destination, route.params]);

  // Animate the book button when pressed
  const handlePressIn = () => {
    Animated.spring(animatedButtonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedButtonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const calculatePrice = (baseRate) => {
    if (!distance || !baseRate) return 0;
    return parseFloat((baseRate * distance).toFixed(2));
  };
  const handleBookRide = async () => {
    if (!type) {
      Alert.alert('Select Vehicle', 'Please choose a vehicle type to continue');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Booking ride...");
      const user = auth().currentUser;
      const selectedType = typesData.find((t) => t.type === type);
      
      // Create order data. If desired, you can also create a sub-collection (e.g., tracking) later.
      const orderData = {
        user: {
          id: user.uid,
          name: userData.name,
          phone: userData.phoneNumber,
        },
        route: {
          origin: { ...origin, name: originName },
          destination: { ...destination, name: destinationName },
          distance: distance ?? 0,    
          duration: duration ?? 0,    
        },
        vehicle: {
          type: selectedType.type,
          price: calculatePrice(selectedType.baseRatePerKm),
        },
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      console.log("Order Data:", orderData);
      // Create the order in the unified "orders" collection.
      const orderRef = await firestore().collection('orders').add(orderData);
      console.log("Order Reference:", orderRef);
      dispatch(setOrderData({
        orderId: orderRef.id,
        ...orderData,
        createdAt: new Date().toISOString(),
      }));

      navigation.navigate('OrderScreen', {
        id: orderRef.id,
        originPlace,
        destinationPlace,
        originName,
        destinationName,
        distance, // Pass distance
        price: orderData.vehicle.price,        // Pass price correctly
      });
      
    } catch (error) {
      console.error('Order Creation Error:', error);
      Alert.alert('Order Error', `Failed to create order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
    
  // Return an image based on the vehicle type (using the first word)
  const getVehicleImage = (type) => {
    const images = {
      Haice: require('../../../assets/images/a1.png'),
      Every: require('../../../assets/images/a2.png'),
      default: require('../../../assets/images/a3.png'),
    };
    const key = type.split(' ')[0];
    return images[key] || images.default;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Preparing Your Ride Options...</Text>
      </View>
    );
  }

  const originCoords = {
    latitude: origin.lat,
    longitude: origin.lng,
  };
  
  const destinationCoords = {
    latitude: destination.lat,
    longitude: destination.lng,
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: (origin.lat + destination.lat) / 2,
            longitude: (origin.lng + destination.lng) / 2,
            latitudeDelta: Math.abs(origin.lat - destination.lat) * 2, // Increased delta for zoom out
            longitudeDelta: Math.abs(origin.lng - destination.lng) * 2, // Increased delta for zoom out
          }}
          mapPadding={{ top: 0, right: 0, bottom: height * 0.4, left: 0 }}
        >
          <MapViewDirections
            origin={originCoords}
            destination={destinationCoords}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#e74c3c"  // Red route line
            precision="high"
            onReady={(result) => {
              console.log("MapViewDirections onReady:", result);
              if (result.distance === 0 || result.duration === 0) {
                const errorMessage = 'No route found between these locations';
                setRouteError(errorMessage);
                console.error(errorMessage);
                return;
              }
              setDistance(result.distance);
              setDuration(result.duration);
            }}
            onError={(errorMessage) => {
              console.error('Directions error:', errorMessage);
              setRouteError('Could not calculate route. Please check locations');
            }}
          />

          {/* Error Banner */}
          {routeError && (
            <View style={[styles.errorBanner, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="warning" size={20} color="#fff" />
              <Text style={styles.errorText}>{routeError}</Text>
            </View>
          )}

          {/* Origin Marker */}
          <Marker coordinate={originCoords}>
            <View style={[styles.markerBubble, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="location" size={20} color="#fff" />
              <View style={[styles.markerArrow, { backgroundColor: '#e74c3c' }]} />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker coordinate={destinationCoords}>
            <View style={[styles.markerBubble, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="flag" size={18} color="#fff" />
              <View style={[styles.markerArrow, { backgroundColor: '#e74c3c' }]} />
            </View>
          </Marker>
        </MapView>

        {/* Route Info Card */}
        <View style={styles.routeInfoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="speedometer" size={18} color="#e74c3c" />
            <Text style={styles.infoText}>
              {distance ? `${distance.toFixed(1)} km` : '--'}
            </Text>
          </View>
          
          <View style={styles.infoDivider} />
          
          <View style={styles.infoItem}>
            <Ionicons name="time" size={18} color="#e74c3c" />
            <Text style={styles.infoText}>
              {duration ? `${Math.round(duration)} mins` : '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Ride Selection */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Locations Card */}
        <View style={styles.locationsCard}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#e74c3c' }]} />
            <View style={styles.locationTexts}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationValue} numberOfLines={2}>
                {originName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#e74c3c' }]} />
            <View style={styles.locationTexts}>
              <Text style={styles.locationLabel}>Drop-off Location</Text>
              <Text style={styles.locationValue} numberOfLines={2}>
                {destinationName}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Options */}
        <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
        
        {typesData.map((vehicle) => (
          <Pressable
            key={vehicle.id}
            onPress={() => {
                console.log(`Vehicle type selected: ${vehicle.type}`);
                setType(vehicle.type)
              }
            }
            style={({ pressed }) => [
              styles.vehicleCard,
              type === vehicle.type && styles.selectedVehicleCard,
              { opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <Image
              source={getVehicleImage(vehicle.type)}
              style={styles.vehicleImage}
            />
            
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>{vehicle.type}</Text>
              <View style={styles.metaContainer}>
                <Text style={styles.metaText}>
                  <Ionicons name="people" size={14} /> {vehicle.capacity}
                </Text>
                <Text style={styles.metaText}>
                  <Ionicons name="briefcase" size={14} /> {vehicle.luggage}
                </Text>
              </View>
            </View>

            <View style={styles.priceTag}>
              <Text style={styles.priceText}>Rs {calculatePrice(vehicle.baseRatePerKm)}</Text>
            </View>

            {type === vehicle.type && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Book Button */}
      <Animated.View 
        style={[
          styles.bookButtonContainer,
          { transform: [{ scale: animatedButtonScale }] }
        ]}
      >
        <Pressable
          onPress={handleBookRide}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.bookButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.bookButtonText}>Confirm Ride</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',  // White background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Inter-Medium',
  },
  mapContainer: {
    height: height * 0.60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerBubble: {
    backgroundColor: '#e74c3c',  // Red marker bubble
    padding: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerArrow: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  infoDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  locationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationTexts: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 14,
    color: '#95a5a6',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#2c3e50',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  errorBanner: {
    backgroundColor: '#e74c3c',  // Red error banner
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  selectedVehicleCard: {
    borderWidth: 2,
    borderColor: '#e74c3c',  // Red selected border
    backgroundColor: '#f8fbff',
  },
  vehicleImage: {
    width: 80,
    height: 60,
    resizeMode: 'contain',
  },
  vehicleInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Inter-Medium',
    marginRight: 12,
  },
  priceTag: {
    backgroundColor: '#e74c3c',  // Red price tag
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',  // Red selected badge
    borderRadius: 12,
    padding: 4,
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  bookButton: {
    backgroundColor: '#e74c3c',  // Red book button
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});

export default SearchResults;
