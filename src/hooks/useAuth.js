// hooks/useAuth.js
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUserInfo, setDriverInfo } from '../redux/userSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          const userDoc = await firestore().collection('users').doc(userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            dispatch(setUserInfo({ uid: userId, ...userData }));
            setUser(userData);

            const storedRole = await AsyncStorage.getItem('userRole');
            setRole(storedRole);
          }
        }
      } catch (error) {
        console.error('Error checking user data: ', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [dispatch]);

  return { user, role, loading };
};