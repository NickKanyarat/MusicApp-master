// MplayerScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";

const MplayerScreen = () => {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        setAccessToken(token);
      } else {
        navigation.navigate("Login");
      }
    };

    fetchAccessToken();
  }, []);

  useEffect(() => {
    const fetchCurrentPlayback = async () => {
      try {
        const response = await fetch(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            setSongDuration(data.item.duration_ms);
            setIsPlaying(data.is_playing);
            setSliderValue(data.progress_ms);
            setCurrentTrack(data.item);
          }
        } else if (response.status === 401) {
          console.log("Access token expired. Refreshing token...");
          await refreshAccessToken();
          await fetchCurrentPlayback();
        } else {
          console.error(
            "Failed to fetch current playback:",
            response.status
          );
          Alert.alert("Error", "Failed to fetch current playback.");
        }
      } catch (error) {
        console.error("Error fetching current playback:", error);
        Alert.alert("Error", "Failed to fetch current playback.");
      }
    };

    const interval = setInterval(() => {
      fetchCurrentPlayback();
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  const togglePlayback = async () => {
    if (!accessToken) {
      navigation.navigate("Login");
      return;
    }

    try {
      if (isPlaying) {
        await pausePlayback();
      } else {
        await startPlayback();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle playback.");
      console.error("Failed to toggle playback:", error);
    }
  };

  const startPlayback = async () => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/play",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [currentTrack.uri],
          }),
        }
      );

      if (response.ok) {
        setIsPlaying(true);
        console.log("Playback started successfully.");
      } else if (response.status === 401) {
        console.log("Access token expired. Refreshing token...");
        await refreshAccessToken();
        await startPlayback();
      } else {
        console.error("Failed to start playback:", response.status);
        Alert.alert("Error", "Failed to start playback.");
      }
    } catch (error) {
      console.error("Error starting playback:", error);
      Alert.alert("Error", "Failed to start playback.");
    }
  };

  const pausePlayback = async () => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/pause",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setIsPlaying(false);
        console.log("Playback paused successfully.");
      } else {
        console.error("Failed to pause playback:", response.status);
        Alert.alert("Error", "Failed to pause playback.");
      }
    } catch (error) {
      console.error("Error pausing playback:", error);
      Alert.alert("Error", "Failed to pause playback.");
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const clientId = "c082e853dede4ab7a5dd520df4ca3d44";
      const clientSecret = "46b89c90048b48b89242a299f084e681";

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh access token");
      }

      const tokenData = await response.json();
      await AsyncStorage.setItem("accessToken", tokenData.access_token);
      setAccessToken(tokenData.access_token);
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw error;
    }
  };

  const handleNextTrackPress = async () => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/next",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log("Playback moved to next track successfully.");
      } else {
        console.error(
          "Failed to move playback to next track:",
          response.status,
          await response.text()
        );
        Alert.alert("Error", "Failed to move playback to next track.");
      }
    } catch (error) {
      console.error("Error moving playback to next track:", error);
      Alert.alert("Error", "Failed to move playback to next track.");
    }
  };

  const handlePreviousTrackPress = async () => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/previous",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log("Playback moved to previous track successfully.");
      } else {
        console.error(
            "Failed to move playback to previous track:",
            response.status,
            await response.text()
          );
          Alert.alert("Error", "Failed to move playback to previous track.");
        }
      } catch (error) {
        console.error("Error moving playback to previous track:", error);
        Alert.alert("Error", "Failed to move playback to previous track.");
      }
    };
  
    const onSliderValueChange = async (value) => {
      setSliderValue(value);
      if (isPlaying) {
        try {
          const response = await fetch(
            "https://api.spotify.com/v1/me/player/seek",
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                position_ms: value,
              }),
            }
          );
  
          if (!response.ok) {
            console.error(
              "Failed to control track position:",
              response.status
            );
            Alert.alert("Error", "Failed to control track position.");
          }
        } catch (error) {
          console.error("Error controlling track position:", error);
          Alert.alert("Error", "Failed to control track position.");
        }
      }
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screen}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <AntDesign name="left" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Music Player</Text>
          {currentTrack && (
            <>
              <View style={styles.trackImageContainer}>
                <Image
                  source={{ uri: currentTrack.album.images[0].url }}
                  style={styles.trackImage}
                />
              </View>
              <View style={styles.trackInfoContainer}>
                <Text style={styles.trackName}>{currentTrack.name}</Text>
                <Text style={styles.trackArtists}>
                  {currentTrack.artists.map((artist) => artist.name).join(", ")}
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={{ width: "100%", alignSelf: "center", marginTop: 20 }}
                  minimumValue={0}
                  maximumValue={songDuration}
                  value={sliderValue}
                  onValueChange={onSliderValueChange}
                  minimumTrackTintColor="white"
                  maximumTrackTintColor="white"
                />
              </View>
              <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={handlePreviousTrackPress}>
                  <AntDesign name="banckward" size={35} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePlayback}>
                  <AntDesign
                    name={isPlaying ? "pausecircle" : "play"}
                    size={45}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextTrackPress}>
                  <AntDesign name="forward" size={35} color="white" />
                </TouchableOpacity>
              </View>
            </>
          )}
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
    },
    backButton: {
      position: "absolute",
      top: 20,
      left: 20,
      zIndex: 1,
    },
    title: {
      color: "white",
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 30,
      textAlign: "center",
    },
    trackImageContainer: {
      alignItems: "center",
    },
    trackImage: {
      aspectRatio: 1,
      width: "100%",
      maxWidth: 350,
      height: undefined,
    },
    trackInfoContainer: {
      alignItems: "flex-start",
      marginLeft: 15,
      marginTop: 30,
      marginBottom: 30,
      height: 110,
    },
    trackName: {
      color: "white",
      fontSize: 25,
      fontWeight: "600",
      marginBottom: 10,
    },
    trackArtists: {
      color: "lightgray",
      fontSize: 20,
      height: 50,
    },
    sliderContainer: {
      alignItems: "center",
      marginBottom: 50,
    },
    controlsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "85%",
      alignSelf: "center",
      position: "relative",
      alignItems: "center",
    },
  });
  
  export default MplayerScreen;  
