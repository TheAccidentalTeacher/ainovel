"""
Agent Debate Orchestrator

Manages multi-agent debates with voting, synthesis, and witty argument generation.
Implements Alana's requested "Option C" debate mode with research compilation citations.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from services.avatar_base import Avatar
from services.research_doc_service import get_research_doc_service
import asyncio


class DebateOrchestrator:
    """
    Orchestrates debates between multiple avatars.
    
    Features:
    - Multi-avatar witty arguments
    - Research compilation citations
    - Democratic voting system
    - Synthesis of winning arguments into actionable advice
    - Cross-genre connections
    """
    
    def __init__(self, avatars: List[Avatar]):
        """
        Initialize debate orchestrator.
        
        Args:
            avatars: List of avatars participating in debate
        """
        self.agents = avatars
        self.research_service = get_research_doc_service()
    
    async def conduct_debate(
        self,
        debate_topic: str,
        user_context: Dict[str, Any],
        participating_agents: Optional[List[str]] = None,
        rounds: int = 1
    ) -> Dict[str, Any]:
        """
        Conduct a multi-agent debate.
        
        Args:
            debate_topic: Question being debated (e.g., "Should I kill the love interest?")
            user_context: Manuscript context, character info, plot summary
            participating_agents: Optional list of agent IDs to include (None = all agents)
            rounds: Number of debate rounds (1 = opening arguments only, 2+ = rebuttals)
            
        Returns:
            Dict with arguments, votes, synthesis, and research citations
        """
        print(f"🎭 Starting debate: {debate_topic}")
        
        # Filter participating agents
        if participating_agents:
            debate_agents = [a for a in self.agents if a.agent_id in participating_agents]
        else:
            debate_agents = self.agents
        
        print(f"   Participants: {', '.join([a.name for a in debate_agents])}")
        
        # Round 1: Opening arguments
        arguments = []
        
        for agent in debate_agents:
            print(f"   🤖 {agent.name} preparing argument...")
            argument = await agent.generate_debate_argument(
                debate_topic=debate_topic,
                user_context=user_context,
                opposing_arguments=None  # First round, no opposing views yet
            )
            arguments.append(argument)
        
        print(f"   ✅ Round 1 complete: {len(arguments)} arguments")
        
        # Additional rounds (rebuttals)
        for round_num in range(2, rounds + 1):
            print(f"   🔄 Round {round_num}: Rebuttals...")
            
            rebuttal_arguments = []
            
            for agent in debate_agents:
                # Each agent sees all previous arguments
                rebuttal = await agent.generate_debate_argument(
                    debate_topic=debate_topic,
                    user_context=user_context,
                    opposing_arguments=arguments  # Now they can refute each other
                )
                rebuttal_arguments.append(rebuttal)
            
            arguments.extend(rebuttal_arguments)
            print(f"   ✅ Round {round_num} complete")
        
        # Tally votes
        vote_tally = self._tally_votes(arguments)
        
        print(f"   📊 Vote tally: {vote_tally}")
        
        # Generate synthesis
        synthesis = await self._synthesize_arguments(
            debate_topic=debate_topic,
            arguments=arguments,
            vote_tally=vote_tally,
            user_context=user_context
        )
        
        print(f"   ✨ Synthesis complete")
        
        # Extract research citations from all arguments
        citations = self._extract_citations(arguments)
        
        return {
            "debate_topic": debate_topic,
            "timestamp": datetime.utcnow(),
            "participants": [a.name for a in debate_agents],
            "rounds": rounds,
            "arguments": arguments,
            "vote_tally": vote_tally,
            "synthesis": synthesis,
            "research_citations": citations,
            "winner": vote_tally.get("winner"),
            "consensus": vote_tally.get("consensus", False)
        }
    
    def _tally_votes(self, arguments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Tally votes from debate arguments.
        
        Returns:
            Dict with vote counts, winner, and consensus info
        """
        support_votes = []
        oppose_votes = []
        abstain_votes = []
        
        for arg in arguments:
            vote = arg.get("vote", "abstain").lower()
            agent_name = arg.get("agent_name")
            
            if "support" in vote or "yes" in vote or "favor" in vote:
                support_votes.append(agent_name)
            elif "oppose" in vote or "no" in vote or "against" in vote:
                oppose_votes.append(agent_name)
            else:
                abstain_votes.append(agent_name)
        
        total_votes = len(support_votes) + len(oppose_votes)
        
        # Determine winner
        if len(support_votes) > len(oppose_votes):
            winner = "support"
            margin = len(support_votes) - len(oppose_votes)
        elif len(oppose_votes) > len(support_votes):
            winner = "oppose"
            margin = len(oppose_votes) - len(support_votes)
        else:
            winner = "tie"
            margin = 0
        
        # Check for consensus (75%+ agreement)
        consensus = False
        if total_votes > 0:
            support_pct = len(support_votes) / total_votes
            oppose_pct = len(oppose_votes) / total_votes
            consensus = support_pct >= 0.75 or oppose_pct >= 0.75
        
        return {
            "support": len(support_votes),
            "oppose": len(oppose_votes),
            "abstain": len(abstain_votes),
            "support_votes": support_votes,
            "oppose_votes": oppose_votes,
            "abstain_votes": abstain_votes,
            "winner": winner,
            "margin": margin,
            "consensus": consensus,
            "total_votes": total_votes
        }
    
    async def _synthesize_arguments(
        self,
        debate_topic: str,
        arguments: List[Dict[str, Any]],
        vote_tally: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> str:
        """
        Synthesize debate arguments into actionable recommendation.
        
        Uses main Claude instance (not an agent) to objectively combine viewpoints.
        """
        # Build synthesis prompt
        synthesis_prompt = f"""You are synthesizing a multi-agent debate into actionable advice for a novelist.

DEBATE TOPIC: {debate_topic}

USER CONTEXT:
{user_context}

AGENT ARGUMENTS:
"""
        
        for arg in arguments:
            synthesis_prompt += f"\n{arg['agent_name']} ({arg['vote']}):\n{arg['argument']}\n"
        
        synthesis_prompt += f"""

VOTE TALLY:
- Support: {vote_tally['support']} votes
- Oppose: {vote_tally['oppose']} votes
- Abstain: {vote_tally['abstain']} votes
- Winner: {vote_tally['winner']}
- Consensus: {vote_tally['consensus']}

YOUR TASK:
Synthesize these arguments into clear, actionable recommendation. Consider:
1. What did the majority vote for? (weight heavily)
2. What valid concerns did the minority raise?
3. Is there a compromise that satisfies both sides?
4. What's the BEST advice for the user's specific context?

RESPONSE FORMAT:
[2-3 paragraphs of synthesis]

Begin with the winning position, acknowledge valid opposing points, then give final recommendation.
Be decisive but nuanced. Make this USEFUL."""

        # Use first agent's client to generate synthesis (any agent will do)
        if not self.agents:
            return "Unable to synthesize - no agents available."
        
        synthesis_agent = self.agents[0]
        
        response = await synthesis_agent.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": synthesis_prompt
            }]
        )
        
        return response.content[0].text
    
    def _extract_citations(self, arguments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract research document citations from debate arguments.
        
        Looks for patterns like:
        - "line 3,421"
        - "research doc line 1,847"
        - "per line 867"
        
        Returns:
            List of citations with line numbers and content
        """
        import re
        
        citations = []
        seen_lines = set()
        
        citation_pattern = r'(?:line|lines)\s+(\d{1,5})'
        
        for arg in arguments:
            argument_text = arg.get("argument", "")
            
            # Find all line number references
            matches = re.finditer(citation_pattern, argument_text, re.IGNORECASE)
            
            for match in matches:
                line_num = int(match.group(1))
                
                # Avoid duplicate citations
                if line_num in seen_lines:
                    continue
                
                seen_lines.add(line_num)
                
                # Get actual line content from research doc
                line_data = self.research_service.get_line(line_num, context_lines=1)
                
                if line_data:
                    citations.append({
                        "line_number": line_num,
                        "cited_by": arg["agent_name"],
                        "content": line_data["content"],
                        "context": line_data["context"]
                    })
        
        # Sort by line number
        citations.sort(key=lambda x: x["line_number"])
        
        return citations
    
    async def quick_consensus_check(
        self,
        question: str,
        user_context: Dict[str, Any],
        required_agents: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Quick consensus check - each agent votes without full arguments.
        Faster than full debate for simple yes/no questions.
        
        Args:
            question: Yes/no question
            user_context: Context for decision
            required_agents: Specific agents to consult (None = all)
            
        Returns:
            Dict with votes and quick synthesis
        """
        agents = self.agents
        if required_agents:
            agents = [a for a in self.agents if a.agent_id in required_agents]
        
        votes = []
        
        for agent in agents:
            # Quick vote prompt
            vote_prompt = f"""Quick consensus vote (one sentence + vote):

QUESTION: {question}

CONTEXT: {user_context}

Respond with:
VOTE: [support/oppose/abstain]
REASON: [One sentence why]
"""
            
            response = await agent.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=256,
                temperature=0.7,
                system=agent.get_system_prompt(),
                messages=[{"role": "user", "content": vote_prompt}]
            )
            
            response_text = response.content[0].text
            
            # Parse vote
            vote = "abstain"
            reason = response_text
            
            if "VOTE:" in response_text:
                parts = response_text.split("REASON:")
                vote = parts[0].replace("VOTE:", "").strip().lower()
                if len(parts) > 1:
                    reason = parts[1].strip()
            
            votes.append({
                "agent_name": agent.name,
                "vote": vote,
                "reason": reason
            })
        
        # Tally
        vote_tally = self._tally_votes(votes)
        
        return {
            "question": question,
            "votes": votes,
            "vote_tally": vote_tally,
            "quick_consensus": True
        }


def create_debate_orchestrator(avatars: List[Avatar]) -> DebateOrchestrator:
    """Factory function to create debate orchestrator"""
    return DebateOrchestrator(avatars=avatars)
