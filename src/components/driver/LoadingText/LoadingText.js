import React from 'react';
import { Text, StyleSheet } from 'react-native';

const LoadingText = () => (
  <Text style={styles.loadingText}>Loading orders...</Text>
);

const styles = StyleSheet.create({
  loadingText: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    fontSize: 18,
    color: "#666",
  },
});

export default LoadingText;
