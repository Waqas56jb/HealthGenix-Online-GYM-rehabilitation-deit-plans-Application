import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as Animatable from 'react-native-animatable';

const RehabScreen = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sound, setSound] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = { sender: 'user', text: message };
    setChatHistory([...chatHistory, newMessage]);
    setLoading(true);

    try {
      const response = await axios.post('http://10.54.12.248:5000/rehab', {
        message,
        history: chatHistory,
      });

      const botResponse = {
        sender: 'bot',
        text: response.data.response,
        audioUrl: response.data.audio_url ? `http://10.54.12.248:5000${response.data.audio_url}` : null,
        downloadUrl: response.data.download_url ? `http://10.54.12.248:5000${response.data.download_url}` : null,
      };
      setChatHistory((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [...prev, { sender: 'bot', text: 'Error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const downloadFile = async (url, fileName) => {
    try {
      const { uri } = await FileSystem.downloadAsync(url, FileSystem.documentDirectory + fileName);
      console.log('Downloaded to:', uri);
      alert('Text downloaded successfully!');
    } catch (error) {
      console.error(error);
      alert('Error downloading text.');
    }
  };

  const playAudio = async (audioUrl) => {
    if (!audioUrl) {
      alert('Audio not available.');
      return;
    }

    if (sound) {
      await sound.unloadAsync();
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error(error);
      alert('Error playing audio.');
    }
  };

  const renderItem = ({ item }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={item.sender === 'user' ? styles.userMessage : styles.botMessage}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      {item.sender === 'bot' && (
        <View style={styles.buttonContainer}>
          <Animatable.View animation="bounceIn" delay={100}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => downloadFile(item.downloadUrl, 'rehab_response.txt')}
            >
              <Text style={styles.buttonText}>📥 Download</Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View animation="bounceIn" delay={200}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => playAudio(item.audioUrl)}
            >
              <Text style={styles.buttonText}>🎵 Play</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      )}
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <Animatable.Text animation="zoomIn" style={styles.header}>
        🌟 RehabBot 🌟
      </Animatable.Text>
      <FlatList
        data={chatHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.chatList}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      {loading && (
        <Animatable.View animation="rotate" iterationCount="infinite" style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00CED1" />
          <Text style={styles.loaderText}>Loading your rehab magic...</Text>
        </Animatable.View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask about injury recovery..."
          placeholderTextColor="#A0A0A0"
        />
        <Animatable.View animation="pulse" iterationCount="infinite">
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>🚀 Send</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Black background
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00CED1', // Aqua
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#00CED1',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  chatList: {
    flex: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#00CED1', // Aqua for user
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: '75%',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333333', // Dark gray for bot
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: '75%',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  messageText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#00CED1', // Aqua buttons
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#1A1A1A', // Black text on aqua
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333', // Dark gray input area
    borderRadius: 30,
    paddingHorizontal: 15,
    marginTop: 15,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#00CED1', // Aqua send button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  sendButtonText: {
    color: '#1A1A1A', // Black text
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loaderText: {
    color: '#00CED1',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
});

export default RehabScreen;