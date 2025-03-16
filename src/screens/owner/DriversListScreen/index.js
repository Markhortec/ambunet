import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Button,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const DriversListScreen = ({ route }) => {
  const { companyId } = route.params;
  const [drivers, setDrivers] = useState([]);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editedData, setEditedData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    cnicNumber: '',
    gender: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, [companyId]);

  const fetchDrivers = async () => {
    const driversSnapshot = await firestore()
      .collection('drivers')
      .where('companyId', '==', companyId)
      .get();
    const driversData = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDrivers(driversData);
  };

  const handleEdit = (driver) => {
    setEditingDriverId(driver.id);
    setEditedData({
      name: driver.name,
      phoneNumber: driver.phoneNumber,
      email: driver.email,
      address: driver.address,
      cnicNumber: driver.cnicNumber,
      gender: driver.gender,
    });
  };

  const handleSave = async (driverId) => {
    await firestore().collection('drivers').doc(driverId).update({
      name: editedData.name,
      phoneNumber: editedData.phoneNumber,
      email: editedData.email,
      address: editedData.address,
      cnicNumber: editedData.cnicNumber,
      gender: editedData.gender,
    });
    setEditingDriverId(null);
    fetchDrivers(); // Refresh the list
  };

  const renderItem = ({ item }) => (
    <LinearGradient
      colors={['#FFFFFF', '#F7F7F7']}
      style={styles.driverCard}
    >
      <Image source={{ uri: item.profilePhoto }} style={styles.driverPhoto} />
      {editingDriverId === item.id ? (
        <ScrollView>
          <TextInput
            value={editedData.name}
            onChangeText={(text) => setEditedData({ ...editedData, name: text })}
            style={styles.input}
            placeholder="Name"
          />
          <TextInput
            value={editedData.phoneNumber}
            onChangeText={(text) =>
              setEditedData({ ...editedData, phoneNumber: text })
            }
            style={styles.input}
            placeholder="Phone Number"
          />
          <TextInput
            value={editedData.email}
            onChangeText={(text) =>
              setEditedData({ ...editedData, email: text })
            }
            style={styles.input}
            placeholder="Email"
          />
          <TextInput
            value={editedData.address}
            onChangeText={(text) =>
              setEditedData({ ...editedData, address: text })
            }
            style={styles.input}
            placeholder="Address"
          />
          <TextInput
            value={editedData.cnicNumber}
            onChangeText={(text) =>
              setEditedData({ ...editedData, cnicNumber: text })
            }
            style={styles.input}
            placeholder="CNIC Number"
          />
          <TextInput
            value={editedData.gender}
            onChangeText={(text) =>
              setEditedData({ ...editedData, gender: text })
            }
            style={styles.input}
            placeholder="Gender"
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSave(item.id)}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <Text style={styles.driverName}>{item.name}</Text>
          <Text style={styles.driverDetail}>Phone: {item.phoneNumber}</Text>
          <Text style={styles.driverDetail}>Email: {item.email}</Text>
          <Text style={styles.driverDetail}>Address: {item.address}</Text>
          <Text style={styles.driverDetail}>CNIC: {item.cnicNumber}</Text>
          <Text style={styles.driverDetail}>Gender: {item.gender}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );

  return (
    <FlatList
      data={drivers}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F70000',
    textAlign: 'center',
    marginBottom: 8,
  },
  driverDetail: {
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
  saveButton: {
    backgroundColor: '#F70000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriversListScreen;