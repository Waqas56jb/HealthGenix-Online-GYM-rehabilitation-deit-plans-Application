import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

const OtpVerificationScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://10.54.12.248:3001/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        Alert.alert("Success", "OTP Verified. Proceed to reset password.");
        navigation.navigate("ResetPasswordScreen", { email });
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#03DAC6",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    padding: 12,
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "#03DAC6",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OtpVerificationScreen;
