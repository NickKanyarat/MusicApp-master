import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get access token from AsyncStorage
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          // Fetch user data
          const response = await fetch("https://api.spotify.com/v1/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const data = await response.json();
          setUserData(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      // Remove access token and refresh token from AsyncStorage
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      // Navigate to the login screen
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <Text style={styles.title}>User Profile</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    userData.images.length > 0 ? userData.images[0].url : null,
                }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Name :</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{userData.display_name}</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Email :</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{userData.email}</Text>
              </View>
            </View>

            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    textAlign: "center",
  },
  profileInfo: {
    paddingTop: 30,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  labelContainer: {
    alignItems: "flex-start",
  },
  label: {
    color: "lightgray",
    fontSize: 18,
    marginRight: 10,
    fontWeight: "bold",
  },
  valueContainer: {
    alignItems: "flex-start",
  },
  value: {
    color: "white",
    fontSize: 18,
    fontWeight: "normal",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginTop: 10,
  },
  logoutContainer: {
    alignItems: "center",
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 50,
    backgroundColor: "red",
    borderRadius: 25,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ProfileScreen;
