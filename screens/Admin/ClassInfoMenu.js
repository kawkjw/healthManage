import React, { useContext, useEffect } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text, Surface } from "react-native-paper";
import myBase, { db } from "../../config/MyBase";
import { MyStyles, TextSize, theme } from "../../css/MyStyles";
import { AuthContext } from "../Auth";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

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
        <View style={MyStyles.container}>
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("PtInfo", { ptName: "pt" })}
                    >
                        <Text style={TextSize.largeSize}>PT</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("PtInfo", { ptName: "squash" })}
                    >
                        <Text style={TextSize.largeSize}>스쿼시 PT</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("GxInfo")}
                    >
                        <Text style={TextSize.largeSize}>GX</Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
