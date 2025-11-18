import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function WorkoutsScreen() {
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Strength', 'Cardio', 'Flexibility', 'HIIT'];

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/api/workouts?userId=${userId}`);
      if (response.data.success) {
        setWorkoutPlans(response.data.workoutPlans || []);
        setExercises(response.data.exercises || []);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const generateAIWorkout = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Error', 'Please describe your workout goals');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post(`${API_URL}/api/ai/generate-workout`, {
        userId,
        prompt: aiPrompt,
      });

      if (response.data.success) {
        Alert.alert('Success', 'AI workout plan generated!');
        setShowAIModal(false);
        setAiPrompt('');
        fetchWorkoutData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate workout');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises =
    selectedCategory === 'All'
      ? exercises
      : exercises.filter((ex) => ex.category === selectedCategory);

  return (
    <View className="flex-1 bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-16 pb-6 rounded-b-3xl"
        >
          <Text className="text-white text-3xl font-bold mb-2">Workouts</Text>
          <Text className="text-white/80 text-base">Build your perfect routine</Text>
        </LinearGradient>

        <View className="px-6 mt-6">
          {/* AI Workout Generator */}
          <TouchableOpacity onPress={() => setShowAIModal(true)}>
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6 flex-row items-center"
            >
              <View className="bg-white/20 rounded-full p-3 mr-4">
                <MaterialCommunityIcons name="robot" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">AI Workout Generator</Text>
                <Text className="text-white/80 text-sm">Create custom plans with AI</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* My Workout Plans */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">My Plans</Text>
            {workoutPlans.length === 0 ? (
              <View className="bg-dark-light rounded-2xl p-6 items-center">
                <MaterialCommunityIcons name="weight-lifter" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">
                  No workout plans yet. Use AI to generate one!
                </Text>
              </View>
            ) : (
              workoutPlans.map((plan) => (
                <WorkoutPlanCard key={plan.id} plan={plan} />
              ))
            )}
          </View>

          {/* Exercise Library */}
          <View>
            <Text className="text-white text-2xl font-bold mb-4">Exercise Library</Text>
            
            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`mr-3 px-6 py-3 rounded-full ${
                    selectedCategory === category ? 'bg-primary' : 'bg-dark-light'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedCategory === category ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise List */}
            {filteredExercises.length === 0 ? (
              <View className="bg-dark-light rounded-2xl p-6 items-center">
                <MaterialCommunityIcons name="dumbbell" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">
                  No exercises found for this category
                </Text>
              </View>
            ) : (
              filteredExercises.map((exercise, index) => (
                <ExerciseCard key={exercise.id || index} exercise={exercise} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* AI Modal */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-dark-light rounded-t-3xl p-6" style={{ minHeight: 400 }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">AI Workout Generator</Text>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 text-base mb-4">
              Describe your fitness goals, available equipment, and preferences:
            </Text>

            <TextInput
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="e.g., I want a 30-minute full body workout with dumbbells for muscle gain"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={6}
              className="bg-dark-lighter rounded-xl p-4 text-white text-base mb-6"
              style={{ minHeight: 150, textAlignVertical: 'top' }}
            />

            <TouchableOpacity
              onPress={generateAIWorkout}
              disabled={loading}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-xl py-4"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-lg font-bold">
                    Generate Workout Plan
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WorkoutPlanCard({ plan }: any) {
  return (
    <View className="bg-dark-light rounded-2xl p-5 mb-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white text-xl font-bold mb-1">{plan.name}</Text>
          <Text className="text-gray-400 text-sm">{plan.description}</Text>
        </View>
      </View>
      <View className="flex-row">
        <View className="bg-primary/20 rounded-lg px-3 py-1 mr-2">
          <Text className="text-primary text-xs font-semibold">
            {plan.duration} min
          </Text>
        </View>
        <View className="bg-accent/20 rounded-lg px-3 py-1">
          <Text className="text-accent text-xs font-semibold">
            {plan.exercises?.length || 0} exercises
          </Text>
        </View>
      </View>
    </View>
  );
}

function ExerciseCard({ exercise }: any) {
  return (
    <View className="bg-dark-light rounded-2xl p-5 mb-4">
      <View className="flex-row items-center">
        <View className="bg-primary/20 rounded-full p-3 mr-4">
          <MaterialCommunityIcons name="dumbbell" size={28} color="#6366F1" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold mb-1">{exercise.name}</Text>
          <Text className="text-gray-400 text-sm">
            {exercise.sets} sets • {exercise.reps} reps
          </Text>
        </View>
        <View className="bg-secondary/20 rounded-lg px-3 py-1">
          <Text className="text-secondary text-xs font-semibold">{exercise.category}</Text>
        </View>
      </View>
    </View>
  );
}