#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AetherisSpatialAPITester:
    def __init__(self, base_url="https://modular-visualizer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            if expected_status and actual_status:
                print(f"   Expected status: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, params=None, description=""):
        """Generic API endpoint tester"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)

            success = response.status_code == expected_status
            details = ""
            
            if not success:
                try:
                    error_data = response.json()
                    details = f"Response: {error_data}"
                except:
                    details = f"Response text: {response.text[:200]}"
            
            test_name = f"{method} {endpoint}" + (f" - {description}" if description else "")
            self.log_test(test_name, success, details, expected_status, response.status_code)
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            test_name = f"{method} {endpoint}" + (f" - {description}" if description else "")
            self.log_test(test_name, False, f"Exception: {str(e)}")
            return False, {}

    def test_products_api(self):
        """Test all product-related endpoints"""
        print("\n🔍 Testing Product APIs...")
        
        # Test GET /api/products - should return seeded products
        success, products = self.test_api_endpoint('GET', 'products', 200, description="Get all products")
        if success and isinstance(products, list) and len(products) > 0:
            print(f"   Found {len(products)} products")
            # Check if we have the expected seeded product
            desk_product = next((p for p in products if p.get('product_id') == 'prod_modular_desk_01'), None)
            if desk_product:
                print(f"   ✅ Found expected desk product: {desk_product.get('name')}")
            else:
                print(f"   ⚠️  Expected 'prod_modular_desk_01' not found in products")
        
        # Test GET /api/categories
        success, categories = self.test_api_endpoint('GET', 'categories', 200, description="Get product categories")
        if success and isinstance(categories, list):
            print(f"   Found categories: {categories}")
        
        # Test search functionality
        success, search_results = self.test_api_endpoint('GET', 'products', 200, 
                                                       params={'search': 'desk'}, 
                                                       description="Search for 'desk'")
        if success and isinstance(search_results, list):
            print(f"   Search 'desk' returned {len(search_results)} results")
        
        # Test category filtering
        success, furniture_products = self.test_api_endpoint('GET', 'products', 200, 
                                                           params={'category': 'Furniture'}, 
                                                           description="Filter by 'Furniture' category")
        if success and isinstance(furniture_products, list):
            print(f"   Furniture category returned {len(furniture_products)} results")
        
        # Test specific product retrieval
        success, product_detail = self.test_api_endpoint('GET', 'products/prod_modular_desk_01', 200, 
                                                       description="Get specific product")
        if success and product_detail.get('product_id') == 'prod_modular_desk_01':
            print(f"   ✅ Retrieved specific product: {product_detail.get('name')}")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Auth APIs...")
        
        # Test /api/auth/me without authentication - should return 401
        self.test_api_endpoint('GET', 'auth/me', 401, description="Get user info (unauthenticated)")
        
        # Test logout endpoint
        self.test_api_endpoint('POST', 'auth/logout', 200, description="Logout")

    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔒 Testing Protected APIs (without auth - should fail)...")
        
        # These should all return 401 without proper authentication
        protected_endpoints = [
            ('GET', 'designs', 'Get user designs'),
            ('GET', 'ai/history', 'Get AI chat history'),
            ('GET', 'users/preferences', 'Get user preferences'),
            ('GET', 'collections', 'Get design collections')
        ]
        
        for method, endpoint, description in protected_endpoints:
            self.test_api_endpoint(method, endpoint, 401, description=f"{description} (should be protected)")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Aetheris Spatial API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test product APIs (public endpoints)
        self.test_products_api()
        
        # Test auth endpoints
        self.test_auth_endpoints()
        
        # Test protected endpoints (should fail without auth)
        self.test_protected_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = AetherisSpatialAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())