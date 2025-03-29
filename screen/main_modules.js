import React, { useRef } from 'react';
import { View, Text, Image, Animated, TouchableWithoutFeedback, StyleSheet, ScrollView } from 'react-native';

const models = [
  { id: 1, name: 'Diet', image: require('../assets/img/diet.png'), screen: 'DietBot' },
  { id: 2, name: 'Rehabilitation', image: require('../assets/img/rehab.png'), screen: 'Rehabilitation_Chatbot' },
  { id: 3, name: 'Gym', image: require('../assets/img/gym.png'), screen: 'CameraScreen' },
];

const ModelShowcase = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}> Our Services </Text>
      <View style={styles.cardContainer}>
        {models.map((model) => (
          <AnimatedCard key={model.id} model={model} navigation={navigation} />
        ))}
      </View>
    </ScrollView>
  );
};

const AnimatedCard = ({ model, navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.9)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => navigation.navigate(model.screen));
  };

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}> 
        <Image source={model.image} style={styles.image} />
        <Text style={styles.cardTitle}>{model.name}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0A0F24', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, color: '#03DAC6', fontWeight: 'bold', marginBottom: 30, textShadowColor: '#FFFFFF', textShadowRadius: 10 },
  cardContainer: { flexDirection: 'column', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    width: 220,
    elevation: 15,
    shadowColor: '#03DAC6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    borderWidth: 1.5,
    borderColor: '#03DAC6',
  },
  image: { width: 160, height: 160, borderRadius: 20, marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textShadowColor: '#03DAC6', textShadowRadius: 10 },
});

export default ModelShowcase;
