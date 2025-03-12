import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Alert, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useDispatch } from "react-redux";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { setUserInfo } from "./src/redux/userSlice";
import { setDriverInfo } from "./src/redux/driverSlice";
import { Dimensions } from "react-native";
// Import screens
import OwnerTabNavigator from "./OwnerTabNavigator";
import OwnerDashboardScreen from "./src/screens/owner/OwnerDashboardScreen";
import RegistrationScreen from "./src/screens/owner/RegistrationScreen";
import ProfileScreen from "./src/screens/owner/ProfileScreen";
import OTPScreen from "./src/screens/owner/OTPScreen";
import BusinessRegistrationScreen from "./src/screens/owner/BusinessRegistrationScreen";
import AddAmbulanceScreen from "./src/screens/owner/AddAmbulanceScreen";
import AddDriverScreen from "./src/screens/owner/AddDriverScreen";
import AssignAmbulanceScreen from "./src/screens/owner/AssignAmbulanceScreen";
import RoleScreen from "./src/screens/owner/RoleScreen";
import BusinessProfileScreen from "./src/screens/owner/BusinessProfileScreen";
import OwnerHomeScreen from "./src/screens/owner/OwnerHomeScreen";
import DriverLoginScreen from "./src/screens/driver/DriverLoginScreen";
import HomeScreen from "./src/screens/user/HomeScreen";
import SplashScreen from "./src/screens/owner/SplashScreen";
import AuthLoadingScreen from "./src/screens/owner/AuthLoadingScreen";
import DriverHomeScreen from "./src/screens/driver/DriverHomeScreen";
import DestinationSearch from "./src/screens/user/DestinationSearch";
import SearchResults from "./src/screens/user/SearchResults";
import OrderScreen from "./src/screens/user/OrderScreen";
import DHomeScreen from "./src/screens/driver/HomeScreen";
import NewOrderPopup from "./src/components/driver/NewOrderPopup";
import DriverTrack from "./src/screens/driver/DriverTrack/DriverTrack";
import UserTrack from "./src/screens/user/UserTrack/UserTrack";
// Create navigators
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      drawerStyle: { width: 250 },
      headerShown: false,
    }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} />
  </Drawer.Navigator>
);

// Main App Stack Navigator
const AppStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AuthLoadingScreen" component={AuthLoadingScreen} />
    <Stack.Screen name="RoleScreen" component={RoleScreen} options={{ headerShown: false }} />
    <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
    <Stack.Screen name="OwnerTabNavigator" component={OwnerTabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="OwnerHomeScreen" component={OwnerHomeScreen} />
    <Stack.Screen name="DestinationSearch" component={DestinationSearch} />
    <Stack.Screen name="OTPScreen" component={OTPScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="BusinessProfileScreen" component={BusinessProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AssignAmbulanceScreen" component={AssignAmbulanceScreen} />
    <Stack.Screen name="AddDriverScreen" component={AddDriverScreen} />
    <Stack.Screen name="AddAmbulanceScreen" component={AddAmbulanceScreen} />
    <Stack.Screen name="BusinessRegistrationScreen" component={BusinessRegistrationScreen} />
    <Stack.Screen name="OwnerDashboardScreen" component={OwnerDashboardScreen} />
    <Stack.Screen name="HomeScreen" component={DrawerNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="SearchResults" component={SearchResults} options={{ headerShown: false }} />
    <Stack.Screen name="OrderScreen" component={OrderScreen} options={{ headerShown: false }} />
    <Stack.Screen name="DriverLoginScreen" component={DriverLoginScreen} />
    <Stack.Screen name="DriverHomeScreen" component={DriverHomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="DHomeScreen" component={DHomeScreen} />
    <Stack.Screen name="NewOrderPopup" component={NewOrderPopup} options={{ headerShown: false }} />
    <Stack.Screen name="DriverTrack" component={DriverTrack} options={{ headerShown: false }} />
    <Stack.Screen name="UserTrack" component={UserTrack} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppNavigation = () => {
  const dispatch = useDispatch();
  const navigationRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = auth().currentUser;
        const role = await AsyncStorage.getItem("userRole");

        if (user) {
          const userId = user.uid;
          const userDoc = await firestore().collection("users").doc(userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            dispatch(setUserInfo({ uid: userId, ...userData }));
            navigateBasedOnRole(role, userId);
          } else {
            navigationRef.current?.navigate("ProfileScreen");
          }
        } else {
          navigationRef.current?.navigate("RegistrationScreen");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking user data: ", error);
        Alert.alert("Error", "An error occurred while checking user data.");
        setLoading(false);
      }
    };

    checkUser();
  }, [dispatch]);

  const navigateBasedOnRole = async (role, userId) => {
    if (role === "owner") {
      navigationRef.current?.navigate("OwnerTabNavigator");
    } else if (role === "user") {
      navigationRef.current?.navigate("HomeScreen");
    } else {
      navigationRef.current?.navigate("RoleScreen");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppStackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigation;
