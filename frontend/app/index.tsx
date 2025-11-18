import { View, Text, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-dark">
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center px-6">
          {/* App Icon */}
          <Animated.View entering={FadeInDown.duration(1000).springify()}>
            <View className="bg-white/20 rounded-full p-8 mb-8">
              <MaterialCommunityIcons name="dumbbell" size={80} color="white" />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View entering={FadeInUp.duration(1000).delay(200)}>
            <Text className="text-white text-5xl font-bold mb-3">FitGenius</Text>
            <Text className="text-white/80 text-lg text-center mb-12">
              Your AI-Powered Fitness Companion
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View 
            entering={FadeInUp.duration(1000).delay(400)}
            className="w-full mb-12"
          >
            <FeatureItem icon="brain" text="AI Workout Plans" />
            <FeatureItem icon="nutrition" text="Smart Nutrition Tracking" />
            <FeatureItem icon="chart-line" text="Progress Analytics" />
            <FeatureItem icon="robot" text="AI Fitness Coach" />
          </Animated.View>

          {/* Buttons */}
          <Animated.View 
            entering={FadeInUp.duration(1000).delay(600)}
            className="w-full"
          >
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              className="bg-white rounded-2xl py-4 mb-4"
            >
              <Text className="text-primary text-center text-lg font-bold">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="bg-white/20 rounded-2xl py-4 border-2 border-white"
            >
              <Text className="text-white text-center text-lg font-bold">
                Login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View className="flex-row items-center mb-4">
      <View className="bg-white/20 rounded-full p-2 mr-4">
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>
      <Text className="text-white text-base">{text}</Text>
    </View>
  );
}