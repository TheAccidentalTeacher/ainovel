# Quick Start: Premise Builder API

## Create Session
```bash
curl -X POST http://localhost:8000/api/premise-builder/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "My Novel", "project_id": null}'
```

Response:
```json
{
  "session": {
    "id": "abc-123",
    "status": "in_progress",
    "current_step": 0
  },
  "next_step": 1,
  "can_generate_baseline": false
}
```

## Update Steps

### Step 1: Genre
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 1,
    "data": {
      "primary_genre": "Science Fiction",
      "secondary_genre": "Romance",
      "subgenres": ["Space Opera"],
      "audience_rating": "adult"
    }
  }'
```

### Step 2: Tone & Themes
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 2,
    "data": {
      "tone_adjectives": ["adventurous", "romantic", "humorous"],
      "darkness_level": 4,
      "humor_level": 7,
      "themes": ["love conquers all", "exploration", "finding home"],
      "comparable_works": ["The Martian meets Pride and Prejudice"],
      "heat_level": "warm"
    }
  }'
```

### Step 3: Characters
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 3,
    "data": {
      "protagonist": {
        "name": "Captain Maya Chen",
        "role": "protagonist",
        "brief_description": "Fearless starship captain with trust issues",
        "goal": "Complete the mission and return home",
        "flaw": "Refuses to ask for help"
      },
      "antagonist": {
        "name": "Commander Drake",
        "role": "antagonist",
        "brief_description": "Rival captain from competing faction"
      },
      "supporting_cast": [
        {
          "name": "Dr. Elias Worth",
          "role": "love interest",
          "brief_description": "Brilliant scientist with a mysterious past"
        }
      ]
    }
  }'
```

### Step 4: Plot
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 4,
    "data": {
      "primary_conflict": "Must reach distant planet before rival faction",
      "stakes": "Future of human colonization hangs in the balance",
      "inciting_incident": "Distress signal from unexplored sector",
      "midpoint_twist": "Dr. Worth reveals connection to alien civilization",
      "climax_notes": "Final confrontation on uncharted world",
      "ending_vibe": "hopeful",
      "subplots": ["Crew loyalty tested", "Maya confronts past trauma"]
    }
  }'
```

### Step 5: Structure
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 5,
    "data": {
      "target_word_count": 90000,
      "target_chapter_count": 30,
      "pov_style": "third_person_limited",
      "tense_style": "past",
      "pacing_preference": "fast"
    }
  }'
```

### Step 6: Constraints
```bash
curl -X PATCH http://localhost:8000/api/premise-builder/sessions/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "step": 6,
    "data": {
      "tropes_to_include": ["enemies to lovers", "found family"],
      "tropes_to_avoid": ["love triangle"],
      "content_warnings": [],
      "content_restrictions": ["no graphic violence"],
      "faith_elements": null,
      "must_have_scenes": [
        "First meeting on bridge",
        "Spacewalk together",
        "Final confrontation"
      ]
    }
  }'
```

## AI Assistant
```bash
curl -X POST http://localhost:8000/api/premise-builder/sessions/abc-123/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "expand_character",
    "user_input": "Brilliant scientist who loves stargazing",
    "context": {}
  }'
```

Response:
```json
{
  "suggestion": "Dr. Elias Worth is a renowned astrophysicist...",
  "alternatives": [],
  "tokens_used": 150
}
```

## Generate Baseline Premise
```bash
curl -X POST http://localhost:8000/api/premise-builder/sessions/abc-123/baseline \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "refinement_prompt": null
  }'
```

Response: Session with `baseline_premise` populated

## Generate Premium Premise
```bash
curl -X POST http://localhost:8000/api/premise-builder/sessions/abc-123/premium \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "refinement_prompt": "Add more focus on the romantic tension"
  }'
```

Response: Session with `premium_premise` populated

## Complete Session
```bash
curl -X POST http://localhost:8000/api/premise-builder/sessions/abc-123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "accept_premium_premise": true
  }'
```

Response:
```json
{
  "message": "Premise builder session completed successfully",
  "session_id": "abc-123",
  "project_id": "project-xyz",
  "next_action": "generate_story_bible"
}
```

## Get Session Status
```bash
curl http://localhost:8000/api/premise-builder/sessions/abc-123
```

## Available AI Actions

| Action | Purpose | Example Input |
|--------|---------|---------------|
| `expand_character` | Enrich character seed | "A shy librarian who loves adventure" |
| `suggest_themes` | Generate theme ideas | Genre context |
| `suggest_tropes` | List genre tropes | Genre context |
| `check_conflicts` | Find contradictions | Constraints + themes |
| `suggest_complications` | Plot twist ideas | Current plot setup |
| `calculate_structure` | Structural advice | Word/chapter counts |

## Enum Values

### Heat Level
- `sweet` - Kissing only
- `warm` - Closed-door intimacy
- `hot` - Open-door sensual
- `steamy` - Explicit

### POV Style
- `first_person_single`
- `first_person_multi`
- `third_person_limited`
- `third_person_omniscient`
- `alternating`

### Tense Style
- `past`
- `present`

### Pacing Preference
- `fast` - Action-packed
- `moderate` - Balanced
- `slow` - Contemplative

### Session Status
- `in_progress`
- `completed`
- `abandoned`
