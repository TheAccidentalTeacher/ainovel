import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_outline():
    client = AsyncIOMotorClient('mongodb+srv://scoso:9Pegasus@brainstorm-cluster.bg60my0.mongodb.net/?retryWrites=true&w=majority&appName=brainstorm-cluster')
    db = client.ai_novel_generator
    
    # Get the most recent outline
    outline = await db.outlines.find_one(sort=[('created_at', -1)])
    
    if not outline:
        print("No outline found")
        return
    
    print(f"Outline ID: {outline['id']}")
    print(f"Total chapters: {len(outline['chapters'])}")
    print("\n--- First Chapter Fields ---")
    
    first_chapter = outline['chapters'][0]
    print(f"Chapter Index: {first_chapter.get('chapter_index')}")
    print(f"Title: {first_chapter.get('title')}")
    
    print("\nAll fields present:")
    for key in first_chapter.keys():
        value = first_chapter[key]
        if isinstance(value, str):
            preview = value[:100] + "..." if len(value) > 100 else value
        else:
            preview = value
        print(f"  - {key}: {preview}")
    
    print("\n--- Checking specific structured fields ---")
    print(f"opening_scene: {'✓ PRESENT' if first_chapter.get('opening_scene') else '✗ MISSING'}")
    print(f"characters_present: {'✓ PRESENT' if first_chapter.get('characters_present') else '✗ MISSING'}")
    print(f"locations: {'✓ PRESENT' if first_chapter.get('locations') else '✗ MISSING'}")
    print(f"plot_events: {'✓ PRESENT' if first_chapter.get('plot_events') else '✗ MISSING'}")
    print(f"character_development: {'✓ PRESENT' if first_chapter.get('character_development') else '✗ MISSING'}")
    print(f"subplots_advanced: {'✓ PRESENT' if first_chapter.get('subplots_advanced') else '✗ MISSING'}")
    print(f"closing_scene: {'✓ PRESENT' if first_chapter.get('closing_scene') else '✗ MISSING'}")
    print(f"tone_notes: {'✓ PRESENT' if first_chapter.get('tone_notes') else '✗ MISSING'}")
    print(f"summary_prose: {'✓ PRESENT' if first_chapter.get('summary_prose') else '✗ MISSING'}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(check_outline())
