import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Dimensions, Modal, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getFirestore, doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { setUserInfo } from "../../../redux/userSlice";

const OwnerHomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [profileInfo, setProfileInfo] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});
  const userId = useSelector((state) => state.user.uid);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("User ID from Redux state:", userId);
        if (userId) {
          const db = getFirestore();
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          console.log("User data fetched:", userData);
          setUserName(userData.name);
          setProfileInfo(userData);
          setEditedInfo({
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber
          });
          dispatch(setUserInfo({
            uid: userId,
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            role: userData.role,
            userStatus: userData.userStatus,
            message: userData.message
          }));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, dispatch]);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setIsEditing(false); // Reset editing state when closing menu
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        name: editedInfo.name,
        email: editedInfo.email,
        phoneNumber: editedInfo.phoneNumber
      });
      
      // Update local state
      setProfileInfo(prev => ({
        ...prev,
        name: editedInfo.name,
        email: editedInfo.email,
        phoneNumber: editedInfo.phoneNumber
      }));
      
      setUserName(editedInfo.name);
      setIsEditing(false);
      setLoading(false);
      
      // Update Redux store
      dispatch(setUserInfo({
        uid: userId,
        name: editedInfo.name,
        email: editedInfo.email,
        phoneNumber: editedInfo.phoneNumber,
        role: profileInfo.role,
        userStatus: profileInfo.userStatus,
        message: profileInfo.message
      }));
      
    } catch (error) {
      console.error("Error updating user data:", error);
      setLoading(false);
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
      {/* Menu Button */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={toggleMenu}
      >
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>

      {/* Profile Menu Modal - Now sliding from left */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.modalContainer}>
            {/* Close button at top right */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={toggleMenu}
            >
              <Ionicons name="close" size={24} color="#F70000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Profile Information</Text>
            
            {profileInfo && (
              <View style={styles.profileInfoContainer}>
                {isEditing ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Name:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedInfo.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedInfo.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        keyboardType="email-address"
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedInfo.phoneNumber}
                        onChangeText={(text) => handleInputChange('phoneNumber', text)}
                        keyboardType="phone-pad"
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Role:</Text>
                      <Text style={styles.nonEditableField}>{profileInfo.role}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsEditing(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoText}>{profileInfo.name}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoText}>{profileInfo.email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoText}>{profileInfo.phoneNumber}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Role:</Text>
                      <Text style={styles.infoText}>{profileInfo.role}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={handleEdit}
                    >
                      <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Header with Gradient */}
      <View>
        <LinearGradient colors={['#F70000', '#D60000']} style={styles.header}>
          <Text style={styles.headerTitle}>Owner Home</Text>
        </LinearGradient>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.welcomeText}>Welcome, {userName || 'Owner'}</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AddDriverScreen')}
          >
            <Icon name="account-plus" size={50} color="#F70000" />
            <Text style={styles.gridText}>Add Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AddAmbulanceScreen')}
          >
            <Icon name="ambulance" size={50} color="#F70000" />
            <Text style={styles.gridText}>Add Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('AssignAmbulanceScreen')}
          >
            <Icon name="account-convert" size={50} color="#F70000" />
            <Text style={styles.gridText}>Assign Ambulance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  menuButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
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
  mainContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  gridItem: {
    width: '45%',
    height: 150,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gridText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFF',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#F70000',
    textAlign: 'center',
  },
  profileInfoContainer: {
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 8,
  },
  nonEditableField: {
    fontSize: 16,
    color: '#333',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: '#F70000',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#F70000',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#DDD',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OwnerHomeScreen;