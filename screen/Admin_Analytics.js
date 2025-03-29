import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { BarChart } from 'react-native-chart-kit';

// Configurable IP and Port
const IP = '10.54.12.248'; // Your IP
const PORT = '3001'; // Your port
const API_BASE_URL = `http://${IP}:${PORT}/api`;
const DASHBOARD_API = `${API_BASE_URL}/dashboard`;
const NOTIFICATION_API = `${API_BASE_URL}/notifications`;
const USERS_API = `${API_BASE_URL}/users`;

// Card Component
const Card = ({ title, value, icon }) => (
  <View style={styles.card}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View style={styles.textWrapper}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const AnalyticsDashboardScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcementsLast7Days, setAnnouncementsLast7Days] = useState(0);
  const [usersLast7Days, setUsersLast7Days] = useState(0);
  const [areaStats, setAreaStats] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [dashboardRes, notificationsRes, usersRes, areaRes] = await Promise.all([
        axios.get(DASHBOARD_API),
        axios.get(`${NOTIFICATION_API}/last7days`),
        axios.get(`${USERS_API}/registered/last7days`),
        axios.get(`${USERS_API}/area-stats`),
      ]);

      setData(dashboardRes.data);
      setAnnouncementsLast7Days(notificationsRes.data.count || 0);
      setUsersLast7Days(usersRes.data.count || 0);
      setAreaStats(areaRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const chartData = {
    labels: areaStats.map(stat => stat.area),
    datasets: [{ data: areaStats.map(stat => stat.count) }],
  };

  const chartConfig = {
    backgroundGradientFrom: '#1E1E1E',
    backgroundGradientTo: '#1E1E1E',
    decimalPlaces: 0,
    color: () => '#03DAC6', // Aqua bars
    labelColor: () => '#FFFFFF', // White labels
    style: { borderRadius: 16 },
    propsForBackgroundLines: { stroke: '#333333' },
    propsForLabels: { fontSize: 12, fontWeight: 'bold' },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#03DAC6" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Analytics Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#03DAC6" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <View style={styles.cards}>
              <Card
                title="Total Users"
                value={data?.totalUsers ?? 'N/A'}
                icon={<Ionicons name="people" size={28} color="#03DAC6" />}
              />
              <Card
                title="Total Admins"
                value={data?.totalAdmins ?? 'N/A'}
                icon={<Ionicons name="shield-checkmark" size={28} color="#03DAC6" />}
              />
              <Card
                title="Announcements (7 Days)"
                value={announcementsLast7Days}
                icon={<Ionicons name="megaphone" size={28} color="#03DAC6" />}
              />
              <Card
                title="New Users (7 Days)"
                value={usersLast7Days}
                icon={<Ionicons name="person-add" size={28} color="#03DAC6" />}
              />
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Top 4 Areas by User Count</Text>
              {areaStats.length > 0 ? (
                <BarChart
                  data={chartData}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                />
              ) : (
                <Text style={styles.noDataText}>No area data available</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, // Black background
  header: {
    backgroundColor: '#03DAC6', // Aqua header
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  content: { padding: 20 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#1E1E1E', // Dark gray cards
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  textWrapper: { flex: 1 },
  cardTitle: { color: '#03DAC6', fontSize: 14 }, // Aqua titles
  cardValue: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }, // White values
  chartSection: { marginTop: 20, alignItems: 'center' },
  chartTitle: { color: '#03DAC6', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  chart: { borderRadius: 16 },
  noDataText: { color: '#999999', fontSize: 16, textAlign: 'center' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 20 },
  loader: { flex: 1, justifyContent: 'center' },
});

export default AnalyticsDashboardScreen;