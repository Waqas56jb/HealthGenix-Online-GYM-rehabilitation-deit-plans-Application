import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import * as Animatable from "react-native-animatable";

const SERVER_IP = "10.54.12.248"; // Change this to your actual local IP
const SERVER_PORT = 5000; // Flask server port
const API_URL = `http://${SERVER_IP}:${SERVER_PORT}/ask`;

const DietChatScreen = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = { sender: "user", text: message };
    setChatHistory((prevChat) => [...prevChat, newMessage]);
    setMessage("");
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL, { message, history: chatHistory });
      setChatHistory((prevChat) => [
        ...prevChat,
        { sender: "bot", text: response.data.response },
      ]);
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={item.sender === "user" ? styles.userMessage : styles.botMessage}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </Animatable.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Animatable.Text animation="zoomIn" style={styles.header}>
        🍎 DietBot 🍎
      </Animatable.Text>
      <ScrollView
        style={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {chatHistory.map((chat, index) => renderItem({ item: chat, index }))}
        {loading && (
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            style={styles.loaderContainer}
          >
            <ActivityIndicator size="large" color="#00CED1" />
            <Text style={styles.loaderText}>Cooking up your diet advice...</Text>
          </Animatable.View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask your diet question..."
          placeholderTextColor="#A0A0A0"
        />
        <Animatable.View animation="pulse" iterationCount="infinite">
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>{loading ? "..." : "🚀 Send"}</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Black background
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00CED1", // Aqua
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "#00CED1",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  chatContainer: {
    flex: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#00CED1", // Aqua for user
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: "75%",
    shadowColor: "#00CED1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#333333", // Dark gray for bot
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: "75%",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  messageText: {
    color: "#FFFFFF", // White text
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: "#FF5555",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333", // Dark gray input area
    borderRadius: 30,
    paddingHorizontal: 15,
    marginTop: 15,
    shadowColor: "#00CED1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#00CED1", // Aqua send button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  sendButtonText: {
    color: "#1A1A1A", // Black text
    fontSize: 16,
    fontWeight: "bold",
  },
  loaderContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  loaderText: {
    color: "#00CED1",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "bold",
  },
});

export default DietChatScreen;