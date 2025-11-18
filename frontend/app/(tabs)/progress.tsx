import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LineChart } from 'react-native-gifted-charts';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProgressScreen() {
  const [weightData, setWeightData] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any>(null);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCaloriesBurned: 0,
    avgWorkoutDuration: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/api/progress?userId=${userId}`);
      if (response.data.success) {
        setWeightData(response.data.weightData || []);
        setMeasurements(response.data.measurements);
        setStats(response.data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const addWeight = async () => {
    if (!newWeight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post(`${API_URL}/api/progress/add-weight`, {
        userId,
        weight: parseFloat(newWeight),
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Weight recorded!');
        setShowAddWeight(false);
        setNewWeight('');
        fetchProgressData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record weight');
    }
  };

  const chartData = weightData.slice(-7).map((item, index) => ({
    value: item.weight,
    label: format(new Date(item.date), 'MM/dd'),
  }));

  return (
    <View className="flex-1 bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-16 pb-6 rounded-b-3xl"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-3xl font-bold mb-2">Progress</Text>
              <Text className="text-white/80 text-base">Track your journey</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddWeight(true)}
              className="bg-white/20 rounded-full p-3"
            >
              <MaterialCommunityIcons name="plus" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View className="px-6 mt-6">
          {/* Stats Grid */}
          <View className="mb-6">
            <View className="flex-row mb-4">
              <ProgressStatCard
                icon="dumbbell"
                value={stats.totalWorkouts.toString()}
                label="Total Workouts"
                gradient={['#6366F1', '#8B5CF6']}
              />
              <View className="w-4" />
              <ProgressStatCard
                icon="fire"
                value={stats.totalCaloriesBurned.toString()}
                label="Calories Burned"
                gradient={['#EF4444', '#F97316']}
              />
            </View>
            <View className="flex-row">
              <ProgressStatCard
                icon="clock-outline"
                value={stats.avgWorkoutDuration.toString()}
                label="Avg Duration (min)"
                gradient={['#10B981', '#14B8A6']}
              />
              <View className="w-4" />
              <ProgressStatCard
                icon="lightning-bolt"
                value={stats.currentStreak.toString()}
                label="Day Streak"
                gradient={['#F59E0B', '#FBBF24']}
              />
            </View>
          </View>

          {/* Weight Progress */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">Weight Progress</Text>
            <View className="bg-dark-light rounded-2xl p-5">
              {weightData.length === 0 ? (
                <View className="items-center py-8">
                  <MaterialCommunityIcons name="scale-bathroom" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-center mt-4">
                    Start tracking your weight to see progress
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <View>
                      <Text className="text-gray-400 text-sm">Current Weight</Text>
                      <Text className="text-white text-3xl font-bold">
                        {weightData[weightData.length - 1]?.weight || 0}
                        <Text className="text-gray-400 text-xl"> kg</Text>
                      </Text>
                    </View>
                    {weightData.length > 1 && (
                      <View className="items-end">
                        <Text className="text-gray-400 text-sm">Change</Text>
                        <Text className="text-primary text-xl font-bold">
                          {(weightData[weightData.length - 1]?.weight - weightData[0]?.weight).toFixed(1)} kg
                        </Text>
                      </View>
                    )}
                  </View>

                  {chartData.length > 1 && (
                    <View className="mt-4">
                      <LineChart
                        data={chartData}
                        width={width - 80}
                        height={180}
                        color="#6366F1"
                        thickness={3}
                        startFillColor="rgba(99, 102, 241, 0.3)"
                        endFillColor="rgba(99, 102, 241, 0.05)"
                        startOpacity={0.9}
                        endOpacity={0.2}
                        initialSpacing={20}
                        noOfSections={4}
                        yAxisColor="#334155"
                        xAxisColor="#334155"
                        yAxisTextStyle={{ color: '#94A3B8' }}
                        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                        curved
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Body Measurements */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">Body Measurements</Text>
            {!measurements ? (
              <View className="bg-dark-light rounded-2xl p-6 items-center">
                <MaterialCommunityIcons name="tape-measure" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">
                  No measurements recorded yet
                </Text>
              </View>
            ) : (
              <View className="bg-dark-light rounded-2xl p-5">
                <MeasurementRow label="Chest" value={measurements.chest} />
                <MeasurementRow label="Waist" value={measurements.waist} />
                <MeasurementRow label="Hips" value={measurements.hips} />
                <MeasurementRow label="Arms" value={measurements.arms} />
                <MeasurementRow label="Thighs" value={measurements.thighs} last />
              </View>
            )}
          </View>

          {/* Achievements */}
          <View>
            <Text className="text-white text-2xl font-bold mb-4">Achievements</Text>
            <View className="flex-row flex-wrap">
              <AchievementBadge
                icon="trophy"
                title="First Workout"
                unlocked={stats.totalWorkouts > 0}
              />
              <AchievementBadge
                icon="fire"
                title="Week Streak"
                unlocked={stats.currentStreak >= 7}
              />
              <AchievementBadge
                icon="lightning-bolt"
                title="10 Workouts"
                unlocked={stats.totalWorkouts >= 10}
              />
              <AchievementBadge
                icon="star"
                title="Weight Goal"
                unlocked={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal
        visible={showAddWeight}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddWeight(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-dark-light rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">Record Weight</Text>
              <TouchableOpacity onPress={() => setShowAddWeight(false)}>
                <MaterialCommunityIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 text-base mb-4">Enter your current weight:</Text>

            <View className="bg-dark-lighter rounded-xl px-4 py-3 mb-6">
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g., 75.5"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                className="text-white text-2xl font-bold text-center"
              />
              <Text className="text-gray-400 text-center mt-2">kg</Text>
            </View>

            <TouchableOpacity onPress={addWeight}>
              <LinearGradient
                colors={['#3B82F6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-xl py-4"
              >
                <Text className="text-white text-center text-lg font-bold">Save Weight</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProgressStatCard({ icon, value, label, gradient }: any) {
  return (
    <View className="flex-1">
      <LinearGradient colors={gradient} className="rounded-2xl p-5">
        <MaterialCommunityIcons name={icon} size={32} color="white" className="mb-2" />
        <Text className="text-white text-3xl font-bold mt-2">{value}</Text>
        <Text className="text-white/80 text-sm mt-1">{label}</Text>
      </LinearGradient>
    </View>
  );
}

function MeasurementRow({ label, value, last = false }: any) {
  return (
    <View
      className={`flex-row justify-between items-center py-3 ${!last ? 'border-b border-dark-lighter' : ''}`}
    >
      <Text className="text-gray-400 text-base">{label}</Text>
      <Text className="text-white text-lg font-semibold">{value || '--'} cm</Text>
    </View>
  );
}

function AchievementBadge({ icon, title, unlocked }: any) {
  return (
    <View className="w-[48%] mb-4">
      <View
        className={`rounded-2xl p-5 items-center ${
          unlocked ? 'bg-primary/20' : 'bg-dark-light'
        }`}
      >
        <View
          className={`rounded-full p-4 mb-3 ${
            unlocked ? 'bg-primary' : 'bg-dark-lighter'
          }`}
        >
          <MaterialCommunityIcons
            name={icon}
            size={32}
            color={unlocked ? 'white' : '#6B7280'}
          />
        </View>
        <Text
          className={`text-center text-sm font-semibold ${
            unlocked ? 'text-white' : 'text-gray-500'
          }`}
        >
          {title}
        </Text>
        {unlocked && (
          <View className="bg-primary rounded-full px-3 py-1 mt-2">
            <Text className="text-white text-xs font-bold">Unlocked</Text>
          </View>
        )}
      </View>
    </View>
  );
}