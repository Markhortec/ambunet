// utils/navigationHelpers.js
export const navigateBasedOnRole = (navigation, role, userId) => {
    if (role === 'Owner') {
      navigation.replace('OwnerTabNavigator');
    } else if (role === 'User') {
      navigation.replace('HomeScreen');
    } else if (role === 'Driver') {
      navigation.replace('DHomeScreen');
    } else {
      navigation.replace('RoleScreen');
    }
  };