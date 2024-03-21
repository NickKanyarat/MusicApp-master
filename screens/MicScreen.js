import { Button, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import axios from 'axios';

const MicScreen = () => {
  const [recording, setRecording] = useState();
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  async function startRecording() {
    try {
      if (permissionResponse.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }

      console.log("Starting recording..");
      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recordingObject.startAsync();
      setRecording(recordingObject);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    try {
      console.log("Stopping recording..");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      setRecording(undefined);

      // เรียกใช้ฟังก์ชันเพื่อตรวจสอบไฟล์เสียง
      checkAudioFileExistence(uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  async function checkAudioFileExistence(uri) {
    try {
      const response = await axios.head(uri);
      if (response.status === 200) {
        console.log("Audio file exists");
      } else {
        console.log("Audio file does not exist");
      }
    } catch (error) {
      console.error("Error checking audio file existence:", error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewScreen}>
        <Text style={styles.titleText}>MICROPHONE</Text>
        <View style={styles.button}>
          <Button
            title={recording ? "Stop Recording" : "Start Recording"}
            onPress={recording ? stopRecording : startRecording}
            color="purple"
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
  viewScreen: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  titleText: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    marginHorizontal: 50,
    marginVertical: 50,
    padding: 50,
  },
});

export default MicScreen;
