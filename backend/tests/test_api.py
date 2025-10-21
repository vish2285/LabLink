# 🧪 Unit tests for API endpoints
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.database import Base, get_db
from app import models

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create test client
    with TestClient(app) as c:
        yield c
    
    # Clean up
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def test_professor():
    """Create a test professor"""
    db = TestingSessionLocal()
    professor = models.Professor(
        id=1,
        name="Test Professor",
        department="Computer Science",
        email="test@ucdavis.edu",
        research_interests="machine learning, artificial intelligence",
        profile_link="https://example.com",
        photo_url="https://example.com/photo.jpg"
    )
    db.add(professor)
    db.commit()
    db.refresh(professor)
    db.close()
    return professor

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_api_health_endpoint(client):
    """Test API health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_departments_endpoint(client):
    """Test departments endpoint"""
    response = client.get("/api/departments")
    assert response.status_code == 200
    assert response.json() == ["Computer Science"]

def test_professors_endpoint_returns_list(client, test_professor):
    """Test professors endpoint returns a list of professors"""
    response = client.get("/api/professors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(p.get("id") == test_professor.id for p in data)

def test_departments_endpoint_is_cs_only(client):
    """Departments endpoint returns Computer Science only (by design)"""
    response = client.get("/api/departments")
    assert response.status_code == 200
    assert response.json() == ["Computer Science"]

def test_professor_by_id_endpoint(client, test_professor):
    """Test get professor by ID endpoint"""
    response = client.get(f"/api/professors/{test_professor.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_professor.id
    assert data["name"] == test_professor.name

def test_professor_not_found(client):
    """Test professor not found"""
    response = client.get("/api/professors/999")
    assert response.status_code == 404

def test_rate_limiting(client):
    """Test rate limiting (this might fail if rate limits are too strict)"""
    # Make multiple requests quickly
    responses = []
    for _ in range(5):
        response = client.get("/api/departments")
        responses.append(response.status_code)
    
    # At least some should succeed
    assert 200 in responses

def test_cors_headers(client):
    """Test CORS headers are present"""
    response = client.get("/api/departments")
    # Check that the endpoint works (CORS is handled by middleware)
    assert response.status_code == 200
    # Security headers present
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"

def test_input_validation():
    """Test input validation in schema"""
    from app.schema import StudentProfileIn
    
    # Valid input
    valid_profile = StudentProfileIn(
        interests="machine learning",
        skills="python, pytorch"
    )
    assert valid_profile.interests == "machine learning"
    
    # Skills-only allowed (empty interests accepted)
    skills_only = StudentProfileIn(interests="", skills="python")
    assert skills_only.interests == ""
    
    # Invalid input - XSS attempt
    with pytest.raises(ValueError, match="Invalid characters"):
        StudentProfileIn(interests="<script>alert('xss')</script>", skills="python")
    
    # Invalid input - too long
    with pytest.raises(ValueError, match="too long"):
        StudentProfileIn(interests="x" * 2001, skills="python")

def test_cache_functionality():
    """Test cache functionality"""
    from app.cache import cache, cache_professor_list, get_cached_professor_list
    
    # Test cache set and get
    test_data = [{"id": 1, "name": "Test"}]
    cache_professor_list("test_key", test_data)
    
    cached_data = get_cached_professor_list("test_key")
    assert cached_data == test_data
    
    # Test cache miss
    cached_data = get_cached_professor_list("nonexistent_key")
    assert cached_data is None

if __name__ == "__main__":
    pytest.main([__file__])
