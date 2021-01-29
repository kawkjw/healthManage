import React, { useContext, useEffect } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import myBase, { db } from "../../config/MyBase";
import { MyStyles } from "../../css/MyStyles";
import { AuthContext } from "../Auth";

export default ClientInfoMenu = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const { signOut } = useContext(AuthContext);

    useEffect(() => {
        const checkAdmin = async () => {
            await db
                .collection("users")
                .doc(myBase.auth().currentUser.uid)
                .get()
                .then((user) => {
                    if (!user.exists) {
                        navigation.goBack();
                    } else {
                        if (user.data().permission !== 0) {
                            signOut();
                        }
                    }
                });
        };
        checkAdmin();
    }, []);

    return (
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("ClientInfo")}
                >
                    <Text>All Client Infos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("FindUser")}
                >
                    <Text>Find User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("SelectMembership")}
                >
                    <Text>Select Membership</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
