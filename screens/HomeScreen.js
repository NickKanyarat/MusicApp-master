import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          setAccessToken(token);
          fetchTopTracks(token);
        } else {
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        Alert.alert("Error", "Failed to fetch data.");
      }
    };

    fetchData();
  }, [navigation]);

  const fetchTopTracks = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/tracks?limit=30&time_range=long_term",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch top tracks");
      }

      const data = await response.json();
      setTopTracks(data.items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to fetch top tracks.");
    }
  };

  const handleTrackPress = async (track) => {
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
            uris: [track.uri],
          }),
        }
      );

      if (response.ok) {
        console.log("Successfully started playback of the selected track.");
        navigation.navigate("Player", { track }); 
      } else {
        console.error("Failed to start playback:", response.status);
        Alert.alert("Error", "Failed to start playback.");
      }
    } catch (error) {
      console.error("Error starting playback:", error);
      Alert.alert("Error", "Failed to start playback.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.title}>Tracks for You</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <ScrollView contentContainerStyle={styles.tracksContainer}>
            {topTracks.map((track, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleTrackPress(track)}
              >
                <View style={styles.trackItem}>
                  <Image
                    source={{ uri: track.album.images[0].url }}
                    style={styles.trackImage}
                  />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName}>{track.name}</Text>
                    <Text style={styles.trackArtists}>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    marginTop: 20,
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tracksContainer: {
    alignItems: "flex-start",
  },
  trackItem: {
    flexDirection: "row",
    marginBottom: 20,
    width: "100%",
  },
  trackImage: {
    width: 55,
    height: 55,
    marginRight: 10,
    borderRadius: 5,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  trackArtists: {
    color: "lightgray",
    fontSize: 14,
  },
});

export default HomeScreen;