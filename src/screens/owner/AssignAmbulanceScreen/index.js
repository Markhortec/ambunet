import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, LogBox } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AssignAmbulanceScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');

  // Ignore all log notifications
  //LogBox.ignoreAllLogs();

  useEffect(() => {
    const fetchCompanyIdAndData = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          throw new Error('No user is currently signed in.');
        }
        const userId = user.uid;

        // Fetch companyId from Firestore using the userId
        const businessesSnapshot = await firestore()
          .collection('businesses')
          .where('userId', '==', userId)
          .get();

        if (!businessesSnapshot.empty) {
          const companyData = businessesSnapshot.docs[0].data();
          setCompanyId(businessesSnapshot.docs[0].id);

          // Fetch drivers
          const driversSnapshot = await firestore()
            .collection('drivers')
            .where('companyId', '==', businessesSnapshot.docs[0].id)
            .get();

          const driversData = driversSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Fetch ambulances
          const ambulancesSnapshot = await firestore()
            .collection('ambulances')
            .where('companyId', '==', businessesSnapshot.docs[0].id)
            .get();

          const ambulancesData = ambulancesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Filter out assigned drivers and ambulances
          const unassignedDrivers = driversData.filter(driver => !driver.assignedAmbulance);
          const unassignedAmbulances = ambulancesData.filter(ambulance => !ambulance.assignedDriver);

          setDrivers(unassignedDrivers);
          setAmbulances(unassignedAmbulances);
        } else {
          console.log('No business found for user ID', userId);
          Alert.alert('Error', 'No business found. Please ensure your account is linked to a business.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to fetch data from Firestore. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyIdAndData();
  }, []);

  const assignAmbulance = async () => {
    if (selectedDriver && selectedAmbulance) {
      try {
        // Update the driver document to include the assigned ambulance
        await firestore().collection('drivers').doc(selectedDriver).update({
          assignedAmbulance: selectedAmbulance,
        });

        // Update the ambulance document to include the assigned driver
        await firestore().collection('ambulances').doc(selectedAmbulance).update({
          assignedDriver: selectedDriver,
        });

        // Fetch updated data to reflect changes
        const driversSnapshot = await firestore()
          .collection('drivers')
          .where('companyId', '==', companyId)
          .get();

        const driversData = driversSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const ambulancesSnapshot = await firestore()
          .collection('ambulances')
          .where('companyId', '==', companyId)
          .get();

        const ambulancesData = ambulancesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const unassignedDrivers = driversData.filter(driver => !driver.assignedAmbulance);
        const unassignedAmbulances = ambulancesData.filter(ambulance => !ambulance.assignedDriver);

        setDrivers(unassignedDrivers);
        setAmbulances(unassignedAmbulances);

        Alert.alert('Success', `Ambulance ${selectedAmbulance} assigned to driver ${selectedDriver}!`);
      } catch (error) {
        console.error('Error assigning ambulance:', error);
        Alert.alert('Error', 'Failed to assign ambulance. Please try again later.');
      }
    } else {
      Alert.alert('Error', 'Please select both a driver and an ambulance.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F70000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.title}>Assign Ambulance</Text>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Icon name="account" size={20} color="#555" style={styles.icon} />
            <Text style={styles.label}>Select Driver</Text>
          </View>
          <Picker
            selectedValue={selectedDriver}
            onValueChange={(itemValue) => setSelectedDriver(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Driver" value="" />
            {drivers.map(driver => (
              <Picker.Item key={driver.id} label={driver.name} value={driver.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Icon name="ambulance" size={20} color="#555" style={styles.icon} />
            <Text style={styles.label}>Select Ambulance</Text>
          </View>
          <Picker
            selectedValue={selectedAmbulance}
            onValueChange={(itemValue) => setSelectedAmbulance(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Ambulance" value="" />
            {ambulances.map(ambulance => (
              <Picker.Item key={ambulance.id} label={ambulance.registrationNumber} value={ambulance.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.assignButton} onPress={assignAmbulance}>
          <Text style={styles.assignButtonText}>Assign Ambulance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  mainContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  picker: {
    height: 50,
    borderColor: '#B0BEC5',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  assignButton: {
    backgroundColor: '#F70000',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 2,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AssignAmbulanceScreen;
