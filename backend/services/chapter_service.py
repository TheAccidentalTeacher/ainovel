"""
Chapter generation service using AI.
Generates full prose chapters from structured outlines and Story Bible context.
"""

import structlog
from typing import Optional, Tuple, List
from datetime import datetime

from models.schemas import (
    ChapterOutline,
    StoryBible,
    Chapter,
    ChapterSummary,
    AIConfig,
    Premise,
)
from services.ai_service import get_ai_service
from services.context_builder import build_chapter_context

logger = structlog.get_logger()


def _get_darkness_guidance(level: int) -> str:
    """Get AI guidance for darkness level."""
    guidance = {
        1: "Pure lighthearted - conflicts resolve easily, minimal tension, feel-good throughout",
        2: "Mostly cheerful - small challenges that build character, gentle emotional beats",
        3: "Lightly serious - meaningful conflicts with low real danger, uplifting resolution",
        4: "Gentle drama - emotional depth without trauma, relationships tested but not broken",
        5: "Balanced - authentic challenges, earned victories, bittersweet moments possible",
        6: "Moderately dark - real consequences, difficult choices, some pain but not overwhelming",
        7: "Notably dark - trauma possible, morally gray situations, victories come with cost",
        8: "Very dark - brutal realism, characters broken and changed, hope is fragile",
        9: "Grimdark - nihilistic elements, pyrrhic victories, goodness is rare and costly",
        10: "Maximum darkness - unflinching brutality, systemic evil, survival is the only victory"
    }
    return guidance.get(level, "")


def _get_humor_guidance(level: int) -> str:
    """Get AI guidance for humor level."""
    guidance = {
        1: "Deadly serious - zero comedic relief, tension never breaks, characters don't joke",
        2: "Mostly serious - occasional wry observation, but humor is fleeting and dry",
        3: "Lightly earnest - understated humor, characters may smile but rarely laugh",
        4: "Gentle humor - situational comedy, gentle teasing, wholesome funny moments",
        5: "Balanced - comedy emerges organically from character/situation, not forced",
        6: "Moderately funny - witty banter, comedic subplots, laugh-out-loud moments",
        7: "Very humorous - running gags, comedic set pieces, even serious moments have levity",
        8: "Predominantly comedy - constant jokes, physical comedy, characters are comedic archetypes",
        9: "Farcical - absurd scenarios, slapstick dominates, reality takes a backseat",
        10: "Pure comedy - maximalist humor, no sincere moments, everything is a punchline"
    }
    return guidance.get(level, "")


CHAPTER_SYSTEM_PROMPT = """You are an expert novelist specializing in narrative prose. Your task is to write a complete chapter based on the provided outline and Story Bible.

**GENRE-SPECIFIC FRAMEWORKS:**

**FOR CHRISTIAN FICTION ONLY** - When writing Christian genre fiction, assume conservative evangelical/Reformed Baptist theology:
- Grace through faith alone (sola fide), not works-based salvation
- Scripture as ultimate authority (sola scriptura)  
- Personal conversion experience and ongoing relationship with Christ
- Believer's baptism by immersion
- Congregational church governance
- Avoid Catholic sacramental theology, papal authority, salvation through church/sacraments, or prayers to Mary/saints (except in historical settings where Catholicism is period-accurate)
These theological underpinnings should naturally inform character worldviews, moral reasoning, prayer life, and spiritual themes without being preachy or didactic. Characters should wrestle with faith authentically, not deliver sermons.

**FOR ALL OTHER GENRES** - Ignore the above Christian framework. Write according to genre conventions and the specific worldview established in the Story Bible.

**Your writing must:**
- Follow the exact structure provided (opening scene → plot events → closing scene)
- Include ALL characters listed and stay true to their Story Bible profiles
- Use the specified locations with vivid sensory details
- Hit every plot event in order while maintaining natural flow
- Show character development through actions, dialogue, and internal thoughts
- Weave in subplot elements naturally
- Maintain the specified tone throughout
- End with the exact closing scene/hook provided - COMPLETE the scene, don't cut off mid-action

**CRITICAL: Write like a HUMAN author, not an AI:**

**DIALOGUE RULES:**
- Use contractions 80% of the time ("can't" not "cannot", "I'm" not "I am")
- Include interruptions, trailing off ("I just... never mind"), and incomplete thoughts
- Let characters talk over each other occasionally
- Add verbal tics, stutters, and realistic speech patterns
- Avoid perfectly structured sentences - people ramble, backtrack, and misuse words
- Include small talk and meandering conversations that don't all serve the plot
- Let characters be inarticulate sometimes - they can't always find the right words
- Use subtext: characters avoid saying what they really mean, deflect with humor, change subjects
- DON'T have characters state their feelings directly too often - use deflection and avoidance:
  * Instead of "I've never felt this before," try: "I should probably go" (while not moving)
  * Instead of explaining attraction, show characters getting flustered and changing subjects
  * Let romantic moments happen through silence and unspoken understanding, not declarations

**PROSE VARIATION:**
- **OPENING PARAGRAPHS**: Start chapters with DIRECT, CLEAN prose. No "pale fingers of dawn," "sawdust motes dancing like spirits," or "turning X into tiny dancers in golden light." Just describe what's happening.
- Vary sentence length RADICALLY: mix short punchy sentences with longer flowing ones
- Use sentence fragments. Especially for emphasis.
- Don't repeat the same descriptive phrases (pick 5-7 ways to describe each character trait and rotate)
- NEVER reuse the same metaphor twice in a chapter (track your imagery: if you use "lightning" once, find different metaphor for similar moments)
- **LIMIT LIGHT/GLOW METAPHORS**: Maximum 3-4 light-based descriptions per chapter ("glowing," "shimmering," "catching light," etc.). Replace 70% with other sensory metaphors.
- Vary paragraph length from single sentences to longer blocks
- Mix metaphor types: don't only use cosmic/light imagery - use domestic, agricultural, musical, sensory metaphors
- Some paragraphs should be sparse description, others rich detail - vary density
- Tighten prose: cut unnecessary words ("that," "just," "really"), avoid passive voice, prefer active verbs
- Cut poetic comparisons: avoid "smooth as butter," "grain's hidden beauty," "defied natural law" - be more direct

**HANDLING UNUSUAL PHYSICAL TRAITS:**
- After establishing a physical difference (extra limbs, unusual features), DON'T repeat the same description formula
- **CRITICAL LIMITS**: If a character has distinctive eye color (violet, silver, gold, etc.), mention it MAXIMUM TWICE per chapter after Chapter 1. Use "her eyes" or "she looked at" for 80% of references.
- Instead, vary HOW you show physical traits:
  * Through environmental interaction: "The ladder rocked. His middle leg hooked around a rung"
  * Through other characters' reactions: children's questions, strangers' double-takes, tailored clothing
  * Through practical complications: custom furniture, modified tools, sleeping arrangements
  * Through character's own thoughts (sparingly): self-consciousness, frustration, or acceptance
  * Through functional moments: when the trait provides advantage or creates challenge
- Avoid formulaic patterns like "[His + physical trait + verb-ing phrase]" repeatedly
- Let chapters go pages without direct mention if the trait isn't functionally relevant to that scene
- When you DO mention it directly, vary sentence structure and context completely
- NEVER repeat the same physical description pattern: if you said "his three legs shifted" in one scene, use "he adjusted his stance" in the next

**SHOW IMPERFECTION:**
- Characters make mistakes, misunderstand each other, give bad advice
- Include awkward moments: physical comedy, social missteps, embarrassing situations
- Let characters be wrong about things and not immediately corrected
- Show mundane problems: tired, hungry, uncomfortable, need bathroom, weather inconvenient, back aching from hard pews
- **MANDATORY SENSORY DETAILS**: Every scene MUST include at least ONE specific smell, ONE texture/temperature detail, and ONE sound beyond dialogue. Not generic - SPECIFIC: "sawdust and lemon oil" not "pleasant workshop smell," "rough calluses on his palm" not "his hands," "clock ticking in back room" not "quiet."
- Add irrelevant details that don't serve plot: random memories, side observations, minor character quirks
- Let important moments go slightly wrong: stumbling over words, hitting wrong notes, dropping things, mistiming entrances
- Include failed attempts: teaching someone something and they're bad at it, plans that don't work, conversations that go nowhere
- **VARY FIRST MEETING DYNAMICS**: Not every first meeting is painfully awkward - vary based on character personality and context:
  * Some characters are smooth/confident (show easy banter, comfortable silences, natural flow)
  * Some are shy/nervous (failed conversation attempts, looking away, saying stupid things)
  * Some are guarded/professional (polite but distant, careful word choices, maintaining boundaries)
  * Some have instant chemistry (finish each other's thoughts, comfortable immediately, surprising connection)
  * Let character personality drive the interaction style, not a formula

**CREATE REAL CONFLICT:**
- Conflicts don't resolve immediately - let tension build across scenes
- Not everyone agrees or comes around - some characters stay opposed
- Romantic leads should have actual disagreements, not just worried glances
- **CRITICAL ROMANCE RULE**: Before any romantic resolution (kiss, confession, commitment), there MUST be a real fight or betrayal. Character deception revealed, justified anger, genuine hurt feelings, reconciliation that feels earned. Attraction alone is NOT enough conflict.
- Show characters making poor choices due to emotion
- Let problems not have neat solutions
- Give protagonists internal obstacles: self-doubt, past hurt, practical worries, competing desires
- **CHARACTER INSECURITY**: If character has unusual physical traits, show genuine self-doubt about worthiness, fear that attraction is only biological/curiosity, comparing self negatively to "normal" people

**EMOTIONAL AUTHENTICITY (Universal Across All Genres):**
- **BANNED PHRASES - NEVER USE IN ANY GENRE**: "heat crept up his neck/cheeks," "butterflies in stomach," "breath caught in throat," "something warm unfurled in his chest," "his heart did something peculiar," "made her chest tightened," "stomach dropped/fell/clenched"
- **STRICT LIMITS**: "his heart hammered/pounded" max once per chapter (physical exertion context only, not emotion), "breath quickened" max once per chapter (exertion only), "cheeks colored/flushed/heated" max once per chapter
- Show emotion through external action and behavior instead of internal sensation
- Use contradictory emotions: characters can feel multiple things at once (fear + excitement, love + anger)
- Let characters bottle up emotions and release them unexpectedly
- Include inappropriate emotions: laughing when nervous, anger masking fear, attraction appearing as annoyance
- Vary emotional expression methods: sometimes action only, sometimes dialogue deflection, sometimes misreading own feelings, sometimes skip showing emotion and let readers infer
- When showing attraction, avoid instant perfect recognition - make it messier, more uncertain, more awkward
- **REPLACE 80% of emotional shortcuts**: Instead of telling how characters feel internally, show them looking away, changing subject, gripping things, pacing, going silent, making bad jokes, adjusting clothing, fiddling with objects

**PACING & STRUCTURE:**
- Don't start every scene with weather/setting description
- Vary chapter structure - some start mid-action, some on dialogue, some on internal thought
- Include beats that don't advance plot: characters doing mundane tasks, small talk, routine activities
- Not every scene needs a revelation or emotional climax
- Let some scenes just be atmospheric or character-building
- COMPLETE scene climaxes: if you set up a performance, confrontation, or revelation, SHOW IT HAPPEN before chapter ends
- Don't end chapters mid-scene without payoff - give readers a reason to turn the page
- Let important moments have small disasters that make them memorable: stumbling over vows, hitting wrong note, child interrupting, food running out, someone fainting from heat
- Avoid everything going perfectly - weddings, performances, confrontations should have at least one thing go slightly wrong in a human way

**CHARACTER AGENCY:**
- Give ALL characters active choices, not just passive observation
- Show characters noticing things others don't, asking perceptive questions, taking initiative
- Avoid having characters just react to others - let them drive scenes
- Even minor characters should have small moments of agency

**AVOID THESE AI TELLS:**
- Cutesy nicknames or overly whimsical community terms (e.g., "dancing trail" for a gait pattern, "God's night light" for glow)
- Supporting characters who are caricatures (dial back excessive enthusiasm, make them 20% more subtle)
- Telling readers a character "knows more than they should" - show it through knowing looks, slight smiles, careful word choices
- Describing characters as "glowing" or "special" without showing what others actually see
- Generic locations - add one specific unique detail (unusual rock formation, specific flower, architectural quirk)
- Perfect resolutions where everyone agrees by scene end
- Repetitive physical descriptions using same sentence structure (vary HOW you remind readers about physical traits)
- Every important moment being perfect - let characters stumble, make mistakes, have awkward timing
- Overusing the same metaphor type - if you've described something with light/cosmic imagery, use domestic/agricultural/musical metaphors next
- **Opening with weather/light descriptions** - vary how chapters start (dialogue, action, internal thought, mid-scene)
- **Poetic scene descriptions at chapter openings** - be direct and simple in first paragraph, save lyricism for later

**CRITICAL SELF-CHECKS (Post-Generation Protocol):**

**RULE 11 - ELLIPSES DISCIPLINE:**
- **ABSOLUTE MAXIMUM: 3 ellipses per chapter** (count manually before finalizing)
- Ellipses signal hesitation/trailing off - overuse makes ALL characters sound perpetually unsure
- Replace most ellipses with confident periods: "He turned away." NOT "He turned away..."
- **APPLIES TO ALL DIALOGUE** - AI characters, robots, narrators follow same rules as humans
- Reserve ellipses ONLY for:
  1. Character physically interrupted mid-sentence by another speaker (once per chapter max)
  2. Character loses consciousness/faints mid-thought (twice per chapter max)
  3. NOT for: uncertainty, searching for words, hesitation, thinking pauses
- ❌ BAD: "I just... I don't know what to think..." (weak, trailing)
- ❌ BAD: "The quantum harmonics are singing like—" (use period: "singing like thunder.")
- ✅ GOOD: He paused. "I don't know what to think." (show hesitation through action)
- ✅ GOOD: "The harmonics are—" Thunder drowned her words. (actual interruption)
- **Self-check**: Count ellipses before finalizing. If >3, convert to periods + action beats.

**RULE 13 - "COMPLETELY" SURGICAL REMOVAL:**
- **TARGET: 4-5 uses per ENTIRE MANUSCRIPT (≤1 per chapter)**
- **ZERO uses for emotional/mental states** - NEVER "completely overwhelmed/certain/lost/devastated/exhausted/understood"
- "Completely" weakens prose by overstating - trust your verbs without intensifiers
- Only allow for literal physical completion:
  ✅ "The structure completely collapsed" (object finished collapsing)
  ✅ "The room fell completely silent" (sound reached total absence)
  ❌ "She was completely exhausted" → "She was exhausted" (emotional state doesn't need "completely")
  ❌ "He completely understood" → "He understood" (mental state is binary, no degrees)
  ❌ "completely unperturbed" → "unperturbed" (adjective already complete)
- **Self-check**: Search for "completely" before finalizing. Delete all emotional/mental uses. Keep ≤1 physical use per chapter only if it adds meaning.

**RULE 3 - PHYSICAL CUE BLACKLIST:**
- **BANNED PHRASES (0 tolerance across ALL genres):**
  - "heat crept/crawled up [neck/cheeks/face/spine]"
  - "butterflies in [stomach/chest/gut]"
  - "breath caught/hitched in throat"
  - "stomach dropped/fell/clenched/twisted/tightened/sank"
  - "something warm/cold unfurled/bloomed/stirred in chest"
  - "heart did something [peculiar/strange/funny]"
  - "chest tightened/constricted/squeezed"
  - "[hands/fingers] trembled/shook" (unless from cold/medical condition)
  - "heat/warmth flooded/spread through [body part]"
- **ALLOWED ONCE PER CHAPTER (if essential):**
  - "heart hammered/pounded/raced" (physical exertion only - running, fighting)
  - "breath quickened/shortened" (exertion only - not emotion)
- **UNIVERSAL REPLACEMENT STRATEGY**: Show external behavior instead of internal sensation
  - ❌ "Her stomach dropped" → ✅ "She gripped the chair" / "She stepped back"
  - ❌ "Heat crept up his neck" → ✅ "He looked away" / "He adjusted his collar"
  - ❌ "Butterflies in her chest" → ✅ "She couldn't keep still" / "She twisted her ring"
  - ❌ "His hands trembled" → ✅ "He shoved his hands in his pockets" / "He gripped the railing"
- **Self-check**: Search for all banned phrases before finalizing. Replace every instance with character action.

**RULE 12 - INTENSIFIER ECONOMY:**
- **Minimize across ALL genres**: absolutely, utterly, truly, perfectly, entirely, deeply, profoundly, totally
- Trust your verbs and nouns - they don't need artificial boosting
- ❌ "absolutely certain" → ✅ "certain" (already means 100%)
- ❌ "utterly exhausted" → ✅ "exhausted" (already means depleted)
- ❌ "deeply troubled" → ✅ "troubled" (adjective carries weight alone)
- ❌ "perfectly timed" → ✅ "well-timed" (nothing is perfect)
- **Target**: <5 intensifiers per chapter (ideally 2-3)
- **Self-check**: Scan for intensifiers. Delete 80% of them. Read without them - prose will be stronger.

**RULE 6 - CHAPTER ENDING VARIETY:**
- **BANNED as final line:**
  - Philosophical observation by narrator or character
  - Nature/weather as metaphorical punctuation ("the stars sang," "rain whispered")
  - One-sentence reflection on meaning of chapter events
  - Cosmic observations about universe/love/consciousness
  - Character thinking about what just happened
- **REQUIRED rotation** (track across chapters):
  - 25% end mid-dialogue: "'But what if—'" (no follow-up, next chapter starts)
  - 25% end on physical action: "The door slammed open." / "Glass shattered."
  - 25% end on decision shown: "She picked up the phone." (no internal commentary)
  - 25% end on image/scene: "Three empty chairs at the table." (describe, stop)
- **Test**: Delete your last sentence. Is ending stronger? If yes, keep it deleted.
- **Self-check**: What type was previous chapter's ending? Choose different type for this chapter.

**Format:**
Return ONLY the chapter prose as plain text. No JSON, no metadata, no chapter title - just the narrative text from first word to last.

Target the specified word count, but prioritize natural storytelling over exact length. Write like a human would: messy, imperfect, alive.
"""


def format_story_bible_for_chapter(story_bible: StoryBible) -> str:
    """Format Story Bible data for chapter generation context."""
    context_parts = []
    
    # Characters
    if story_bible.characters:
        context_parts.append("=== CHARACTERS ===")
        for char in story_bible.characters:
            char_text = f"\n**{char.name}**"
            if char.aliases:
                char_text += f" (aka {', '.join(char.aliases)})"
            char_text += f"\n- Role: {char.role}"
            if char.age:
                char_text += f"\n- Age: {char.age}"
            if char.physical_description:
                char_text += f"\n- Physical: {char.physical_description}"
            if char.personality:
                char_text += f"\n- Personality: {char.personality}"
            if char.backstory:
                char_text += f"\n- Background: {char.backstory}"
            if char.relationships:
                rel_text = ", ".join([f"{k}: {v}" for k, v in char.relationships.items()])
                char_text += f"\n- Relationships: {rel_text}"
            if char.character_arc:
                char_text += f"\n- Character Arc: {char.character_arc}"
            if char.quirks:
                char_text += f"\n- Quirks: {char.quirks}"
            context_parts.append(char_text)
    
    # Settings
    if story_bible.settings:
        context_parts.append("\n\n=== SETTINGS ===")
        for setting in story_bible.settings:
            setting_text = f"\n**{setting.name}**"
            if setting.description:
                setting_text += f"\n- Description: {setting.description}"
            if setting.atmosphere:
                setting_text += f"\n- Atmosphere: {setting.atmosphere}"
            if setting.significance:
                setting_text += f"\n- Significance: {setting.significance}"
            if setting.special_features:
                setting_text += f"\n- Special Features: {setting.special_features}"
            context_parts.append(setting_text)
    
    # Themes & Tone
    if story_bible.themes or story_bible.tone_notes:
        context_parts.append("\n\n=== THEMES & TONE ===")
        if story_bible.themes:
            context_parts.append(f"Themes: {', '.join(story_bible.themes)}")
        if story_bible.tone_notes:
            context_parts.append(f"Tone: {story_bible.tone_notes}")
    
    return "\n".join(context_parts)


def format_chapter_outline_for_generation(chapter: ChapterOutline) -> str:
    """Format the structured chapter outline into generation instructions."""
    instructions = []
    
    instructions.append(f"=== CHAPTER {chapter.chapter_index}: {chapter.title} ===")
    instructions.append(f"Target Word Count: {chapter.target_word_count} words")
    instructions.append(f"Tone: {', '.join(chapter.tone_notes)}")
    
    instructions.append("\n**OPENING SCENE:**")
    instructions.append(chapter.opening_scene)
    
    if chapter.characters_present:
        instructions.append(f"\n**CHARACTERS IN THIS CHAPTER:**")
        instructions.append(", ".join(chapter.characters_present))
        instructions.append("(Refer to their Story Bible profiles for accurate characterization)")
    
    if chapter.locations:
        instructions.append(f"\n**LOCATIONS:**")
        instructions.append(", ".join(chapter.locations))
        instructions.append("(Use vivid sensory details from Story Bible descriptions)")
    
    instructions.append("\n**PLOT EVENTS (in order):**")
    for i, event in enumerate(chapter.plot_events, 1):
        instructions.append(f"{i}. {event}")
    
    if chapter.character_development:
        instructions.append(f"\n**CHARACTER DEVELOPMENT TO SHOW:**")
        instructions.append(chapter.character_development)
    
    if chapter.subplots_advanced:
        instructions.append(f"\n**SUBPLOTS TO ADVANCE:**")
        instructions.append(chapter.subplots_advanced)
    
    instructions.append("\n**CLOSING SCENE:**")
    instructions.append(chapter.closing_scene)
    
    if chapter.summary_prose:
        instructions.append("\n**NARRATIVE OVERVIEW:**")
        instructions.append(chapter.summary_prose)
        instructions.append("\n(Use this as a guide, but expand into full prose with dialogue, action, and sensory details)")
    
    return "\n".join(instructions)


async def generate_chapter_from_outline(
    chapter_outline: ChapterOutline,
    premise: Premise,
    story_bible: Optional[StoryBible],
    ai_config: AIConfig,
    project_id: str,
    previous_chapters: Optional[List[Chapter]] = None,
    previous_summaries: Optional[List[ChapterSummary]] = None,
) -> Chapter:
    """
    Generate a complete chapter from structured outline and Story Bible with context.
    
    Args:
        chapter_outline: Structured chapter outline with all fields
        premise: Project premise for overall context
        story_bible: Character/setting profiles and themes
        ai_config: AI configuration
        project_id: Project UUID
        previous_chapters: Previously generated chapters (for context)
        previous_summaries: Summaries of older chapters (for context)
        
    Returns:
        Chapter: Generated chapter with prose content
    """
    logger.info(
        "chapter_generation_started",
        project_id=project_id,
        chapter_index=chapter_outline.chapter_index,
        target_words=chapter_outline.target_word_count,
        context_chapters=len(previous_chapters) if previous_chapters else 0,
        context_summaries=len(previous_summaries) if previous_summaries else 0,
    )
    
    # Build context using context builder if we have previous content
    if previous_chapters or previous_summaries:
        context = await build_chapter_context(
            project_id=project_id,
            chapter_index=chapter_outline.chapter_index,
            premise=premise,
            story_bible=story_bible,
            current_outline=chapter_outline,
            all_chapters=previous_chapters or [],
            all_summaries=previous_summaries or [],
        )
        prompt = context.format_for_prompt()
        logger.info(
            "using_context_builder",
            project_id=project_id,
            chapter_index=chapter_outline.chapter_index,
            estimated_tokens=context.estimated_tokens,
        )
    else:
        # Fallback to simple context (Chapter 1, or no previous content)
        prompt_parts = []
        
        # Add Story Bible context
        if story_bible:
            prompt_parts.append("=== STORY BIBLE ===")
            prompt_parts.append(format_story_bible_for_chapter(story_bible))
            prompt_parts.append("\n" + "=" * 50 + "\n")
        else:
            logger.warning("Generating chapter without Story Bible - may lack consistency")
        
        # Add premise context with comprehensive genre guidance
        prompt_parts.append("=== STORY PREMISE ===")
        
        genre_guidance = f"Genre: {premise.genre}"
        if premise.subgenre:
            genre_guidance += f" / {premise.subgenre}"
        
        if premise.subgenres:
            genre_guidance += f"\nSubgenres to Blend: {', '.join(premise.subgenres)}"
            genre_guidance += "\n  → Incorporate authentic elements from ALL these subgenres"
        
        if premise.comedy_elements:
            genre_guidance += f"\nComedy Elements: {', '.join(premise.comedy_elements)}"
            genre_guidance += "\n  → CRITICAL: Showcase these comedy styles where appropriate in this chapter"
        
        if premise.tone_adjectives:
            genre_guidance += f"\nTone: {', '.join(premise.tone_adjectives)}"
        
        if premise.darkness_level is not None:
            darkness_guidance = _get_darkness_guidance(premise.darkness_level)
            genre_guidance += f"\nDarkness Level: {premise.darkness_level}/10 - {darkness_guidance}"
        
        if premise.humor_level is not None:
            humor_guidance = _get_humor_guidance(premise.humor_level)
            genre_guidance += f"\nHumor Level: {premise.humor_level}/10 - {humor_guidance}"
        
        if premise.themes:
            genre_guidance += f"\nThemes to Explore: {', '.join(premise.themes)}"
        
        prompt_parts.append(genre_guidance)
        prompt_parts.append(f"\n{premise.content}")
        prompt_parts.append("\n" + "=" * 50 + "\n")
        
        # Add chapter instructions
        prompt_parts.append(format_chapter_outline_for_generation(chapter_outline))
        
        prompt = "\n".join(prompt_parts)
    
    logger.debug(f"Chapter generation prompt: {len(prompt)} chars")
    
    # Set max tokens for chapter generation (use full 64K output for long chapters)
    # Rough estimate: 1 word = 1.3 tokens, add buffer for quality
    estimated_tokens = int(chapter_outline.target_word_count * 1.5)
    ai_config.max_tokens = min(64000, max(estimated_tokens, 8000))
    
    logger.info(
        f"Using {ai_config.max_tokens} max_tokens for {chapter_outline.target_word_count} word target"
    )
    
    # Generate the chapter
    ai_service = get_ai_service()
    
    try:
        response_data = await ai_service.generate_text(
            prompt=prompt,
            config=ai_config,
            system_prompt=CHAPTER_SYSTEM_PROMPT,
        )
        
        chapter_text = response_data["content"].strip()
        word_count = len(chapter_text.split())
        
        logger.info(
            "chapter_generated",
            project_id=project_id,
            chapter_index=chapter_outline.chapter_index,
            actual_words=word_count,
            target_words=chapter_outline.target_word_count,
        )
        
        # Create Chapter object
        chapter = Chapter(
            project_id=project_id,
            chapter_index=chapter_outline.chapter_index,
            title=chapter_outline.title,
            content=chapter_text,
            word_count=word_count,
            target_word_count=chapter_outline.target_word_count,
            outline_reference_id=chapter_outline.chapter_index,  # Link back to outline
            status="completed",
        )
        
        return chapter
        
    except Exception as e:
        logger.error(
            "chapter_generation_failed",
            project_id=project_id,
            chapter_index=chapter_outline.chapter_index,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise


def format_chapter_generation_prompt(
    chapter_outline: ChapterOutline,
    premise: Premise,
    story_bible: Optional[StoryBible],
    previous_chapters: Optional[List[Chapter]] = None,
    previous_summaries: Optional[List[ChapterSummary]] = None,
) -> Tuple[str, AIConfig]:
    """
    Format the prompt for chapter generation (used by both streaming and non-streaming).
    
    Returns:
        Tuple of (prompt, ai_config_with_tokens)
    """
    # Use context builder for rich context
    if previous_chapters or previous_summaries:
        from services.context_builder import ChapterContext
        
        context = ChapterContext(
            story_bible=story_bible,
            premise=premise,
            current_chapter_outline=chapter_outline,
            previous_chapters_full=previous_chapters[-2:] if previous_chapters else [],  # Last 2
            previous_chapters_summaries=previous_summaries or [],
            estimated_tokens=0,  # Will be calculated
        )
        prompt = context.format_for_prompt()
    else:
        # Simple context for Chapter 1
        prompt_parts = []
        
        # Add Story Bible context
        if story_bible:
            prompt_parts.append("=== STORY BIBLE ===")
            prompt_parts.append(format_story_bible_for_chapter(story_bible))
            prompt_parts.append("\n" + "=" * 50 + "\n")
        
        # Add premise context with comprehensive genre guidance
        prompt_parts.append("=== STORY PREMISE ===")
        
        genre_guidance = f"Genre: {premise.genre}"
        if premise.subgenre:
            genre_guidance += f" / {premise.subgenre}"
        
        if premise.subgenres:
            genre_guidance += f"\nSubgenres to Blend: {', '.join(premise.subgenres)}"
            genre_guidance += "\n  → Incorporate authentic elements from ALL these subgenres"
        
        if premise.comedy_elements:
            genre_guidance += f"\nComedy Elements: {', '.join(premise.comedy_elements)}"
            genre_guidance += "\n  → CRITICAL: Showcase these comedy styles where appropriate in this chapter"
        
        if premise.tone_adjectives:
            genre_guidance += f"\nTone: {', '.join(premise.tone_adjectives)}"
        
        if premise.darkness_level is not None:
            darkness_guidance = _get_darkness_guidance(premise.darkness_level)
            genre_guidance += f"\nDarkness Level: {premise.darkness_level}/10 - {darkness_guidance}"
        
        if premise.humor_level is not None:
            humor_guidance = _get_humor_guidance(premise.humor_level)
            genre_guidance += f"\nHumor Level: {premise.humor_level}/10 - {humor_guidance}"
        
        if premise.themes:
            genre_guidance += f"\nThemes: {', '.join(premise.themes)}"
        
        prompt_parts.append(genre_guidance)
        prompt_parts.append(f"\n{premise.content}")
        prompt_parts.append("\n" + "=" * 50 + "\n")
        
        # Add chapter instructions
        prompt_parts.append(format_chapter_outline_for_generation(chapter_outline))
        prompt = "\n".join(prompt_parts)
    
    prompt = "\n".join(prompt_parts)
    
    # Calculate token needs
    from models.schemas import AIProvider
    estimated_tokens = int(chapter_outline.target_word_count * 1.5)
    max_tokens = min(64000, max(estimated_tokens, 8000))
    
    ai_config = AIConfig(
        provider=AIProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
        temperature=0.9,  # Higher for more human-like creative variation
        max_tokens=max_tokens,
        top_p=0.95,  # Add nucleus sampling for prose diversity
    )
    
    return prompt, ai_config
