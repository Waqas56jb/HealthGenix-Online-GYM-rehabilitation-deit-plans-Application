import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AdminPasswordResetScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer for OTP expiration
  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  // Verify Email and Send OTP
  const handleVerifyEmailAndSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter an email");
      return;
    }

    setLoading(true);
    try {
      // Verify email
      const verifyResponse = await fetch("http://10.54.12.248:3001/admin-verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setLoading(false);
        Alert.alert("Error", verifyData.message || "Email not found");
        return;
      }

      // Send OTP
      const otpResponse = await fetch("http://10.54.12.248:3001/admin-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const otpData = await otpResponse.json();

      setLoading(false);
      if (otpResponse.ok) {
        setOtpModalVisible(true);
        setTimer(60);
        setCanResend(false);
        Alert.alert("Success", "OTP sent to your email.");
      } else {
        Alert.alert("Error", otpData.message || "Failed to send OTP");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Network error or server unavailable");
      console.error(error);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://10.54.12.248:3001/admin-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setOtpModalVisible(false);
        setResetModalVisible(true);
        setOtp(""); // Clear OTP
      } else {
        Alert.alert("Error", data.message || "Invalid OTP");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Network error or server unavailable");
      console.error(error);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://10.54.12.248:3001/admin-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const otpData = await response.json();
      setLoading(false);

      if (response.ok) {
        setTimer(60);
        setCanResend(false);
        setOtp("");
        Alert.alert("Success", "New OTP sent to your email.");
      } else {
        Alert.alert("Error", otpData.message || "Failed to resend OTP");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Network error or server unavailable");
      console.error(error);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in both password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://10.54.12.248:3001/admin-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setResetModalVisible(false);
        Alert.alert("Success", "Password reset successfully!", [
          { text: "OK", onPress: () => navigation.navigate("AdminLogin") },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Network error or server unavailable");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Forgot Password</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail" size={24} color="#aaa" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!otpModalVisible && !resetModalVisible} // Disable when modals are open
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyEmailAndSendOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      {/* OTP Verification Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.timerText}>Time remaining: {timer}s</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resendButton, !canResend && styles.buttonDisabled]}
              onPress={handleResendOtp}
              disabled={!canResend || loading}
            >
              <Text style={styles.resendText}>
                {canResend ? "Resend OTP" : `Resend in ${timer}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={resetModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    width: "100%",
    marginBottom: 20,
  },
  icon: {
    marginLeft: 10,
    marginRight: 5,
  },
  input: {
    flex: 1,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "#03DAC6",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#028f7e",
    opacity: 0.7,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: "#03DAC6",
    fontWeight: "bold",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 15,
  },
  resendButton: {
    marginTop: 15,
  },
  resendText: {
    color: "#03DAC6",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default AdminPasswordResetScreen;