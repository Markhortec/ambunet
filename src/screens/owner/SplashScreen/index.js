import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUserInfo } from '../../../redux/userSlice';

const SplashScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          setTimeout(() => {
            navigation.replace('RoleScreen');
          }, 3000);
          return;
        }

        const userId = user.uid;
        const userDoc = await firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
          // If user document does not exist, delay navigation to ProfileScreen
          setTimeout(() => {
            navigation.replace('ProfileScreen', { userId: userId });
          }, 3000);
          return;
        }

        const userData = userDoc.data();
        dispatch(setUserInfo({ uid: userId, ...userData }));

        
        const firestoreRole = userData.role;
        const asyncRole = await AsyncStorage.getItem('userRole');

        // Proceed only if roles are defined
        if (!firestoreRole || !asyncRole) {
          setTimeout(() => {
            navigation.replace('RoleScreen');
          }, 3000);
          return;
        }

        // Match roles and delay navigation based on role
        if (firestoreRole === asyncRole) {
          setTimeout(() => {
            handleNavigationBasedOnRole(firestoreRole, userId);
          }, 3000);
        } else {
          setTimeout(() => {
            navigation.replace('RoleScreen');
          }, 3000); 
        }
      } catch (error) {
        console.error('Error checking user data: ', error);
        Alert.alert('Error', 'An error occurred while checking user data. Please try again.');
        setTimeout(() => {
          navigation.replace('RoleScreen');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkUser(); 
  }, [dispatch, navigation]);
  useEffect(() => {
    const driverCheck = async () => {
        try {
            
            const storedDriver = await AsyncStorage.getItem('driverData');
            // console.log('Stored driver data:', storedDriver);  // Log the retrieved driver data

            if (storedDriver) {
                const driverData = JSON.parse(storedDriver);
                const { driverId } = driverData; 
                // console.log('Retrieved driverId:', driverId);  // Log the driverId

            
                const driverDoc = await firestore()
                    .collection('drivers')
                    .doc(driverId)  
                    .get();

                // console.log('Driver document:', driverDoc.exists ? 'Found' : 'Not found');  // Log Firestore query result
                
                if (driverDoc.exists) {
                   
                    // console.log('Driver found in Firestore, dispatching driver info');
                    dispatch(setDriverInfo(driverData));

                  
                   
                        // console.log('Navigating to DHomeScreen');
                        navigation.replace('DHomeScreen');  // Navigate directly to the driver home screen
                    
                } 
            } 
        } catch (error) {
            // console.error('Error in driverCheck:', error);  // Log any errors that occur in the try block
            // Alert.alert('Error', 'Failed to retrieve driver data. Please try again later.');
        }
    };

    driverCheck();
}, [dispatch]);

  const handleNavigationBasedOnRole = async (role, userId) => {
    console.log('Navigating based on role:', role); 
    console.log('User ID:', userId); 
  
    if (role === 'Owner') {
      const businessDoc = await firestore()
        .collection('businesses')
        .where('userId', '==', userId)
        .get();
  
      console.log('Business document:', businessDoc); 
  
      if (!businessDoc.empty) {
        navigation.replace('OwnerTabNavigator');
      } else {
        navigation.replace('BusinessRegistrationScreen');
      }
    } else if (role === 'User') {
        navigation.replace('HomeScreen');
    } else {
      console.log('Unexpected role:', role); 
      navigation.replace('RoleScreen'); 
    }
  };
  
  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('../../../../assets/images/4.png')} />
      <Text style={styles.text}>AmbuNet</Text>
      {loading && <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF030D',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
