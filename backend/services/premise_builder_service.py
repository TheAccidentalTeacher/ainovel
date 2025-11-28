"""
Premise Builder Service.

Business logic for guided premise creation wizard with AI assistance.
"""

import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from models.premise_builder import (
    BuilderSessionStatus,
    PremiseBuilderSession,
    ProjectStub,
    GenreProfile,
    ToneThemeProfile,
    CharacterSeeds,
    CharacterSeed,
    PlotIntent,
    StructureTargets,
    ConstraintsProfile,
    PremiseArtifact,
    PremiseRefinement,
    AIAssistResponse,
)
from models.schemas import (
    Premise,
    Project,
    ProjectStatus,
    AIConfig,
    AIProvider,
)
from services.ai_service import AIService


logger = logging.getLogger(__name__)


class PremiseBuilderService:
    """
    Service for managing premise builder sessions and AI-assisted premise generation.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.sessions_collection = db["premise_builder_sessions"]
        self.projects_collection = db["projects"]
        self.premises_collection = db["premises"]
        self.ai_service = AIService()
    
    async def create_session(
        self,
        project_id: Optional[str] = None,
        initial_title: Optional[str] = None
    ) -> PremiseBuilderSession:
        """Create new premise builder session."""
        session = PremiseBuilderSession(
            project_id=project_id,
            status=BuilderSessionStatus.IN_PROGRESS,
            current_step=0
        )
        
        # Initialize with project stub if title provided
        if initial_title:
            session.project_stub = ProjectStub(title=initial_title)
            session.current_step = 1
        
        # Persist to database
        session_dict = session.model_dump(mode="json")
        await self.sessions_collection.insert_one(session_dict)
        
        logger.info(f"Created premise builder session {session.id}")
        return session
    
    async def get_session(self, session_id: str) -> Optional[PremiseBuilderSession]:
        """Retrieve session by ID."""
        doc = await self.sessions_collection.find_one({"id": session_id})
        if not doc:
            return None
        
        # Remove MongoDB _id field
        doc.pop("_id", None)
        return PremiseBuilderSession(**doc)
    
    async def update_step(
        self,
        session_id: str,
        step: int,
        data: Dict[str, Any]
    ) -> PremiseBuilderSession:
        """
        Update specific step data in session.
        
        Validates and parses data based on step number.
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Parse and validate step data
        try:
            if step == 0:
                session.project_stub = ProjectStub(**data)
            elif step == 1:
                session.genre_profile = GenreProfile(**data)
            elif step == 2:
                session.tone_theme_profile = ToneThemeProfile(**data)
            elif step == 3:
                session.character_seeds = CharacterSeeds(**data)
            elif step == 4:
                session.plot_intent = PlotIntent(**data)
            elif step == 5:
                session.structure_targets = StructureTargets(**data)
                # Auto-calculate average chapter length
                if session.structure_targets.target_word_count and session.structure_targets.target_chapter_count:
                    session.structure_targets.average_chapter_length = (
                        session.structure_targets.target_word_count // session.structure_targets.target_chapter_count
                    )
            elif step == 6:
                session.constraints_profile = ConstraintsProfile(**data)
            else:
                raise ValueError(f"Invalid step number: {step}")
        
        except Exception as e:
            raise ValueError(f"Invalid data for step {step}: {str(e)}")
        
        # Update metadata
        session.current_step = max(session.current_step, step)
        session.updated_at = datetime.utcnow()
        session.version += 1
        
        # Persist
        session_dict = session.model_dump(mode="json")
        await self.sessions_collection.replace_one(
            {"id": session_id},
            session_dict
        )
        
        logger.info(f"Updated session {session_id} step {step}")
        return session
    
    async def invoke_ai_assistant(
        self,
        session: PremiseBuilderSession,
        action: str,
        context: Dict[str, Any],
        user_input: Optional[str] = None
    ) -> AIAssistResponse:
        """
        Invoke lightweight AI assistant for step-specific help.
        
        Uses GPT-4o or Claude Haiku for fast, cheap responses.
        """
        # Build context-aware prompt based on action
        prompt = self._build_assistant_prompt(session, action, context, user_input)
        
        # Use appropriate token limits for comprehensive responses
        # Plot generation needs lots of tokens for detailed, rich output
        if action == "generate_full_plot":
            max_tokens = 16000  # Go big for comprehensive plot generation
        elif action in ("expand_plot_element", "suggest_plot_beats", "suggest_twists", "suggest_subplots"):
            max_tokens = 4000  # Generous for detailed expansions
        elif action in ("brainstorm_concept", "mashup_subgenres"):
            max_tokens = 2000  # More room for creative concepts
        else:
            max_tokens = 1000  # Default is generous
            
        config = AIConfig(
            provider=AIProvider.OPENAI,
            model_name="gpt-4o",
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        start = time.time()
        
        try:
            response = await self.ai_service.generate_text(
                prompt=prompt,
                config=config
            )
            
            tokens_used = response.get("usage", {}).get("total_tokens", 0)
            content = response.get("content", "").strip()
            
            # For actions that return numbered lists, split into alternatives
            if action in ("brainstorm_concept", "mashup_subgenres", "suggest_themes", 
                         "suggest_emotional_tone", "suggest_atmosphere", "suggest_central_question"):
                # Split on numbered lines (1. 2. 3. etc)
                import re
                items = re.split(r'\n\s*\d+\.\s+', content)
                # Remove empty first element if content starts with "1."
                items = [item.strip() for item in items if item.strip()]
                
                if len(items) > 1:
                    # First item is the main suggestion, rest are alternatives
                    suggestion = items[0]
                    alternatives = items[1:]
                else:
                    # Fallback if parsing fails
                    suggestion = content
                    alternatives = []
            else:
                suggestion = content
                alternatives = []
            
            logger.info(f"AI assistant action '{action}' completed in {time.time() - start:.2f}s")
            
            return AIAssistResponse(
                suggestion=suggestion,
                alternatives=alternatives,
                tokens_used=tokens_used
            )
        
        except Exception as e:
            logger.error(f"AI assistant failed for action '{action}': {e}", exc_info=True)
            raise
    
    def _build_assistant_prompt(
        self,
        session: PremiseBuilderSession,
        action: str,
        context: Dict[str, Any],
        user_input: Optional[str]
    ) -> str:
        """Build context-aware prompt for AI assistant actions."""
        
        # Base system context
        system = "You are a helpful writing assistant helping authors develop novel premises. "
        system += "Provide concise, creative suggestions while respecting the author's vision."
        
        # Theological framework for Christian fiction
        primary_genre = context.get("primary_genre", "")
        if "Christian" in primary_genre or (session.genre_profile and "Christian" in session.genre_profile.primary_genre):
            system += "\n\nTheological Context: For Christian fiction, assume a conservative evangelical/Reformed Baptist theological framework. "
            system += "Characters should reflect biblical worldviews emphasizing: grace through faith alone (sola fide), Scripture as ultimate authority (sola scriptura), "
            system += "personal conversion and relationship with Christ, believer's baptism, and congregational church governance. "
            system += "Avoid Catholic sacramental theology, papal authority, or works-based salvation unless in historical settings where Catholicism is accurate to the period. "
            system += "These theological underpinnings should inform character motivations and moral reasoning naturally, not preachy or overt."
        
        # Action-specific prompts
        if action == "expand_character":
            genre = context.get("genre", "fiction")
            logline = context.get("logline", "")
            themes = context.get("themes", [])
            themes_text = ", ".join(themes) if themes else ""
            
            prompt = f"{system}\n\nFor a {genre} novel"
            if themes_text:
                prompt += f" exploring themes of {themes_text}"
            if logline:
                prompt += f", with this story concept: {logline[:200]}..."
            prompt += f"\n\nExpand this character: {user_input}\n\n"
            prompt += "Provide a detailed character description (3-5 sentences) including:\n"
            prompt += "- Physical appearance and distinctive features\n"
            prompt += "- Personality traits and quirks\n"
            prompt += "- Core motivation and goals\n"
            prompt += "- Key flaw or internal conflict\n"
            prompt += "- Brief backstory hook\n\n"
            prompt += "Write in an engaging, narrative style."
        
        elif action == "suggest_themes":
            genre = context.get("primary_genre", "general fiction")
            darkness = context.get("darkness_level", 5)
            humor = context.get("humor_level", 5)
            logline = context.get("logline", "")
            
            # Get tone-appropriate guidance
            darkness_guidance = {
                1: "Pure lighthearted - themes should be uplifting, optimistic, and encouraging",
                2: "Mostly cheerful - themes about overcoming small obstacles, finding joy, community",
                3: "Lightly serious - themes of personal growth, relationships, gentle challenges",
                4: "Gentle drama - themes of emotional struggle, family bonds, healing",
                5: "Balanced - universal themes that mix light and shadow authentically",
                6: "Moderately dark - themes of loss, difficult choices, moral complexity",
                7: "Notably dark - themes of trauma, sacrifice, the cost of survival",
                8: "Very dark - themes of corruption, broken systems, difficult truths",
                9: "Grimdark - themes of nihilism, futility, survival at any cost",
                10: "Maximum darkness - themes of systemic evil, absence of hope, brutal realism"
            }.get(darkness, "")
            
            humor_guidance = {
                1: "Deadly serious - no comedic themes, focus on weight and gravity",
                2: "Mostly serious - themes should be earnest with occasional lightness",
                3: "Lightly earnest - sincere themes with subtle wit",
                4: "Gentle humor - themes can include warmth, misunderstandings, gentle satire",
                5: "Balanced - themes that naturally allow both serious and funny moments",
                6: "Moderately funny - themes about absurdity, social comedy, character quirks",
                7: "Very humorous - themes of chaos, mistaken identity, farcical situations",
                8: "Predominantly comedy - themes should support constant humor and levity",
                9: "Farcical - themes of ridiculous circumstances, over-the-top scenarios",
                10: "Pure comedy - themes exist only to set up jokes and punchlines"
            }.get(humor, "")
            
            prompt = f"{system}\n\n"
            prompt += f"For a {genre} novel with:\n"
            prompt += f"- Darkness Level {darkness}/10: {darkness_guidance}\n"
            prompt += f"- Humor Level {humor}/10: {humor_guidance}\n"
            if logline:
                prompt += f"- Story concept: {logline[:200]}...\n"
            prompt += f"\nSuggest 5 thematic elements that FIT THIS SPECIFIC TONE. "
            prompt += f"The themes must feel appropriate for darkness level {darkness} and humor level {humor}. "
            prompt += f"Don't suggest heavy dramatic themes if the tone is lighthearted and comedic. "
            prompt += f"Don't suggest frivolous themes if the tone is dark and serious. "
            prompt += f"Format as a numbered list with brief explanations."
        
        elif action == "suggest_emotional_tone":
            genre = context.get("primary_genre", "general fiction")
            themes = context.get("themes", [])
            darkness = context.get("darkness_level", 5)
            humor = context.get("humor_level", 5)
            themes_text = ", ".join(themes) if themes else "not specified"
            
            # Provide examples that match the tone
            journey_examples = ""
            if darkness <= 3 and humor >= 6:
                journey_examples = " (e.g., 'confusion to clarity', 'lonely to beloved', 'chaos to harmony')"
            elif darkness <= 3:
                journey_examples = " (e.g., 'doubt to confidence', 'lost to found', 'stranger to friend')"
            elif darkness >= 7 and humor <= 4:
                journey_examples = " (e.g., 'innocence to disillusionment', 'hope to survival', 'naivety to harsh wisdom')"
            elif darkness >= 7:
                journey_examples = " (e.g., 'idealism to pragmatism', 'trust to wariness', 'faith to skepticism')"
            else:
                journey_examples = " (e.g., 'fear to courage', 'divided to united', 'ignorance to understanding')"
            
            prompt = f"{system}\n\n"
            prompt += f"For a {genre} novel with:\n"
            prompt += f"- Themes: {themes_text}\n"
            prompt += f"- Darkness Level: {darkness}/10\n"
            prompt += f"- Humor Level: {humor}/10\n\n"
            prompt += f"Suggest 3 emotional journey arcs that match this specific tone{journey_examples}. "
            prompt += f"The journeys should feel appropriate for the darkness and humor levels. "
            prompt += f"Lighter stories need lighter journeys; darker stories need more complex, potentially tragic arcs. "
            prompt += f"Format as a numbered list."
        
        elif action == "suggest_core_values":
            genre = context.get("primary_genre", "general fiction")
            themes = context.get("themes", [])
            themes_text = ", ".join(themes) if themes else "not specified"
            prompt = f"{system}\n\nFor a {genre} novel with themes of {themes_text}, "
            prompt += "suggest 5 core values that could be explored (e.g., justice, family, freedom, loyalty). "
            prompt += "Format as a numbered list with brief context."
        
        elif action == "suggest_central_question":
            genre = context.get("primary_genre", "general fiction")
            themes = context.get("themes", [])
            logline = context.get("logline", "")
            darkness = context.get("darkness_level", 5)
            humor = context.get("humor_level", 5)
            themes_text = ", ".join(themes) if themes else "not specified"
            
            # Tone-appropriate question examples
            question_examples = ""
            if darkness <= 3 and humor >= 6:
                question_examples = " (e.g., 'Can laughter heal all wounds?', 'What makes life worth celebrating?', 'How do we find joy in chaos?')"
            elif darkness <= 3:
                question_examples = " (e.g., 'What does it mean to belong?', 'Can hope overcome adversity?', 'How do we define family?')"
            elif darkness >= 7 and humor <= 4:
                question_examples = " (e.g., 'What price is survival worth?', 'Can good exist without hope?', 'How far will desperation drive us?')"
            elif darkness >= 7:
                question_examples = " (e.g., 'Can we laugh at the abyss?', 'Is cynicism a form of wisdom?', 'What remains when everything falls apart?')"
            else:
                question_examples = " (e.g., 'What makes us human?', 'Can love conquer hate?', 'How do we choose between heart and duty?')"
            
            prompt = f"{system}\n\n"
            prompt += f"For a {genre} novel with:\n"
            prompt += f"- Themes: {themes_text}\n"
            prompt += f"- Darkness Level: {darkness}/10\n"
            prompt += f"- Humor Level: {humor}/10\n"
            if logline:
                prompt += f"- Concept: {logline[:200]}...\n"
            prompt += f"\nSuggest 3 central questions that match this specific tone{question_examples}. "
            prompt += f"The questions should feel appropriate for the darkness and humor levels. "
            prompt += f"Format as a numbered list."
        
        elif action == "suggest_atmosphere":
            genre = context.get("primary_genre", "general fiction")
            darkness = context.get("darkness_level", 5)
            humor = context.get("humor_level", 5)
            themes = context.get("themes", [])
            themes_text = ", ".join(themes) if themes else "not specified"
            
            # Tone-appropriate examples
            atmos_examples = ""
            if darkness <= 3 and humor >= 6:
                atmos_examples = " (e.g., playful, bubbly, madcap, zany, lighthearted)"
            elif darkness <= 3:
                atmos_examples = " (e.g., warm, cozy, hopeful, uplifting, gentle)"
            elif darkness >= 7 and humor <= 4:
                atmos_examples = " (e.g., oppressive, bleak, suffocating, unforgiving, brutal)"
            elif darkness >= 7:
                atmos_examples = " (e.g., cynical, bitter, dark-humored, gallows, sardonic)"
            else:
                atmos_examples = " (e.g., tense, bittersweet, contemplative, atmospheric, nuanced)"
            
            prompt = f"{system}\n\n"
            prompt += f"For a {genre} novel with:\n"
            prompt += f"- Darkness Level: {darkness}/10\n"
            prompt += f"- Humor Level: {humor}/10\n"
            prompt += f"- Themes: {themes_text}\n\n"
            prompt += f"Suggest 5 atmospheric/mood descriptors that match this specific tone{atmos_examples}. "
            prompt += f"The atmosphere must feel appropriate for both the darkness and humor levels. "
            prompt += f"Format as a numbered list with brief descriptions."
        
        elif action == "suggest_characters":
            genre = context.get("primary_genre", "general fiction")
            logline = context.get("logline", "")
            themes = context.get("themes", [])
            tone_adj = context.get("tone_adjectives", [])
            themes_text = ", ".join(themes) if themes else "general themes"
            tone_text = ", ".join(tone_adj) if tone_adj else "balanced"
            
            prompt = f"{system}\n\nFor a {genre} novel with a {tone_text} tone exploring {themes_text}, "
            if logline:
                prompt += f"and this concept: {logline[:300]}..., "
            prompt += "generate 4-5 compelling character concepts. Include:\n"
            prompt += "1. A protagonist (with internal conflict)\n"
            prompt += "2. An antagonist or opposing force\n"
            prompt += "3. 2-3 supporting characters\n\n"
            prompt += "For each character, provide:\n"
            prompt += "- Name and role (Protagonist/Antagonist/Supporting)\n"
            prompt += "- 1-2 sentence description (personality, goal, key trait)\n\n"
            prompt += "Keep descriptions under 100 words each.\n\n"
            prompt += "Format as a numbered list like:\n"
            prompt += "1. [Name] (Protagonist): [1-2 sentence description]\n"
            prompt += "2. [Name] (Antagonist): [1-2 sentence description]\n"
            prompt += "etc."
        
        elif action == "suggest_tropes":
            genre = session.genre_profile.primary_genre if session.genre_profile else "general fiction"
            prompt = f"{system}\n\nFor a {genre} novel, list 5-7 common tropes or story patterns that readers enjoy in this genre."
        
        elif action == "check_conflicts":
            prompt = f"{system}\n\nReview these story elements and identify any potential contradictions or concerns:\n\n"
            prompt += f"Constraints: {context.get('constraints', '')}\n"
            prompt += f"Themes: {context.get('themes', '')}\n"
            prompt += f"Tone: {context.get('tone', '')}\n\n"
            prompt += "Are there any conflicts (e.g., 'no violence' but 'revenge thriller')?"
        
        elif action == "generate_full_plot":
            # Comprehensive plot generation from all previous context
            genre = session.genre_profile.primary_genre if session.genre_profile else "general fiction"
            logline = session.project_stub.logline if session.project_stub and session.project_stub.logline else ""
            themes = session.tone_theme_profile.themes if session.tone_theme_profile else []
            themes_text = ", ".join(themes) if themes else "universal themes"
            
            protagonist = ""
            antagonist = ""
            if session.character_seeds:
                if session.character_seeds.protagonist:
                    p = session.character_seeds.protagonist
                    protagonist = f"{p.name} - {p.role}: {p.brief_description[:200]}"
                if session.character_seeds.antagonist:
                    a = session.character_seeds.antagonist
                    antagonist = f"{a.name} - {a.role}: {a.brief_description[:200]}"
            
            prompt = f"{system}\n\nGenerate a comprehensive plot structure for a {genre} novel"
            if logline:
                prompt += f" with this concept: {logline[:300]}..."
            prompt += f"\n\nThemes: {themes_text}\n"
            if protagonist:
                prompt += f"Protagonist: {protagonist}\n"
            if antagonist:
                prompt += f"Antagonist: {antagonist}\n"
            
            prompt += "\n\nProvide the following plot elements in a structured format:\n\n"
            prompt += "**PRIMARY CONFLICT:** [2-3 sentences describing the central story problem]\n\n"
            prompt += "**CONFLICT TYPES:** [List applicable types: internal, interpersonal, societal, supernatural, etc.]\n\n"
            prompt += "**STAKES:** [What's at risk - personal, relational, and global levels]\n\n"
            prompt += "**STAKES LAYERS:** [List the different stake levels: Personal, Relational, Professional, Community, Global, Existential]\n\n"
            prompt += "**INCITING INCIDENT:** [What kicks off the story]\n\n"
            prompt += "**FIRST PLOT POINT:** [Point of no return]\n\n"
            prompt += "**MIDPOINT SHIFT:** [Major revelation that changes everything]\n\n"
            prompt += "**SECOND PLOT POINT:** [All is lost moment]\n\n"
            prompt += "**CLIMAX:** [Final confrontation]\n\n"
            prompt += "**RESOLUTION:** [How it all resolves]\n\n"
            prompt += "**KEY STORY BEATS:** [5-7 major plot points as bullet list]\n\n"
            prompt += "**EMOTIONAL BEATS:** [Key emotional moments]\n\n"
            prompt += "**ROMANTIC SUBPLOT:** [If applicable, describe the romantic arc - otherwise write 'N/A']\n\n"
            prompt += "**SECONDARY SUBPLOT:** [B-story or secondary character arc]\n\n"
            prompt += "**THEMATIC SUBPLOT:** [Philosophical or thematic exploration thread]\n\n"
            prompt += "**ADDITIONAL SUBPLOTS:** [Any other subplot threads as bullet list]\n\n"
            prompt += "**MAJOR TWISTS:** [2-3 plot twists]\n\n"
            prompt += "**RED HERRINGS:** [Misdirections or false leads as bullet list]\n\n"
            prompt += "**ENDING VIBE:** [Emotional tone: triumph/bittersweet/tragic/open]\n\n"
            prompt += "**FINAL IMAGE:** [The last scene/moment that closes the story]\n\n"
            prompt += "**TENSION ESCALATION:** [How tension builds throughout]\n\n"
            prompt += "**PACING:** [Pacing strategy and rhythm considerations]\n\n"
            prompt += "Be specific and detailed, using the established characters and themes."
        
        elif action == "expand_plot_element":
            element_name = context.get("element_name", "plot element")
            current_value = user_input or ""
            genre = session.genre_profile.primary_genre if session.genre_profile else "general fiction"
            
            # Get context from session
            protagonist_name = ""
            if session.character_seeds and session.character_seeds.protagonist:
                protagonist_name = session.character_seeds.protagonist.name
            
            prompt = f"{system}\n\nFor a {genre} novel"
            if protagonist_name:
                prompt += f" featuring protagonist {protagonist_name}"
            prompt += f", expand and enrich this {element_name}:\n\n"
            prompt += f"Current: {current_value}\n\n"
            prompt += f"Provide an enhanced, more detailed version (3-5 sentences) that:\n"
            prompt += f"- Adds specific details and vivid imagery\n"
            prompt += f"- Connects to character motivations\n"
            prompt += f"- Raises the stakes or emotional impact\n"
            prompt += f"- Makes the scene/moment more compelling\n\n"
            prompt += f"Write in an engaging narrative style."
        
        elif action == "suggest_plot_beats":
            genre = context.get("primary_genre", "general fiction")
            conflict = context.get("central_conflict", "")
            protagonist = context.get("protagonist", {})
            antagonist = context.get("antagonist", {})
            
            prot_name = protagonist.get("name", "the protagonist") if protagonist else "the protagonist"
            antag_name = antagonist.get("name", "the antagonist") if antagonist else "the antagonist"
            
            prompt = f"{system}\n\nFor a {genre} novel with this central conflict:\n{conflict}\n\n"
            prompt += f"Featuring {prot_name} vs {antag_name}\n\n"
            prompt += "Suggest 7-10 key story beats that would create a compelling narrative arc. "
            prompt += "Include both plot events and emotional moments. Format as a numbered list."
        
        elif action == "suggest_twists":
            genre = context.get("primary_genre", "general fiction")
            conflict = context.get("central_conflict", "")
            characters = context.get("characters", "")
            
            prompt = f"{system}\n\nFor a {genre} novel with this setup:\n"
            prompt += f"Conflict: {conflict}\n"
            prompt += f"Characters: {characters}\n\n"
            prompt += "Suggest 5 potential plot twists or revelations that would surprise readers "
            prompt += "while feeling earned and logical in retrospect. Format as a numbered list with brief explanations."
        
        elif action == "suggest_subplots":
            genre = context.get("primary_genre", "general fiction")
            main_plot = context.get("main_plot", "")
            characters = context.get("characters", [])
            
            prompt = f"{system}\n\nFor a {genre} novel with this main plot:\n{main_plot}\n\n"
            if characters:
                prompt += f"Supporting cast: {', '.join(characters)}\n\n"
            prompt += "Suggest 3-4 compelling subplot ideas (romantic, thematic, secondary character arcs) "
            prompt += "that would complement and enhance the main story. Format as a numbered list."
        
        elif action == "analyze_conflict_layers":
            conflict = user_input or context.get("central_conflict", "")
            
            prompt = f"{system}\n\nAnalyze this central conflict:\n{conflict}\n\n"
            prompt += "Identify and explain the different layers of conflict present:\n"
            prompt += "- Internal (character vs self)\n"
            prompt += "- Interpersonal (character vs character)\n"
            prompt += "- Societal (character vs society/system)\n"
            prompt += "- Environmental (character vs nature/world)\n"
            prompt += "- Supernatural (if applicable)\n\n"
            prompt += "Explain how these layers interact and compound the stakes."
        
        elif action == "suggest_complications":
            prompt = f"{system}\n\nGiven this plot setup: {user_input}\n\n"
            prompt += "Suggest 3 potential complications or twists that could make the story more engaging."
        
        elif action == "calculate_structure":
            words = context.get("target_word_count", 80000)
            chapters = context.get("target_chapter_count", 25)
            avg = words // chapters
            prompt = f"For a {words}-word novel with {chapters} chapters, average chapter length is ~{avg} words. "
            prompt += "Provide brief structural advice (chapter length distribution, pacing considerations)."
        
        elif action == "brainstorm_concept":
            primary = context.get("primary_genre", "")
            secondary = context.get("secondary_genre", "")
            comedy_elements = context.get("comedy_elements", [])
            subgenres = context.get("subgenres", [])
            genres_text = f"{primary} + {secondary}" if secondary else primary
            
            prompt = f"{system}\n\nGenerate 5 creative novel concept ideas for a {genres_text} story"
            
            # Add subgenre context if available
            if subgenres:
                subgenres_text = ", ".join(subgenres)
                prompt += f" incorporating elements from these subgenres: {subgenres_text}"
            
            prompt += ". "
            
            # CRITICAL: Comedy elements instruction MUST be prominent
            if comedy_elements:
                comedy_text = ", ".join(comedy_elements)
                prompt += f"\n\n🎭 **CRITICAL COMEDY REQUIREMENTS:**\n"
                prompt += f"You MUST incorporate these specific comedy styles: **{comedy_text}**\n"
                prompt += f"- Each story concept must EXPLICITLY showcase these comedy elements\n"
                prompt += f"- The comedy should be INTEGRAL to the premise, not just added decoration\n"
                prompt += f"- Readers should immediately recognize the {comedy_text} style(s) in each concept\n"
                prompt += f"- Be specific about HOW the comedy manifests (characters, situations, dialogue style, etc.)\n\n"
            
            prompt += "Each concept should be 2-3 sentences describing a unique premise, setting, or hook that clearly demonstrates the genre and comedy style. "
            prompt += "Make them varied and interesting. Format as a numbered list."
        
        elif action == "mashup_subgenres":
            primary = context.get("primary_genre", "")
            subgenres = context.get("subgenres", [])
            comedy_elements = context.get("comedy_elements", [])
            
            if not subgenres or len(subgenres) < 2:
                prompt = f"{system}\n\nNot enough subgenres selected for mashup."
            else:
                subgenres_text = ", ".join(subgenres)
                prompt = f"{system}\n\nCreate 5 creative novel concepts that mashup these {primary} subgenres: **{subgenres_text}**\n\n"
                prompt += f"📚 **SUBGENRE REQUIREMENTS:**\n"
                prompt += f"Each concept must authentically blend elements from ALL of these specific subgenres: {subgenres_text}\n"
                prompt += f"- Don't just mention them - SHOW how they intersect in the plot\n"
                prompt += f"- The mashup should feel organic, not forced\n\n"
                
                # CRITICAL: Comedy elements instruction
                if comedy_elements:
                    comedy_text = ", ".join(comedy_elements)
                    prompt += f"🎭 **CRITICAL COMEDY REQUIREMENTS:**\n"
                    prompt += f"You MUST incorporate these specific comedy styles: **{comedy_text}**\n"
                    prompt += f"- Each concept must EXPLICITLY showcase these comedy elements\n"
                    prompt += f"- The comedy should be woven into the premise itself\n"
                    prompt += f"- Readers should immediately recognize the {comedy_text} style(s)\n"
                    prompt += f"- Be specific about HOW the comedy manifests\n\n"
                
                prompt += f"**EXAMPLE:**\n"
                prompt += f"If subgenres are 'Christian Romance', 'Christian Science Fiction', and 'Amish Fiction', "
                prompt += f"a good mashup would be: 'An Amish community discovers their ancestors were alien missionaries, "
                prompt += f"and a forbidden romance blooms between a human carpenter and a half-alien scout.' "
                prompt += f"\n\n**NOW:** Create 5 unique concepts that genuinely combine all elements: {subgenres_text}"
                if comedy_elements:
                    prompt += f" with {comedy_text} comedy"
                prompt += ". Each concept should be 2-3 sentences with SPECIFIC details. Format as a numbered list."
        
        else:
            # Generic fallback
            prompt = f"{system}\n\nHelp the author with this request: {action}\n\nContext: {user_input}"
        
        return prompt
    
    async def generate_baseline_premise(
        self,
        session_id: str,
        refinement_prompt: Optional[str] = None
    ) -> PremiseBuilderSession:
        """
        Generate baseline premise synthesis from wizard data (Step 7).
        
        Uses GPT-4o to create cohesive ~500-700 word premise.
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Build synthesis prompt from all collected data
        prompt = self._build_baseline_synthesis_prompt(session, refinement_prompt)
        
        config = AIConfig(
            provider=AIProvider.OPENAI,
            model_name="gpt-4o",
            temperature=0.8,
            max_tokens=2000
        )
        
        start = time.time()
        
        try:
            response = await self.ai_service.generate_text(
                prompt=prompt,
                config=config
            )
            
            content = response.get("content", "").strip()
            tokens = response.get("usage", {}).get("total_tokens", 0)
            duration = time.time() - start
            
            # Create artifact
            artifact = PremiseArtifact(
                content=content,
                word_count=len(content.split()),
                model_used=config.model_name,
                provider=config.provider.value,
                temperature=config.temperature,
                tokens_used=tokens,
                generation_time_seconds=duration
            )
            
            # Store in session
            session.baseline_premise = artifact
            session.current_step = max(session.current_step, 7)
            session.updated_at = datetime.utcnow()
            
            # Track refinement if provided
            if refinement_prompt:
                session.refinement_history.append(
                    PremiseRefinement(request=refinement_prompt)
                )
            
            # Persist
            session_dict = session.model_dump(mode="json")
            await self.sessions_collection.replace_one(
                {"id": session_id},
                session_dict
            )
            
            logger.info(f"Generated baseline premise for session {session_id} in {duration:.2f}s")
            return session
        
        except Exception as e:
            logger.error(f"Failed to generate baseline premise: {e}", exc_info=True)
            raise
    
    def _build_baseline_synthesis_prompt(
        self,
        session: PremiseBuilderSession,
        refinement: Optional[str]
    ) -> str:
        """Build prompt for baseline premise synthesis."""
        
        prompt = """You are an expert novel development assistant. Synthesize the following story elements into a cohesive, compelling premise (500-700 words) for a novel.

**Genre & Tone:**
"""
        
        if session.genre_profile:
            prompt += f"- Primary Genre: {session.genre_profile.primary_genre}\n"
            if session.genre_profile.secondary_genre:
                prompt += f"- Secondary Genre: {session.genre_profile.secondary_genre}\n"
            if session.genre_profile.subgenres:
                prompt += f"- Subgenres: {', '.join(session.genre_profile.subgenres)}\n"
        
        if session.tone_theme_profile:
            prompt += f"\n**Tone:**\n"
            prompt += f"- Adjectives: {', '.join(session.tone_theme_profile.tone_adjectives)}\n"
            prompt += f"- Darkness Level: {session.tone_theme_profile.darkness_level}/10\n"
            prompt += f"- Humor Level: {session.tone_theme_profile.humor_level}/10\n"
            if session.tone_theme_profile.themes:
                prompt += f"- Themes: {', '.join(session.tone_theme_profile.themes)}\n"
        
        if session.character_seeds:
            prompt += f"\n**Characters:**\n"
            if session.character_seeds.protagonist:
                p = session.character_seeds.protagonist
                prompt += f"- Protagonist: {p.name} - {p.brief_description}\n"
                if p.goal:
                    prompt += f"  Goal: {p.goal}\n"
                if p.flaw:
                    prompt += f"  Flaw: {p.flaw}\n"
            
            if session.character_seeds.antagonist:
                a = session.character_seeds.antagonist
                prompt += f"- Antagonist: {a.name} - {a.brief_description}\n"
            
            if session.character_seeds.supporting_cast:
                prompt += f"- Supporting Cast:\n"
                for char in session.character_seeds.supporting_cast:
                    prompt += f"  • {char.name} ({char.role}): {char.brief_description}\n"
        
        if session.plot_intent:
            prompt += f"\n**Plot:**\n"
            prompt += f"- Primary Conflict: {session.plot_intent.primary_conflict}\n"
            prompt += f"- Stakes: {session.plot_intent.stakes}\n"
            if session.plot_intent.conflict_types:
                prompt += f"- Conflict Types: {', '.join(session.plot_intent.conflict_types)}\n"
            if session.plot_intent.stakes_layers:
                prompt += f"- Stakes Layers: {', '.join(session.plot_intent.stakes_layers)}\n"
            if session.plot_intent.inciting_incident:
                prompt += f"- Inciting Incident: {session.plot_intent.inciting_incident}\n"
            if session.plot_intent.first_plot_point:
                prompt += f"- First Plot Point: {session.plot_intent.first_plot_point}\n"
            if session.plot_intent.midpoint_shift:
                prompt += f"- Midpoint Shift: {session.plot_intent.midpoint_shift}\n"
            if session.plot_intent.second_plot_point:
                prompt += f"- Second Plot Point: {session.plot_intent.second_plot_point}\n"
            if session.plot_intent.climax_confrontation:
                prompt += f"- Climax: {session.plot_intent.climax_confrontation}\n"
            if session.plot_intent.resolution:
                prompt += f"- Resolution: {session.plot_intent.resolution}\n"
            if session.plot_intent.key_story_beats:
                prompt += "- Key Story Beats:\n"
                for beat in session.plot_intent.key_story_beats:
                    prompt += f"  • {beat}\n"
            if session.plot_intent.emotional_beats:
                prompt += "- Emotional Beats:\n"
                for beat in session.plot_intent.emotional_beats:
                    prompt += f"  • {beat}\n"
            if session.plot_intent.major_twists:
                prompt += "- Major Twists:\n"
                for twist in session.plot_intent.major_twists:
                    prompt += f"  • {twist}\n"
            if session.plot_intent.red_herrings:
                prompt += "- Red Herrings:\n"
                for herring in session.plot_intent.red_herrings:
                    prompt += f"  • {herring}\n"
            if session.plot_intent.romantic_subplot:
                prompt += f"- Romantic Subplot: {session.plot_intent.romantic_subplot}\n"
            if session.plot_intent.secondary_subplot:
                prompt += f"- Secondary Subplot: {session.plot_intent.secondary_subplot}\n"
            if session.plot_intent.thematic_subplot:
                prompt += f"- Thematic Subplot: {session.plot_intent.thematic_subplot}\n"
            if session.plot_intent.additional_subplots:
                prompt += "- Additional Subplots:\n"
                for subplot in session.plot_intent.additional_subplots:
                    prompt += f"  • {subplot}\n"
            if session.plot_intent.tension_escalation:
                prompt += f"- Tension Escalation Strategy: {session.plot_intent.tension_escalation}\n"
            if session.plot_intent.pacing_notes:
                prompt += f"- Pacing Notes: {session.plot_intent.pacing_notes}\n"
            if session.plot_intent.final_image:
                prompt += f"- Final Image: {session.plot_intent.final_image}\n"
            prompt += f"- Ending Vibe: {session.plot_intent.ending_vibe}\n"
        
        if session.structure_targets:
            prompt += f"\n**Structure:**\n"
            prompt += f"- Target Length: {session.structure_targets.target_word_count:,} words\n"
            prompt += f"- Chapters: {session.structure_targets.target_chapter_count}\n"
            prompt += f"- POV: {session.structure_targets.pov_style.value}\n"
            prompt += f"- Tense: {session.structure_targets.tense_style.value}\n"
            prompt += f"- Pacing: {session.structure_targets.pacing_preference.value}\n"
        
        if session.constraints_profile:
            if session.constraints_profile.tropes_to_include:
                prompt += f"\n**Tropes to Include:** {', '.join(session.constraints_profile.tropes_to_include)}\n"
            if session.constraints_profile.tropes_to_avoid:
                prompt += f"**Tropes to Avoid:** {', '.join(session.constraints_profile.tropes_to_avoid)}\n"
            if session.constraints_profile.faith_elements:
                prompt += f"**Faith Elements:** {session.constraints_profile.faith_elements}\n"
            if session.constraints_profile.must_have_scenes:
                prompt += f"**Must-Have Scenes:** {', '.join(session.constraints_profile.must_have_scenes)}\n"
        
        prompt += "\n**Task:**\n"
        prompt += "Synthesize the above into a compelling, cohesive premise (500-700 words) that:\n"
        prompt += "1. Introduces the protagonist and their world\n"
        prompt += "2. Establishes the central conflict and stakes\n"
        prompt += "3. Hints at character arcs and major plot points\n"
        prompt += "4. Captures the tone and themes\n"
        prompt += "5. Makes the story sound irresistible\n"
        
        if refinement:
            prompt += f"\n**Refinement Request:** {refinement}\n"
        
        prompt += "\nWrite the premise now:"
        
        return prompt
    
    async def generate_premium_premise(
        self,
        session_id: str,
        refinement_prompt: Optional[str] = None
    ) -> PremiseBuilderSession:
        """
        Generate premium final premise using Claude Sonnet 4.5 (Step 8).
        
        Produces ~700-1000 word long-form premise with structured metadata.
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if not session.baseline_premise:
            raise ValueError("Baseline premise required before generating premium premise")
        
        # Build premium synthesis prompt
        prompt = self._build_premium_synthesis_prompt(session, refinement_prompt)
        
        config = AIConfig(
            provider=AIProvider.ANTHROPIC,
            model_name="claude-sonnet-4-20250514",
            temperature=0.85,
            max_tokens=4000
        )
        
        start = time.time()
        
        try:
            response = await self.ai_service.generate_text(
                prompt=prompt,
                config=config
            )
            
            content = response.get("content", "").strip()
            tokens = response.get("usage", {}).get("total_tokens", 0)
            duration = time.time() - start
            
            # Extract metadata and clean content
            metadata, clean_content = self._extract_premise_metadata(content)
            
            # Create artifact
            artifact = PremiseArtifact(
                content=clean_content,
                word_count=len(clean_content.split()),
                model_used=config.model_name,
                provider=config.provider.value,
                temperature=config.temperature,
                tokens_used=tokens,
                generation_time_seconds=duration,
                metadata=metadata
            )
            
            # Store in session
            session.premium_premise = artifact
            session.current_step = 8
            session.updated_at = datetime.utcnow()
            
            if refinement_prompt:
                session.refinement_history.append(
                    PremiseRefinement(request=refinement_prompt)
                )
            
            # Persist
            session_dict = session.model_dump(mode="json")
            await self.sessions_collection.replace_one(
                {"id": session_id},
                session_dict
            )
            
            logger.info(f"Generated premium premise for session {session_id} in {duration:.2f}s")
            return session
        
        except Exception as e:
            logger.error(f"Failed to generate premium premise: {e}", exc_info=True)
            raise
    
    def _build_premium_synthesis_prompt(
        self,
        session: PremiseBuilderSession,
        refinement: Optional[str]
    ) -> str:
        """Build prompt for premium premise synthesis."""
        
        prompt = """You are an award-winning novelist's assistant with expertise in story development. Create a premium, long-form premise (700-1000 words) that will serve as the foundation for a full novel outline and manuscript.

Use the baseline premise and collected story elements below to craft a rich, detailed premise that:
1. Vividly establishes the world and atmosphere
2. Deeply characterizes the protagonist and key characters
3. Sets up compelling conflicts with clear stakes
4. Outlines the emotional journey and character arcs
5. Hints at major plot beats without spoiling everything
6. Captures the unique voice and tone of the story
7. Makes the novel impossible to resist writing and reading

**Baseline Premise:**
"""
        
        if session.baseline_premise:
            prompt += f"{session.baseline_premise.content}\n\n"
        
        # Include full context
        prompt += "**Additional Context:**\n"
        
        if session.structure_targets:
            prompt += f"- Target Length: {session.structure_targets.target_word_count:,} words in {session.structure_targets.target_chapter_count} chapters\n"
        
        if session.tone_theme_profile:
            if session.tone_theme_profile.heat_level:
                prompt += f"- Romance Heat Level: {session.tone_theme_profile.heat_level.value}\n"
        
        if session.constraints_profile:
            if session.constraints_profile.faith_elements:
                prompt += f"- Faith Elements: {session.constraints_profile.faith_elements}\n"
        
        if refinement:
            prompt += f"\n**Refinement Request:** {refinement}\n"
        
        prompt += "\n**Task:**\n"
        prompt += "Write a premium premise (700-1000 words) that will inspire compelling outline and chapter generation. "
        prompt += "Be specific about sensory details, character quirks, and emotional beats. "
        prompt += "Make it sing.\n\n"
        prompt += "After the premise, include a metadata block in this format:\n"
        prompt += "```json\n"
        prompt += "{\n"
        prompt += '  "key_conflicts": ["list", "of", "major conflicts"],\n'
        prompt += '  "promise_of_premise": "one-sentence hook",\n'
        prompt += '  "target_word_count": 80000,\n'
        prompt += '  "target_chapter_count": 25\n'
        prompt += "}\n"
        prompt += "```\n"
        
        return prompt
    
    def _extract_premise_metadata(self, content: str) -> tuple[Dict[str, Any], str]:
        """
        Extract JSON metadata block from premise content.
        
        Returns: (metadata_dict, cleaned_content)
        """
        import json
        import re
        
        # Look for JSON code block
        match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if match:
            try:
                metadata = json.loads(match.group(1))
                # Remove the JSON block from content
                clean_content = content[:match.start()] + content[match.end():]
                # Clean up any extra whitespace
                clean_content = clean_content.strip()
                return metadata, clean_content
            except json.JSONDecodeError:
                logger.warning("Failed to parse metadata JSON")
        
        return {}, content
    
    async def complete_session(
        self,
        session_id: str,
        use_premium: bool = True,
        manual_premise: Optional[str] = None
    ) -> str:
        """
        Complete session and persist premise to project.
        
        Returns project_id for navigation.
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Determine final premise content
        if manual_premise:
            premise_content = manual_premise
            word_count = len(manual_premise.split())
        elif use_premium and session.premium_premise:
            premise_content = session.premium_premise.content
            word_count = session.premium_premise.word_count
        elif session.baseline_premise:
            premise_content = session.baseline_premise.content
            word_count = session.baseline_premise.word_count
        else:
            raise ValueError("No premise available to persist")
        
        # Extract structure targets
        if not session.structure_targets:
            raise ValueError("Structure targets required to complete session")
        
        target_words = session.structure_targets.target_word_count
        target_chapters = session.structure_targets.target_chapter_count
        
        # Extract comprehensive genre info
        genre = session.genre_profile.primary_genre if session.genre_profile else "Fiction"
        subgenre = session.genre_profile.secondary_genre if session.genre_profile else None
        subgenres = session.genre_profile.subgenres if session.genre_profile and session.genre_profile.subgenres else []
        comedy_elements = session.genre_profile.comedy_elements if session.genre_profile and session.genre_profile.comedy_elements else []
        
        # Extract tone/theme info
        tone_adjectives = session.tone_theme_profile.tone_adjectives if session.tone_theme_profile and session.tone_theme_profile.tone_adjectives else []
        darkness_level = session.tone_theme_profile.darkness_level if session.tone_theme_profile else None
        humor_level = session.tone_theme_profile.humor_level if session.tone_theme_profile else None
        themes = session.tone_theme_profile.themes if session.tone_theme_profile and session.tone_theme_profile.themes else []
        
        # Get title and folder
        title = session.project_stub.title if session.project_stub else "Untitled Novel"
        folder = session.project_stub.folder if session.project_stub and session.project_stub.folder else None
        
        # Create or update project
        if session.project_id:
            # Update existing project
            project_doc = await self.projects_collection.find_one({"id": session.project_id})
            if not project_doc:
                raise ValueError(f"Project {session.project_id} not found")
            
            project = Project(**{k: v for k, v in project_doc.items() if k != "_id"})
            project_id = session.project_id
        else:
            # Create new project
            project = Project(
                title=title,
                status=ProjectStatus.PREMISE_READY,
                genre=genre,
                subgenre=subgenre,
                folder=folder,
                total_chapters=target_chapters
            )
            project_id = project.id
            
            # Insert project
            project_dict = project.model_dump(mode="json")
            await self.projects_collection.insert_one(project_dict)
        
        # Create premise document with ALL genre/tone data
        premise = Premise(
            project_id=project_id,
            genre=genre,
            subgenre=subgenre,
            subgenres=subgenres,
            comedy_elements=comedy_elements,
            tone_adjectives=tone_adjectives,
            darkness_level=darkness_level,
            humor_level=humor_level,
            themes=themes,
            target_word_count=target_words,
            target_chapter_count=target_chapters,
            content=premise_content,
            word_count=word_count
        )
        
        # Insert premise
        premise_dict = premise.model_dump(mode="json")
        await self.premises_collection.insert_one(premise_dict)
        
        # Update project with premise reference
        await self.projects_collection.update_one(
            {"id": project_id},
            {
                "$set": {
                    "premise_id": premise.id,
                    "status": ProjectStatus.PREMISE_READY.value,
                    "genre": genre,
                    "subgenre": subgenre,
                    "total_chapters": target_chapters,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Mark session complete
        session.status = BuilderSessionStatus.COMPLETED
        session.updated_at = datetime.utcnow()
        session_dict = session.model_dump(mode="json")
        await self.sessions_collection.replace_one(
            {"id": session_id},
            session_dict
        )
        
        logger.info(f"Completed session {session_id}, created/updated project {project_id}")
        return project_id
    
    async def abandon_session(self, session_id: str) -> None:
        """Mark session as abandoned."""
        await self.sessions_collection.update_one(
            {"id": session_id},
            {
                "$set": {
                    "status": BuilderSessionStatus.ABANDONED.value,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        logger.info(f"Abandoned session {session_id}")
