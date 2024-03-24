import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  FlatList,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MicScreen = () => {
  const [recording, setRecording] = useState(null);
  const [audioPermission, setAudioPermission] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordedAudioURIs, setRecordedAudioURIs] = useState([]);

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: "Microphone Permission",
              message: "This app needs access to your microphone.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Microphone permission granted");
            setAudioPermission(true);
          } else {
            console.log("Microphone permission denied");
            setAudioPermission(false);
          }
        } else {
          const { status } = await Audio.requestPermissionsAsync();
          setAudioPermission(status === "granted");
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestMicPermission();
    getRecordedAudioURIs();
  }, []);

  const getRecordedAudioURIs = async () => {
    try {
      let uris = await AsyncStorage.getItem("recordedAudioURI");
      if (uris) {
        uris = JSON.parse(uris);
        uris = uris.filter((item) => item && item.uri && item.date);
        uris.sort((a, b) => b.date - a.date);
        const latest2URIs = uris.slice(0, 1);
        setRecordedAudioURIs(latest2URIs);
      }
    } catch (error) {
      console.error("Error retrieving recorded audio URIs:", error);
      Alert.alert("Error", "Failed to retrieve recorded audio URIs.");
    }
  };  

  const startRecording = async () => {
    try {
      if (!audioPermission) {
        Alert.alert(
          "Permission Denied",
          "Please grant permission to record audio."
        );
        return;
      }

      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recordingObject.startAsync();
      setRecording(recordingObject);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
        setIsRecording(false);
        saveRecordedAudioURI(uri);
        getRecordedAudioURIs();
      } else {
        console.warn("No recording to stop.");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording.");
    }
  };

  const saveRecordedAudioURI = async (uri) => {
    try {
      let recordedAudios = await AsyncStorage.getItem("recordedAudioURI");
      if (!recordedAudios) {
        recordedAudios = [];
      } else {
        recordedAudios = JSON.parse(recordedAudios);
      }
      recordedAudios.push({ uri, date: Date.now() });
      await AsyncStorage.setItem(
        "recordedAudioURI",
        JSON.stringify(recordedAudios)
      );
    } catch (error) {
      console.error("Error saving recorded audio URI:", error);
      Alert.alert("Error", "Failed to save recorded audio.");
    }
  };

  const playSound = async (uri) => {
    try {
      if (!uri) {
        Alert.alert("Error", "No recorded audio available.");
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      if (!sound) {
        Alert.alert("Error", "Failed to create sound.");
        return;
      }

      setSound(sound);
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.playAsync();
      } else {
        Alert.alert("Error", "Sound is not loaded.");
      }
    } catch (error) {
      console.error("Failed to play sound:", error);
      Alert.alert("Error", "Failed to play sound.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.title}>Microphone</Text>
        <View style={styles.content}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isRecording ? "red" : "green" },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fileContainer}>
          <FlatList
            data={recordedAudioURIs}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.button}
                onPress={() => playSound(item.uri)}
              >
                <Text style={styles.buttonText}>{`Sound ${index + 1}`}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  screen: {
    flex: 1,
    padding: 20,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "blue",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  fileContainer: {
    flex: 1,
    alignItems: "center",
  },
});

export default MicScreen;
