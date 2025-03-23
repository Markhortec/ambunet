import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { fetchUserData, setUserInfo } from '../../../redux/userSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for fetching data
  const [isSaving, setIsSaving] = useState(false); // Loading state for saving profile
  const [role, setRole] = useState('');

  // Load user data and role
  useEffect(() => {
    const loadUserData = async () => {
      if (!userInfo.uid) {
        await dispatch(fetchUserData()); // Fetch user data if UID is not present
      }
      const storedRole = await AsyncStorage.getItem('userRole'); // Fetch role from AsyncStorage
      console.log("Stored role from AsyncStorage:", storedRole); // Log to verify role retrieval
      setRole(storedRole); // Set role state
      setLoading(false); // Set loading to false after fetching
    };
    loadUserData();
  }, [dispatch, userInfo.uid]);

  // Set local state with user info when userInfo changes
  useEffect(() => {
    if (userInfo.uid) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhoneNumber(userInfo.phoneNumber || '');
      setOwnerPhoto(userInfo.ownerPhoto || null);
    }
  }, [userInfo]);

  // Function to handle image upload
  const handleImageUpload = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorCode);
      } else {
        const uri = response.assets[0]?.uri;
        if (uri) {
          setOwnerPhoto(uri); // Set the selected image URI
        }
      }
    });
  };

  const uploadImageToStorage = async (imageUri, userId, imageType) => {
    if (!imageUri) return null;

    try {
      const filename = `${imageType}_${Date.now()}.jpg`;
      const reference = storage().ref(`users/${userId}/${filename}`);
      const task = reference.putFile(imageUri);

      task.on('state_changed', (snapshot) => {
        console.log(
          `Upload is ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}% done`
        );
      });

      await task;
      const downloadUrl = await reference.getDownloadURL();
      console.log(`${imageType} image uploaded successfully:`, downloadUrl);

      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      throw new Error(`Failed to upload ${imageType} image`);
    }
  };

  const handleSaveProfile = async () => {
    if (!userInfo.uid) {
      Alert.alert('Error', 'User ID not found.');
      return;
    }

    if (name.trim() === '' || email.trim() === '' || phoneNumber.trim() === '') {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    try {
      setIsSaving(true); // Start loading indicator for saving

      const storedRole = await AsyncStorage.getItem('userRole');
      if (!storedRole) {
        Alert.alert('Error', 'User role not found.');
        setIsSaving(false); // Stop loading on error
        return;
      }

      let ownerPhotoUrl = null;
      if (ownerPhoto) {
        ownerPhotoUrl = await uploadImageToStorage(ownerPhoto, userInfo.uid, 'ownerPhoto');
      }

      // Save user information in Firestore with status and message fields
      await firestore()
        .collection('users')
        .doc(userInfo.uid)
        .set({
          name: name.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          ownerPhoto: ownerPhotoUrl,
          role: storedRole,
          status: 'active', // Default status
          message: 'Account created successfully', // Default empty message
        });

      // Update Redux state with the new fields
      dispatch(
        setUserInfo({
          uid: userInfo.uid,
          name,
          email,
          phoneNumber,
          ownerPhoto: ownerPhotoUrl,
          role: storedRole,
          status: 'active', // Default status
          message: '', // Default empty message
        })
      );

      // Navigate based on user role
      if (storedRole === 'Owner') {
        const businessDoc = await firestore().collection('businesses').where('userId', '==', userInfo.uid).get();
        if (!businessDoc.empty) {
          navigation.navigate('OwnerHomeScreen');
        } else {
          navigation.navigate('BusinessRegistrationScreen', {
            uid: userInfo.uid,
            email: email,
            name: name,
            phoneNumber: phoneNumber,
            ownerPhoto: ownerPhotoUrl ? ownerPhotoUrl : '',
          });
        }
      } else if (storedRole === 'User') {
        navigation.navigate('HomeScreen');
      } else {
        Alert.alert('Error', 'Unknown user role. Please contact support.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to save profile information: ${error.message}`);
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FC1501" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleImageUpload} style={styles.imageContainer}>
            {ownerPhoto ? (
              <Image source={{ uri: ownerPhoto }} style={styles.imagePreview} />
            ) : (
              <Icon name="account-circle" size={80} color="#FC1501" style={styles.profileIcon} />
            )}
          </TouchableOpacity>
          <Text style={styles.text}>Your Profile</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
          />
        </View>

        <TouchableOpacity
          onPress={handleSaveProfile}
          style={styles.saveButton}
          disabled={isSaving} // Disable button while saving
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" /> // Show loading indicator
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F70000',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileIcon: {
    marginBottom: 10,
  },
  text: {
    fontSize: 24,
    color: 'black',
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: 'black',
  },
  saveButton: {
    backgroundColor: '#f70000',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ProfileScreen;