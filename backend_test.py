#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Monexa Finance App
Tests all backend endpoints systematically with realistic data
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://monexa-finance.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class MonexaAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        self.created_transaction_id = None
        self.created_category_id = None
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {details}")
        
    def set_auth_header(self, token):
        """Set authorization header for authenticated requests"""
        self.auth_token = token
        self.headers["Authorization"] = f"Bearer {token}"
        
    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== TESTING HEALTH ENDPOINTS ===")
        
        try:
            # Test root endpoint
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Root Endpoint", True, f"Message: {data.get('message', 'No message')}")
            else:
                self.log_result("Root Endpoint", False, f"Status: {response.status_code}")
                
            # Test health endpoint
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Status: {data.get('status', 'unknown')}")
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Health Endpoints", False, f"Connection error: {str(e)}")
            
    def test_auth_signup(self):
        """Test user signup"""
        print("\n=== TESTING AUTHENTICATION - SIGNUP ===")
        
        # Generate unique test user
        unique_id = str(uuid.uuid4())[:8]
        test_user = {
            "full_name": f"Sarah Johnson {unique_id}",
            "email": f"sarah.johnson.{unique_id}@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/signup",
                headers=self.headers,
                json=test_user,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.set_auth_header(self.auth_token)
                
                self.log_result(
                    "User Signup", 
                    True, 
                    f"User created: {data.get('user', {}).get('full_name')} | Token received",
                    data
                )
                return test_user
            else:
                self.log_result("User Signup", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_result("User Signup", False, f"Error: {str(e)}")
            return None
            
    def test_auth_me(self):
        """Test get current user profile"""
        print("\n=== TESTING AUTHENTICATION - GET ME ===")
        
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Get Current User", 
                    True, 
                    f"User: {data.get('full_name')} | Email: {data.get('email')}",
                    data
                )
            else:
                self.log_result("Get Current User", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Get Current User", False, f"Error: {str(e)}")
            
    def test_auth_login(self, test_user):
        """Test user login"""
        print("\n=== TESTING AUTHENTICATION - LOGIN ===")
        
        if not test_user:
            self.log_result("User Login", False, "No test user available")
            return
            
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                headers=self.headers,
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "User Login", 
                    True, 
                    f"Login successful for {data.get('user', {}).get('email')}",
                    data
                )
            else:
                self.log_result("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("User Login", False, f"Error: {str(e)}")
            
    def test_auth_forgot_password(self, test_user):
        """Test forgot password"""
        print("\n=== TESTING AUTHENTICATION - FORGOT PASSWORD ===")
        
        if not test_user:
            self.log_result("Forgot Password", False, "No test user available")
            return
            
        forgot_data = {"email": test_user["email"]}
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/forgot-password",
                headers=self.headers,
                json=forgot_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Forgot Password", 
                    True, 
                    f"Message: {data.get('message', 'Success')}",
                    data
                )
            else:
                self.log_result("Forgot Password", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Forgot Password", False, f"Error: {str(e)}")
            
    def test_categories_list(self):
        """Test getting categories (should have 6 default categories)"""
        print("\n=== TESTING CATEGORIES - LIST ===")
        
        if not self.auth_token:
            self.log_result("List Categories", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/categories",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                category_names = [cat.get('name') for cat in data]
                expected_categories = ["Food", "Transport", "Shopping", "Bills", "Salary", "Entertainment"]
                
                if len(data) >= 6 and all(cat in category_names for cat in expected_categories):
                    self.log_result(
                        "List Categories", 
                        True, 
                        f"Found {len(data)} categories including all defaults: {', '.join(category_names)}",
                        data
                    )
                else:
                    self.log_result(
                        "List Categories", 
                        False, 
                        f"Expected 6 default categories, got {len(data)}: {category_names}"
                    )
            else:
                self.log_result("List Categories", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("List Categories", False, f"Error: {str(e)}")
            
    def test_categories_create(self):
        """Test creating a new category"""
        print("\n=== TESTING CATEGORIES - CREATE ===")
        
        if not self.auth_token:
            self.log_result("Create Category", False, "No auth token available")
            return
            
        new_category = {
            "name": "Investment",
            "icon": "trending-up"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/categories",
                headers=self.headers,
                json=new_category,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.created_category_id = data.get("id")
                self.log_result(
                    "Create Category", 
                    True, 
                    f"Created category: {data.get('name')} with ID: {self.created_category_id}",
                    data
                )
            else:
                self.log_result("Create Category", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Create Category", False, f"Error: {str(e)}")
            
    def test_categories_update(self):
        """Test updating a category"""
        print("\n=== TESTING CATEGORIES - UPDATE ===")
        
        if not self.auth_token or not self.created_category_id:
            self.log_result("Update Category", False, "No auth token or category ID available")
            return
            
        update_data = {
            "name": "Investments & Savings",
            "icon": "bank"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/categories/{self.created_category_id}",
                headers=self.headers,
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Update Category", 
                    True, 
                    f"Updated category to: {data.get('name')}",
                    data
                )
            else:
                self.log_result("Update Category", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Update Category", False, f"Error: {str(e)}")
            
    def test_transactions_create(self):
        """Test creating transactions (both income and expense)"""
        print("\n=== TESTING TRANSACTIONS - CREATE ===")
        
        if not self.auth_token:
            self.log_result("Create Transactions", False, "No auth token available")
            return
            
        # Create income transaction
        income_transaction = {
            "type": "income",
            "amount": 3500.00,
            "category_name": "Salary",
            "date": "2025-01-15",
            "note": "Monthly salary payment"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/transactions",
                headers=self.headers,
                json=income_transaction,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Create Income Transaction", 
                    True, 
                    f"Created {data.get('type')} of ${data.get('amount')} for {data.get('category_name')}",
                    data
                )
            else:
                self.log_result("Create Income Transaction", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Create Income Transaction", False, f"Error: {str(e)}")
            
        # Create expense transaction
        expense_transaction = {
            "type": "expense",
            "amount": 85.50,
            "category_name": "Food",
            "date": "2025-01-14",
            "note": "Grocery shopping at Whole Foods"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/transactions",
                headers=self.headers,
                json=expense_transaction,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.created_transaction_id = data.get("id")
                self.log_result(
                    "Create Expense Transaction", 
                    True, 
                    f"Created {data.get('type')} of ${data.get('amount')} for {data.get('category_name')}",
                    data
                )
            else:
                self.log_result("Create Expense Transaction", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Create Expense Transaction", False, f"Error: {str(e)}")
            
    def test_transactions_list(self):
        """Test getting transactions list"""
        print("\n=== TESTING TRANSACTIONS - LIST ===")
        
        if not self.auth_token:
            self.log_result("List Transactions", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/transactions",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "List Transactions", 
                    True, 
                    f"Retrieved {len(data)} transactions",
                    {"count": len(data), "sample": data[:2] if data else []}
                )
            else:
                self.log_result("List Transactions", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("List Transactions", False, f"Error: {str(e)}")
            
    def test_transactions_update(self):
        """Test updating a transaction"""
        print("\n=== TESTING TRANSACTIONS - UPDATE ===")
        
        if not self.auth_token or not self.created_transaction_id:
            self.log_result("Update Transaction", False, "No auth token or transaction ID available")
            return
            
        update_data = {
            "type": "expense",
            "amount": 92.75,
            "category_name": "Food",
            "date": "2025-01-14",
            "note": "Grocery shopping at Whole Foods + organic produce"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/transactions/{self.created_transaction_id}",
                headers=self.headers,
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Update Transaction", 
                    True, 
                    f"Updated transaction amount to ${data.get('amount')}",
                    data
                )
            else:
                self.log_result("Update Transaction", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Update Transaction", False, f"Error: {str(e)}")
            
    def test_analytics_summary(self):
        """Test analytics summary endpoint"""
        print("\n=== TESTING ANALYTICS - SUMMARY ===")
        
        if not self.auth_token:
            self.log_result("Analytics Summary", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/analytics/summary",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Analytics Summary", 
                    True, 
                    f"Balance: ${data.get('balance', 0):.2f}, Income: ${data.get('total_income', 0):.2f}, Expenses: ${data.get('total_expense', 0):.2f}",
                    data
                )
            else:
                self.log_result("Analytics Summary", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Analytics Summary", False, f"Error: {str(e)}")
            
    def test_analytics_insights(self):
        """Test AI-powered insights endpoint"""
        print("\n=== TESTING ANALYTICS - AI INSIGHTS ===")
        
        if not self.auth_token:
            self.log_result("AI Insights", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/analytics/insights",
                headers=self.headers,
                timeout=15  # AI calls may take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                insights = data.get("insights", [])
                self.log_result(
                    "AI Insights", 
                    True, 
                    f"Generated {len(insights)} insights",
                    {"insights": insights}
                )
            else:
                self.log_result("AI Insights", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("AI Insights", False, f"Error: {str(e)}")
            
    def test_ai_chat(self):
        """Test AI chat functionality"""
        print("\n=== TESTING AI CHAT ===")
        
        if not self.auth_token:
            self.log_result("AI Chat", False, "No auth token available")
            return
            
        chat_message = {
            "message": "Can you analyze my spending patterns and give me some advice?"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat",
                headers=self.headers,
                json=chat_message,
                timeout=20  # AI calls may take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("message", "")
                self.log_result(
                    "AI Chat", 
                    True, 
                    f"AI responded with {len(ai_response)} characters",
                    {"response_preview": ai_response[:100] + "..." if len(ai_response) > 100 else ai_response}
                )
            else:
                self.log_result("AI Chat", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("AI Chat", False, f"Error: {str(e)}")
            
    def test_chat_history(self):
        """Test getting chat history"""
        print("\n=== TESTING CHAT HISTORY ===")
        
        if not self.auth_token:
            self.log_result("Chat History", False, "No auth token available")
            return
            
        try:
            response = requests.get(
                f"{self.base_url}/chat/history",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Chat History", 
                    True, 
                    f"Retrieved {len(data)} chat messages",
                    {"message_count": len(data)}
                )
            else:
                self.log_result("Chat History", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Chat History", False, f"Error: {str(e)}")
            
    def test_profile_endpoints(self):
        """Test profile-related endpoints"""
        print("\n=== TESTING PROFILE ENDPOINTS ===")
        
        if not self.auth_token:
            self.log_result("Profile Endpoints", False, "No auth token available")
            return
            
        # Test get profile
        try:
            response = requests.get(
                f"{self.base_url}/profile",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Get Profile", 
                    True, 
                    f"Profile: {data.get('full_name')} | Currency: {data.get('currency')}",
                    data
                )
            else:
                self.log_result("Get Profile", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Get Profile", False, f"Error: {str(e)}")
            
        # Test update preferences
        preferences = {
            "currency": "EUR",
            "monthly_budget": 2500.00
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/profile/preferences",
                headers=self.headers,
                json=preferences,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Update Preferences", 
                    True, 
                    f"Updated preferences: {data.get('message', 'Success')}",
                    data
                )
            else:
                self.log_result("Update Preferences", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Update Preferences", False, f"Error: {str(e)}")
            
    def test_cleanup(self):
        """Clean up test data"""
        print("\n=== CLEANUP TEST DATA ===")
        
        if not self.auth_token:
            return
            
        # Delete created transaction
        if self.created_transaction_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/transactions/{self.created_transaction_id}",
                    headers=self.headers,
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Delete Transaction", True, "Test transaction deleted")
                else:
                    self.log_result("Delete Transaction", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Delete Transaction", False, f"Error: {str(e)}")
                
        # Delete created category
        if self.created_category_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/categories/{self.created_category_id}",
                    headers=self.headers,
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Delete Category", True, "Test category deleted")
                else:
                    self.log_result("Delete Category", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Delete Category", False, f"Error: {str(e)}")
                
        # Clear chat history
        try:
            response = requests.delete(
                f"{self.base_url}/chat/history",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Clear Chat History", True, "Chat history cleared")
            else:
                self.log_result("Clear Chat History", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Clear Chat History", False, f"Error: {str(e)}")
            
    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting Monexa Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test health endpoints first
        self.test_health_check()
        
        # Test authentication flow
        test_user = self.test_auth_signup()
        self.test_auth_me()
        self.test_auth_forgot_password(test_user)
        
        # Test categories
        self.test_categories_list()
        self.test_categories_create()
        self.test_categories_update()
        
        # Test transactions
        self.test_transactions_create()
        self.test_transactions_list()
        self.test_transactions_update()
        
        # Test analytics
        self.test_analytics_summary()
        self.test_analytics_insights()
        
        # Test AI chat
        self.test_ai_chat()
        self.test_chat_history()
        
        # Test profile
        self.test_profile_endpoints()
        
        # Test login with created user
        self.test_auth_login(test_user)
        
        # Cleanup
        self.test_cleanup()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  • {result['test']}: {result['details']}")
                    
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = MonexaAPITester()
    tester.run_all_tests()