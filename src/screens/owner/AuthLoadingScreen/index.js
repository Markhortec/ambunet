import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { navigateBasedOnRole } from '../../../utils/navigationHelpers';

const AuthLoadingScreen = ({ navigation }) => {
  const { user, role, loading } = useAuth();

  React.useEffect(() => {
    if (!loading) {
      navigateBasedOnRole(navigation, role, user?.uid);
    }
  }, [loading, user, role]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return null;
};

export default AuthLoadingScreen;