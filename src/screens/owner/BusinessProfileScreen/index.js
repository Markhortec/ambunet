import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
const BusinessProfileScreen = () => {
  const [name, setName] = useState('');
  const [addr, setAddr] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const userId = auth().currentUser?.uid;
        const querySnapshot = await firestore()
          .collection('businesses')
          .where('userId', '==', userId)
          .get();

        if (!querySnapshot.empty) {
          const documentSnapshot = querySnapshot.docs[0];
          setCompanyId(documentSnapshot.id);
          fetchProfileData(documentSnapshot.id);
        } else {
          console.warn('No business found for user ID', userId);
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

  const confirmSave = () => {
    setModalVisible(true);
  };

  const handleSave = async () => {
    setModalVisible(false);
    setLoading(true);
    try {
      if (!companyId) {
        throw new Error('Company ID is missing.');
      }

      await firestore().collection('businesses').doc(companyId).set(
        {
          businessName: name,
          address: addr,
          ownerName: ownerName,
          phone: ownerPhone,
        },
        { merge: true }
      );

      Alert.alert('Success', 'Your business profile has been updated successfully!');
      setIsEditing(false);
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
            <View>
  <LinearGradient
    colors={['#F70000', '#D60000']}
    style={styles.header}
  >
    <Text style={styles.headerTitle}>Business Profile</Text>
  </LinearGradient>
</View>


            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#F70000" style={styles.iconStyle} />
              <TextInput
                placeholder="Owner Name"
                value={ownerName}
                onChangeText={setOwnerName}
                style={styles.input}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="office-building" size={20} color="#F70000" style={styles.iconStyle} />
              <TextInput
                placeholder="Business Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#F70000" style={styles.iconStyle} />
              <TextInput
                placeholder="Owner Phone Number"
                value={ownerPhone}
                onChangeText={setOwnerPhone}
                style={styles.input}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="map-marker" size={20} color="#F70000" style={styles.iconStyle} />
              <TextInput
                placeholder="Address"
                value={addr}
                onChangeText={setAddr}
                style={styles.input}
                editable={isEditing}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={isEditing ? confirmSave : () => setIsEditing(true)}
            >
              <Text style={styles.submitButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to save changes?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  mainContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F70000',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F70000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  iconStyle: {
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#F70000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#D3D3D3',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#F70000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default BusinessProfileScreen;