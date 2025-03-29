import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated
} from "react-native";
import axios from "axios";

const SERVER_IP = "10.54.12.248";
const SERVER_PORT = 5000;
const API_URL = `http://${SERVER_IP}:${SERVER_PORT}/chat`;

const DietChatScreen = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initial welcome message
  useEffect(() => {
    setChatHistory([{
      sender: "bot",
      text: "Welcome to HealthGenix Chat! I'm here to assist you with your authentication queries. How can I help you today?"
    }]);
    
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Scroll to end when chat updates
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
      setChatHistory((prevChat) => [...prevChat, { sender: "bot", text: response.data.response }]);
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerText}>HealthGenix Chatbot</Text>
        <Text style={styles.subHeader}>Your Personal Diet & Fitness Assistant</Text>
      </Animated.View>

      <ScrollView 
        style={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {chatHistory.map((chat, index) => (
          <Animated.View 
            key={index}
            style={[
              chat.sender === "user" ? styles.userMessage : styles.botMessage,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.messageText}>{chat.text}</Text>
          </Animated.View>
        ))}
        {loading && (
          <ActivityIndicator size="large" color="#00FFFF" style={styles.loadingIndicator} />
        )}
        {error && (
          <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your question here..."
          placeholderTextColor="#A0FFFF"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
          onPress={sendMessage} 
          disabled={loading}
        >
          <Animated.Text style={styles.sendButtonText}>
            {loading ? "..." : "Send"}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Deep black background
  },
  header: {
    padding: 20,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#00CED1",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00FFFF", // Aqua color
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    color: "#A0FFFF",
    textAlign: "center",
    marginTop: 5,
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#00CED1", // Aqua for user messages
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: "75%",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#1A1A1A", // Dark gray for bot messages
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: "75%",
    borderWidth: 1,
    borderColor: "#00CED1",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#FF4444",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  errorText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#00CED1",
  },
  input: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 25,
    marginRight: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#00CED1",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#00CED1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#008B8B",
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingIndicator: {
    marginVertical: 10,
  },
});

export default DietChatScreen;