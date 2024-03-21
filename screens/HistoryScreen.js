import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert, FlatList, Image, TouchableOpacity, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HistoryScreen = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recentRecording, setRecentRecording] = useState(null);
  const [recordedAudios, setRecordedAudios] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          fetchRecentlyPlayed(token);
        } else {
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to fetch data.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadRecordedAudios = async () => {
      try {
        const storedAudios = await AsyncStorage.getItem('recordedAudioURI');
        if (storedAudios) {
          setRecordedAudios(JSON.parse(storedAudios));
        }
      } catch (error) {
        console.error('Error loading recorded audios:', error);
      }
    };

    loadRecordedAudios();
  }, []); 

  const fetchRecentlyPlayed = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const uniqueTracks = [];
        const trackIds = new Set();
        for (const item of data.items) {
          if (!trackIds.has(item.track.id)) {
            uniqueTracks.push(item);
            trackIds.add(item.track.id);
          }
          if (uniqueTracks.length === 5) break;
        }
        setRecentlyPlayed(uniqueTracks);
      } else {
        console.error("Failed to fetch recently played:", response.status);
      }
    } catch (error) {
      console.error("Error fetching recently played:", error);
    }
  };

  useEffect(() => {
    if (recordedAudios.length > 0) {
      setRecentRecording(recordedAudios[recordedAudios.length - 1]);
    } else {
      setRecentRecording(null);
    }
  }, [recordedAudios]);

  const renderItem = ({ item }) => (
    <View style={styles.songItem}>
      <Image
        source={{ uri: item.track.album.images[0].url }}
        style={styles.albumImage}
      />
      <View style={styles.songDetails}>
        <Text style={styles.songName}>{item.track.name}</Text>
        <Text style={styles.artistName}>{item.track.artists[0].name}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.title}>History</Text>
        <FlatList
          data={recentlyPlayed}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.content}
        />
        <View style={styles.recentContainer}>
          <Text style={styles.title}>Recent song humming</Text>
          {recentRecording && (
            <TouchableOpacity onPress={() => Linking.openURL(recentRecording)}>
              <Image source={{ uri: recentRecording }} style={styles.albumImage} />
            </TouchableOpacity>
          )}
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
    height: "50%",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  songItem: {
    flexDirection: "row",
    marginBottom: 20,
    width: "100%",
  },
  albumImage: {
    width: 55,
    height: 55,
    marginRight: 10,
    borderRadius: 5,
  },
  songDetails: {
    marginLeft: 0,
  },
  songName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  artistName: {
    color: "gray",
    fontSize: 14,
  },
  recentContainer: {
    flexGrow: 1,
    alignItems: "flex-start",
    height: "50%",
    paddingTop: 20,
  },
});

export default HistoryScreen;