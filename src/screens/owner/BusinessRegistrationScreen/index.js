import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

const BusinessRegistrationScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState('');
  const [ownerPhoto, setOwnerPhoto] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false); // Loading state

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth().currentUser;

        if (user) {
          const userId = user.uid;
          setPhone(user.phoneNumber || '');
          const userDoc = await firestore().collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setOwnerName(userData.name || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
        Alert.alert('Error', `Failed to fetch user data. Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const uploadImageToStorage = async (imageUri, companyId, imageType) => {
    if (!imageUri) return null;

    try {
      const filename = `${imageType}_${Date.now()}.jpg`;
      const reference = storage().ref(`businesses/${companyId}/${filename}`);
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
        Alert.alert('Image Uploaded', 'Image uploaded successfully!');
      }
    });
  };

  const registerBusiness = async () => {
    if (businessName && logo && ownerPhoto && address) {
      try {
        setIsRegistering(true); // Start loading
  
        const user = auth().currentUser;
        if (!user) {
          Alert.alert('Error', 'User not authenticated.');
          setIsRegistering(false); // Stop loading on error
          return;
        }
  
        const userId = user.uid;
        const businessRef = firestore().collection('businesses').doc();
        const companyId = businessRef.id;
  
        const [logoUrl, ownerPhotoUrl] = await Promise.all([
          uploadImageToStorage(logo, companyId, 'logo'),
          uploadImageToStorage(ownerPhoto, companyId, 'ownerPhoto'),
        ]);
  
        // Save business data with new fields
        await businessRef.set({
          companyId,
          ownerName,
          phone,
          businessName,
          logo: logoUrl,
          ownerPhoto: ownerPhotoUrl,
          address,
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          requestStatus: 'send', // Default value for requestStatus
          message: 'Account created successfully', // Default value for message
          balance: 0, // Default value for balance
        });
  
        Alert.alert(
          'Success',
          `Business registered successfully! Your business "${businessName}" is now pending approval.`,
        );
  
        // Navigate to the next screen after a short delay
        setTimeout(() => {
          navigation.navigate('OwnerTabNavigator');
        }, 1000); // Delay navigation for 1 second
      } catch (error) {
        Alert.alert('Error', `Failed to register business. Error: ${error.message}`);
      } finally {
        setIsRegistering(false); // Stop loading in all cases
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields.');
    }
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F70000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Owner Photo</Text>
          <TouchableOpacity onPress={() => handleImageUpload(setOwnerPhoto)} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Owner Photo</Text>
          </TouchableOpacity>
          {ownerPhoto && <Image source={{ uri: ownerPhoto }} style={styles.imagePreview} />}
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Business Logo</Text>
          <TouchableOpacity onPress={() => handleImageUpload(setLogo)} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Logo</Text>
          </TouchableOpacity>
          {logo && <Image source={{ uri: logo }} style={styles.imagePreview} />}
        </View>

        <View style={styles.inputContainer}>
          <Icon name="account" size={20} color="#333" style={styles.iconStyle} />
          <TextInput
            placeholder="Owner Name"
            value={ownerName}
            onChangeText={setOwnerName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="phone" size={20} color="#333" style={styles.iconStyle} />
          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="office-building" size={20} color="#333" style={styles.iconStyle} />
          <TextInput
            placeholder="Company/Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="map-marker" size={20} color="#333" style={styles.iconStyle} />
          <TextInput
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={registerBusiness}
          disabled={isRegistering} // Disable button while registering
        >
          {isRegistering ? (
            <ActivityIndicator color="#FFFFFF" /> // Show loading indicator
          ) : (
            <Text style={styles.submitButtonText}>Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  mainContent: {
    flexGrow: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  uploadSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#F70000',
    paddingVertical: 12,
    width: 220,
    borderRadius: 30,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
    borderColor: '#B0BEC5',
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingLeft: 10,
  },
  iconStyle: {
    marginRight: 15,
  },
  submitButton: {
    backgroundColor: '#F70000',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BusinessRegistrationScreen;