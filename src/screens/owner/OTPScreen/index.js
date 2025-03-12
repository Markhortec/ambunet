import React, { useState } from 'react';
import { View, Text,TextInput, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { setUserInfo } from '../../../redux/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTPScreen = ({ navigation }) => {
  const [otp, setOtp] = useState('');
  const confirmResult = useSelector((state) => state.user.confirmResult);
  const dispatch = useDispatch();

  const onSubmit = async () => {
    if (otp.length === 6 && confirmResult) {
      const verificationId = confirmResult;
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);

      try {
       
        const userCredential = await auth().signInWithCredential(credential);
        const user = userCredential.user;

        const userDoc = await firestore().collection('users').doc(user.uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(userData)
          const userRole = userData.role; 
          const roleSelection = await AsyncStorage.getItem('userRole'); 

          // Handle role changes or navigation based on existing user document
          if (roleSelection === 'User' && userRole === 'Owner') {
              await firestore().collection('users').doc(uid).update({ role: 'User' });
              await AsyncStorage.setItem('userRole', 'User');
              const querySnapshot = await firestore().collection('businesses').where('userId', '==', uid).get();

              if (!querySnapshot.empty) {
                  navigation.navigate("OwnerTabNavigator");
              } else {
                  navigation.navigate("BusinessRegistrationScreen", { userId: uid });
              }
          } else if (roleSelection === 'Owner' && userRole === 'User') {
              await firestore().collection('users').doc(uid).update({ role: 'Owner' });
              await AsyncStorage.setItem('userRole', 'Owner');
              const querySnapshot = await firestore().collection('businesses').where('userId', '==', uid).get();

              if (!querySnapshot.empty) {
                  navigation.navigate("OwnerTabNavigator");
              } else {
                  navigation.navigate("BusinessRegistrationScreen", { userId: uid });
              }
          } else if (roleSelection === 'User' && userRole === 'User') {
       
              await AsyncStorage.setItem('userRole', 'User');
              navigation.navigate("HomeScreen");
          } else if (roleSelection === 'Owner' && userRole === 'Owner') {
             
              await AsyncStorage.setItem('userRole', 'Owner');
              navigation.navigate("OwnerTabNavigator");
          } else if (userRole === 'User') {
              await AsyncStorage.setItem('userRole', 'User');
              navigation.navigate("UserHomeScreen");
          }
          // navigation.navigate('OwnerTabNavigator', {
          //   screen: 'OwnerHomeScreen',
          // });
        } else {
          
          dispatch(setUserInfo({ uid: user.uid, phoneNumber: user.phoneNumber }));
          navigation.navigate('ProfileScreen');
        }
      } catch (error) {
        Alert.alert('Invalid OTP', 'Please enter a valid OTP.');
      }
    } else {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <Icon name="phone" size={50} color="#FC1501" style={styles.icon} />
      <Text style={styles.title}>Enter the OTP sent to your phone</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        placeholder="123456"
      />
      <TouchableOpacity onPress={onSubmit} disabled={otp.length !== 6}>
        <View style={[styles.button, { backgroundColor: otp.length === 6 ? '#FC1501' : '#DDDDDD' }]}>
          <Text style={styles.buttonText}>Verify</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F6F6',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    elevation: 2, 
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OTPScreen;
