import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, Image, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import * as ImagePicker from 'react-native-image-picker'; 
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AddDriverScreen = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [licensePhoto, setLicensePhoto] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicFrontImage, setCnicFrontImage] = useState('');
  const [cnicBackImage, setCnicBackImage] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const userId = auth().currentUser.uid;
        const userDoc = await firestore().collection('businesses').where('userId', '==', userId).get();
        if (!userDoc.empty) {
          setCompanyId(userDoc.docs[0].id);
        } else {
          Alert.alert('Error', 'Company ID not found.');
        }
      } catch (error) {
        console.error('Failed to fetch company ID:', error);
        Alert.alert('Error', 'Failed to fetch company ID. Please try again later.');
      }
    };

    fetchCompanyId();
  }, []);

  // Image picker handler
  const handleImageUpload = (imageSetter) => {
    const options = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        imageSetter(source.uri);
      }
    });
  };

  // Check if phone number is unique
  const isPhoneNumberUnique = async () => {
    const snapshot = await firestore()
      .collection('drivers')
      .where('phoneNumber', '==', phoneNumber)
      .get();

    return snapshot.empty; // True if no document with the same phone number exists
  };

  // Validation functions
  const validateForm = async () => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (name.trim() === '') return 'Name is required.';
    if (!/^[0-9]{10,11}$/.test(phoneNumber)) return 'Invalid phone number. Must be 10 or 11 digits.';
    
    // Check if the phone number is unique
    const isUnique = await isPhoneNumberUnique();
    if (!isUnique) return 'Phone number already exists. Please use a different number.';

    if (!passwordRegex.test(password)) return 'Password must be at least 8 characters long, contain at least one number, and one special character.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
    if (address.trim() === '') return 'Address is required.';
    if (gender === '') return 'Gender is required.';
    if (profilePhoto.trim() === '') return 'Profile photo is required.';
    if (licensePhoto.trim() === '') return 'License photo is required.';
    if (cnicNumber.trim() === '') return 'CNIC number is required.';
    if (cnicFrontImage.trim() === '') return 'CNIC front image is required.';
    if (cnicBackImage.trim() === '') return 'CNIC back image is required.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = await validateForm(); // Wait for phone number uniqueness check
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      await firestore().collection('drivers').add({
        name,
        phoneNumber,
        password,
        email,
        address,
        gender,
        profilePhoto,
        licensePhoto,
        cnicNumber,
        cnicFrontImage,
        cnicBackImage,
        companyId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('Success', 'Driver added successfully!');
      // Reset form fields
      setName('');
      setPhoneNumber('');
      setPassword('');
      setEmail('');
      setAddress('');
      setGender('');
      setProfilePhoto('');
      setLicensePhoto('');
      setCnicNumber('');
      setCnicFrontImage('');
      setCnicBackImage('');
    } catch (error) {
      console.error('Error adding driver:', error);
      Alert.alert('Error', 'Failed to add driver. Please try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        
        <TouchableOpacity onPress={() => handleImageUpload(setProfilePhoto)} style={styles.profileSection}>
          <Icon name="account-circle" size={80} color="red" style={styles.profileIcon} />
          {profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.profileImage} /> : null}
          <Text style={styles.uploadText}>Tap to Upload Profile Photo</Text>
        </TouchableOpacity>

        
        <Text style={styles.sectionTitle}>Driver Registration</Text>
        <View style={styles.inputContainer}>
          <Icon name="account" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="phone" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Phone Number (Unique)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Password (8+ chars, 1 number, 1 special)"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="home" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="gender-male-female" size={20} color="red" style={styles.iconStyle} />
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

       
        <Text style={styles.sectionTitle}>License Photo</Text>
        <TouchableOpacity onPress={() => handleImageUpload(setLicensePhoto)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload License Photo</Text>
        </TouchableOpacity>
        {licensePhoto ? <Image source={{ uri: licensePhoto }} style={styles.uploadedImage} /> : null}

       
        <View style={styles.inputContainer}>
          <Icon name="card-account-details" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="CNIC Number"
            value={cnicNumber}
            onChangeText={setCnicNumber}
            style={styles.input}
            keyboardType="number-pad"
          />
        </View>

       
        <Text style={styles.sectionTitle}>CNIC Front Image</Text>
        <TouchableOpacity onPress={() => handleImageUpload(setCnicFrontImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload CNIC Front Image</Text>
        </TouchableOpacity>
        {cnicFrontImage ? <Image source={{ uri: cnicFrontImage }} style={styles.uploadedImage} /> : null}

       
        <Text style={styles.sectionTitle}>CNIC Back Image</Text>
        <TouchableOpacity onPress={() => handleImageUpload(setCnicBackImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload CNIC Back Image</Text>
        </TouchableOpacity>
        {cnicBackImage ? <Image source={{ uri: cnicBackImage }} style={styles.uploadedImage} /> : null}

        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIcon: {
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  iconStyle: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 5,
  },
  picker: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  uploadButtonText: {
    color: '#007BFF',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: 'red',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default AddDriverScreen;
