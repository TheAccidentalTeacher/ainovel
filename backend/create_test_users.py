"""Create test users for the application."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def create_users():
    client = AsyncIOMotorClient('mongodb+srv://sosborne:Ginger2015!@brainstorm-cluster.bg60my0.mongodb.net/')
    db = client['ai_novel_generator']
    
    users = [
        {
            'id': 'user_abc123',
            'email': 'abc123@example.com',
            'name': 'abc123',
            'hashed_password': bcrypt.hashpw(b'abc123', bcrypt.gensalt()).decode('utf-8'),
            'is_active': True,
            'is_premium': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'custom_avatars_count': 0,
            'projects_count': 0
        },
        {
            'id': 'user_alana',
            'email': 'alana@example.com',
            'name': 'Alana',
            'hashed_password': bcrypt.hashpw(b'Terry', bcrypt.gensalt()).decode('utf-8'),
            'is_active': True,
            'is_premium': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'custom_avatars_count': 0,
            'projects_count': 0
        }
    ]
    
    for user in users:
        existing = await db.users.find_one({'email': user['email']})
        if existing:
            print(f"User {user['name']} already exists")
        else:
            await db.users.insert_one(user)
            print(f"✅ Created user: {user['name']} (email: {user['email']})")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(create_users())
