import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Button,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

import LinearGradient from 'react-native-linear-gradient';
const { width } = Dimensions.get('window');

const OwnerDashboardScreen = () => {
  const [numberOfDrivers, setNumberOfDrivers] = useState(0);
  const [numberOfAmbulances, setNumberOfAmbulances] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [onDutyDrivers, setOnDutyDrivers] = useState([]);
  const navigation = useNavigation();

  const handleDriversPress = () => {
    navigation.navigate('DriversList', { companyId });
  };

  const handleAmbulancesPress = () => {
    navigation.navigate('AmbulancesList', { companyId });
  };

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

      const userId = user.uid;

      // Fetch the company ID from the 'businesses' collection
      const businessSnapshot = await firestore()
        .collection('businesses')
        .where('userId', '==', userId)
        .get();

      if (businessSnapshot.empty) {
        throw new Error('No business found for the current user.');
      }

      const businessData = businessSnapshot.docs[0].data();
      if (!businessData.companyId) {
        throw new Error('Company ID not found in the business document.');
      }
      setCompanyId(businessData.companyId);

      // Fetch drivers associated with the company
      const driversSnapshot = await firestore()
        .collection('drivers')
        .where('companyId', '==', businessData.companyId)
        .get();
      setNumberOfDrivers(driversSnapshot.size);

      // Fetch ambulances associated with the company
      const ambulancesSnapshot = await firestore()
        .collection('ambulances')
        .where('companyId', '==', businessData.companyId)
        .get();
      setNumberOfAmbulances(ambulancesSnapshot.size);

      // Combine drivers and ambulances data
      const driversData = driversSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const ambulancesData = ambulancesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Create a mapping of driver IDs to driver data
      const driverMap = new Map(driversData.map((driver) => [driver.id, driver]));

      // Combine data
      const combinedAssignments = ambulancesData.map((ambulance) => {
        const driver = driverMap.get(ambulance.assignedDriver) || {};
        return {
          key: ambulance.id,
          ambulance: ambulance.registrationNumber,
          driver: driver.name || 'Not Assigned',
          driverPhone: driver.phoneNumber || 'N/A',
          driverPhoto: driver.profilePhoto || 'https://via.placeholder.com/100',
          assignedDriver: ambulance.assignedDriver,
        };
      });

      setAssignments(combinedAssignments);

      // Fetch on-duty drivers
      const dutySnapshot = await firestore()
        .collection('duty')
        .where('companyId', '==', businessData.companyId)
        .get();
      const dutyData = dutySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOnDutyDrivers(dutyData);
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
    <LinearGradient
      colors={['#FFFFFF', '#F7F7F7']}
      style={styles.assignmentCard}
    >
      <View style={styles.assignmentContent}>
        <View style={styles.assignmentDetails}>
          <Text style={styles.assignmentTitle}>Ambulance: {item.ambulance}</Text>
          <Text style={styles.assignmentText}>Driver: {item.driver}</Text>
          <Text style={styles.assignmentText}>Driver Phone: {item.driverPhone}</Text>
        </View>
        <View style={styles.driverPhotoContainer}>
          <Image source={{ uri: item.driverPhoto }} style={styles.driverPhoto} />
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
    </LinearGradient>
  );

  const renderOnDutyDriver = ({ item }) => (
    <LinearGradient
      colors={['#FFFFFF', '#F7F7F7']}
      style={styles.onDutyCard}
    >
      <View style={styles.onDutyContent}>
        <View style={styles.onDutyDetails}>
          <Text style={styles.onDutyTitle}>Driver: {item.name}</Text>
          <Text style={styles.onDutyText}>Phone: {item.phone}</Text>
          <Text style={styles.onDutyText}>Ambulance: {item.ambulanceRegNo}</Text>
          <Text style={styles.onDutyText}>Status: {item.status}</Text>
        </View>
        <View style={styles.statusIndicator}>
          <Icon
            name={item.status === 'Online' ? 'checkbox-marked-circle' : 'close-circle'}
            size={24}
            color={item.status === 'Online' ? '#4CAF50' : '#F70000'}
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={['#F70000', '#D60000']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
      </LinearGradient>
      <View style={styles.statsContainer}>
        <TouchableOpacity onPress={handleDriversPress} style={styles.statsCard}>
          <Icon name="account-group" size={40} color="#F70000" style={styles.icon} />
          <Text style={styles.statsCount}>{numberOfDrivers}</Text>
          <Text style={styles.statsLabel}>Drivers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAmbulancesPress} style={styles.statsCard}>
          <Icon name="ambulance" size={40} color="#F70000" style={styles.icon} />
          <Text style={styles.statsCount}>{numberOfAmbulances}</Text>
          <Text style={styles.statsLabel}>Ambulances</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>On-Duty Drivers</Text>
      <FlatList
        data={onDutyDrivers}
        renderItem={renderOnDutyDriver}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.onDutyList}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#F70000" style={styles.loading} />
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={assignments}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          ListFooterComponent={
            <Button title="Refresh Data" onPress={fetchData} color="#F70000" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F70000',
  },
  statsLabel: {
    fontSize: 16,
    color: '#333',
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
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
    color: '#F70000',
    marginBottom: 10,
  },
  assignmentText: {
    fontSize: 14,
    color: '#666',
  },
  driverPhotoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
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
  onDutyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: width * 0.8,
  },
  onDutyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onDutyDetails: {
    flex: 1,
  },
  onDutyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F70000',
    marginBottom: 5,
  },
  onDutyText: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F70000',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  onDutyList: {
    paddingHorizontal: 15,
  },
});

export default OwnerDashboardScreen;