import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState({
    workoutsThisWeek: 0,
    caloriesBurned: 0,
    activeMinutes: 0,
    currentStreak: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('userName');
    const userId = await AsyncStorage.getItem('userId');
    if (name) setUserName(name);
    if (userId) {
      fetchStats(userId);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-16 pb-8 rounded-b-3xl"
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white/80 text-base">Welcome back,</Text>
              <Text className="text-white text-3xl font-bold">{userName}</Text>
            </View>
            <TouchableOpacity className="bg-white/20 rounded-full p-3">
              <MaterialCommunityIcons name="bell" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between">
            <StatCard
              icon="fire"
              value={stats.caloriesBurned.toString()}
              label="Calories"
              color="#EF4444"
            />
            <StatCard
              icon="clock-outline"
              value={stats.activeMinutes.toString()}
              label="Minutes"
              color="#3B82F6"
            />
            <StatCard
              icon="lightning-bolt"
              value={stats.currentStreak.toString()}
              label="Day Streak"
              color="#FBBF24"
            />
          </View>
        </LinearGradient>

        {/* Content */}
        <View className="px-6 mt-6">
          {/* Today's Workout */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">Today's Focus</Text>
            <TouchableOpacity>
              <LinearGradient
                colors={['#334155', '#1E293B']}
                className="rounded-2xl p-5"
              >
                <View className="flex-row items-center mb-3">
                  <View className="bg-primary/20 rounded-full p-3 mr-4">
                    <MaterialCommunityIcons name="dumbbell" size={28} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xl font-bold">Full Body Workout</Text>
                    <Text className="text-gray-400 text-sm">45 min • 12 exercises</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
                </View>
                <View className="bg-primary/20 rounded-xl p-3">
                  <Text className="text-primary text-sm font-semibold">Generate AI Workout Plan</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap">
              <QuickActionCard
                icon="robot"
                title="AI Coach"
                gradient={['#EC4899', '#8B5CF6']}
                onPress={() => router.push('/(tabs)/ai-coach')}
              />
              <QuickActionCard
                icon="chart-line"
                title="Progress"
                gradient={['#3B82F6', '#6366F1']}
                onPress={() => router.push('/(tabs)/progress')}
              />
              <QuickActionCard
                icon="food-apple"
                title="Nutrition"
                gradient={['#10B981', '#14B8A6']}
                onPress={() => router.push('/(tabs)/nutrition')}
              />
              <QuickActionCard
                icon="run"
                title="Start Workout"
                gradient={['#F59E0B', '#EF4444']}
                onPress={() => router.push('/(tabs)/workouts')}
              />
            </View>
          </View>

          {/* Weekly Summary */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">This Week</Text>
            <View className="bg-dark-light rounded-2xl p-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-semibold">Workouts Completed</Text>
                <Text className="text-primary text-2xl font-bold">{stats.workoutsThisWeek}</Text>
              </View>
              <View className="bg-dark-lighter rounded-xl h-2 overflow-hidden">
                <View
                  className="bg-primary h-full"
                  style={{ width: `${(stats.workoutsThisWeek / 7) * 100}%` }}
                />
              </View>
              <Text className="text-gray-400 text-sm mt-2">Goal: 7 workouts per week</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: any) {
  return (
    <View className="bg-white/10 rounded-2xl p-4 flex-1 mx-1">
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text className="text-white text-2xl font-bold mt-2">{value}</Text>
      <Text className="text-white/60 text-xs">{label}</Text>
    </View>
  );
}

function QuickActionCard({ icon, title, gradient, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className="w-[48%] mb-4">
      <LinearGradient colors={gradient} className="rounded-2xl p-5 items-center">
        <View className="bg-white/20 rounded-full p-4 mb-3">
          <MaterialCommunityIcons name={icon} size={32} color="white" />
        </View>
        <Text className="text-white text-base font-bold text-center">{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}