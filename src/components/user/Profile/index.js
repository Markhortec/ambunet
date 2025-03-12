import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const Profile = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <Image
        source={{ uri: "https://via.placeholder.com/150" }} // Replace with your image URL
        style={styles.profileImage}
      />

      {/* Profile Name */}
      <Text style={styles.profileName}>Driver Name</Text>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate("EditProfile")} // Navigate to EditProfile screen
      >
        <Ionicons name="pencil" size={20} color="white" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  editButtonText: {
    color: "white",
    marginLeft: 5,
  },
});

export default Profile;