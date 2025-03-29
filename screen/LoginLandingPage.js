import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const LandingScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.heading, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>HealthGenix</Animated.Text>
      <Animated.Text style={[styles.subText, { opacity: fadeAnim }]}>Choose how you want to log in:</Animated.Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('UserLogin')}>
          <Text style={styles.buttonText}>User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.buttonText}>Admin</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  heading: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#03DAC6',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1.5,
  },
  subText: {
    fontSize: 18,
    color: '#BBB',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#03DAC6',
    width: 240,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#03DAC6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default LandingScreen;
