import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function NutritionScreen() {
  const [dailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 67,
  });
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [meals, setMeals] = useState<any[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealData, setMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(
        `${API_URL}/api/nutrition?userId=${userId}&date=${today}`
      );
      if (response.data.success) {
        setMeals(response.data.meals || []);
        setConsumed(response.data.consumed || { calories: 0, protein: 0, carbs: 0, fats: 0 });
      }
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    }
  };

  const addMeal = async () => {
    if (!mealData.name || !mealData.calories) {
      Alert.alert('Error', 'Please fill in at least meal name and calories');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post(`${API_URL}/api/nutrition/add-meal`, {
        userId,
        ...mealData,
        calories: parseFloat(mealData.calories),
        protein: parseFloat(mealData.protein || '0'),
        carbs: parseFloat(mealData.carbs || '0'),
        fats: parseFloat(mealData.fats || '0'),
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Meal logged successfully!');
        setShowAddMeal(false);
        setMealData({ name: '', calories: '', protein: '', carbs: '', fats: '' });
        fetchNutritionData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to log meal');
    }
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={['#10B981', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-16 pb-6 rounded-b-3xl"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-3xl font-bold mb-2">Nutrition</Text>
              <Text className="text-white/80 text-base">{format(new Date(), 'MMMM dd, yyyy')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddMeal(true)}
              className="bg-white/20 rounded-full p-3"
            >
              <MaterialCommunityIcons name="plus" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View className="px-6 mt-6">
          {/* Calorie Progress */}
          <View className="bg-dark-light rounded-2xl p-6 mb-6">
            <View className="items-center mb-6">
              <Text className="text-gray-400 text-sm mb-2">Calories</Text>
              <Text className="text-white text-5xl font-bold mb-2">
                {consumed.calories}
                <Text className="text-gray-400 text-2xl"> / {dailyGoals.calories}</Text>
              </Text>
              <Text className="text-primary text-base font-semibold">
                {dailyGoals.calories - consumed.calories} remaining
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="bg-dark-lighter rounded-xl h-3 overflow-hidden mb-6">
              <View
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full"
                style={{ width: `${Math.min((consumed.calories / dailyGoals.calories) * 100, 100)}%` }}
              >
                <LinearGradient
                  colors={['#10B981', '#14B8A6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full"
                />
              </View>
            </View>

            {/* Macros */}
            <View className="flex-row justify-between">
              <MacroCard
                icon="food-drumstick"
                label="Protein"
                value={consumed.protein}
                goal={dailyGoals.protein}
                color="#EF4444"
              />
              <MacroCard
                icon="bread-slice"
                label="Carbs"
                value={consumed.carbs}
                goal={dailyGoals.carbs}
                color="#F59E0B"
              />
              <MacroCard
                icon="oil"
                label="Fats"
                value={consumed.fats}
                goal={dailyGoals.fats}
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Meals */}
          <View>
            <Text className="text-white text-2xl font-bold mb-4">Today's Meals</Text>
            {meals.length === 0 ? (
              <View className="bg-dark-light rounded-2xl p-6 items-center">
                <MaterialCommunityIcons name="food-apple" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">
                  No meals logged yet. Start tracking your nutrition!
                </Text>
              </View>
            ) : (
              meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMeal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-dark-light rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">Log Meal</Text>
              <TouchableOpacity onPress={() => setShowAddMeal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <InputField
                label="Meal Name"
                value={mealData.name}
                onChangeText={(text) => setMealData({ ...mealData, name: text })}
                placeholder="e.g., Chicken Salad"
              />
              <InputField
                label="Calories"
                value={mealData.calories}
                onChangeText={(text) => setMealData({ ...mealData, calories: text })}
                placeholder="500"
                keyboardType="numeric"
              />
              <InputField
                label="Protein (g)"
                value={mealData.protein}
                onChangeText={(text) => setMealData({ ...mealData, protein: text })}
                placeholder="35"
                keyboardType="numeric"
              />
              <InputField
                label="Carbs (g)"
                value={mealData.carbs}
                onChangeText={(text) => setMealData({ ...mealData, carbs: text })}
                placeholder="40"
                keyboardType="numeric"
              />
              <InputField
                label="Fats (g)"
                value={mealData.fats}
                onChangeText={(text) => setMealData({ ...mealData, fats: text })}
                placeholder="15"
                keyboardType="numeric"
              />

              <TouchableOpacity onPress={addMeal} className="mt-4">
                <LinearGradient
                  colors={['#10B981', '#14B8A6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-xl py-4"
                >
                  <Text className="text-white text-center text-lg font-bold">Log Meal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MacroCard({ icon, label, value, goal, color }: any) {
  const percentage = Math.min((value / goal) * 100, 100);
  return (
    <View className="flex-1 mx-1">
      <View className="items-center">
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        <Text className="text-white text-xl font-bold mt-2">{value}g</Text>
        <Text className="text-gray-400 text-xs">/ {goal}g</Text>
        <Text className="text-gray-500 text-xs mt-1">{label}</Text>
      </View>
      <View className="bg-dark-lighter rounded-full h-1 mt-2 overflow-hidden">
        <View className="h-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

function MealCard({ meal }: any) {
  return (
    <View className="bg-dark-light rounded-2xl p-5 mb-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold mb-1">{meal.name}</Text>
          <Text className="text-primary text-base font-semibold">{meal.calories} cal</Text>
        </View>
        <Text className="text-gray-400 text-sm">{meal.time || 'Today'}</Text>
      </View>
      <View className="flex-row">
        <View className="bg-red-500/20 rounded-lg px-3 py-1 mr-2">
          <Text className="text-red-500 text-xs">P: {meal.protein}g</Text>
        </View>
        <View className="bg-yellow-500/20 rounded-lg px-3 py-1 mr-2">
          <Text className="text-yellow-500 text-xs">C: {meal.carbs}g</Text>
        </View>
        <View className="bg-purple-500/20 rounded-lg px-3 py-1">
          <Text className="text-purple-500 text-xs">F: {meal.fats}g</Text>
        </View>
      </View>
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <View className="mb-4">
      <Text className="text-white text-base mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType={keyboardType}
        className="bg-dark-lighter rounded-xl px-4 py-3 text-white text-base"
      />
    </View>
  );
}