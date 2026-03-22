import requests
import time

def test_rate_limiting_detailed():
    """Test rate limiting with more detailed analysis"""
    base_url = "https://modular-visualizer.preview.emergentagent.com"
    
    print("🔍 Testing Rate Limiting in Detail...")
    
    # Test general API rate limiting
    print("\n1. Testing general API rate limiting (60/min)...")
    for i in range(65):  # Try to exceed 60 requests
        try:
            response = requests.get(f"{base_url}/api/products", timeout=2)
            print(f"Request {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"✅ Rate limit triggered at request {i+1}")
                retry_after = response.headers.get('Retry-After')
                print(f"Retry-After header: {retry_after}")
                return True
                
        except Exception as e:
            print(f"Request {i+1} failed: {e}")
        
        time.sleep(0.05)  # Small delay to avoid overwhelming
    
    print("❌ No rate limit triggered after 65 requests")
    
    # Test AI endpoint rate limiting (15/min) - should get 401 but test the rate limiter
    print("\n2. Testing AI endpoint rate limiting (15/min)...")
    for i in range(20):
        try:
            response = requests.post(
                f"{base_url}/api/ai/chat",
                json={"message": f"test {i}"},
                timeout=2
            )
            print(f"AI Request {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"✅ AI rate limit triggered at request {i+1}")
                return True
                
        except Exception as e:
            print(f"AI Request {i+1} failed: {e}")
        
        time.sleep(0.1)
    
    print("❌ No AI rate limit triggered after 20 requests")
    return False

if __name__ == "__main__":
    test_rate_limiting_detailed()