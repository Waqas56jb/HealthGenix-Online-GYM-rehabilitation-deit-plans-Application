import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground source={require('../assets/img/1.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        {/* White Header Behind Text */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>HealthGenix</Text>
        </View>

        <Animated.Text style={[styles.subText, { opacity: fadeAnim }]}>
          With this application, you will be able to improve your healthy lifestyle by exercising.
        </Animated.Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LoginLandingPage')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Chatbot Button with Animation */}
      <Animatable.View animation="pulse" iterationCount="infinite" style={styles.chatBotButtonContainer}>
        <TouchableOpacity style={styles.chatBotButton} onPress={() => navigation.navigate('LandingPageChatBot')}>
          <Text style={styles.chatBotText}>💬</Text>
        </TouchableOpacity>
      </Animatable.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 80,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerContainer: {
    backgroundColor: '#03DAC6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 5,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000', // Black text for contrast
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#03DAC6',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  chatBotButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 50,
  },
  chatBotButton: {
    backgroundColor: '#03DAC6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  chatBotText: {
    fontSize: 30,
  },
});

export default WelcomeScreen;
