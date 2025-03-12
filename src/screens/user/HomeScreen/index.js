import React, { useCallback } from "react";
import { View, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import HomeMap from "../../../components/user/HomeMap";
import InitialMessage from "../../../components/user/InitialMessage";
import HomeSearch from "../../../components/user/HomeSearch";
import Logout from "../../../components/owner/Logout";
import Profile from "../../../components/user/Profile"; // Profile component

const HomeScreen = ({ navigation }) => {
  // Prevent unnecessary re-renders
  const openDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Sidebar Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <HomeMap />
      </View>

      {/* Bottom UI Elements */}
      <View style={styles.bottomContainer}>
        <Logout navigation={navigation} />
        <InitialMessage />
        <HomeSearch />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  mapContainer: {
    height: Dimensions.get("window").height - 400,
  },
  bottomContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  profileContainer: {
    marginTop: 10, // Adds spacing between HomeSearch and Profile
    alignItems: "center",
  },
});

export default HomeScreen;
