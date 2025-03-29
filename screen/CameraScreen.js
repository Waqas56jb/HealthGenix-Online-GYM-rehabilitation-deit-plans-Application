import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart, ProgressChart } from 'react-native-chart-kit';
import axios from 'axios';
import Papa from 'papaparse';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const [exerciseData, setExerciseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://10.54.12.248:3001/exercise-results');
        Papa.parse(response.data, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setExerciseData(result.data || []);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processData = () => {
    const exerciseCounts = {};
    const repCounts = {};
    const timestamps = [];

    exerciseData.forEach((row) => {
      if (!row.Exercise || !row['Rep Count'] || !row.Timestamp) return;
      exerciseCounts[row.Exercise] = (exerciseCounts[row.Exercise] || 0) + 1;
      repCounts[row.Exercise] = (repCounts[row.Exercise] || 0) + parseInt(row['Rep Count'], 10);
      timestamps.push({ date: row.Timestamp, reps: parseInt(row['Rep Count'], 10) });
    });

    return { exerciseCounts, repCounts, timestamps };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { exerciseCounts, repCounts, timestamps } = processData();

  const barData = {
    labels: Object.keys(exerciseCounts),
    datasets: [{ data: Object.values(exerciseCounts) }],
  };

  const pieData = Object.keys(exerciseCounts).map((key, index) => ({
    name: key,
    population: exerciseCounts[key],
    color: ['#00FFFF', '#00CED1', '#20B2AA', '#40E0D0', '#48D1CC'][index % 5],
    legendFontColor: '#FFFFFF',
    legendFontSize: 14,
  }));

  const lineData = {
    labels: timestamps.map((t, i) => (i % 2 === 0 ? t.date.slice(11, 16) : '')),
    datasets: [{ data: timestamps.map((t) => t.reps) }],
  };

  const doughnutData = {
    data: Object.values(repCounts).map((val) => val / 50),
    colors: ['#00FFFF', '#00CED1', '#20B2AA', '#40E0D0', '#48D1CC'],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Exercise Analytics Dashboard</Text>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Exercise Frequency</Text>
        <BarChart
          data={barData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          showValuesOnTopOfBars
          style={styles.chart}
          fromZero
          withVerticalLabels={false}
          showBarTops={false}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Exercise Distribution</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Reps Over Time</Text>
        <LineChart
          data={lineData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Rep Progress</Text>
        <ProgressChart
          data={doughnutData}
          width={screenWidth - 40}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={chartConfig}
          hideLegend={false}
          style={styles.chart}
        />
      </View>
    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#000000',
  backgroundGradientTo: '#1A1A1A',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#00CED1' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#00FFFF', textAlign: 'center', marginVertical: 20 },
  chartContainer: {
    marginVertical: 20,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 10,
    elevation: 5,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 10 },
  chart: { borderRadius: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  loadingText: { fontSize: 20, color: '#00FFFF' },
  errorText: { fontSize: 20, color: 'red' },
});

export default DashboardScreen;