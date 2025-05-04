import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Logout from '../owner/Logout';

const CustomDrawer = ({ navigation }) => {
  const { name, email, phoneNumber, role, userStatus, message } = useSelector((state) => state.user);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileImage}>
          <Text style={styles.initials}>
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{name || 'User'}</Text>
        <Text style={styles.email}>{email || 'No email'}</Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{phoneNumber || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{role || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons 
            name={userStatus === 'active' ? 'checkmark-circle-outline' : 'close-circle-outline'} 
            size={20} 
            color={userStatus === 'active' ? 'green' : 'red'} 
          />
          <Text style={styles.detailText}>
            Status: {userStatus || 'N/A'}
          </Text>
        </View>

        {message && (
          <View style={styles.messageContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#555" />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}
      </View>

      {/* Add Logout Button at the bottom */}
      <TouchableOpacity 
        style={styles.logoutButton}
      >
         <Logout navigation={navigation} />
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  initials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#555',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    paddingHorizontal: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  messageText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#555',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 'auto', // Pushes to bottom
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    marginLeft: 10,
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomDrawer;