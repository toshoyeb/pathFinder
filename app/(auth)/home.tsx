import auth from "@react-native-firebase/auth";
import { Button, Text, View } from "react-native";

const Page = () => {
  return (
    <View>
      <Text>Home Page</Text>
      <Button title="Log Out" onPress={() => auth().signOut()} />
    </View>
  );
};

export default Page;
