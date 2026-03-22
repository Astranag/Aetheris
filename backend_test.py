import requests
import sys
import time
from datetime import datetime

class QualityComplianceAPITester:
    def __init__(self, base_url="https://modular-visualizer.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                has_status = "status" in data and data["status"] == "healthy"
                has_version = "version" in data
                has_timestamp = "timestamp" in data
                
                if has_status and has_version and has_timestamp:
                    self.log_result("Health endpoint returns healthy status with version and timestamp", True)
                    return True
                else:
                    self.log_result("Health endpoint", False, f"Missing fields: status={has_status}, version={has_version}, timestamp={has_timestamp}")
            else:
                self.log_result("Health endpoint", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Health endpoint", False, f"Error: {str(e)}")
        return False

    def test_privacy_summary_endpoint(self):
        """Test GDPR/CCPA privacy summary endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/legal/privacy-summary", timeout=10)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["data_controller", "data_collected", "lawful_basis", "rights", "gdpr_compliant", "ccpa_compliant"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and isinstance(data.get("rights"), list):
                    self.log_result("Privacy summary returns GDPR/CCPA compliance info with rights array", True)
                    return True
                else:
                    self.log_result("Privacy summary endpoint", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Privacy summary endpoint", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Privacy summary endpoint", False, f"Error: {str(e)}")
        return False

    def test_security_headers(self):
        """Test security headers presence"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            headers = response.headers
            
            required_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY", 
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": None,  # Just check presence
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": None  # Just check presence
            }
            
            missing_headers = []
            for header, expected_value in required_headers.items():
                if header not in headers:
                    missing_headers.append(header)
                elif expected_value and headers[header] != expected_value:
                    missing_headers.append(f"{header}={headers[header]} (expected {expected_value})")
            
            if not missing_headers:
                self.log_result("Security headers present (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy, Permissions-Policy)", True)
                return True
            else:
                self.log_result("Security headers", False, f"Missing/incorrect: {missing_headers}")
        except Exception as e:
            self.log_result("Security headers", False, f"Error: {str(e)}")
        return False

    def test_rate_limiting(self):
        """Test rate limiting on AI endpoint"""
        try:
            # Make rapid requests to trigger rate limit
            for i in range(20):
                response = requests.post(
                    f"{self.base_url}/api/ai/chat",
                    json={"message": f"test {i}"},
                    timeout=5
                )
                if response.status_code == 429:
                    self.log_result("Rate limiting returns 429 response after excessive requests to /api/ai/chat", True)
                    return True
                elif response.status_code == 401:
                    # Expected for unauthenticated requests, continue testing
                    continue
                time.sleep(0.1)
            
            self.log_result("Rate limiting", False, "No 429 response received after 20 requests")
        except Exception as e:
            self.log_result("Rate limiting", False, f"Error: {str(e)}")
        return False

    def test_input_sanitization(self):
        """Test input sanitization on search endpoint"""
        try:
            malicious_input = "<script>alert(1)</script>"
            response = requests.get(
                f"{self.base_url}/api/products",
                params={"search": malicious_input},
                timeout=10
            )
            
            if response.status_code == 200:
                # Check that script tags are not in response and results are safe
                response_text = response.text
                if "<script>" not in response_text and "alert(1)" not in response_text:
                    self.log_result("Input sanitization prevents script execution and returns safe results", True)
                    return True
                else:
                    self.log_result("Input sanitization", False, "Script tags found in response")
            else:
                self.log_result("Input sanitization", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Input sanitization", False, f"Error: {str(e)}")
        return False

    def test_existing_product_apis(self):
        """Test that existing product APIs still work"""
        try:
            # Test products list
            response = requests.get(f"{self.base_url}/api/products", timeout=10)
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    self.log_result("Product discovery still works: GET /api/products returns products", True)
                else:
                    self.log_result("Product discovery", False, "No products returned")
                    return False
            else:
                self.log_result("Product discovery", False, f"Status {response.status_code}")
                return False

            # Test specific product
            response = requests.get(f"{self.base_url}/api/products/prod_modular_desk_01", timeout=10)
            if response.status_code == 200:
                product = response.json()
                if "product_id" in product and product["product_id"] == "prod_modular_desk_01":
                    self.log_result("Product detail still works: GET /api/products/prod_modular_desk_01", True)
                    return True
                else:
                    self.log_result("Product detail", False, "Invalid product data")
            else:
                self.log_result("Product detail", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Existing product APIs", False, f"Error: {str(e)}")
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🔍 Testing Aetheris Spatial - Quality & Compliance Layer")
        print("=" * 60)
        
        # Test new quality/compliance features
        self.test_health_endpoint()
        self.test_privacy_summary_endpoint()
        self.test_security_headers()
        self.test_rate_limiting()
        self.test_input_sanitization()
        
        # Test existing functionality still works
        self.test_existing_product_apis()
        
        print("\n" + "=" * 60)
        print(f"📊 Backend Tests: {self.tests_passed}/{self.tests_run} passed")
        
        return self.tests_passed, self.tests_run, self.results

def main():
    tester = QualityComplianceAPITester()
    passed, total, results = tester.run_all_tests()
    
    if passed == total:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print(f"⚠️  {total - passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())