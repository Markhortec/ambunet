import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../hooks/useAuth';
import { navigateBasedOnRole } from '../../../utils/navigationHelpers';

const SplashScreen = () => {
  const navigation = useNavigation();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigateBasedOnRole(navigation, role, user.uid);
      } else {
        navigation.replace('RoleScreen');
      }
    }
  }, [loading, user, role]);

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('../../../../assets/images/4.png')} />
      <Text style={styles.text}>AmbuNet</Text>
      {loading && <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF030D',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;