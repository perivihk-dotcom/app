import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        await AsyncStorage.setItem('userId', response.data.user.id);
        await AsyncStorage.setItem('userName', response.data.user.name);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 pt-16">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-8"
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-12">
              <Text className="text-white text-4xl font-bold mb-2">Welcome Back!</Text>
              <Text className="text-gray-400 text-lg">Login to continue your fitness journey</Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <Text className="text-white text-base mb-2">Email</Text>
              <View className="bg-dark-lighter rounded-xl px-4 py-3 flex-row items-center">
                <MaterialCommunityIcons name="email" size={20} color="#9CA3AF" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-white text-base"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-white text-base mb-2">Password</Text>
              <View className="bg-dark-lighter rounded-xl px-4 py-3 flex-row items-center">
                <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showPassword}
                  className="flex-1 ml-3 text-white text-base"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="mt-6"
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
                  <Text className="text-white text-center text-lg font-bold">Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Signup Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-400">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text className="text-primary font-bold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}