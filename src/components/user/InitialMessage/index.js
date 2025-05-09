import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";
const InitialMessage = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Use Ambulance Services Responsibly</Text>
            <Text style={styles.text}>
                This service is intended for urgent medical needs only. Please avoid making requests unless absolutely necessary, so we can serve those in real emergencies.
            </Text>
            <Text style={styles.learnMore}>Learn more about when to call an ambulance</Text>
        </View>
    );
};
export default InitialMessage;
