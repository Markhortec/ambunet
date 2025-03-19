import React, { useEffect, useState, useRef } from 'react';
import { Modal, FlatList, Alert, View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { useDispatch } from 'react-redux';
import { setConfirmResult, setUserInfo } from '../../../redux/userSlice';
import auth from '@react-native-firebase/auth';
import { Countries } from '../../../components/owner/Countries';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


const RegistrationScreen = ({ navigation }) => {
  const textInput = useRef(null);
  const defaultCountryCode = '+92';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [focusInput, setFocusInput] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [dataCountries, setDataCountries] = useState(Countries);
  const [codeCountry, setCodeCountry] = useState(defaultCountryCode);
  const [placeHolder, setPlaceHolder] = useState('');
  const [isValidNumber, setIsValidNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  GoogleSignin.configure({
    webClientId: '387764172656-idiab3d7hchrgkga1lc8g48a9redmb6i.apps.googleusercontent.com',
  });
  useEffect(() => {
    const defaultCountry = Countries.find(country => country.dial_code === defaultCountryCode);
    setPlaceHolder(defaultCountry ? defaultCountry.emoji : '');
  }, []);

  const onPressContinue = () => {
    if (isValidNumber) {
      const fullPhoneNumber = `${codeCountry}${phoneNumber}`;
      auth().signInWithPhoneNumber(fullPhoneNumber)
        .then((result) => {
          dispatch(setConfirmResult({ verificationId: result.verificationId }));
          dispatch(setUserInfo({ phoneNumber: fullPhoneNumber }));
          navigation.navigate('OTPScreen');
        })
        .catch(error => {
          console.error('Phone number authentication error: ', error);
          handleAuthError(error);
        });
    } else {
      showAlert('Invalid phone number. Please check the format and try again.');
    }
  };

  const handleAuthError = (error) => {
    if (error.code === 'auth/too-many-requests') {
      showAlert('We have detected unusual activity. Please try again later.');
    } else if (error.code === 'auth/missing-or-invalid-session-info') {
      showAlert('Session information is missing or invalid. Please try again.');
    } else {
      showAlert('Failed to send verification code. Please try again.');
    }
  };
  
const onGoogleButtonPress = async () => {
  setLoading(true);
  try {
      // Check for Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken;

      if (!idToken) {
          throw new Error("Failed to retrieve idToken from Google Sign-In.");
      }

      // Create a Google credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;

      const { email, displayName, photoURL, uid } = user;

      // Dispatch user info to state
      dispatch(setUserInfo({
          email: email || null,
          name: displayName || null,
          photo: photoURL || null,
          uid: uid,
      }));

      // Check if user document exists in Firestore
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (userDoc.exists) {
          const userData = userDoc.data();
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
              // If both the role selection and user role are "User"
              await AsyncStorage.setItem('userRole', 'User');
              navigation.navigate("HomeScreen");
          } else if (roleSelection === 'Owner' && userRole === 'Owner') {
              // If both the role selection and user role are "Owner"
              await AsyncStorage.setItem('userRole', 'Owner');
              navigation.navigate("OwnerTabNavigator");
          } else if (userRole === 'User') {
              await AsyncStorage.setItem('userRole', 'User');
              navigation.navigate("UserHomeScreen");
          }
      } else {
          // If no user document exists, create a new user document in Firestore
          const fetchedRole = (await AsyncStorage.getItem('userRole')) ?? 'User';
          await firestore().collection('users').doc(uid).set({
              email,
              displayName,
              photoURL,
              uid,
              createdAt: firestore.FieldValue.serverTimestamp(),
              role: fetchedRole, 
          });

          // Store the fetched role in AsyncStorage
          await AsyncStorage.setItem('userRole', fetchedRole);

          // Navigate to ProfileScreen for further details
          navigation.navigate("ProfileScreen", {
              user: {
                  uid,
                  email,
                  displayName,
                  photoURL,
              },
          });
      }
  } catch (error) {
      console.log("Error during Google Sign-In: ", error);
      Alert.alert('Sign-In Error', error.message || 'An error occurred during sign-in. Please try again.');
  } finally {
      setLoading(false);
  }
};



const renderGoogleSignInButton = () => (
  <TouchableOpacity
    style={[styles.googleButtonContainer, styles.elevatedButton]}
    onPress={onGoogleButtonPress}
    disabled={loading}
  >
    <View style={[styles.customGoogleButton, loading && styles.disabledButton]}>
      {loading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      )}
    </View>
  </TouchableOpacity>
);

  const onChangePhone = (number) => {
    if (number === '' || /^[0-9\b]+$/.test(number)) {
      setPhoneNumber(number);
      validatePhoneNumber(number);
    }
  };

  const validatePhoneNumber = (number) => {
    const fullPhoneNumber = `${codeCountry}${number}`;
    const phoneNumberParsed = parsePhoneNumberFromString(fullPhoneNumber);
    setIsValidNumber(phoneNumberParsed?.isValid() || false);
  };

  const onShowHideModal = () => {
    setModalVisible(!modalVisible);
  };

  const showAlert = (message) => {
    Alert.alert('Alert', message, [{ text: 'OK', onPress: () => { } }]);
  };

  const filterCountries = (value) => {
    if (value) {
      const countryData = Countries.filter((obj) =>
        obj.dial_code.includes(value) || obj.name.toLowerCase().includes(value.toLowerCase())
      );
      setDataCountries(countryData);
    } else {
      setDataCountries(Countries);
    }
  };

  const onCountryChange = (item) => {
    setCodeCountry(item.dial_code);
    setPlaceHolder(item.emoji);
    onShowHideModal();
    validatePhoneNumber(phoneNumber);
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity onPress={() => onCountryChange(item)} style={styles.countryItem}>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.dial_code}</Text>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={onShowHideModal}
    >
      <View style={styles.modalContainer}>
        <TextInput
          placeholder="Search country code"
          style={styles.searchInput}
          onChangeText={filterCountries}
        />
        <FlatList
          data={dataCountries}
          keyExtractor={(item) => item.code}
          renderItem={renderCountryItem}
        />
        <TouchableOpacity onPress={onShowHideModal} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.whiteBackground} />
      <View style={styles.redBackground} />
      <KeyboardAvoidingView
        keyboardVerticalOffset={50}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.containerAvoidingView}
      >
        <Text style={styles.text}>Please Enter Your Phone Number</Text>
        <View style={[styles.containerInput, { borderBottomColor: focusInput ? '#FF030D' : '#DAD7D7' }]}>
          <TouchableOpacity onPress={onShowHideModal}>
            <View style={styles.openDialogueView}>
              <Text style={styles.countryCodeText}>{codeCountry}</Text>
              <Text style={styles.emojiStyle}>{placeHolder}</Text>
            </View>
          </TouchableOpacity>
          <TextInput
            ref={textInput}
            style={styles.phoneInputStyle}
            placeholder="Enter phone number"
            keyboardType="numeric"
            value={phoneNumber}
            onChangeText={onChangePhone}
            onFocus={() => setFocusInput(true)}
            onBlur={() => setFocusInput(false)}
          />
        </View>
        {phoneNumber.length > 0 && (
          <Text style={[styles.validationText, { color: isValidNumber ? 'green' : 'red' }]}>
            {isValidNumber ? 'Valid phone number' : 'Invalid phone number'}
          </Text>
        )}
        <View style={styles.orContainer}>
          <Text style={styles.orText}>OR</Text>
        </View>
        {renderGoogleSignInButton()}
        <View style={styles.viewBottom}>
          <TouchableOpacity onPress={onPressContinue} disabled={!isValidNumber}>
            <View style={[styles.btnContinue, { backgroundColor: isValidNumber ? '#FF030D' : '#DAD7D7' }]}>
              <Text style={styles.continueText}>Continue</Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {renderModal()}
    </View>
  );
};



const styles = StyleSheet.create({
  // Your styles remain unchanged here
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  redBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#FC1501',
  },
  whiteBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: 'white',
  },
  containerAvoidingView: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    width: '100%',
    zIndex: 1,
  },
  text: {
    color: 'white',
    marginBottom: 50,
    marginTop: 50,
    fontSize: 20,
    fontFamily: 'Roboto-Medium',
  },
  containerInput: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 2,
    height: 60,
    width: '100%',
  },
  openDialogueView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    color: '#00F700',
  },
  emojiStyle: {
    fontSize: 24,
    marginLeft: 5,
  },
  phoneInputStyle: {
    marginLeft: 5,
    flex: 1,
    height: 50,
    fontSize: 18,
  },
  validationText: {
    fontSize: 14,
    marginTop: 10,
    fontFamily: 'Roboto-Regular',
  },
  btnContinue: {
    alignItems: 'center',
    borderRadius: 10,
    width: '100%',
    height: 50,
    justifyContent: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
  },
  viewBottom: {
    width: '100%',
    position: 'absolute',
    bottom: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    width: '100%',
  },
  countryName: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: 'gray',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'lightgray',
    borderRadius: 5,
  },
  closeText: {
    fontSize: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 50,
  },
  orText: {
    fontSize: 16,
    color: '#fff',
  },
  googleButtonContainer: {
    width: '100%',
    marginTop: 50,
  },
  customGoogleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#747775',
    borderRadius: 4,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  elevatedButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default RegistrationScreen;
