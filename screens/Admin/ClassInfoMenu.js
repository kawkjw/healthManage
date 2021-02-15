import React, { useContext, useEffect } from "react";
import { Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
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
                    onPress={() => navigation.navigate("PtInfo")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("GxInfo")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>GX</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
