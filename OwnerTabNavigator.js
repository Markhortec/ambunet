import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import OwnerDashboardScreen from './src/screens/owner/OwnerDashboardScreen';
import BusinessProfileScreen from './src/screens/owner/BusinessProfileScreen';
import OwnerHomeScreen from './src/screens/owner/OwnerHomeScreen';
import Logout from './src/components/owner/Logout';

const Tab = createBottomTabNavigator();

const OwnerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      let iconName;

      if (route.name === 'OwnerHome') {
        iconName = 'view-dashboard';
      } else if (route.name === 'Dashboard') {
        iconName = 'briefcase';
      } else if (route.name === 'BusinessProfile') {
        iconName = 'home';
      } else if (route.name === 'Logout') {
        iconName = 'logout';
      }

      //console.log(`Icon for ${route.name}: ${iconName}`); // Debug log

      return {
        tabBarIcon: ({ color, size }) => (
          <Icon name={iconName} size={size} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: '#F70000',
          paddingBottom: 10,
          paddingTop: 10,
          height: 60,
        },
        tabBarLabelStyle: {
          color: '#FFF',
          fontSize: 12,
        },
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: '#FFF',
      };
    }}
  >
    <Tab.Screen name="OwnerHome" component={OwnerHomeScreen} />
    <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
    <Tab.Screen name="BusinessProfile" component={BusinessProfileScreen} />
    <Tab.Screen name="Logout" component={Logout} options={{ tabBarLabel: 'Logout' }} />
  </Tab.Navigator>
);


export default OwnerTabNavigator;
