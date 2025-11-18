import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AICoachScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<any[]>([
    {
      id: '1',
      text: "Hello! I'm your AI fitness coach. I can help you with workout plans, nutrition advice, form corrections, and motivation. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/api/ai/chat-history?userId=${userId}`);
      if (response.data.success && response.data.messages.length > 0) {
        setMessages([
          messages[0],
          ...response.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        ]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        userId,
        message: inputText,
      });

      if (response.data.success) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.data.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: any) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View className="flex-1 bg-dark">
      {/* Header */}
      <LinearGradient
        colors={['#EC4899', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-16 pb-6 rounded-b-3xl"
      >
        <View className="flex-row items-center">
          <View className="bg-white/20 rounded-full p-3 mr-4">
            <MaterialCommunityIcons name="robot" size={32} color="white" />
          </View>
          <View>
            <Text className="text-white text-3xl font-bold">AI Coach</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
              <Text className="text-white/80 text-sm">Online</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && (
            <View className="flex-row items-center mb-4">
              <View className="bg-dark-light rounded-2xl rounded-tl-sm px-4 py-3">
                <ActivityIndicator color="#6366F1" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestions */}
        <View className="px-6 pb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <QuickSuggestion
              icon="dumbbell"
              text="Workout plan"
              onPress={() => setInputText('Create a workout plan for me')}
            />
            <QuickSuggestion
              icon="food-apple"
              text="Meal ideas"
              onPress={() => setInputText('Suggest healthy meal ideas')}
            />
            <QuickSuggestion
              icon="help-circle"
              text="Exercise tips"
              onPress={() => setInputText('Tips for better form')}
            />
          </ScrollView>
        </View>

        {/* Input */}
        <View className="px-6 pb-6">
          <View className="bg-dark-light rounded-2xl px-4 py-2 flex-row items-center">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor="#6B7280"
              className="flex-1 text-white text-base py-2"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
              className="ml-2"
            >
              <View
                className={`rounded-full p-2 ${
                  inputText.trim() && !loading ? 'bg-primary' : 'bg-dark-lighter'
                }`}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={24}
                  color={inputText.trim() && !loading ? 'white' : '#6B7280'}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ message }: any) {
  return (
    <View
      className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.isUser
            ? 'bg-primary rounded-tr-sm'
            : 'bg-dark-light rounded-tl-sm'
        }`}
      >
        <Text className="text-white text-base">{message.text}</Text>
        <Text className="text-gray-400 text-xs mt-1">
          {format(message.timestamp, 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}

function QuickSuggestion({ icon, text, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className="mr-3">
      <View className="bg-dark-light rounded-full px-4 py-2 flex-row items-center">
        <MaterialCommunityIcons name={icon} size={18} color="#6366F1" />
        <Text className="text-white text-sm ml-2">{text}</Text>
      </View>
    </TouchableOpacity>
  );
}