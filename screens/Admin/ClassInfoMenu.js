import React, { useContext, useEffect } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from "react-native";
import myBase, { db } from "../../config/MyBase";
import { MyStyles, TextSize } from "../../css/MyStyles";
import { AuthContext } from "../Auth";

export default ClientInfoMenu = ({ navigation, route }) => {
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
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("PtInfo", { ptName: "pt" })}
                >
                    <Text style={TextSize.largeSize}>PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("PtInfo", { ptName: "squash" })}
                >
                    <Text style={TextSize.largeSize}>스쿼시 PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("GxInfo")}
                >
                    <Text style={TextSize.largeSize}>GX</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
