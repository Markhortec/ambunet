import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Dimensions, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import OrderMap from '../../../components/user/OrderMap';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const OrderScreen = () => {
  const [order, setOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();

  const { id, originPlace, destinationPlace, originName, destinationName, distance, price } = route.params;

  // Extract and validate origin coordinates
  const originLatitude = originPlace?.details?.geometry?.location?.lat;
  const originLongitude = originPlace?.details?.geometry?.location?.lng;
  const origin = { latitude: originLatitude, longitude: originLongitude };

  // Extract destination coordinates
  const destinationLatitude = destinationPlace?.details?.geometry?.location?.lat;
  const destinationLongitude = destinationPlace?.details?.geometry?.location?.lng;
  const destination = { latitude: destinationLatitude, longitude: destinationLongitude };

  // Listen to the order document for real-time updates.
  useEffect(() => {
    const unsubscribeOrder = firestore()
      .collection('orders')
      .doc(id)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setOrder(data);
          // Navigate to UserTrack if the order is accepted.
          if (data.status === 'Accepted') {
            navigation.navigate('UserTrack', { orderId: id });
          }
        }
        setLoading(false);
      }, error => {
        console.error('Error fetching order:', error);
        setLoading(false);
      });
    
    return () => unsubscribeOrder();
  }, [id, navigation]);

  // Fetch nearby drivers (ambulances) within a 7 km radius.
  useEffect(() => {
    if (!origin.latitude || !origin.longitude) {
      console.warn('Origin coordinates are missing');
      return;
    }

    const unsubscribeDrivers = firestore()
      .collection('onDuty')
      .where('status', '==', 'Online')
      .onSnapshot(snapshot => {
        const driversData = [];
        snapshot.forEach(doc => {
          const driver = doc.data();
          if (driver.latitude && driver.longitude) {
            const distanceCalc = calculateDistance(
              origin.latitude,
              origin.longitude,
              driver.latitude,
              driver.longitude
            );
            // Debug log to help determine the computed distance.
            console.log(`Driver ${driver.ambulanceRegNo}: ${distanceCalc.toFixed(2)} km away`);

            if (distanceCalc <= 7) {
              driversData.push({
                ...driver,
                id: doc.id,
                distance: distanceCalc.toFixed(2)
              });
            }
          }
        });
        setDrivers(driversData);
      }, error => {
        console.error('Error fetching drivers:', error);
      });

    return () => unsubscribeDrivers();
  }, [origin.latitude, origin.longitude]);

  // Confirm cancellation using an alert dialog.
  const confirmCancelOrder = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel your booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await firestore().collection('orders').doc(id).delete();
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
              navigation.navigate('HomeScreen');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel the booking.');
            }
          } 
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <OrderMap origin={origin} destination={destination} drivers={drivers} />
      </View>

      {/* Order Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={styles.detailValue}>{order?.status || 'Loading...'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>Rs {price}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance:</Text>
          <Text style={styles.detailValue}>{distance} km</Text>
        </View>
      </View>

      {/* Location Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pickup:</Text>
          <Text style={styles.detailValue}>{originName || 'Loading...'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Drop-off:</Text>
          <Text style={styles.detailValue}>{destinationName || 'Loading...'}</Text>
        </View>
      </View>

      {/* Nearby Drivers Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Available Ambulances (7km)</Text>
        {drivers.length === 0 ? (
          <Text style={styles.noDriversText}>No ambulances available in your area</Text>
        ) : (
          drivers.map(driver => (
            <View key={driver.ambulanceRegNo} style={styles.driverCard}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverDetail}>Reg: {driver.ambulanceRegNo}</Text>
              <Text style={styles.driverDetail}>Distance: {driver.distance} km</Text>
              <Text style={styles.driverDetail}>Contact: {driver.phone}</Text>
            </View>
          ))
        )}
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={confirmCancelOrder}>
        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5'
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
  mapContainer: {
    height: Dimensions.get('window').height * 0.6, 
    backgroundColor: '#E0E0E0'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden'
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  detailRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10
  },
  detailLabel: { fontSize: 14, color: '#666', flex: 1, textAlign: 'left' },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },
  driverCard: {
    backgroundColor: '#F9F9F9', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 10
  },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  driverDetail: { fontSize: 14, color: '#666', marginTop: 4 },
  noDriversText: {
    fontSize: 14, 
    color: '#666', 
    fontStyle: 'italic', 
    textAlign: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF4444', 
    borderRadius: 10, 
    padding: 15,
    marginHorizontal: 15, 
    marginTop: 10, 
    alignItems: 'center'
  },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});

export default OrderScreen;
