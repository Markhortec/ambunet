import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from '../../../redux/userSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Assuming you are using react-native-vector-icons
import LinearGradient from 'react-native-linear-gradient';

const OwnerHomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const userName = useSelector((state) => state.user.userInfo?.name); 
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await dispatch(fetchUserData()); // Fetch user data
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data: ', error);
        setLoading(false);
      }
    };
    loadUserData();
  }, [dispatch]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F70000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <View>
        <LinearGradient colors={['#F70000', '#D60000']} style={styles.header}>
          <Text style={styles.headerTitle}>Owner Home</Text>
        </LinearGradient>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.welcomeText}>Welcome, {userName || 'Owner'}!</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AddDriverScreen')}
          >
            <Icon name="account-plus" size={50} color="#F70000" />
            <Text style={styles.gridText}>Add Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AddAmbulanceScreen')}
          >
            <Icon name="ambulance" size={50} color="#F70000" />
            <Text style={styles.gridText}>Add Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AssignAmbulanceScreen')}
          >
            <Icon name="account-convert" size={50} color="#F70000" />
            <Text style={styles.gridText}>Assign Ambulance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
  mainContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  gridItem: {
    width: '45%',
    height: 150,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gridText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default OwnerHomeScreen;
