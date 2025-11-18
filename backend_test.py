#!/usr/bin/env python3
"""
FitGenius Backend API Testing Script
Tests all backend API endpoints for the FitGenius Fitness AI App
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://gymgenius-7.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class FitGeniusAPITester:
    def __init__(self):
        self.user_id = None
        self.test_results = {}
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        # Generate unique email for this test run
        import time
        timestamp = int(time.time())
        self.test_email = f"sarah.johnson.{timestamp}@fitgenius.com"
    
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        self.test_results[test_name] = {
            'success': success,
            'details': details,
            'response_data': response_data
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test("Health Check", True, "API is healthy", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_user_signup(self):
        """Test user signup endpoint"""
        try:
            # Use realistic test data with unique email
            signup_data = {
                "name": "Sarah Johnson",
                "email": self.test_email,
                "password": "FitLife2025!"
            }
            
            response = self.session.post(f"{API_BASE}/auth/signup", 
                                       json=signup_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'user' in data and 'id' in data['user']:
                    self.user_id = data['user']['id']
                    self.log_test("User Signup", True, 
                                f"User created successfully with ID: {self.user_id}", data)
                    return True
                else:
                    self.log_test("User Signup", False, f"Invalid response structure: {data}")
            else:
                self.log_test("User Signup", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Signup", False, f"Error: {str(e)}")
        return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            # Use the same email from signup
            login_data = {
                "email": self.test_email,
                "password": "FitLife2025!"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", 
                                       json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'user' in data and 'id' in data['user']:
                    # Verify user_id matches
                    if data['user']['id'] == self.user_id:
                        self.log_test("User Login", True, 
                                    "Login successful with correct user ID", data)
                        return True
                    else:
                        self.log_test("User Login", False, 
                                    f"User ID mismatch: expected {self.user_id}, got {data['user']['id']}")
                else:
                    self.log_test("User Login", False, f"Invalid response structure: {data}")
            else:
                self.log_test("User Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}")
        return False
    
    def test_user_stats(self):
        """Test user stats endpoint"""
        if not self.user_id:
            self.log_test("User Stats", False, "No user_id available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/users/{self.user_id}/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'stats' in data:
                    stats = data['stats']
                    required_fields = ['workoutsThisWeek', 'caloriesBurned', 'activeMinutes', 'currentStreak']
                    if all(field in stats for field in required_fields):
                        self.log_test("User Stats", True, 
                                    f"Stats retrieved successfully: {stats}", data)
                        return True
                    else:
                        self.log_test("User Stats", False, f"Missing required fields in stats: {stats}")
                else:
                    self.log_test("User Stats", False, f"Invalid response structure: {data}")
            else:
                self.log_test("User Stats", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Stats", False, f"Error: {str(e)}")
        return False
    
    def test_workouts(self):
        """Test workouts endpoint"""
        if not self.user_id:
            self.log_test("Workouts", False, "No user_id available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/workouts?userId={self.user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'workoutPlans' in data and 'exercises' in data:
                    exercises = data['exercises']
                    if len(exercises) > 0:
                        self.log_test("Workouts", True, 
                                    f"Retrieved {len(exercises)} exercises and workout plans", data)
                        return True
                    else:
                        self.log_test("Workouts", False, "No exercises returned")
                else:
                    self.log_test("Workouts", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Workouts", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Workouts", False, f"Error: {str(e)}")
        return False
    
    def test_ai_workout_generation(self):
        """Test AI workout generation endpoint"""
        if not self.user_id:
            self.log_test("AI Workout Generation", False, "No user_id available")
            return False
        
        try:
            workout_request = {
                "userId": self.user_id,
                "prompt": "I want a 30-minute full body workout with dumbbells for muscle gain"
            }
            
            response = self.session.post(f"{API_BASE}/ai/generate-workout", 
                                       json=workout_request, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'workout' in data:
                    workout = data['workout']
                    required_fields = ['name', 'description', 'duration', 'exercises']
                    if all(field in workout for field in required_fields):
                        self.log_test("AI Workout Generation", True, 
                                    f"AI workout generated: {workout['name']}", data)
                        return True
                    else:
                        self.log_test("AI Workout Generation", False, 
                                    f"Missing required fields in workout: {workout}")
                else:
                    self.log_test("AI Workout Generation", False, f"Invalid response structure: {data}")
            else:
                self.log_test("AI Workout Generation", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("AI Workout Generation", False, f"Error: {str(e)}")
        return False
    
    def test_nutrition_get(self):
        """Test nutrition GET endpoint"""
        if not self.user_id:
            self.log_test("Nutrition GET", False, "No user_id available")
            return False
        
        try:
            date = "2025-01-15"
            response = self.session.get(f"{API_BASE}/nutrition?userId={self.user_id}&date={date}", 
                                      timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'meals' in data and 'consumed' in data:
                    consumed = data['consumed']
                    required_fields = ['calories', 'protein', 'carbs', 'fats']
                    if all(field in consumed for field in required_fields):
                        self.log_test("Nutrition GET", True, 
                                    f"Nutrition data retrieved for {date}", data)
                        return True
                    else:
                        self.log_test("Nutrition GET", False, 
                                    f"Missing required fields in consumed: {consumed}")
                else:
                    self.log_test("Nutrition GET", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Nutrition GET", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Nutrition GET", False, f"Error: {str(e)}")
        return False
    
    def test_nutrition_add_meal(self):
        """Test nutrition add meal endpoint"""
        if not self.user_id:
            self.log_test("Nutrition Add Meal", False, "No user_id available")
            return False
        
        try:
            meal_data = {
                "userId": self.user_id,
                "name": "Grilled Chicken Salad",
                "calories": 450,
                "protein": 35,
                "carbs": 40,
                "fats": 15,
                "date": "2025-01-15"
            }
            
            response = self.session.post(f"{API_BASE}/nutrition/add-meal", 
                                       json=meal_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'meal' in data:
                    meal = data['meal']
                    if meal.get('name') == meal_data['name']:
                        self.log_test("Nutrition Add Meal", True, 
                                    f"Meal '{meal['name']}' added successfully", data)
                        return True
                    else:
                        self.log_test("Nutrition Add Meal", False, 
                                    f"Meal name mismatch: expected {meal_data['name']}, got {meal.get('name')}")
                else:
                    self.log_test("Nutrition Add Meal", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Nutrition Add Meal", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Nutrition Add Meal", False, f"Error: {str(e)}")
        return False
    
    def test_progress_get(self):
        """Test progress GET endpoint"""
        if not self.user_id:
            self.log_test("Progress GET", False, "No user_id available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/progress?userId={self.user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'weightData' in data and 'stats' in data:
                    stats = data['stats']
                    required_fields = ['totalWorkouts', 'totalCaloriesBurned', 'avgWorkoutDuration', 'currentStreak']
                    if all(field in stats for field in required_fields):
                        self.log_test("Progress GET", True, 
                                    f"Progress data retrieved successfully", data)
                        return True
                    else:
                        self.log_test("Progress GET", False, 
                                    f"Missing required fields in stats: {stats}")
                else:
                    self.log_test("Progress GET", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Progress GET", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Progress GET", False, f"Error: {str(e)}")
        return False
    
    def test_progress_add_weight(self):
        """Test progress add weight endpoint"""
        if not self.user_id:
            self.log_test("Progress Add Weight", False, "No user_id available")
            return False
        
        try:
            weight_data = {
                "userId": self.user_id,
                "weight": 75.5,
                "date": "2025-01-15"
            }
            
            response = self.session.post(f"{API_BASE}/progress/add-weight", 
                                       json=weight_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'entry' in data:
                    entry = data['entry']
                    if entry.get('weight') == weight_data['weight']:
                        self.log_test("Progress Add Weight", True, 
                                    f"Weight {entry['weight']}kg recorded successfully", data)
                        return True
                    else:
                        self.log_test("Progress Add Weight", False, 
                                    f"Weight mismatch: expected {weight_data['weight']}, got {entry.get('weight')}")
                else:
                    self.log_test("Progress Add Weight", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Progress Add Weight", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Progress Add Weight", False, f"Error: {str(e)}")
        return False
    
    def test_ai_chat_history(self):
        """Test AI chat history endpoint"""
        if not self.user_id:
            self.log_test("AI Chat History", False, "No user_id available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/ai/chat-history?userId={self.user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'messages' in data:
                    messages = data['messages']
                    self.log_test("AI Chat History", True, 
                                f"Retrieved {len(messages)} chat messages", data)
                    return True
                else:
                    self.log_test("AI Chat History", False, f"Invalid response structure: {data}")
            else:
                self.log_test("AI Chat History", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("AI Chat History", False, f"Error: {str(e)}")
        return False
    
    def test_ai_chat(self):
        """Test AI chat endpoint"""
        if not self.user_id:
            self.log_test("AI Chat", False, "No user_id available")
            return False
        
        try:
            chat_data = {
                "userId": self.user_id,
                "message": "What's a good workout for beginners?"
            }
            
            response = self.session.post(f"{API_BASE}/ai/chat", 
                                       json=chat_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'response' in data:
                    ai_response = data['response']
                    if ai_response and len(ai_response.strip()) > 0:
                        self.log_test("AI Chat", True, 
                                    f"AI responded with {len(ai_response)} characters", data)
                        return True
                    else:
                        self.log_test("AI Chat", False, "Empty AI response")
                else:
                    self.log_test("AI Chat", False, f"Invalid response structure: {data}")
            else:
                self.log_test("AI Chat", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("AI Chat", False, f"Error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print(f"🚀 Starting FitGenius API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence as specified in the review request
        tests = [
            ("Health Check", self.test_health_check),
            ("User Signup", self.test_user_signup),
            ("User Login", self.test_user_login),
            ("User Stats", self.test_user_stats),
            ("Workouts", self.test_workouts),
            ("AI Workout Generation", self.test_ai_workout_generation),
            ("Nutrition GET", self.test_nutrition_get),
            ("Nutrition Add Meal", self.test_nutrition_add_meal),
            ("Progress GET", self.test_progress_get),
            ("Progress Add Weight", self.test_progress_add_weight),
            ("AI Chat History", self.test_ai_chat_history),
            ("AI Chat", self.test_ai_chat),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error: {str(e)}")
                failed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 Test Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return self.test_results

if __name__ == "__main__":
    tester = FitGeniusAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_tests = [name for name, result in results.items() if not result['success']]
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        sys.exit(1)
    else:
        print(f"\n✅ All tests passed!")
        sys.exit(0)