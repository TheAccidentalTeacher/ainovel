"""Create users directly in MongoDB"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def create_users():
    # Use the same connection string from your settings
    client = AsyncIOMotorClient('mongodb+srv://sosborne:Ginger2015!@brainstorm-cluster.bg60my0.mongodb.net/')
    db = client['ai_novel_generator']
    
    # User 1: abc123
    user1 = {
        'id': 'user_abc123',
        'email': 'abc123@example.com',
        'name': 'abc123',
        'hashed_password': bcrypt.hashpw(b'abc12345', bcrypt.gensalt()).decode('utf-8'),
        'is_active': True,
        'is_premium': False,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'custom_avatars_count': 0,
        'projects_count': 0
    }
    
    # User 2: Alana
    user2 = {
        'id': 'user_alana',
        'email': 'alana@example.com',
        'name': 'Alana',
        'hashed_password': bcrypt.hashpw(b'Terry123', bcrypt.gensalt()).decode('utf-8'),
        'is_active': True,
        'is_premium': False,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'custom_avatars_count': 0,
        'projects_count': 0
    }
    
    # Delete existing if any
    await db.users.delete_many({'email': {'$in': ['abc123@example.com', 'alana@example.com']}})
    
    # Insert both users
    await db.users.insert_one(user1)
    print(f"✅ Created user: abc123 (email: abc123@example.com, password: abc12345)")
    
    await db.users.insert_one(user2)
    print(f"✅ Created user: Alana (email: alana@example.com, password: Terry123)")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(create_users())
