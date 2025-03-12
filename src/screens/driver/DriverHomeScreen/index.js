import { View } from "react-native"
import Logout from "../../../components/owner/Logout"

const DriverHomeScreen = ({ navigation }) => {
    return (
      <View>
        <Logout navigation={navigation} />
      </View>
    );
  };
  

export default DriverHomeScreen;