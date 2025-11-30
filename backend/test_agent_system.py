"""
Quick Test Script for Agent System

Tests:
1. List agents endpoint
2. Research Assistant chat
3. Simple debate
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/agents"


def test_list_agents():
    """Test: List all agents"""
    print("=== TEST 1: List Agents ===")
    
    response = requests.get(f"{BASE_URL}/list")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {data['count']} agents:")
        for agent in data['agents']:
            print(f"   - {agent['name']} ({agent['short_name']}): {agent['personality_description']}")
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        return False


def test_research_assistant_chat():
    """Test: Chat with Research Assistant"""
    print("\n=== TEST 2: Chat with Research Assistant ===")
    
    payload = {
        "agent_id": "research_assistant_001",
        "message": "Could my 1870 protagonist in England own her own house if she's married?",
        "context": {
            "genre": "historical_romance",
            "time_period": "1870"
        }
    }
    
    print(f"Question: {payload['message']}")
    print("Waiting for Research Assistant...")
    
    response = requests.post(f"{BASE_URL}/chat", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ {data['agent_name']} responded:")
        print(f"\n{data['response']}\n")
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        return False


def test_simple_debate():
    """Test: Start a simple debate"""
    print("\n=== TEST 3: Simple Debate ===")
    
    payload = {
        "debate_topic": "Should I kill the love interest in Act 2?",
        "context": {
            "genre": "romance",
            "current_act": 2,
            "protagonist": "Sarah",
            "love_interest": "Marcus",
            "plot_summary": "Sarah and Marcus have been developing chemistry. Big midpoint reversal coming."
        },
        "participating_agents": ["research_assistant_001"],  # Just Research Assistant for quick test
        "rounds": 1
    }
    
    print(f"Debate Topic: {payload['debate_topic']}")
    print("Starting debate with Research Assistant...")
    
    response = requests.post(f"{BASE_URL}/debate", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Debate complete!")
        print(f"Participants: {', '.join(data['participants'])}")
        print(f"\nVote Tally:")
        print(f"  Support: {data['vote_tally']['support']}")
        print(f"  Oppose: {data['vote_tally']['oppose']}")
        print(f"  Abstain: {data['vote_tally']['abstain']}")
        print(f"  Winner: {data['vote_tally']['winner']}")
        
        print(f"\n--- ARGUMENTS ---")
        for arg in data['arguments']:
            print(f"\n{arg['agent_name']} ({arg['vote']}):")
            print(f"{arg['argument'][:500]}...")  # First 500 chars
        
        print(f"\n--- SYNTHESIS ---")
        print(f"{data['synthesis'][:500]}...")
        
        if data['research_citations']:
            print(f"\n--- RESEARCH CITATIONS ({len(data['research_citations'])}) ---")
            for cite in data['research_citations'][:3]:  # First 3
                print(f"  Line {cite['line_number']}: {cite['content'][:100]}...")
        
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        return False


def main():
    """Run all tests"""
    print("🧪 AGENT SYSTEM TEST SUITE\n")
    
    results = []
    
    # Test 1
    results.append(test_list_agents())
    
    # Test 2
    results.append(test_research_assistant_chat())
    
    # Test 3
    results.append(test_simple_debate())
    
    # Summary
    print("\n" + "="*60)
    print(f"RESULTS: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    
    print("="*60)


if __name__ == "__main__":
    main()
