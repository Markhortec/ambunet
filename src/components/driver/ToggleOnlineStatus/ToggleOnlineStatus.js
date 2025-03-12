import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const ToggleOnlineStatus = ({ isOnline, toggleOnlineStatus }) => (
  <Pressable onPress={toggleOnlineStatus} style={styles.toggleButton}>
    <Text style={styles.toggleText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  toggleButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  toggleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ToggleOnlineStatus;
