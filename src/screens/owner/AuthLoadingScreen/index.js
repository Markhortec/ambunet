import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUserInfo } from '../../../redux/userSlice';

const AuthLoadingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = auth().currentUser;

        if (user) {
          const userId = user.uid;
          const userDoc = await firestore().collection('users').doc(userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            dispatch(setUserInfo({ uid: userId, ...userData }));

            // Fetch role from AsyncStorage
            const role = await AsyncStorage.getItem('userRole');

            if (role === 'owner') {
              const businessDoc = await firestore()
                .collection('businesses')
                .where('userId', '==', userId)
                .get();

              if (!businessDoc.empty) {
                navigation.navigate('OwnerTabNavigator');
              } else {
                navigation.navigate('BusinessRegistrationScreen');
              }
            } else if (role === 'user') {
             
                navigation.navigate('HomeScreen');
   
            } else {
              navigation.navigate('RoleScreen');
            }
          } else {
            navigation.navigate('ProfileScreen');
          }
        } else {
          navigation.navigate('RoleScreen');
        }
      } catch (error) {
        console.error('Error checking user data: ', error);
        navigation.navigate('RoleScreen');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [dispatch, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return null;
};

export default AuthLoadingScreen;
