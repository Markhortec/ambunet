import React from 'react';
import { Alert, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { signOutUser } from '../../../redux/userSlice'; // Ensure this is correctly imported
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for local storage management

const Logout = ({ navigation }) => {
  const dispatch = useDispatch();

  // Function to configure Google Sign-In
  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: '387764172656-idiab3d7hchrgkga1lc8g48a9redmb6i.apps.googleusercontent.com', // Ensure you use the correct webClientId
    });
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Google Sign-Out
      await GoogleSignin.signOut(); 
      console.log('Successfully signed out from Google');

      // Redux Sign-Out
      await dispatch(signOutUser());  // Removed unwrap() for debugging purposes
      console.log('Successfully signed out from Redux');

      // Remove role from local storage
      await AsyncStorage.removeItem('userRole');  // Assuming 'role' is the key used to store the role in local storage
      console.log('Role removed from local storage');
        // Remove role from local storage
        await AsyncStorage.removeItem('driverData');  // Assuming 'role' is the key used to store the role in local storage
        console.log('driverData removed from local storage');
      // Navigate to the RoleScreen
      navigation.navigate('RoleScreen');
    } catch (error) {
      console.error('Logout failed:', error);  // Improved error logging
      Alert.alert(
        'Logout Error',
        `An error occurred while logging out. Please try again. Error: ${error.message}`
      );
    }
  };

  // Function to confirm logout with a prompt
  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Do you really want to logout?',
      [
        {
          text: 'No',
          onPress: () => console.log('Logout canceled'),
          style: 'cancel',
        },
        { text: 'Yes', onPress: handleLogout },
      ],
      { cancelable: false }
    );
  };

  // Configure Google Sign-In when the component mounts
  React.useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <Button title="Logout" onPress={confirmLogout} color="#F70000" />
  );
};

export default Logout;
