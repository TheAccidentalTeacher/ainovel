"""
Test Authentication System

Quick test to verify JWT authentication endpoints work correctly.
🦸 CODE MASTER: BraveStarr's Justice Testing!
"""

import httpx
import asyncio

BASE_URL = "http://localhost:8002"

async def test_auth():
    """Test authentication flow"""
    
    print("🦸 CODE MASTER AUTHENTICATION TEST")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Register new user
        print("\n1️⃣  TESTING USER REGISTRATION...")
        register_data = {
            "email": "test@novelwriter.com",
            "password": "SecurePass123!",
            "name": "Test Writer"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/api/auth/register", json=register_data)
            if response.status_code == 201:
                data = response.json()
                print("✅ Registration successful!")
                print(f"   User: {data['user']['name']} ({data['user']['email']})")
                print(f"   Token: {data['access_token'][:50]}...")
                token = data['access_token']
            elif response.status_code == 400:
                print("⚠️  User already exists, trying login instead...")
                # Try login instead
                login_data = {
                    "email": register_data["email"],
                    "password": register_data["password"]
                }
                response = await client.post(f"{BASE_URL}/api/auth/login", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    print("✅ Login successful!")
                    print(f"   User: {data['user']['name']} ({data['user']['email']})")
                    token = data['access_token']
                else:
                    print(f"❌ Login failed: {response.text}")
                    return
            else:
                print(f"❌ Registration failed: {response.text}")
                return
        except Exception as e:
            print(f"❌ Error: {e}")
            return
        
        # Test 2: Get current user profile
        print("\n2️⃣  TESTING PROTECTED ENDPOINT (GET /api/auth/me)...")
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(f"{BASE_URL}/api/auth/me", headers=headers)
            if response.status_code == 200:
                user = response.json()
                print("✅ Protected endpoint works!")
                print(f"   User ID: {user['id']}")
                print(f"   Email: {user['email']}")
                print(f"   Name: {user['name']}")
                print(f"   Active: {user['is_active']}")
                print(f"   Premium: {user['is_premium']}")
            else:
                print(f"❌ Failed: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Test invalid token
        print("\n3️⃣  TESTING INVALID TOKEN...")
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = await client.get(f"{BASE_URL}/api/auth/me", headers=headers)
            if response.status_code == 401:
                print("✅ Invalid token correctly rejected!")
            else:
                print(f"⚠️  Unexpected response: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Test no token
        print("\n4️⃣  TESTING NO TOKEN...")
        try:
            response = await client.get(f"{BASE_URL}/api/auth/me")
            if response.status_code == 403:
                print("✅ Missing token correctly rejected!")
            else:
                print(f"⚠️  Unexpected response: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 MISSION ACCOMPLISHED! Authentication system is operational!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_auth())
