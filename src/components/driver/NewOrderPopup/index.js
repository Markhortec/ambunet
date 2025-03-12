import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const OrderPopup = ({ selectedOrder, timer, acceptOrder }) => (
  <View style={styles.orderPopup}>
    <Text style={styles.orderTitle}>{selectedOrder.userName}</Text>
    <Text style={styles.orderDetails}>Phone: {selectedOrder.userPhone}</Text>
    <Text style={styles.orderDetails}>Pickup Location: {selectedOrder.originName}</Text>
    <Text style={styles.orderDetails}>Drop-off Location: {selectedOrder.destinationName}</Text>
    <Text style={styles.timerText}>{timer}s</Text>
    <Pressable style={styles.acceptButton} onPress={() => acceptOrder(selectedOrder)}>
      <Text style={styles.acceptButtonText}>Accept</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  orderPopup: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  orderDetails: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  timerText: {
    fontSize: 18,
    color: "#FF4C4C",
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  acceptButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default OrderPopup;
