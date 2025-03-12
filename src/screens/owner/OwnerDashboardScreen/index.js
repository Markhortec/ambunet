import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, Button, ActivityIndicator, Alert } from 'react-native';
import { Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const OwnerDashboardScreen = () => {
  const [numberOfDrivers, setNumberOfDrivers] = useState(0);
  const [numberOfAmbulances, setNumberOfAmbulances] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [companyId, setCompanyId] = useState(null); // State to store company ID

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No user is currently signed in.');
      }

      const userId = user.uid; // Get the current user's ID

      // Fetch the company ID from the 'businesses' collection using the userId as a foreign key
      const businessSnapshot = await firestore().collection('businesses')
        .where('userId', '==', userId) // Filter businesses by user ID
        .get();

      if (businessSnapshot.empty) {
        throw new Error('No business found for the current user.');
      }

      const businessData = businessSnapshot.docs[0].data();
      if (!businessData.companyId) {
        throw new Error('Company ID not found in the business document.');
      }
      setCompanyId(businessData.companyId); // Set companyId from business document

      // Fetch drivers associated with the company
      const driversSnapshot = await firestore().collection('drivers')
        .where('companyId', '==', businessData.companyId) // Filter drivers by company ID
        .get();
      setNumberOfDrivers(driversSnapshot.size);

      // Fetch ambulances associated with the company
      const ambulancesSnapshot = await firestore().collection('ambulances')
        .where('companyId', '==', businessData.companyId) // Filter ambulances by company ID
        .get();
      setNumberOfAmbulances(ambulancesSnapshot.size);

      // Combine drivers and ambulances data
      const driversData = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ambulancesData = ambulancesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Create a mapping of driver IDs to driver data
      const driverMap = new Map(driversData.map(driver => [driver.id, driver]));

      // Combine data
      const combinedAssignments = ambulancesData.map(ambulance => {
        const driver = driverMap.get(ambulance.assignedDriver) || {};
        return {
          key: ambulance.id,
          ambulance: ambulance.registrationNumber,
          driver: driver.name || 'Not Assigned',
          driverPhone: driver.phoneNumber || 'N/A',
          driverPhoto: driver.profilePhoto || 'https://via.placeholder.com/100',
          assignedDriver: ambulance.assignedDriver
        };
      });

      setAssignments(combinedAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const unassignDriver = async (ambulanceId, driverId) => {
    try {
      await firestore().collection('ambulances').doc(ambulanceId).update({
        assignedDriver: firestore.FieldValue.delete(),
      });

      await firestore().collection('drivers').doc(driverId).update({
        assignedAmbulance: firestore.FieldValue.delete(),
      });

      // Fetch updated data
      fetchData();
      Alert.alert('Success', 'Assignment removed successfully.');
    } catch (error) {
      console.error('Error unassigning driver:', error);
      Alert.alert('Error', 'Failed to remove assignment. Please try again later.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentContent}>
        <View style={styles.assignmentDetails}>
          <Text style={styles.assignmentTitle}>Ambulance: {item.ambulance}</Text>
          <Text>Driver: {item.driver}</Text>
          <Text>Driver Phone: {item.driverPhone}</Text>
        </View>
        <View style={styles.driverPhotoContainer}>
          <Image
            source={{ uri: item.driverPhoto }}
            style={styles.driverPhoto}
          />
        </View>
      </View>
      {item.assignedDriver && (
        <TouchableOpacity
          style={styles.unassignButton}
          onPress={() => unassignDriver(item.key, item.assignedDriver)}
        >
          <Text style={styles.unassignButtonText}>Unassign</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <Icon name="account-group" size={50} color="#F70000" style={styles.icon} />
        <Text style={styles.statsCount}>{numberOfDrivers}</Text>
        <Text style={styles.statsLabel}>Drivers</Text>
      </View>
      <View style={styles.statsCard}>
        <Icon name="ambulance" size={50} color="#F70000" style={styles.icon} />
        <Text style={styles.statsCount}>{numberOfAmbulances}</Text>
        <Text style={styles.statsLabel}>Ambulances</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loading} />
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={assignments}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          ListFooterComponent={
            <Button title="Refresh Data" onPress={fetchData} color="#007BFF" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    marginBottom: 10,
  },
  statsCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F70000',
  },
  statsLabel: {
    fontSize: 16,
    color: '#333',
  },
  assignmentCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  assignmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignmentDetails: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  driverPhotoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0', // Placeholder color if image doesn't load
  },
  unassignButton: {
    backgroundColor: '#F70000',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  unassignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OwnerDashboardScreen;
