import React from "react";
import { Text, View, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import ToHome from "../../../../components/ToHome";
import { theme } from "../../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default Test = ({ navigation }) => {
    return (
        <View style={{ flex: 1 }}>
            <ToHome navigation={navigation} />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ height: 250 }}>
                    <WebView
                        style={{ margin: 10 }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        source={{
                            uri: "https://www.youtube.com/embed/QAUzWtLMnU0",
                        }}
                    />
                </View>
                <View style={{ flex: 2, paddingHorizontal: 10, marginBottom: 5 }}>
                    <Text style={{ fontSize: 20 }}>
                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has
                        roots in a piece of classical Latin literature from 45 BC, making it over
                        2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
                        College in Virginia, looked up one of the more obscure Latin words,
                        consectetur, from a Lorem Ipsum passage, and going through the cites of the
                        word in classical literature, discovered the undoubtable source. Lorem Ipsum
                        comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum"
                        (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a
                        treatise on the theory of ethics, very popular during the Renaissance. The
                        first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line
                        in section 1.10.32.
                    </Text>
                    <Text style={{ fontSize: 20 }}>
                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has
                        roots in a piece of classical Latin literature from 45 BC, making it over
                        2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
                        College in Virginia, looked up one of the more obscure Latin words,
                        consectetur, from a Lorem Ipsum passage, and going through the cites of the
                        word in classical literature, discovered the undoubtable source. Lorem Ipsum
                        comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum"
                        (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a
                        treatise on the theory of ethics, very popular during the Renaissance. The
                        first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line
                        in section 1.10.32.
                    </Text>
                    <Text style={{ fontSize: 20 }}>
                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has
                        roots in a piece of classical Latin literature from 45 BC, making it over
                        2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney
                        College in Virginia, looked up one of the more obscure Latin words,
                        consectetur, from a Lorem Ipsum passage, and going through the cites of the
                        word in classical literature, discovered the undoubtable source. Lorem Ipsum
                        comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum"
                        (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a
                        treatise on the theory of ethics, very popular during the Renaissance. The
                        first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line
                        in section 1.10.32.
                    </Text>
                </View>
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
