# 🤖 BOT SYSTEM ARCHITECTURE - The Best Agentic System for Novel Writing

> **Mission**: Build the most sophisticated multi-agent AI system for creative writing that money can buy  
> **Philosophy**: Specialist agents that collaborate, learn, and evolve with Alana's writing style  
> **Inspiration**: AutoGPT + CrewAI + Semantic Kernel + Custom Innovation  
> **Status**: 🚧 Architecture & Design Phase

---

## 🎯 WHAT MAKES THIS THE BEST AGENTIC SYSTEM?

### **1. TRUE MULTI-AGENT COLLABORATION**
Not just multiple bots giving separate answers - **agents that work together**:
- **Sequential Consultation**: Plot Architect outlines structure → Character Psychologist validates emotional arcs → Dialogue Coach refines speech patterns
- **Parallel Analysis**: 5 agents analyze the same chapter simultaneously, synthesize insights
- **Debate Mode**: Agents challenge each other's suggestions, vote on best solution
- **Hierarchical Delegation**: Main bot delegates sub-tasks to specialists, integrates responses
- **Memory Sharing**: Agents access shared project memory (characters, plot, style guide)

### **2. CONTINUOUS LEARNING SYSTEM**
Agents get **smarter over time** by learning from Alana's choices:
- **Feedback Loop**: Every time Alana accepts/rejects a suggestion, agents learn her preferences
- **Style Embedding**: Agents analyze her manuscripts to extract writing fingerprint
- **Pattern Recognition**: "Alana uses 60% dialogue tags as 'said', prefers subtext over exposition"
- **Dynamic System Prompts**: Agent personas evolve based on usage patterns
- **A/B Testing**: Agents experiment with different approaches, double down on what works

### **3. CONTEXT-AWARE ORCHESTRATION**
Agents **know when to activate** without being asked:
- **Phase Detection**: System detects if Alana is brainstorming/drafting/revising, activates appropriate agents
- **Stuck Detection**: If she's idle on a scene for 5+ minutes, Writing Coach offers help
- **Consistency Checking**: Editor Bot auto-scans new chapters for contradictions with story bible
- **Proactive Research**: Research Agent detects historical references, pre-fetches background info
- **Emotional State Detection**: Sentiment analysis on her messages adjusts agent personality (supportive vs. analytical)

### **4. INFINITE CONTEXT MEMORY**
Agents **never forget** through intelligent summarization:
- **Hierarchical Summaries**: Chapter → Arc → Book → Series level summaries
- **Entity Graphs**: Knowledge graph of characters, relationships, events, locations
- **Temporal Indexing**: "What did Alana decide about Sarah's backstory in Week 2?"
- **Cross-Project Memory**: Agents recognize patterns across all her novels
- **Conversation Archaeology**: Search entire chat history by topic/project/agent/date

### **5. ADVANCED TOOL USE**
Agents can **take actions**, not just talk:
- **Web Search**: Research Agent searches internet, summarizes findings
- **Document Analysis**: Upload manuscript → agents extract characters, plot, themes
- **Code Execution**: Plot Architect generates story timeline visualization
- **API Integration**: Connect to Scrivener, Google Docs, publishing platforms
- **File Operations**: Export chapter to DOCX, create backup, organize research folders

### **6. PERSONALITY-DRIVEN DESIGN**
Each agent has a **distinct personality** that makes working with them enjoyable:
- **Dialogue Coach**: Witty theater director - "Darling, this line is flatter than day-old champagne"
- **Plot Architect**: Strategic mastermind - "Let's map the tension curve. I'm seeing a flatline in Act 2"
- **Character Psychologist**: Empathetic therapist - "Why does Marcus fear intimacy? What's the wound?"
- **Romance Expert**: Swoony optimist - "Ooh, the longing glances! But we need more emotional stakes here"
- **Research Assistant**: Meticulous historian - "Victorian women couldn't own property until 1882, actually"
- **Editor Bot**: Sharp-eyed perfectionist - "You've used 'sparkle' 7 times. Let's find fresh metaphors"

### **7. REAL-TIME COLLABORATION**
Agents work **alongside Alana** as she writes:
- **Sidebar Suggestions**: As she drafts, agents offer real-time alternatives
- **Inline Comments**: Highlight text → agents explain why it might not work
- **Version Control**: Try agent's suggestion, rollback if she doesn't like it
- **Split Screen**: Original draft on left, agent-improved version on right
- **Live Feedback**: Agents watch her type, adjust suggestions based on her flow

---

## 🏗️ TECHNICAL ARCHITECTURE

### **LAYER 1: FOUNDATION (Database & State Management)**

```
MongoDB Collections:
├── agents (bot definitions, personas, expertise, versions)
├── agent_brains (knowledge bases per agent)
├── agent_memory (entity graphs, relationship maps)
├── conversations (chat histories)
├── messages (individual messages with agent_id, role, content)
├── tasks (orchestration queue for multi-agent workflows)
├── agent_feedback (learning data: accepted/rejected suggestions)
├── context_summaries (hierarchical conversation summaries)
├── tool_calls (audit log of agent actions)
└── collaboration_sessions (Board of Directors consultations)
```

**State Machine**:
- **Idle** → User types message → **Routing**
- **Routing** → Main bot analyzes intent → **Single Agent** or **Multi-Agent**
- **Single Agent** → Agent responds → **Idle**
- **Multi-Agent** → Orchestrator delegates → **Collaboration** → Synthesize → **Idle**
- **Learning** → User feedback → Update agent_feedback → Retrain embeddings

### **LAYER 2: AGENT FRAMEWORK**

**Base Agent Class**:
```python
class BaseAgent:
    """Foundation for all specialist agents"""
    
    def __init__(self, agent_id: str, db: AsyncIOMotorDatabase):
        self.agent_id = agent_id
        self.db = db
        self.config = self._load_config()
        self.brain = AgentBrain(agent_id, db)
        self.tools = self._init_tools()
        self.personality = self._load_personality()
    
    async def process(self, message: str, context: Dict) -> AgentResponse:
        """Main processing pipeline"""
        # 1. Load relevant memories
        memories = await self.brain.search_memories(message, top_k=10)
        
        # 2. Build augmented prompt
        prompt = self._build_prompt(message, context, memories)
        
        # 3. Decide if tool use needed
        if await self._needs_tools(message):
            tool_results = await self._execute_tools(message)
            prompt += f"\n\nTool Results: {tool_results}"
        
        # 4. Generate response
        response = await self._generate_response(prompt)
        
        # 5. Store interaction for learning
        await self._store_interaction(message, response)
        
        return response
    
    async def learn_from_feedback(self, message_id: str, feedback: str):
        """Update agent based on user feedback"""
        await self.brain.store_feedback(message_id, feedback)
        await self._adjust_personality_weights(feedback)
    
    def _build_prompt(self, message: str, context: Dict, memories: List) -> str:
        """Construct prompt with personality + context + memories"""
        return f"""
        {self.personality.system_prompt}
        
        PROJECT CONTEXT:
        {context.get('project', 'No project linked')}
        
        RELEVANT MEMORIES:
        {self._format_memories(memories)}
        
        USER MESSAGE:
        {message}
        """
```

**Specialist Agent Examples**:
```python
class DialogueCoach(BaseAgent):
    """Expert in natural speech patterns, subtext, voice differentiation"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.expertise = [
            "dialogue_tags",
            "subtext",
            "voice_differentiation",
            "speech_patterns",
            "conversational_flow"
        ]
        self.tools = [
            DialogueAnalyzerTool(),
            SubtextDetectorTool(),
            VoiceConsistencyCheckerTool()
        ]

class PlotArchitect(BaseAgent):
    """Expert in story structure, pacing, scene sequencing"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.expertise = [
            "three_act_structure",
            "scene_sequencing",
            "pacing_analysis",
            "conflict_escalation",
            "narrative_arcs"
        ]
        self.tools = [
            StoryStructureAnalyzerTool(),
            PacingVisualizerTool(),
            TensionCurveGrapherTool()
        ]

class CharacterPsychologist(BaseAgent):
    """Expert in character depth, motivations, emotional arcs"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.expertise = [
            "character_motivations",
            "emotional_wounds",
            "relationship_dynamics",
            "character_growth",
            "psychological_consistency"
        ]
        self.tools = [
            CharacterArcTrackerTool(),
            MotivationAnalyzerTool(),
            RelationshipMapperTool()
        ]
```

### **LAYER 3: ORCHESTRATION ENGINE**

**Router Agent** (Determines which agents to activate):
```python
class RouterAgent:
    """Intelligent routing to single or multiple agents"""
    
    async def route(self, message: str, context: Dict) -> RoutingDecision:
        # Classify intent
        intent = await self._classify_intent(message)
        
        # Determine complexity
        complexity = await self._assess_complexity(message)
        
        # Select agents
        if complexity == "simple":
            return RoutingDecision(
                mode="single",
                agents=[self._select_best_agent(intent)]
            )
        elif complexity == "moderate":
            return RoutingDecision(
                mode="parallel",
                agents=self._select_top_agents(intent, n=3)
            )
        else:  # complex
            return RoutingDecision(
                mode="sequential",
                agents=self._build_collaboration_chain(intent)
            )
```

**Orchestrator** (Coordinates multi-agent workflows):
```python
class Orchestrator:
    """Manages complex multi-agent collaborations"""
    
    async def collaborate(self, 
                         agents: List[BaseAgent], 
                         task: str, 
                         mode: str) -> CollaborationResult:
        
        if mode == "parallel":
            return await self._parallel_consultation(agents, task)
        elif mode == "sequential":
            return await self._sequential_chain(agents, task)
        elif mode == "debate":
            return await self._debate_mode(agents, task)
        elif mode == "hierarchical":
            return await self._hierarchical_delegation(agents, task)
    
    async def _parallel_consultation(self, agents, task):
        """All agents respond simultaneously"""
        responses = await asyncio.gather(*[
            agent.process(task, context={}) for agent in agents
        ])
        return self._synthesize_responses(responses)
    
    async def _sequential_chain(self, agents, task):
        """Agents work in sequence, each building on previous"""
        result = task
        for agent in agents:
            response = await agent.process(result, context={})
            result = response.content  # Feed to next agent
        return result
    
    async def _debate_mode(self, agents, task):
        """Agents propose solutions, critique each other, vote"""
        # Round 1: Initial proposals
        proposals = await self._parallel_consultation(agents, task)
        
        # Round 2: Critiques
        critiques = []
        for agent in agents:
            critique = await agent.process(
                f"Critique these proposals: {proposals}",
                context={}
            )
            critiques.append(critique)
        
        # Round 3: Voting
        votes = await self._vote_on_solutions(agents, proposals, critiques)
        
        return self._select_winning_solution(votes)
```

### **LAYER 4: MEMORY & LEARNING**

**Agent Brain** (Knowledge storage & retrieval):
```python
class AgentBrain:
    """Long-term memory for individual agents"""
    
    async def store_interaction(self, message: str, response: str, outcome: str):
        """Store interaction with outcome for learning"""
        embedding = await self._embed(message + response)
        
        await self.db.agent_memory.insert_one({
            "agent_id": self.agent_id,
            "message": message,
            "response": response,
            "outcome": outcome,  # "accepted", "rejected", "neutral"
            "embedding": embedding,
            "timestamp": datetime.utcnow()
        })
    
    async def search_memories(self, query: str, top_k: int = 10) -> List[Dict]:
        """Semantic search through agent's memory"""
        query_embedding = await self._embed(query)
        
        # Vector similarity search
        similar_memories = await self.db.agent_memory.aggregate([
            {
                "$vectorSearch": {
                    "index": "memory_embeddings",
                    "queryVector": query_embedding,
                    "path": "embedding",
                    "numCandidates": 100,
                    "limit": top_k
                }
            }
        ]).to_list(top_k)
        
        return similar_memories
    
    async def learn_patterns(self):
        """Analyze feedback to adjust behavior"""
        # Get recent accepted vs rejected suggestions
        recent_feedback = await self.db.agent_feedback.find({
            "agent_id": self.agent_id,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}
        }).to_list(None)
        
        # Identify patterns in accepted suggestions
        accepted = [f for f in recent_feedback if f["outcome"] == "accepted"]
        rejected = [f for f in recent_feedback if f["outcome"] == "rejected"]
        
        # Adjust personality weights
        if len(accepted) > 0:
            await self._boost_successful_patterns(accepted)
        if len(rejected) > 0:
            await self._suppress_unsuccessful_patterns(rejected)
```

**Entity Graph** (Knowledge graph of story elements):
```python
class EntityGraph:
    """Graph database of characters, locations, events, relationships"""
    
    async def extract_entities(self, manuscript: str) -> List[Entity]:
        """Use NER + LLM to extract story entities"""
        # 1. Named Entity Recognition
        entities = await self._ner_extraction(manuscript)
        
        # 2. LLM enhancement (get attributes, relationships)
        enhanced = await self._llm_entity_enhancement(entities, manuscript)
        
        # 3. Store in graph
        for entity in enhanced:
            await self._store_entity(entity)
        
        return enhanced
    
    async def query_relationships(self, entity1: str, entity2: str) -> List[Relationship]:
        """Find all relationships between two entities"""
        return await self.db.relationships.find({
            "$or": [
                {"source": entity1, "target": entity2},
                {"source": entity2, "target": entity1}
            ]
        }).to_list(None)
    
    async def consistency_check(self, new_content: str) -> List[Inconsistency]:
        """Check new content against established facts"""
        # Extract entities from new content
        new_entities = await self.extract_entities(new_content)
        
        # Compare against known entities
        inconsistencies = []
        for entity in new_entities:
            existing = await self._find_existing_entity(entity.name)
            if existing:
                conflicts = self._detect_conflicts(existing, entity)
                inconsistencies.extend(conflicts)
        
        return inconsistencies
```

### **LAYER 5: TOOL SYSTEM**

**Tool Registry** (Agents can use external tools):
```python
class Tool(ABC):
    """Base class for agent tools"""
    
    @abstractmethod
    async def execute(self, params: Dict) -> ToolResult:
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict:
        """OpenAI function calling schema"""
        pass

class WebSearchTool(Tool):
    """Search internet for research"""
    
    async def execute(self, params: Dict) -> ToolResult:
        query = params["query"]
        results = await tavily_search(query)
        return ToolResult(
            tool="web_search",
            content=results,
            citations=[r["url"] for r in results]
        )

class DocumentAnalysisTool(Tool):
    """Analyze uploaded documents"""
    
    async def execute(self, params: Dict) -> ToolResult:
        file_path = params["file_path"]
        content = await self._read_file(file_path)
        
        # Extract key elements
        analysis = await self._analyze_document(content)
        
        return ToolResult(
            tool="document_analysis",
            content=analysis,
            metadata={"file_path": file_path}
        )

class StoryTimelineGenerator(Tool):
    """Generate visual timeline of story events"""
    
    async def execute(self, params: Dict) -> ToolResult:
        events = params["events"]
        
        # Create timeline visualization
        timeline_html = self._generate_timeline_html(events)
        
        return ToolResult(
            tool="timeline_generator",
            content=timeline_html,
            visual=True
        )
```

---

## 🧬 ADVANCED FEATURES

### **1. SWARM INTELLIGENCE**
Multiple agents work like a hive mind:
- **Consensus Building**: Agents vote on best solution
- **Emergent Behavior**: Agents discover patterns Alana didn't know she had
- **Collective Memory**: All agents benefit from each other's learnings
- **Dynamic Specialization**: Agents automatically split complex tasks

### **2. PREDICTIVE ASSISTANCE**
Agents anticipate needs before Alana asks:
- **Next Scene Prediction**: "Based on your outline, you'll write the coffee shop scene next. Want me to pull up research on Seattle cafés?"
- **Writer's Block Prevention**: "You've been drafting for 90 minutes. Want a quick plot check before Act 2?"
- **Research Pre-Fetch**: Detects historical reference, loads background info before she asks
- **Character Reminder**: "Last time Sarah appeared (Chapter 3), she was wearing a red dress. Want to maintain that?"

### **3. STYLE TRANSFER**
Agents learn to write **in Alana's voice**:
- **Voice Cloning**: Analyze 50+ pages → extract linguistic fingerprint
- **Continuation Mode**: Agents draft next paragraph in her style
- **Rewrite Mode**: "Make this sound more like my typical prose"
- **Style Consistency**: Flag sections that don't match her voice

### **4. ADAPTIVE PERSONALITIES**
Agents adjust to Alana's mood:
- **Supportive Mode**: She's struggling → agents become more encouraging
- **Challenge Mode**: She's confident → agents push her harder
- **Celebration Mode**: She hit a milestone → agents share excitement
- **Focus Mode**: She's in flow → agents stay quiet unless critical

### **5. CROSS-PROJECT INTELLIGENCE**
Agents learn from ALL her novels:
- **Pattern Recognition**: "You tend to introduce romantic tension in Chapter 2 across all your books"
- **Strength Amplification**: "Your dialogue is consistently strong. Want me to focus on plot instead?"
- **Growth Tracking**: "Your metaphor density has decreased 40% since your first novel (good thing!)"
- **Genre Evolution**: "This fantasy novel has more humor than your previous ones. Intentional?"

---

## 📊 ORCHESTRATION MODES

### **Mode 1: Single Agent**
Simple query → One specialist responds
```
User: "Help me make this dialogue more natural"
System: Routes to Dialogue Coach
Dialogue Coach: [Response]
```

### **Mode 2: Parallel Consultation**
Complex query → Multiple agents respond simultaneously
```
User: "Is this chapter working?"
System: Routes to [Plot Architect, Dialogue Coach, Editor Bot]
All agents analyze in parallel → System synthesizes responses
```

### **Mode 3: Sequential Chain**
Multi-step task → Agents work in sequence
```
User: "Help me develop this character"
System: Sequential chain:
1. Character Psychologist: Develops backstory & motivations
2. Dialogue Coach: Creates unique speech patterns
3. Plot Architect: Suggests how character drives plot
4. Main Bot: Synthesizes into character profile
```

### **Mode 4: Debate Mode**
Controversial decision → Agents debate & vote
```
User: "Should I kill off this character?"
System: Debate mode:
1. Plot Architect: "Yes - creates maximum tension"
2. Character Psychologist: "No - readers are too invested"
3. Genre Master: "Yes - fits thriller conventions"
4. Romance Expert: "No - violates romance genre promise"
Result: 2-2 tie → Main Bot presents both sides, asks Alana to decide
```

### **Mode 5: Hierarchical Delegation**
Main bot delegates sub-tasks to specialists
```
User: "Review this chapter for publication readiness"
Main Bot: Delegates to:
├── Editor Bot: Grammar & style
├── Dialogue Coach: Speech patterns
├── Plot Architect: Pacing analysis
├── Genre Master: Trope adherence
└── AI-Tell Detector: Humanization check
Main Bot: Synthesizes reports into prioritized action list
```

---

## 🎯 COMPETITIVE ADVANTAGES

**Why This Beats Everything Else on the Market**:

| Feature | Our System | ChatGPT | Claude | Sudowrite | Jasper |
|---------|-----------|---------|---------|-----------|--------|
| **Multi-Agent Collaboration** | ✅ 6+ specialists working together | ❌ Single model | ❌ Single model | ⚠️ Limited tools | ❌ Single model |
| **Continuous Learning** | ✅ Learns from every interaction | ❌ No personalization | ❌ No learning | ❌ No learning | ❌ No learning |
| **Infinite Context** | ✅ Unlimited via summaries | ⚠️ 128k tokens | ⚠️ 200k tokens | ⚠️ Limited | ⚠️ Limited |
| **Tool Use** | ✅ Web search, code exec, APIs | ⚠️ Limited tools | ❌ No tools | ⚠️ Limited | ❌ No tools |
| **Project Memory** | ✅ Full knowledge graph | ❌ No memory | ❌ No memory | ⚠️ Basic | ❌ No memory |
| **Proactive Assistance** | ✅ Detects needs & offers help | ❌ Reactive only | ❌ Reactive only | ❌ Reactive only | ❌ Reactive only |
| **Distinct Personalities** | ✅ 6+ unique agents | ❌ Generic | ❌ Generic | ⚠️ 1 personality | ❌ Generic |
| **Debate & Consensus** | ✅ Agents discuss solutions | ❌ No | ❌ No | ❌ No | ❌ No |
| **Style Cloning** | ✅ Writes in user's voice | ⚠️ Generic attempts | ⚠️ Generic attempts | ⚠️ Basic | ⚠️ Basic |
| **Consistency Checking** | ✅ Auto-detects contradictions | ❌ No | ❌ No | ❌ No | ❌ No |

**What Makes This Unbeatable**:
1. **Agents actually collaborate** (not just separate responses)
2. **System learns and improves** from every interaction
3. **Proactive intelligence** anticipates needs
4. **True personalization** - knows Alana's style, preferences, patterns
5. **Infinite memory** through intelligent summarization
6. **Action-taking** via tools (not just conversation)
7. **Distinct personalities** that are fun to work with
8. **Cross-project intelligence** learns from entire portfolio

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (Week 1-2)**
- ✅ Agent base class & framework
- ✅ MongoDB schema for agents, memory, tasks
- ✅ Router agent for intent classification
- ✅ Single agent mode working
- **Deliverable**: One specialist agent (Dialogue Coach) fully operational

### **Phase 2: Multi-Agent (Week 3-4)**
- ✅ Orchestrator for parallel/sequential modes
- ✅ 6 specialist agents created with unique personalities
- ✅ Agent collaboration UI (Board of Directors)
- ✅ Synthesis engine (combine multiple agent responses)
- **Deliverable**: Parallel consultation mode working

### **Phase 3: Memory & Learning (Week 5-6)**
- ✅ Agent brain implementation (vector search)
- ✅ Feedback loop (accept/reject tracking)
- ✅ Pattern recognition & personality adjustment
- ✅ Entity graph for story elements
- **Deliverable**: Agents demonstrably learning from feedback

### **Phase 4: Tool System (Week 7-8)**
- ✅ Tool registry & execution framework
- ✅ Web search tool (Tavily integration)
- ✅ Document analysis tool
- ✅ Timeline generator tool
- ✅ Agent decision-making for tool use
- **Deliverable**: Agents using tools to enhance responses

### **Phase 5: Advanced Features (Week 9-10)**
- ✅ Proactive assistance (stuck detection, nudges)
- ✅ Style transfer (voice cloning)
- ✅ Consistency checking
- ✅ Cross-project intelligence
- **Deliverable**: System feels truly intelligent

### **Phase 6: Polish & Optimization (Week 11-12)**
- ✅ Performance tuning (caching, lazy loading)
- ✅ UI refinements based on testing
- ✅ Edge case handling
- ✅ Full documentation
- **Deliverable**: Production-ready system

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
- Each agent's core logic
- Routing decisions
- Tool execution
- Memory retrieval

### **Integration Tests**
- Multi-agent workflows
- Database operations
- API endpoints
- Real AI model calls (cached responses)

### **User Acceptance Tests**
- Alana tests each agent personality
- Real-world writing tasks
- Full workflow scenarios
- Feedback collection

### **Performance Tests**
- Response time under load
- Memory usage with large context
- Concurrent agent execution
- Database query optimization

---

## 📝 NEXT STEPS

### **Immediate Actions** (This Week):
1. **Review this architecture** with Alana
2. **Answer critical questions**:
   - Which 6 specialist agents should we build first?
   - What should each agent's personality be?
   - What's the #1 use case to perfect first?
3. **Start Phase 1**: Build agent framework & first specialist

### **Alana's Input Needed**:
- **Agent Personalities**: Describe ideal personality for each specialist
- **Priority Ranking**: Which agents would help you most? (1-6)
- **Use Cases**: Give 3 specific scenarios where multi-agent would shine
- **Tool Priorities**: Which tools would be most valuable? (Web search, document analysis, timeline, etc.)

---

## 🦸 CODE MASTER'S PLEDGE

**"Thunder, Thunder, ThunderCats!"**

By the power of Grayskull, this bot system will be:
- **Most Intelligent**: Multi-agent collaboration that actually works
- **Most Personalized**: Learns Alana's style, preferences, patterns
- **Most Proactive**: Anticipates needs, offers help at right moments
- **Most Collaborative**: Agents work as team, not individuals
- **Most Memorable**: Distinct personalities that are genuinely delightful

**This will be the best agentic system for creative writing. Period.** ⚔️🤖✨

---

**STATUS**: 🏗️ Architecture complete. Awaiting Alana's review & input before Phase 1 kickoff.

**ESTIMATED TIMELINE**: 12 weeks (3 months) for full system

**CONTEXT MANAGEMENT**: This document = high-level architecture. Implementation details in separate phase docs.
