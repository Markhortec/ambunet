import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUserInfo } from '../../../redux/userSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RoleScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const navigationRef = useRef(null); // Initialize the navigation ref
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Load saved role from AsyncStorage on component mount
  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          setSelectedRole(storedRole);
          console.log('Loaded role from AsyncStorage:', storedRole); 
        }
      } catch (error) {
        console.error('Failed to load role from AsyncStorage:', error);
      }
    };

    loadRole();
  }, []);

  

  // Handle role selection
  const handleRoleSelection = async (role) => {
    try {
      // Store the selected role in AsyncStorage
      await AsyncStorage.setItem('userRole', role);
      console.log('Saved role to AsyncStorage:', role); 

      // Update Redux state with the selected role
      dispatch(setUserInfo({ role }));
      console.log('Role dispatched to Redux:', role); 

      setSelectedRole(role); // Update local state with the selected role

      // Navigate to the appropriate screen based on the selected role
      if (role === 'User' || role === 'Owner') {
        navigation.navigate('RegistrationScreen');
      } else if (role === 'Driver') {
        navigation.navigate('DriverLoginScreen');
      }
    } catch (error) {
      console.error('Failed to save role to AsyncStorage:', error);
    }
  };

  // Show loading spinner
  if (!loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Select Your Role</Text>
       <Text style={styles.sub1Text}>Choose how you'd like to use our platform</Text>
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[styles.gridItem, selectedRole === 'User' && styles.selectedItem]}
          onPress={() => handleRoleSelection('User')}
        >
          <Icon name="account" size={50} color="#F70000" />
          <Text style={styles.gridText}>User</Text>
          <Text style={styles.subText}>Book services as a customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridItem, selectedRole === 'Driver' && styles.selectedItem]}
          onPress={() => handleRoleSelection('Driver')}
        >
          <Icon name="car" size={50} color="#F70000" />
          <Text style={styles.gridText}>Driver</Text>
           <Text style={styles.subText}>Deliver services and earn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridItem, selectedRole === 'Owner' && styles.selectedItem]}
          onPress={() => handleRoleSelection('Owner')}
        >
          <Icon name="office-building" size={50} color="#F70000" />
          <Text style={styles.gridText}>Register Your Business</Text>
          <Text style={styles.subText}>Manage your services</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F70000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'white',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap:'nowrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  gridItem: {
    width: '50%',
    height: 170,
    backgroundColor: '#FFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedItem: {
    borderColor: '#F70000',
    borderWidth: 2,
  },
  gridText: {
    marginTop: 10,
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
    subText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  sub1Text: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F70000',
  },
});

export default RoleScreen;
