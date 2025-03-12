import React, { useState, useEffect } from 'react';
import { View,ActivityIndicator, Text,TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const BusinessProfileScreen = () => {
  const [name, setName] = useState('');
  const [addr, setAddr] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');

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
          setCompanyId(documentSnapshot.id);
          fetchProfileData(documentSnapshot.id);
        } else {
          console.log('No business found for user ID', userId);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch companyId:', error);
        Alert.alert('Error', 'Failed to fetch company ID. Please try again later.');
        setLoading(false);
      }
    };

    const fetchProfileData = async (id) => {
      try {
        const profileDoc = await firestore().collection('businesses').doc(id).get();
        if (profileDoc.exists) {
          const data = profileDoc.data();
          console.log('Fetched Data:', data);
          setName(data.businessName || '');
          setAddr(data.address || '');
          setOwnerName(data.ownerName || '');
          setOwnerPhone(data.phone || '');
        } else {
          Alert.alert('No Profile', 'No profile data found. Please create a profile.');
        }
      } catch (error) {
        console.error('Error fetching data:', error.message, error.stack);
        Alert.alert('Error', 'Failed to fetch profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyId();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!companyId) {
        throw new Error('Company ID is missing.');
      }

      await firestore().collection('businesses').doc(companyId).set({
        businessName: name,
        address: addr,
        ownerName: ownerName,
        phone: ownerPhone,
      }, { merge: true });

      Alert.alert('Profile Updated', 'Your business profile has been updated successfully!');
    } catch (error) {
      console.error('Error updating data:', error);
      Alert.alert('Error', 'Failed to update profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F70000" />
          </View>
        ) : (
          <>

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
              <Icon name="office-building" size={20} color="#333" style={styles.iconStyle} />
              <TextInput
                placeholder="Business Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>


            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#333" style={styles.iconStyle} />
              <TextInput
                placeholder="Owner Phone Number"
                value={ownerPhone}
                onChangeText={setOwnerPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>


            <View style={styles.inputContainer}>
              <Icon name="map-marker" size={20} color="#333" style={styles.iconStyle} />
              <TextInput
                placeholder="Address"
                value={addr}
                onChangeText={setAddr}
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
              <Text style={styles.submitButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContent: {
    flexGrow: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  iconStyle: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#F70000',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 1,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default BusinessProfileScreen;
