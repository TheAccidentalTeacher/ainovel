"""
Test script for Premise Builder API endpoints.

Validates that the guided premise builder flow works end-to-end.
"""

import asyncio
import sys
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent))

from backend.models.database import get_database
from backend.services.premise_builder_service import PremiseBuilderService


async def test_premise_builder():
    """Test premise builder session creation and updates."""
    
    print("🧪 Testing Premise Builder Service\n")
    
    # Initialize database
    db = await get_database()
    service = PremiseBuilderService(db)
    
    print("✅ Connected to database")
    
    # Step 1: Create session
    print("\n📝 Step 1: Creating new builder session...")
    session = await service.create_session(
        initial_title="Starlight Over Paradise Valley"
    )
    print(f"   Session ID: {session.id}")
    print(f"   Current Step: {session.current_step}")
    print(f"   Status: {session.status}")
    
    # Step 2: Update Step 1 (Genre)
    print("\n📝 Step 2: Setting genre profile...")
    genre_data = {
        "primary_genre": "Christian Romance",
        "secondary_genre": "Science Fiction",
        "subgenres": ["Amish", "Space Opera"],
        "audience_rating": "adult",
        "suggested_tropes": ["fish out of water", "forbidden love", "found family"]
    }
    session = await service.update_step(session.id, 1, genre_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Primary Genre: {session.genre_profile.primary_genre}")
    
    # Step 3: Update Step 2 (Tone & Themes)
    print("\n📝 Step 3: Setting tone and themes...")
    tone_data = {
        "tone_adjectives": ["heartfelt", "absurd", "hopeful", "humorous"],
        "darkness_level": 3,
        "humor_level": 8,
        "themes": ["faith transcending reality", "love requiring sacrifice", "embracing differences"],
        "comparable_works": ["The Martian meets Amish fiction"],
        "heat_level": "sweet"
    }
    session = await service.update_step(session.id, 2, tone_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Humor Level: {session.tone_theme_profile.humor_level}/10")
    
    # Step 4: Update Step 3 (Characters)
    print("\n📝 Step 4: Adding characters...")
    character_data = {
        "protagonist": {
            "name": "Jedidiah 'Jed' Hostetler",
            "role": "protagonist",
            "brief_description": "28-year-old Amish carpenter with three legs and eight thumbs, extraordinary banjo player",
            "goal": "Understand why he's different while staying faithful",
            "flaw": "Fear of questioning God's plan",
            "arc_notes": "Discovers his alien heritage gives him cosmic purpose"
        },
        "antagonist": None,
        "supporting_cast": [
            {
                "name": "Lieutenant Esther Moonbeam",
                "role": "love interest",
                "brief_description": "Half-human, half-Celestine scout with silver hair and violet eyes",
                "goal": "Find the lost colony and offer them a choice",
                "flaw": "Torn between duty and heart"
            },
            {
                "name": "Bishop Zebulon Yoder",
                "role": "mentor",
                "brief_description": "97-year-old spiritual leader, secretly last original Celestine settler"
            }
        ]
    }
    session = await service.update_step(session.id, 3, character_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Protagonist: {session.character_seeds.protagonist.name}")
    print(f"   Supporting Cast: {len(session.character_seeds.supporting_cast)} characters")
    
    # Step 5: Update Step 4 (Plot)
    print("\n📝 Step 5: Defining plot structure...")
    plot_data = {
        "primary_conflict": "Community must reconcile Amish faith with alien heritage when Jed's music activates dormant genetic markers",
        "stakes": "Community identity, individual destiny, and chance for true love across the stars",
        "inciting_incident": "Jed's banjo playing causes 17 community members to glow with bioluminescence",
        "midpoint_twist": "Ancient spaceship beneath meeting house awakens",
        "climax_notes": "Choice between staying on Earth or relocating to New Eden colony",
        "ending_vibe": "hopeful",
        "subplots": [
            "Miriam's matchmaking attempts",
            "English Charlie's quantum butter-churning explanations",
            "Bishop Yoder preparing to pass on the truth"
        ]
    }
    session = await service.update_step(session.id, 4, plot_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Primary Conflict: {session.plot_intent.primary_conflict[:80]}...")
    
    # Step 6: Update Step 5 (Structure)
    print("\n📝 Step 6: Setting structure targets...")
    structure_data = {
        "target_word_count": 80000,
        "target_chapter_count": 25,
        "pov_style": "third_person_limited",
        "tense_style": "past",
        "pacing_preference": "moderate"
    }
    session = await service.update_step(session.id, 5, structure_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Target: {session.structure_targets.target_word_count:,} words / {session.structure_targets.target_chapter_count} chapters")
    print(f"   Average Chapter: {session.structure_targets.average_chapter_length:,} words")
    
    # Step 7: Update Step 6 (Constraints)
    print("\n📝 Step 7: Adding constraints...")
    constraints_data = {
        "tropes_to_include": ["fish out of water", "opposites attract", "secret identity"],
        "tropes_to_avoid": ["love triangle", "miscommunication plot"],
        "content_warnings": [],
        "content_restrictions": ["no graphic violence", "no profanity"],
        "faith_elements": "Sincere Christian faith that embraces God's cosmic creation",
        "cultural_considerations": "Respectful portrayal of Amish culture while acknowledging fictional elements",
        "must_have_scenes": [
            "Jed's banjo activating genetic markers at Harvest Fellowship",
            "First meeting between Jed and Esther",
            "Discovery of spaceship beneath meeting house"
        ]
    }
    session = await service.update_step(session.id, 6, constraints_data)
    print(f"   Current Step: {session.current_step}")
    print(f"   Must-have scenes: {len(session.constraints_profile.must_have_scenes)}")
    
    print("\n" + "="*60)
    print("✅ All steps completed successfully!")
    print("="*60)
    
    # Verify session state
    print(f"\n📊 Final Session State:")
    print(f"   Session ID: {session.id}")
    print(f"   Title: {session.project_stub.title if session.project_stub else 'N/A'}")
    print(f"   Current Step: {session.current_step}/8")
    print(f"   Status: {session.status.value}")
    print(f"   Genre: {session.genre_profile.primary_genre if session.genre_profile else 'N/A'}")
    print(f"   Characters: {len(session.character_seeds.supporting_cast) + 1 if session.character_seeds else 0}")
    print(f"   Version: {session.version}")
    
    print("\n🎯 Next Steps:")
    print("   1. Generate baseline premise (Step 7)")
    print("   2. Generate premium premise (Step 8)")
    print("   3. Complete session and create project")
    
    print(f"\n💡 Test session created with ID: {session.id}")
    print(f"   You can now test API endpoints with this session ID")
    
    return session.id


if __name__ == "__main__":
    try:
        session_id = asyncio.run(test_premise_builder())
        print(f"\n✨ Test completed successfully!")
        print(f"\n📋 To test API endpoints, use:")
        print(f"   GET  http://localhost:8000/api/premise-builder/sessions/{session_id}")
        print(f"   POST http://localhost:8000/api/premise-builder/sessions/{session_id}/baseline")
        print(f"   POST http://localhost:8000/api/premise-builder/sessions/{session_id}/premium")
    
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
