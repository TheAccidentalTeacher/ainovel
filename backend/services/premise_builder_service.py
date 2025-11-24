"""
Premise Builder Service.

Business logic for guided premise creation wizard with AI assistance.
"""

import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.models.premise_builder import (
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
from backend.models.schemas import (
    Premise,
    Project,
    ProjectStatus,
    AIConfig,
    AIProvider,
)
from backend.services.ai_service import AIService


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
        
        # Use lightweight config
        # For brainstorm/mashup, need more tokens for 5 concepts
        max_tokens = 800 if action in ("brainstorm_concept", "mashup_subgenres") else 300
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
            
            # For brainstorm/mashup actions, split numbered list into alternatives
            if action in ("brainstorm_concept", "mashup_subgenres"):
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
        
        # Action-specific prompts
        if action == "expand_character":
            prompt = f"{system}\n\nThe author provided this character seed: {user_input}\n\n"
            prompt += "Expand this into a richer character description (2-3 sentences) including personality, goals, and potential conflicts."
        
        elif action == "suggest_themes":
            genre = context.get("primary_genre", "general fiction")
            darkness = context.get("darkness_level", 5)
            humor = context.get("humor_level", 5)
            prompt = f"{system}\n\nFor a {genre} novel with darkness level {darkness}/10 and humor level {humor}/10, "
            prompt += "suggest 5 major thematic elements that could enrich the story. "
            prompt += "Format as a numbered list with brief explanations."
        
        elif action == "suggest_emotional_tone":
            genre = context.get("primary_genre", "general fiction")
            themes = context.get("themes", [])
            darkness = context.get("darkness_level", 5)
            themes_text = ", ".join(themes) if themes else "not specified"
            prompt = f"{system}\n\nFor a {genre} novel exploring themes of {themes_text} "
            prompt += f"with darkness level {darkness}/10, "
            prompt += "suggest 3 possible emotional journey arcs (e.g., 'despair to hope', 'innocence to wisdom'). "
            prompt += "Format as a numbered list."
        
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
            themes_text = ", ".join(themes) if themes else "not specified"
            prompt = f"{system}\n\nFor a {genre} novel with themes of {themes_text}, "
            if logline:
                prompt += f"and this concept: {logline[:200]}..., "
            prompt += "suggest 3 profound central questions the story could explore "
            prompt += "(e.g., 'What makes us human?', 'Can love conquer hate?'). "
            prompt += "Format as a numbered list."
        
        elif action == "suggest_atmosphere":
            genre = context.get("primary_genre", "general fiction")
            darkness = context.get("darkness_level", 5)
            themes = context.get("themes", [])
            themes_text = ", ".join(themes) if themes else "not specified"
            prompt = f"{system}\n\nFor a {genre} novel with darkness level {darkness}/10 "
            prompt += f"exploring {themes_text}, "
            prompt += "suggest 5 atmospheric/mood descriptors that would enhance the story's feel "
            prompt += "(e.g., claustrophobic, whimsical, foreboding, ethereal, gritty). "
            prompt += "Format as a numbered list with brief descriptions."
        
        elif action == "suggest_tropes":
            genre = session.genre_profile.primary_genre if session.genre_profile else "general fiction"
            prompt = f"{system}\n\nFor a {genre} novel, list 5-7 common tropes or story patterns that readers enjoy in this genre."
        
        elif action == "check_conflicts":
            prompt = f"{system}\n\nReview these story elements and identify any potential contradictions or concerns:\n\n"
            prompt += f"Constraints: {context.get('constraints', '')}\n"
            prompt += f"Themes: {context.get('themes', '')}\n"
            prompt += f"Tone: {context.get('tone', '')}\n\n"
            prompt += "Are there any conflicts (e.g., 'no violence' but 'revenge thriller')?"
        
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
            genres_text = f"{primary} + {secondary}" if secondary else primary
            
            prompt = f"{system}\n\nGenerate 5 creative novel concept ideas for a {genres_text} story. "
            if comedy_elements:
                comedy_text = ", ".join(comedy_elements)
                prompt += f"IMPORTANT: Incorporate these comedic elements throughout: {comedy_text}. "
                prompt += f"Each concept must showcase these specific comedy styles naturally within the story premise. "
            prompt += "Each concept should be 1-2 sentences describing a unique premise, setting, or hook. "
            prompt += "Make them varied and interesting. Format as a numbered list."
        
        elif action == "mashup_subgenres":
            primary = context.get("primary_genre", "")
            subgenres = context.get("subgenres", [])
            comedy_elements = context.get("comedy_elements", [])
            
            if not subgenres or len(subgenres) < 2:
                prompt = f"{system}\n\nNot enough subgenres selected for mashup."
            else:
                subgenres_text = ", ".join(subgenres)
                prompt = f"{system}\n\nCreate 5 creative novel concepts that mashup these {primary} subgenres: {subgenres_text}. "
                prompt += f"Each concept must authentically blend elements from ALL of these specific subgenres: {subgenres_text}. "
                
                if comedy_elements:
                    comedy_text = ", ".join(comedy_elements)
                    prompt += f"\n\nIMPORTANT: Incorporate these comedic elements: {comedy_text}. "
                    prompt += f"The story concepts must showcase these comedy styles prominently. "
                
                prompt += f"\n\nFor example, if the subgenres are 'Christian Romance', 'Christian Science Fiction', and 'Amish Fiction', "
                prompt += f"a good mashup would be: 'An Amish community discovers their ancestors were alien missionaries, "
                prompt += f"and a forbidden romance blooms between a human carpenter and a half-alien scout.' "
                prompt += f"\n\nNow create 5 unique concepts that genuinely combine: {subgenres_text}. "
                prompt += "Each concept should be 2-3 sentences. Format as a numbered list."
        
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
            if session.tone_theme_profile.comparable_works:
                prompt += f"- Comparable Works: {', '.join(session.tone_theme_profile.comparable_works)}\n"
        
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
            if session.plot_intent.inciting_incident:
                prompt += f"- Inciting Incident: {session.plot_intent.inciting_incident}\n"
            if session.plot_intent.midpoint_twist:
                prompt += f"- Midpoint Twist: {session.plot_intent.midpoint_twist}\n"
            if session.plot_intent.climax_notes:
                prompt += f"- Climax: {session.plot_intent.climax_notes}\n"
            prompt += f"- Ending Vibe: {session.plot_intent.ending_vibe}\n"
            if session.plot_intent.subplots:
                prompt += f"- Subplots: {'; '.join(session.plot_intent.subplots)}\n"
        
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
            
            # Extract metadata if present (TODO: parse JSON metadata block)
            metadata = self._extract_premise_metadata(content)
            
            # Create artifact
            artifact = PremiseArtifact(
                content=content,
                word_count=len(content.split()),
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
            if session.tone_theme_profile.comparable_works:
                prompt += f"- Comparable Works: {', '.join(session.tone_theme_profile.comparable_works)}\n"
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
    
    def _extract_premise_metadata(self, content: str) -> Dict[str, Any]:
        """Extract JSON metadata block from premise content."""
        import json
        import re
        
        # Look for JSON code block
        match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                logger.warning("Failed to parse metadata JSON")
        
        return {}
    
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
        
        # Get genre info
        genre = session.genre_profile.primary_genre if session.genre_profile else "Fiction"
        subgenre = session.genre_profile.secondary_genre if session.genre_profile else None
        
        # Get title
        title = session.project_stub.title if session.project_stub else "Untitled Novel"
        
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
                total_chapters=target_chapters
            )
            project_id = project.id
            
            # Insert project
            project_dict = project.model_dump(mode="json")
            await self.projects_collection.insert_one(project_dict)
        
        # Create premise document
        premise = Premise(
            project_id=project_id,
            genre=genre,
            subgenre=subgenre,
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
