"""
Admin Dashboard API Tests
Tests for the Aetheris Admin Control Nexus - 6 master panels + Dimensional Console
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spatial-nexus-2.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "meta360d@gmail.com"
ADMIN_PASSWORD = "Adimnaetheris"


class TestAdminAuth:
    """Admin authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["email"] == ADMIN_EMAIL, "Email should match"
        assert data["role"] == "admin", "Role should be admin"
        print(f"SUCCESS: Admin login returned token and role=admin")
    
    def test_admin_login_wrong_email(self):
        """Test admin login with wrong email"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@email.com",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"SUCCESS: Wrong email returns 401 with detail: {data['detail']}")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: Wrong password returns 401")
    
    def test_admin_me_without_token(self):
        """Test admin/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /admin/me without token returns 401")


class TestAdminStats:
    """Panel 1: System Overview - Admin stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_stats_returns_all_fields(self):
        """Test /admin/stats returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check all required fields
        required_fields = [
            "total_users", "total_designs", "total_products", 
            "total_ai_chats", "active_sessions", "total_files",
            "categories", "recent_designs", "recent_chats",
            "ontology_shapes", "ontology_materials", "ontology_colors",
            "timestamp"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Validate data types
        assert isinstance(data["total_users"], int), "total_users should be int"
        assert isinstance(data["total_designs"], int), "total_designs should be int"
        assert isinstance(data["total_products"], int), "total_products should be int"
        assert isinstance(data["categories"], list), "categories should be list"
        assert isinstance(data["recent_designs"], list), "recent_designs should be list"
        
        print(f"SUCCESS: /admin/stats returns all required fields")
        print(f"  - Users: {data['total_users']}, Designs: {data['total_designs']}, Products: {data['total_products']}")
    
    def test_admin_stats_without_token(self):
        """Test /admin/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: /admin/stats without token returns 401")


class TestAdminUsers:
    """Panel 2: User Intelligence - Admin users endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_users_returns_list(self):
        """Test /admin/users returns user list with enriched data"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            user = data[0]
            # Check enriched fields
            assert "user_id" in user, "User should have user_id"
            assert "email" in user, "User should have email"
            assert "design_count" in user, "User should have design_count"
            assert "chat_count" in user, "User should have chat_count"
            print(f"SUCCESS: /admin/users returns {len(data)} users with enriched data")
        else:
            print(f"SUCCESS: /admin/users returns empty list (no users yet)")


class TestAdminDesigns:
    """Panel 3: Design & Products - Admin designs endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_designs_returns_list(self):
        """Test /admin/designs returns design list"""
        response = requests.get(f"{BASE_URL}/api/admin/designs", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            design = data[0]
            assert "design_id" in design, "Design should have design_id"
            assert "user_id" in design, "Design should have user_id"
            assert "configuration" in design, "Design should have configuration"
            print(f"SUCCESS: /admin/designs returns {len(data)} designs")
        else:
            print(f"SUCCESS: /admin/designs returns empty list (no designs yet)")


class TestAdminChatHistory:
    """Panel 4: AI Agent Control - Admin chat history endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_chat_history_returns_list(self):
        """Test /admin/chat-history returns chat list"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-history", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: /admin/chat-history returns {len(data)} chats")
    
    def test_admin_chat_history_with_limit(self):
        """Test /admin/chat-history respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-history?limit=5", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert len(data) <= 5, "Should respect limit parameter"
        print(f"SUCCESS: /admin/chat-history respects limit parameter")


class TestAdminActivity:
    """Admin activity endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_activity_returns_both_types(self):
        """Test /admin/activity returns admin_actions and user_tracking"""
        response = requests.get(f"{BASE_URL}/api/admin/activity", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "admin_actions" in data, "Response should have admin_actions"
        assert "user_tracking" in data, "Response should have user_tracking"
        assert isinstance(data["admin_actions"], list), "admin_actions should be list"
        assert isinstance(data["user_tracking"], list), "user_tracking should be list"
        print(f"SUCCESS: /admin/activity returns admin_actions ({len(data['admin_actions'])}) and user_tracking ({len(data['user_tracking'])})")


class TestAdminOntology:
    """Panel 5: Spatial Analytics - Admin ontology endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_ontology_returns_full_structure(self):
        """Test /admin/ontology returns complete ontology"""
        response = requests.get(f"{BASE_URL}/api/admin/ontology", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check all ontology sections
        assert "shapes" in data, "Ontology should have shapes"
        assert "materials" in data, "Ontology should have materials"
        assert "colors" in data, "Ontology should have colors"
        assert "constraints" in data, "Ontology should have constraints"
        assert "sustainability_vectors" in data, "Ontology should have sustainability_vectors"
        assert "dimensional_extensions" in data, "Ontology should have dimensional_extensions"
        
        # Validate types
        assert isinstance(data["shapes"], list), "shapes should be list"
        assert isinstance(data["materials"], list), "materials should be list"
        assert isinstance(data["colors"], dict), "colors should be dict"
        
        print(f"SUCCESS: /admin/ontology returns full structure")
        print(f"  - Shapes: {len(data['shapes'])}, Materials: {len(data['materials'])}, Colors: {len(data['colors'])}")


class TestAdminSecurityLogs:
    """Panel 6: Security & Compliance - Admin security logs endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_security_logs_returns_all_sections(self):
        """Test /admin/security-logs returns all security data"""
        response = requests.get(f"{BASE_URL}/api/admin/security-logs", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check all sections
        assert "admin_logins" in data, "Should have admin_logins"
        assert "data_deletions" in data, "Should have data_deletions"
        assert "active_sessions" in data, "Should have active_sessions"
        assert "rate_limit_config" in data, "Should have rate_limit_config"
        assert "security_headers" in data, "Should have security_headers"
        assert "compliance" in data, "Should have compliance"
        
        # Check compliance flags
        compliance = data["compliance"]
        assert compliance.get("gdpr") == True, "GDPR should be compliant"
        assert compliance.get("ccpa") == True, "CCPA should be compliant"
        assert compliance.get("wcag_aa") == True, "WCAG AA should be compliant"
        
        print(f"SUCCESS: /admin/security-logs returns all security data")
        print(f"  - Admin logins: {len(data['admin_logins'])}, Active sessions: {len(data['active_sessions'])}")


class TestAdminSystemHealth:
    """System health endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_system_health_returns_metrics(self):
        """Test /admin/system-health returns system metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/system-health", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check all metrics
        required_fields = [
            "cpu_percent", "memory_used_mb", "memory_total_mb", "memory_percent",
            "disk_used_gb", "disk_total_gb", "disk_percent",
            "db_size_mb", "db_collections", "db_objects",
            "uptime_status", "api_version", "timestamp"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Validate ranges
        assert 0 <= data["cpu_percent"] <= 100, "CPU percent should be 0-100"
        assert 0 <= data["memory_percent"] <= 100, "Memory percent should be 0-100"
        assert data["uptime_status"] == "operational", "Status should be operational"
        
        print(f"SUCCESS: /admin/system-health returns all metrics")
        print(f"  - CPU: {data['cpu_percent']}%, Memory: {data['memory_percent']}%, DB: {data['db_size_mb']}MB")


class TestAdminOntologyUpdate:
    """Dimensional Console - Ontology update endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
    
    def test_ontology_add_shape(self):
        """Test adding a shape to ontology"""
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "shapes", "action": "add", "value": "test_prism"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "test_prism" in data["shapes"], "test_prism should be in shapes"
        print(f"SUCCESS: Added test_prism to shapes")
    
    def test_ontology_remove_shape(self):
        """Test removing a shape from ontology"""
        # First add it
        requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "shapes", "action": "add", "value": "test_prism"})
        
        # Then remove it
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "shapes", "action": "remove", "value": "test_prism"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "test_prism" not in data["shapes"], "test_prism should be removed from shapes"
        print(f"SUCCESS: Removed test_prism from shapes")
    
    def test_ontology_add_material(self):
        """Test adding a material to ontology"""
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "materials", "action": "add", "value": "Test Material"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "Test Material" in data["materials"], "Test Material should be in materials"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "materials", "action": "remove", "value": "Test Material"})
        print(f"SUCCESS: Added and removed Test Material")
    
    def test_ontology_add_color(self):
        """Test adding a color to ontology"""
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "colors", "action": "add", "value": {"Test Color": "#FF00FF"}})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "Test Color" in data["colors"], "Test Color should be in colors"
        assert data["colors"]["Test Color"] == "#FF00FF", "Color hex should match"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "colors", "action": "remove", "value": "Test Color"})
        print(f"SUCCESS: Added and removed Test Color")
    
    def test_ontology_invalid_field(self):
        """Test ontology update with invalid field"""
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            headers=self.headers,
            json={"field": "invalid_field", "action": "add", "value": "test"})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"SUCCESS: Invalid field returns 400")
    
    def test_ontology_update_without_token(self):
        """Test ontology update requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/ontology/update", 
            json={"field": "shapes", "action": "add", "value": "test"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"SUCCESS: Ontology update without token returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
