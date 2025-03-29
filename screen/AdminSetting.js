import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";

const AllUsersScreen = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SERVER_URL = "http://10.54.12.248:3001"; // Your server URL

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async (retryCount = 0) => {
    try {
      const response = await axios.get(`${SERVER_URL}/get-all-users`, {
        timeout: 5000, // 5-second timeout to avoid hanging
      });
      console.log("Fetched users:", response.data); // Debug log
      setAllUsers(response.data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
      if (retryCount < 2) {
        // Retry up to 2 times if network error occurs
        setTimeout(() => fetchAllUsers(retryCount + 1), 2000); // Wait 2 seconds before retry
      } else {
        setError("Failed to fetch users. Please check your network or server.");
      }
    } finally {
      if (retryCount === 0 || retryCount === 2) setLoading(false); // Only set loading false on first try or last retry
    }
  };

  const deleteUser = async (email, username) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/delete-user/${email}`);
              Alert.alert("Success", "User deleted successfully");
              fetchAllUsers(); // Refresh the list
            } catch (error) {
              console.error("Error deleting user:", error.response?.data || error.message);
              Alert.alert("Error", "Failed to delete user. Try again.");
            }
          },
        },
      ]
    );
  };

  const renderUserCard = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <Image
          source={{
            uri: item.profile_image || "https://via.placeholder.com/150?text=Profile",
          }}
          style={styles.profileImage}
        />
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.detailText}>Country: {item.country || "N/A"}</Text>
          <Text style={styles.detailText}>Phone: {item.phone || "N/A"}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteUser(item.email, item.username)}
        >
          <Icon name="delete" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Beautiful Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Registered Users</Text>
      </View>

      {/* Users List */}
      {loading ? (
        <ActivityIndicator size="large" color="#03DAC6" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : allUsers.length === 0 ? (
        <Text style={styles.noUsersText}>No users found</Text>
      ) : (
        <FlatList
          data={allUsers}
          keyExtractor={(item) => item.email}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // Black background
    padding: 20,
  },
  headerContainer: {
    backgroundColor: "#03DAC6", // Teal background for header
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000", // Black text on teal header
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: "#03DAC6", // Teal card background
    borderRadius: 12,
    marginBottom: 15,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#000000", // Black border on image
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000", // Black text
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#000000", // Black text
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: "#000000", // Black text
  },
  deleteButton: {
    backgroundColor: "#000000", // Black delete button
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  noUsersText: {
    fontSize: 18,
    color: "#03DAC6", // Teal text
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#03DAC6", // Teal text for errors
    textAlign: "center",
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default AllUsersScreen;