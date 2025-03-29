import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Dimensions, TextInput, Modal } from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.54.12.248:3001/api/dashboard';
const NOTIFICATION_API = 'http://10.54.12.248:3001/api/notifications';
const FEEDBACK_API = 'http://10.54.12.248:3001/api/feedback';

const Card = ({ title, value, icon }) => (
    <View style={styles.cardContainer}>
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={styles.textWrapper}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.valueText}>{value}</Text>
        </View>
    </View>
);

Card.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.element.isRequired,
};

const DashboardButton = ({ title, icon, onPress }) => (
    <Animatable.View animation="fadeInUp" duration={1000} style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.buttonIcon}>{icon}</View>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    </Animatable.View>
);

DashboardButton.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    onPress: PropTypes.func.isRequired,
};

const AdminDashboardScreen = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        fetchDashboardData();
        fetchNotifications();
        fetchFeedback();
    }, []);

    const fetchDashboardData = () => {
        fetch(API_URL, { credentials: 'include' })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                setLoading(false);
            });
    };

    const fetchNotifications = () => {
        fetch(`${NOTIFICATION_API}/admin`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch notifications');
                return res.json();
            })
            .then(data => setNotifications(data))
            .catch(err => console.error('Error fetching notifications:', err));
    };

    const fetchFeedback = () => {
        fetch(FEEDBACK_API, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch feedback');
                return res.json();
            })
            .then(data => setFeedbacks(data))
            .catch(err => console.error('Error fetching feedback:', err));
    };

    const sendNotification = () => {
        fetch(NOTIFICATION_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sender_email: 'waqas56jb@gmail.com', receiver_email: email || null, message }) // Replace with actual admin email from session
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to send notification');
                return res.json();
            })
            .then(data => {
                setNotifications([...notifications, data]);
                setShowSendModal(false);
                setEmail('');
                setMessage('');
            })
            .catch(err => console.error('Error sending notification:', err));
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={[styles.headerContainer, { marginTop: 50 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={require('../assets/img/admin.jpg')} style={styles.profileImage} />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>Welcome, Admin</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShowFeedbackModal(true)}>
                        <Feather name="message-square" size={28} color="#fff" style={{ marginRight: 15 }} />
                        {feedbacks.length > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{feedbacks.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)}>
                        <Ionicons name="notifications" size={28} color="#fff" style={{ marginRight: 15 }} />
                        {notifications.length > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{notifications.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {showNotifications && (
                <View style={styles.notificationPopup}>
                    <ScrollView>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <View key={notif.id} style={styles.notificationItem}>
                                    <Text style={styles.notificationText}>{notif.message}</Text>
                                    <Text style={styles.notificationEmail}>To: {notif.receiver_email || 'All Users'}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noNotificationText}>No notifications</Text>
                        )}
                    </ScrollView>
                </View>
            )}

            {showFeedbackModal && (
                <Modal visible={showFeedbackModal} transparent animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>User Feedback</Text>
                            <ScrollView>
                                {feedbacks.length > 0 ? (
                                    feedbacks.map((fb) => (
                                        <View key={fb.id} style={styles.feedbackItem}>
                                            <Text style={styles.feedbackText}>{fb.feedback}</Text>
                                            <Text style={styles.feedbackEmail}>From: {fb.user_email}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noNotificationText}>No feedback yet</Text>
                                )}
                            </ScrollView>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowFeedbackModal(false)}>
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#03DAC6" />
                ) : error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : (
                    <View style={styles.cardsContainer}>
                        <Card title="Total Users" value={data?.totalUsers ?? 'N/A'} icon={<Ionicons name="people" size={28} color="#fff" />} />
                        <Card title="Total Admins" value={data?.totalAdmins ?? 'N/A'} icon={<Ionicons name="shield-checkmark" size={28} color="#fff" />} />
                        <Card title="Total Credits Bought" value="2000" icon={<Feather name="credit-card" size={28} color="#fff" />} />
                        <Card title="Credits Earned This Month" value="1500" icon={<Feather name="dollar-sign" size={28} color="#fff" />} />
                    </View>
                )}

                <View style={styles.buttonsGrid}>
                    <DashboardButton title="Home" icon={<Ionicons name="home" size={24} color="#fff" />} onPress={() => navigation.navigate('AdminDashboard')} />
                    <DashboardButton title="Settings" icon={<Ionicons name="settings" size={24} color="#fff" />} onPress={() => navigation.navigate('AdminSetting')} />
                    <DashboardButton title="Analytics" icon={<MaterialIcons name="bar-chart" size={24} color="#fff" />} onPress={() => navigation.navigate('Admin_Analytics')} />
                    <DashboardButton 
                        title="Send Notification" 
                        icon={<Feather name="speaker" size={24} color="#fff" />} 
                        onPress={() => setShowSendModal(true)} 
                    />
                </View>
            </ScrollView>

            <Modal visible={showSendModal} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Send Notification</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="User Email (leave blank for all users)"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            placeholder="Message"
                            placeholderTextColor="#999"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={sendNotification}>
                                <Text style={styles.buttonText}>Send</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSendModal(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const { width } = Dimensions.get('window');
const buttonSize = width * 0.4;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    contentContainer: { padding: 20 },
    headerContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 10 
    },
    profileImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#03DAC6' },
    cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardContainer: { width: '48%', padding: 15, marginBottom: 15, borderRadius: 12, backgroundColor: '#1E1E1E', elevation: 5, flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    textWrapper: { flex: 1 },
    titleText: { color: '#B0B0B0', fontSize: 14 },
    valueText: { color: '#03DAC6', fontSize: 18, fontWeight: 'bold' },
    buttonsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
    buttonContainer: { width: buttonSize, height: buttonSize, marginBottom: 10 },
    button: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#03DAC6', elevation: 5 },
    buttonIcon: { marginBottom: 10 },
    buttonText: { color: '#fff', fontSize: 14, textAlign: 'center' },
    errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
    notificationPopup: {
        position: 'absolute',
        top: 100,
        right: 20,
        width: 300,
        maxHeight: 400,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 10,
        zIndex: 1000,
        elevation: 5,
    },
    notificationItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    notificationText: {
        color: '#fff',
        fontSize: 14,
    },
    notificationEmail: {
        color: '#999',
        fontSize: 12,
        marginTop: 5,
    },
    noNotificationText: {
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
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
    badgeText: {
        color: '#fff',
        fontSize: 12,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        backgroundColor: '#03DAC6',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
    },
    feedbackItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    feedbackText: {
        color: '#fff',
        fontSize: 14,
    },
    feedbackEmail: {
        color: '#999',
        fontSize: 12,
        marginTop: 5,
    },
});

export default AdminDashboardScreen;