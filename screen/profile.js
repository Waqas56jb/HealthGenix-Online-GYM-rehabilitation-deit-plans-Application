import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // For gradient buttons

const ProfileEditScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState("https://via.placeholder.com/150");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://10.54.12.248:3001/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setName(data.username || "");
        setEmail(data.email || "");
        setCountry(data.country || "");
        setPhone(data.phone || "");
        setProfileImage(data.profile_image ? `http://10.54.12.248:3001${data.profile_image}` : "https://via.placeholder.com/150");
      } else {
        Alert.alert("Error", "Failed to fetch your profile.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Network issue. Please check your connection.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photo library.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", name);
      formData.append("country", country || "");
      formData.append("phone", phone || "");
      if (password) formData.append("password", password);

      if (profileImage && profileImage.startsWith("file://")) {
        formData.append("profile_image", {
          uri: profileImage,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }

      const response = await fetch("http://10.54.12.248:3001/update-profile", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Your profile has been updated!");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Your Profile</Text>
        <Text style={styles.subtitle}>Update your details below</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
        <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
          <Ionicons name="camera" size={28} color="#03DAC6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Your Name</Text>
      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Your Email (Cannot Change)</Text>
      <TextInput
        placeholder="Your email"
        value={email}
        editable={false}
        style={[styles.input, styles.disabledInput]}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Your Country</Text>
      <TextInput
        placeholder="Enter your country"
        value={country}
        onChangeText={setCountry}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Your Phone</Text>
      <TextInput
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>New Password (Optional)</Text>
      <TextInput
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        onPress={handleUpdateProfile}
        style={styles.updateButton}
        disabled={loading}
      >
        <LinearGradient
          colors={["#03DAC6", "#00BFA5"]}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.updateButtonText}>Save Changes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#03DAC6",
    marginTop: 20,
    textShadowColor: "#03DAC6",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#03DAC6",
    shadowColor: "#03DAC6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#03DAC6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#03DAC6",
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1A1A1A",
    color: "#fff",
    fontSize: 16,
    shadowColor: "#03DAC6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  disabledInput: {
    backgroundColor: "#333",
    opacity: 0.7,
  },
  updateButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 20,
  },
  gradient: {
    padding: 15,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProfileEditScreen;