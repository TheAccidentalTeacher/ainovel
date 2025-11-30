"""
🦸 CODE MASTER: Comprehensive Health Check & Function Testing
"By the power of clean code!" - Test all functions with one click!

This endpoint tests all critical backend functions and returns a dashboard-style report.
Access at: http://localhost:8000/api/health-check/full
"""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List
import asyncio
from datetime import datetime

from models.database import get_database
from services.premise_builder_service import PremiseBuilderService
from services.chat_service import ChatService
from config.settings import get_settings

router = APIRouter()


class HealthChecker:
    """Run comprehensive health checks on all backend functions"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.settings = get_settings()
        self.results: List[Dict[str, Any]] = []
        
    async def check_database_connection(self) -> Dict[str, Any]:
        """Test MongoDB connection and basic operations"""
        try:
            # Test connection
            await self.db.command('ping')
            
            # Test collections exist
            collections = await self.db.list_collection_names()
            expected = ['projects', 'premises', 'outlines', 'chapters', 'conversations', 'messages']
            missing = [c for c in expected if c not in collections]
            
            return {
                "test": "Database Connection",
                "status": "✅ PASS" if not missing else "⚠️ WARNING",
                "details": f"Connected to {self.db.name}",
                "collections_found": len(collections),
                "missing_collections": missing or "None",
                "duration_ms": 0
            }
        except Exception as e:
            return {
                "test": "Database Connection",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_ai_providers(self) -> Dict[str, Any]:
        """Test AI provider API keys are configured"""
        try:
            results = []
            
            # Check Anthropic
            if self.settings.anthropic_api_key and self.settings.anthropic_api_key != "your-key-here":
                results.append("✅ Anthropic (Claude)")
            else:
                results.append("❌ Anthropic NOT configured")
            
            # Check OpenAI
            if self.settings.openai_api_key and self.settings.openai_api_key != "your-key-here":
                results.append("✅ OpenAI (GPT)")
            else:
                results.append("❌ OpenAI NOT configured")
            
            # Check Tavily (optional)
            if hasattr(self.settings, 'tavily_api_key') and self.settings.tavily_api_key:
                results.append("✅ Tavily (Web Search)")
            else:
                results.append("⚠️ Tavily not configured (optional)")
            
            status = "✅ PASS" if "❌" not in "\n".join(results) else "⚠️ WARNING"
            
            return {
                "test": "AI Provider Configuration",
                "status": status,
                "details": results,
                "duration_ms": 0
            }
        except Exception as e:
            return {
                "test": "AI Provider Configuration",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_premise_builder(self) -> Dict[str, Any]:
        """Test premise builder service"""
        try:
            start = datetime.now()
            service = PremiseBuilderService(self.db)
            
            # Test service initialization and core attributes
            assert service.db is not None
            assert service.sessions_collection is not None
            assert service.ai_service is not None
            
            duration = (datetime.now() - start).total_seconds() * 1000
            
            return {
                "test": "Premise Builder Service",
                "status": "✅ PASS",
                "details": "Service initialized with database and AI service",
                "duration_ms": round(duration, 2)
            }
        except Exception as e:
            return {
                "test": "Premise Builder Service",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_chapter_service(self) -> Dict[str, Any]:
        """Test chapter generation service (function-based)"""
        try:
            start = datetime.now()
            
            # Test that chapter service module can be imported
            from services import chapter_service
            assert hasattr(chapter_service, 'generate_chapter_from_outline')
            
            duration = (datetime.now() - start).total_seconds() * 1000
            
            return {
                "test": "Chapter Service",
                "status": "✅ PASS",
                "details": "Chapter generation function available",
                "duration_ms": round(duration, 2)
            }
        except Exception as e:
            return {
                "test": "Chapter Service",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_outline_service(self) -> Dict[str, Any]:
        """Test outline generation service"""
        try:
            start = datetime.now()
            
            # Test that outline service module can be imported
            from services import outline_service
            # Check for the actual function that exists
            has_function = (hasattr(outline_service, 'generate_outline') or 
                          hasattr(outline_service, 'generate_outline_from_premise'))
            assert has_function, "Outline generation functions not found"
            
            duration = (datetime.now() - start).total_seconds() * 1000
            
            return {
                "test": "Outline Service",
                "status": "✅ PASS",
                "details": "Outline generation functions available",
                "duration_ms": round(duration, 2)
            }
        except Exception as e:
            return {
                "test": "Outline Service",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_story_bible_service(self) -> Dict[str, Any]:
        """Test story bible extraction service"""
        try:
            start = datetime.now()
            
            # Test that story bible service module can be imported
            from services import story_bible_service
            # Check for actual functions that exist
            has_generate = hasattr(story_bible_service, 'generate_story_bible_from_premise')
            has_format = hasattr(story_bible_service, 'format_story_bible_for_context')
            assert has_generate and has_format, "Story Bible functions not found"
            
            duration = (datetime.now() - start).total_seconds() * 1000
            
            return {
                "test": "Story Bible Service",
                "status": "✅ PASS",
                "details": "Story Bible generation and formatting functions available",
                "duration_ms": round(duration, 2)
            }
        except Exception as e:
            return {
                "test": "Story Bible Service",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def check_chat_service(self) -> Dict[str, Any]:
        """Test chat/chatbot service"""
        try:
            start = datetime.now()
            service = ChatService(self.db)
            
            # Test service initialization
            assert service.db is not None
            assert service.anthropic is not None
            assert service.openai is not None
            
            # Test model configurations
            models = service.models
            assert len(models) > 0
            
            duration = (datetime.now() - start).total_seconds() * 1000
            
            return {
                "test": "Chat Service (Code Master!)",
                "status": "✅ PASS",
                "details": f"{len(models)} AI models configured, ready for heroic assistance!",
                "duration_ms": round(duration, 2)
            }
        except Exception as e:
            return {
                "test": "Chat Service",
                "status": "❌ FAIL",
                "error": str(e),
                "duration_ms": 0
            }
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive report"""
        checks = [
            self.check_database_connection(),
            self.check_ai_providers(),
            self.check_premise_builder(),
            self.check_chapter_service(),
            self.check_outline_service(),
            self.check_story_bible_service(),
            self.check_chat_service(),
        ]
        
        results = await asyncio.gather(*checks, return_exceptions=True)
        
        # Handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "test": f"Check #{i+1}",
                    "status": "❌ FAIL",
                    "error": str(result),
                    "duration_ms": 0
                })
            else:
                processed_results.append(result)
        
        # Calculate summary
        total_tests = len(processed_results)
        passed = sum(1 for r in processed_results if r["status"] == "✅ PASS")
        warnings = sum(1 for r in processed_results if r["status"] == "⚠️ WARNING")
        failed = sum(1 for r in processed_results if r["status"] == "❌ FAIL")
        total_duration = sum(r.get("duration_ms", 0) for r in processed_results)
        
        overall_status = "✅ ALL SYSTEMS GO" if failed == 0 else "❌ SYSTEMS DOWN" if passed == 0 else "⚠️ PARTIAL FAILURE"
        
        return {
            "timestamp": datetime.now().isoformat(),
            "overall_status": overall_status,
            "summary": {
                "total_tests": total_tests,
                "passed": passed,
                "warnings": warnings,
                "failed": failed,
                "total_duration_ms": round(total_duration, 2)
            },
            "tests": processed_results,
            "message": "🦸 Code Master says: " + (
                "Thunder, Thunder, ThunderCats! All systems operational! ⚡🐯" if failed == 0
                else "By the power of Grayskull! We have failures to address! ⚔️" if passed == 0
                else "Eyes of the Hawk activated - some systems need attention! ⭐"
            )
        }


@router.get("/health-check/full")
async def full_health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    🦸 CODE MASTER: Complete System Health Check
    
    Tests all backend functions and returns comprehensive report.
    Click this endpoint to test everything at once!
    
    Returns:
        - Overall status
        - Individual test results
        - Performance metrics
        - Heroic encouragement from Code Master!
    """
    checker = HealthChecker(db)
    return await checker.run_all_checks()


@router.get("/health-check/quick")
async def quick_health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Quick health check - just database and AI providers
    """
    checker = HealthChecker(db)
    
    results = await asyncio.gather(
        checker.check_database_connection(),
        checker.check_ai_providers()
    )
    
    failed = sum(1 for r in results if r["status"] == "❌ FAIL")
    status = "✅ HEALTHY" if failed == 0 else "❌ UNHEALTHY"
    
    return {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "checks": results
    }
