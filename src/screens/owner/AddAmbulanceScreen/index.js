import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
// import DocumentPicker from 'react-native-document-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

const ambulanceTypes = [
  { id: '0', type: 'Haice + AC + Oxy' },
  { id: '1', type: 'Haice + AC' },
  { id: '2', type: 'Haice + Oxy' },
  { id: '3', type: 'Haice' },
  { id: '4', type: 'Every + AC + Oxy' },
  { id: '5', type: 'Every + AC' },
  { id: '6', type: 'Every + Oxy' },
  { id: '7', type: 'Every' },
  { id: '8', type: 'Bolan + Oxy' },
  { id: '9', type: 'Bolan' },
];

const AddAmbulanceScreen = () => {
  const [type, setType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [frontImage, setFrontImage] = useState('');
  const [backImage, setBackImage] = useState('');
  const [interiorImage, setInteriorImage] = useState('');
  const [sideImage, setSideImage] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const userId = auth().currentUser.uid;
        const querySnapshot = await firestore()
          .collection('businesses')
          .where('userId', '==', userId)
          .get();

        if (!querySnapshot.empty) {
          const documentSnapshot = querySnapshot.docs[0];
          setCompanyId(documentSnapshot.data().companyId);
        } else {
          console.log('No business found for user ID', userId);
        }
      } catch (error) {
        console.error('Failed to fetch companyId:', error);
      }
    };

    fetchCompanyId();
  }, []);

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
      } else if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        imageSetter(source.uri);
        Alert.alert('Image Uploaded', 'Image uploaded successfully!');
      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    });
  };

  // const getRealPathFromContentURI = async (uri) => {
  //   if (Platform.OS === 'android' && uri.startsWith('content://')) {
  //     try {
  //       const result = await DocumentPicker.pick({
  //         type: [DocumentPicker.types.images],
  //         uri,
  //         readContent: true,
  //       });
  //       return result.uri;
  //     } catch (error) {
  //       console.error('Error converting content URI:', error);
  //       return uri; // Fallback to original URI
  //     }
  //   }
  //   return uri; // Return original URI for iOS or non-content URIs
  // };

  const uploadImageToStorage = async (imageUri, docId, imageType) => {
    if (!imageUri) return null;
  
    try {
      // Get the real path for Android content URIs
      const uploadUri = Platform.OS === 'android' && imageUri.startsWith('content://')
        ? await getRealPathFromContentURI(imageUri)
        : imageUri;
  
      // Generate a unique filename for the image
      const filename = `${imageType}_${Date.now()}.jpg`;
  
      // Create a reference in Firebase Storage
      const reference = storage().ref(`ambulances/${docId}/${filename}`);
  
      // Upload the file to Firebase Storage
      const task = reference.putFile(uploadUri);
  
      // Monitor the upload progress (optional)
      task.on('state_changed', (snapshot) => {
        console.log(
          `Upload is ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}% done`
        );
      });
  
      // Wait for the upload to complete
      await task;
  
      // Get the download URL for the uploaded image
      const downloadUrl = await reference.getDownloadURL();
      console.log(`${imageType} image uploaded successfully:`, downloadUrl);
  
      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      throw new Error(`Failed to upload ${imageType} image`);
    }
  };

  const addAmbulance = async () => {
    if (
      !type ||
      !registrationNumber ||
      !carPlateNumber ||
      !carBrand ||
      !frontImage ||
      !backImage ||
      !interiorImage ||
      !sideImage ||
      !companyId
    ) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Create a new document in the "ambulances" collection
      const docRef = firestore().collection('ambulances').doc();
      const docId = docRef.id;
  
      // Upload all images to Firebase Storage
      const uploadPromises = [
        uploadImageToStorage(frontImage, docId, 'front'),
        uploadImageToStorage(backImage, docId, 'back'),
        uploadImageToStorage(interiorImage, docId, 'interior'),
        uploadImageToStorage(sideImage, docId, 'side'),
      ];
  
      // Wait for all uploads to complete
      const [frontUrl, backUrl, interiorUrl, sideUrl] = await Promise.all(uploadPromises);
  
      // Save ambulance data to Firestore
      await docRef.set({
        type,
        registrationNumber,
        carPlateNumber,
        carBrand,
        frontImage: frontUrl,
        backImage: backUrl,
        interiorImage: interiorUrl,
        sideImage: sideUrl,
        companyId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        ambulanceStatus: 'active',
        requestStatus: 'send',
      });
  
      Alert.alert('Success', 'Ambulance added successfully!');
      // Reset form fields
      setType('');
      setRegistrationNumber('');
      setCarPlateNumber('');
      setCarBrand('');
      setFrontImage('');
      setBackImage('');
      setInteriorImage('');
      setSideImage('');
    } catch (error) {
      console.error('Error adding ambulance:', error);
      Alert.alert('Error', error.message || 'There was a problem adding the ambulance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <Text style={styles.sectionTitle}>Ambulance Registration</Text>

        <View style={styles.inputContainer}>
          <Icon name="car-side" size={20} color="red" style={styles.iconStyle} />
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Ambulance Type and Services" value="" />
            {ambulanceTypes.map((ambulance) => (
              <Picker.Item key={ambulance.id} label={ambulance.type} value={ambulance.type} />
            ))}
          </Picker>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="car" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Registration Number"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="car" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Car Plate Number"
            value={carPlateNumber}
            onChangeText={setCarPlateNumber}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="car" size={20} color="red" style={styles.iconStyle} />
          <TextInput
            placeholder="Car Brand"
            value={carBrand}
            onChangeText={setCarBrand}
            style={styles.input}
          />
        </View>

        <Text style={styles.uploadText}>Upload Ambulance Images</Text>
        <TouchableOpacity onPress={() => handleImageUpload(setFrontImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Front Image</Text>
        </TouchableOpacity>
        {frontImage && <Image source={{ uri: frontImage }} style={styles.imagePreview} />}

        <TouchableOpacity onPress={() => handleImageUpload(setBackImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Back Image</Text>
        </TouchableOpacity>
        {backImage && <Image source={{ uri: backImage }} style={styles.imagePreview} />}

        <TouchableOpacity onPress={() => handleImageUpload(setInteriorImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Interior Image</Text>
        </TouchableOpacity>
        {interiorImage && <Image source={{ uri: interiorImage }} style={styles.imagePreview} />}

        <TouchableOpacity onPress={() => handleImageUpload(setSideImage)} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Side Image</Text>
        </TouchableOpacity>
        {sideImage && <Image source={{ uri: sideImage }} style={styles.imagePreview} />}

        <TouchableOpacity onPress={addAmbulance} style={styles.submitButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Ambulance</Text>
          )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  iconStyle: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 40,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderBottomWidth: 1,
    paddingLeft: 10,
  },
  uploadText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
  },
  uploadButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#FF6347',
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 0,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddAmbulanceScreen;