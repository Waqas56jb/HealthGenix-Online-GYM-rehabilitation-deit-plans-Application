import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, TextInput, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit'; // Removed BarChart
import * as Animatable from 'react-native-animatable'; // For animations

const screenWidth = Dimensions.get('window').width;
const NOTIFICATION_API = 'http://10.54.12.248:3001/api/notifications';
const FEEDBACK_API = 'http://10.54.12.248:3001/api/feedback';

const UserDashboard = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchNotifications();
    }, []);

    const fetchUserData = () => {
        fetch('http://10.54.12.248:3001/profile', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch user data');
                return res.json();
            })
            .then(data => {
                if (data.message) {
                    navigation.replace('LoginScreen');
                } else {
                    setUser(data);
                }
            })
            .catch(err => {
                console.error('Error fetching user data:', err);
                alert('Failed to fetch user data');
            })
            .finally(() => setLoading(false));
    };

    const fetchNotifications = () => {
        fetch(`${NOTIFICATION_API}/user`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch notifications');
                return res.json();
            })
            .then(data => setNotifications(data))
            .catch(err => console.error('Error fetching notifications:', err));
    };

    const markAsSeen = (id) => {
        fetch(`${NOTIFICATION_API}/${id}/seen`, {
            method: 'PUT',
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to mark as seen');
                return res.json();
            })
            .then(() => {
                setNotifications(notifications.map(n => n.id === id ? { ...n, is_seen: true } : n));
            })
            .catch(err => console.error('Error marking as seen:', err));
    };

    const submitFeedback = () => {
        if (!feedback || !selectedNotification) {
            Alert.alert('Error', 'Please enter feedback before submitting.');
            return;
        }

        fetch(FEEDBACK_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_email: user.email, notification_id: selectedNotification.id, feedback })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to submit feedback');
                return res.json();
            })
            .then(() => {
                Alert.alert('Success', 'Feedback submitted successfully');
                setShowFeedbackModal(false);
                setFeedback('');
                setSelectedNotification(null);
            })
            .catch(err => {
                console.error('Error submitting feedback:', err);
                Alert.alert('Error', 'Failed to submit feedback. Please try again.');
            });
    };

    if (loading) return <ActivityIndicator size="large" color="#FFA500" style={styles.loader} />;

    return (
        <ScrollView style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)}>
                    <Ionicons name="notifications-outline" size={28} color='#fff' style={styles.notificationIcon} />
                    {notifications.filter(n => !n.is_seen).length > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{notifications.filter(n => !n.is_seen).length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Image source={{ uri: user?.profile_image || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                </TouchableOpacity>
            </View>

            {/* User Stats Cards */}
            <View style={styles.statsContainer}>
                <Animatable.View animation="fadeInUp" duration={1000} style={styles.statCard}>
                    <Text style={styles.statValue}>$1,200</Text>
                    <Text style={styles.statLabel}>Total Spent</Text>
                </Animatable.View>
                <Animatable.View animation="fadeInUp" duration={1200} style={styles.statCard}>
                    <Text style={styles.statValue}>3</Text>
                    <Text style={styles.statLabel}>Subscriptions</Text>
                </Animatable.View>
            </View>

            {/* Chart */}
            <Text style={styles.chartTitle}>User Engagement (Last 7 Days)</Text>
            <LineChart
                data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{ data: [100, 200, 150, 300, 250, 400, 500] }]
                }}
                width={screenWidth - 20}
                height={220}
                yAxisLabel=""
                chartConfig={{
                    backgroundGradientFrom: '#03DAC6',
                    backgroundGradientTo: '#08130D',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 10 }
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
            />

            {/* Notifications Popup */}
            {showNotifications && (
                <Animatable.View animation="fadeInDown" duration={500} style={styles.notificationPopup}>
                    <ScrollView>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <TouchableOpacity
                                    key={notif.id}
                                    style={[styles.notificationItem, notif.is_seen ? styles.seenNotification : null]}
                                    onPress={() => {
                                        markAsSeen(notif.id);
                                        setSelectedNotification(notif);
                                        setShowFeedbackModal(true);
                                    }}
                                >
                                    <Text style={styles.notificationText}>{notif.message}</Text>
                                    <Text style={styles.notificationTime}>{new Date(notif.created_at).toLocaleString()}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noNotificationText}>No notifications</Text>
                        )}
                    </ScrollView>
                </Animatable.View>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && selectedNotification && (
                <Modal visible={showFeedbackModal} transparent animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Feedback for Notification</Text>
                            <Text style={styles.notificationText}>{selectedNotification.message}</Text>
                            <TextInput
                                style={[styles.input, { height: 100 }]}
                                placeholder="Your feedback..."
                                placeholderTextColor="#999"
                                value={feedback}
                                onChangeText={setFeedback}
                                multiline
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.modalButton} onPress={submitFeedback}>
                                    <Text style={styles.buttonText}>Submit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalButton} onPress={() => setShowFeedbackModal(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Bottom Navigation Buttons */}
            <View style={styles.bottomNav}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('main_modules')}>
                        <Ionicons name="home" size={24} color="#fff" />
                        <Text style={styles.navButtonText}>Modules</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('CameraScreen')}>
                        <FontAwesome5 name="chart-line" size={24} color="#fff" />
                        <Text style={styles.navButtonText}>Analytics</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('profile')}>
                        <Ionicons name="settings" size={24} color="#fff" />
                        <Text style={styles.navButtonText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('UserLogin')}>
                        <Ionicons name="log-out" size={24} color="#fff" />
                        <Text style={styles.navButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Image Modal */}
            <Modal transparent={true} visible={modalVisible} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.fullscreenImageContainer} onPress={() => setModalVisible(false)}>
                        <Image source={{ uri: user?.profile_image || 'https://via.placeholder.com/100' }} style={styles.fullscreenImage} />
                    </TouchableOpacity>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 10 },
    loader: { marginTop: 20 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 20 },
    avatar: { width: 45, height: 45, borderRadius: 50, borderWidth: 2, borderColor: 'white', shadowColor: '#03DAC6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 5 },
    notificationIcon: { marginLeft: 5 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
    statCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, width: '48%', alignItems: 'center', shadowColor: '#03DAC6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 5 },
    statValue: { color: '#03DAC6', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: '#B0B0B0', fontSize: 14, marginTop: 5 },
    chartTitle: { color: '#03DAC6', fontSize: 18, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
    notificationPopup: {
        position: 'absolute',
        top: 70,
        right: 20,
        width: 300,
        maxHeight: 400,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 10,
        zIndex: 1000,
        elevation: 5,
    },
    notificationItem: { padding: 19, borderBottomWidth: 1, borderBottomColor: '#333' },
    seenNotification: { backgroundColor: '#333' },
    notificationText: { color: '#fff', fontSize: 14 },
    notificationTime: { color: '#999', fontSize: 12, marginTop: 5 },
    noNotificationText: { color: '#999', textAlign: 'center', padding: 20 },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { color: '#fff', fontSize: 12 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, width: '80%' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    input: { backgroundColor: '#333', color: '#fff', padding: 10, borderRadius: 5, marginBottom: 15 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButton: { backgroundColor: '#03DAC6', padding: 10, borderRadius: 5, width: '45%', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 14 },
    bottomNav: {
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    navButton: {
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        width: '45%',
        shadowColor: '#03DAC6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
    },
    fullscreenImage: { width: '100%', height: '100%', resizeMode: 'contain' },
});

export default UserDashboard;