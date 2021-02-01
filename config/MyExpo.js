import { Expo } from "expo-server-sdk";
import * as Notifications from "expo-notifications";
import { db } from "./MyBase";
import * as Permissions from "expo-permissions";
import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyExpo = new Expo();

export const registerForPushNotificationAsync = async () => {
    let token = null;
    const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        const { status } = await Permissions.askAsync(
            Permissions.NOTIFICATIONS
        );
        finalStatus = status;
    }
    if (finalStatus !== "granted") {
        Alert.alert("Fail", "Failed for Notifications", [
            { text: "OK", onPress: () => Linking.openSettings() },
        ]);
        return null;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem("notificationToken", token);
    console.log(await AsyncStorage.getItem("notificationToken"));

    if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }
};

export const pushNotificationsToAdmin = async (
    inputTitle,
    inputBody,
    inputData = {}
) => {
    let messages = [];
    let tokens = [];
    await db
        .collection("adminTokens")
        .get()
        .then(async (adminUsers) => {
            adminUsers.forEach((adminUser) => {
                const expoTokens = adminUser.data().expoToken;
                for (let expoToken of expoTokens) {
                    tokens.push(expoToken);
                }
            });
            for (let token of tokens) {
                if (!Expo.isExpoPushToken(token)) {
                    console.log(`Error: ${token} is not expo token`);
                    return;
                }
                messages.push({
                    to: token,
                    sound: "default",
                    title: inputTitle,
                    body: inputBody,
                    data: inputData,
                    badge: 1,
                });
            }

            let chunks = MyExpo.chunkPushNotifications(messages);
            let tickets = [];
            for (let chunk of chunks) {
                try {
                    const ticketChunk = await MyExpo.sendPushNotificationsAsync(
                        chunk
                    );
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.log(error);
                }
            }
        });
};

export const pushNotificationsToTrainer = async (
    trainerUid,
    inputTitle,
    inputBody,
    inputData = {}
) => {
    let messages = [];
    let tokens = [];
    await db
        .collection("adminTokens")
        .doc(trainerUid)
        .get()
        .then(async (trainer) => {
            const expoTokens = trainer.data().expoToken;
            for (let expoToken of expoTokens) {
                tokens.push(expoToken);
            }

            for (let token of tokens) {
                if (!Expo.isExpoPushToken(token)) {
                    console.log(`Error: ${token} is not expo token`);
                    return;
                }
                messages.push({
                    to: token,
                    sound: "default",
                    title: inputTitle,
                    body: inputBody,
                    data: inputData,
                    badge: 1,
                });
            }

            let chunks = MyExpo.chunkPushNotifications(messages);
            let tickets = [];
            for (let chunk of chunks) {
                try {
                    const ticketChunk = await MyExpo.sendPushNotificationsAsync(
                        chunk
                    );
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.log(error);
                }
            }
        });
};

export const pushNotificationsToClient = async (
    clientUid,
    inputTitle,
    inputBody,
    inputData = {}
) => {
    let messages = [];
    let tokens = [];
    await db
        .collection("users")
        .doc(clientUid)
        .get()
        .then(async (client) => {
            const expoTokens = client.data().expoToken;
            for (let expoToken of expoTokens) {
                tokens.push(expoToken);
            }

            for (let token of tokens) {
                if (!Expo.isExpoPushToken(token)) {
                    console.log(`Error: ${token} is not expo token`);
                    return;
                }
                messages.push({
                    to: token,
                    sound: "default",
                    title: inputTitle,
                    body: inputBody,
                    data: inputData,
                    badge: 1,
                });
            }

            let chunks = MyExpo.chunkPushNotifications(messages);
            let tickets = [];
            for (let chunk of chunks) {
                try {
                    const ticketChunk = await MyExpo.sendPushNotificationsAsync(
                        chunk
                    );
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.log(error);
                }
            }
        });
};

export default MyExpo;
