import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AmbulancesListScreen = ({ route }) => {
  const { companyId } = route.params;
  const [ambulances, setAmbulances] = useState([]);
  const [editingAmbulanceId, setEditingAmbulanceId] = useState(null);
  const [editedData, setEditedData] = useState({});

  // Fetch ambulances
  const fetchAmbulances = useCallback(async () => {
    const snapshot = await firestore()
      .collection('ambulances')
      .where('companyId', '==', companyId)
      .get();

    setAmbulances(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [companyId]);

  useEffect(() => {
    fetchAmbulances();
  }, [fetchAmbulances]);

  // Start editing
  const handleEdit = (ambulance) => {
    setEditingAmbulanceId(ambulance.id);
    setEditedData({ ...ambulance });
  };

  // Save changes
  const handleSave = async (ambulanceId) => {
    await firestore().collection('ambulances').doc(ambulanceId).update(editedData);
    setEditingAmbulanceId(null);
    fetchAmbulances(); // Refresh list
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingAmbulanceId(null);
    setEditedData({});
  };

  const renderItem = ({ item }) => (
    <View style={styles.ambulanceCard}>
      {editingAmbulanceId === item.id ? (
        <ScrollView>
          <TextInput
            value={editedData.registrationNumber}
            onChangeText={(text) => setEditedData({ ...editedData, registrationNumber: text })}
            style={styles.input}
            placeholder="Registration Number"
          />
          <TextInput
            value={editedData.type}
            onChangeText={(text) => setEditedData({ ...editedData, type: text })}
            style={styles.input}
            placeholder="Type"
          />
          <TextInput
            value={editedData.carBrand}
            onChangeText={(text) => setEditedData({ ...editedData, carBrand: text })}
            style={styles.input}
            placeholder="Car Brand"
          />
          <TextInput
            value={editedData.carPlateNumber}
            onChangeText={(text) => setEditedData({ ...editedData, carPlateNumber: text })}
            style={styles.input}
            placeholder="Car Plate Number"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={() => handleSave(item.id)}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          <Text style={styles.ambulanceReg}>Registration: {item.registrationNumber}</Text>
          <Text style={styles.ambulanceDetail}>Type: {item.type}</Text>
          <Text style={styles.ambulanceDetail}>Car Brand: {item.carBrand}</Text>
          <Text style={styles.ambulanceDetail}>Car Plate: {item.carPlateNumber}</Text>
          <View style={styles.imageContainer}>
            {item.frontImage && <Image source={{ uri: item.frontImage }} style={styles.image} />}
            {item.backImage && <Image source={{ uri: item.backImage }} style={styles.image} />}
            {item.interiorImage && <Image source={{ uri: item.interiorImage }} style={styles.image} />}
            {item.sideImage && <Image source={{ uri: item.sideImage }} style={styles.image} />}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      data={ambulances}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
  },
  ambulanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  ambulanceReg: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F70000',
    marginBottom: 8,
  },
  ambulanceDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F70000',
    borderRadius: 5,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  image: {
    width: '48%',
    height: 100,
    borderRadius: 5,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#F70000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#888',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#F70000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AmbulancesListScreen;
