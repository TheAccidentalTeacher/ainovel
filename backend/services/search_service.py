"""
Web search service for gathering additional context from the internet.
Uses Tavily API for AI-optimized search results with advanced features.
"""
from typing import List, Dict, Any, Optional, Literal
import structlog
from tavily import AsyncTavilyClient
from config.settings import get_settings

logger = structlog.get_logger(__name__)


class SearchService:
    """
    Advanced Tavily search service with full API capabilities.
    
    Features:
    - Multiple search depths (basic/advanced)
    - Topic-specific searches (general/news/finance)
    - Time-based filtering
    - Domain inclusion/exclusion
    - Image search with descriptions
    - Answer generation
    - Raw content extraction
    """
    
    def __init__(self):
        settings = get_settings()
        self.tavily_api_key = settings.tavily_api_key
        self.client = AsyncTavilyClient(api_key=self.tavily_api_key) if self.tavily_api_key else None
        self.timeout = 30.0
        
    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: Literal["basic", "advanced"] = "basic",
        topic: Literal["general", "news", "finance"] = "general",
        time_range: Optional[str] = None,
        include_answer: bool = True,
        include_raw_content: bool = False,
        include_images: bool = False,
        include_image_descriptions: bool = False,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
        chunks_per_source: int = 3
    ) -> Dict[str, Any]:
        """
        Advanced Tavily search with full parameter support.
        
        Args:
            query: Search query string
            max_results: Maximum number of results (1-20)
            search_depth: "basic" (fast, 1 credit) or "advanced" (thorough, 2 credits)
            topic: "general", "news" (with publish dates), or "finance"
            time_range: Time filter ("day", "week", "month", "year" or "d", "w", "m", "y")
            include_answer: Generate LLM answer from search results
            include_raw_content: Include full page content (markdown/text)
            include_images: Include related image URLs
            include_image_descriptions: Include AI-generated image descriptions
            include_domains: Whitelist specific domains (max 300)
            exclude_domains: Blacklist specific domains (max 150)
            chunks_per_source: Content chunks per source (advanced only, max 500 chars each)
            
        Returns:
            Dictionary with search results, answer, images, and metadata
        """
        if not self.client:
            logger.warning("TAVILY_API_KEY not set, search disabled")
            return {
                "success": False,
                "error": "Web search is not configured. Set TAVILY_API_KEY environment variable.",
                "results": []
            }
            
        try:
            # Build search parameters
            search_params = {
                "query": query,
                "max_results": max_results,
                "search_depth": search_depth,
                "topic": topic,
                "include_answer": include_answer,
                "include_raw_content": include_raw_content,
                "include_images": include_images,
                "include_image_descriptions": include_image_descriptions,
                "timeout": self.timeout
            }
            
            # Add optional parameters
            if time_range:
                search_params["time_range"] = time_range
            if include_domains:
                search_params["include_domains"] = include_domains[:300]  # Max 300
            if exclude_domains:
                search_params["exclude_domains"] = exclude_domains[:150]  # Max 150
            if search_depth == "advanced":
                search_params["chunks_per_source"] = chunks_per_source
            
            # Execute search
            response = await self.client.search(**search_params)
            
            logger.info(
                "web_search_completed",
                query=query,
                results_count=len(response.get("results", [])),
                search_depth=search_depth,
                topic=topic,
                has_answer=bool(response.get("answer"))
            )
            
            return {
                "success": True,
                "query": response.get("query", query),
                "answer": response.get("answer"),
                "results": self._format_results(response.get("results", [])),
                "images": response.get("images", []),
                "response_time": response.get("response_time", 0)
            }
                
        except Exception as e:
            logger.error("web_search_failed", query=query, error=str(e))
            return {
                "success": False,
                "error": f"Search failed: {str(e)}",
                "results": []
            }
            
    async def search_news(
        self,
        query: str,
        max_results: int = 5,
        time_range: str = "week",
        search_depth: Literal["basic", "advanced"] = "basic"
    ) -> Dict[str, Any]:
        """
        Search recent news articles with publish dates.
        
        Args:
            query: News topic to search
            max_results: Number of articles (1-20)
            time_range: "day", "week", "month", "year"
            search_depth: "basic" or "advanced"
            
        Returns:
            News results with published_date field
        """
        return await self.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            topic="news",
            time_range=time_range,
            include_answer=True
        )
    
    async def search_with_images(
        self,
        query: str,
        max_results: int = 5,
        with_descriptions: bool = True
    ) -> Dict[str, Any]:
        """
        Search with AI-generated image descriptions (for visual research).
        
        Perfect for character faces, setting photos, mood boards.
        
        Args:
            query: Visual search query
            max_results: Number of results
            with_descriptions: Include AI descriptions of images
            
        Returns:
            Results with images and descriptions
        """
        return await self.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_images=True,
            include_image_descriptions=with_descriptions,
            include_answer=True
        )
    
    async def research_deep_dive(
        self,
        query: str,
        max_results: int = 10,
        chunks_per_source: int = 5
    ) -> Dict[str, Any]:
        """
        Deep research with maximum detail (uses 2 credits).
        
        Gets more content per source, raw HTML, and comprehensive answer.
        Best for detailed research on complex topics.
        
        Args:
            query: Research question
            max_results: Number of sources (1-20)
            chunks_per_source: Content chunks per source (1-10)
            
        Returns:
            Comprehensive research results with raw content
        """
        return await self.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            chunks_per_source=min(chunks_per_source, 10),
            include_answer="advanced",  # Detailed answer
            include_raw_content=True,
            include_images=True
        )
    
    def _format_results(self, results: List[Dict]) -> List[Dict[str, Any]]:
        """Format search results with all available fields."""
        formatted = []
        for result in results:
            formatted_result = {
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", ""),
                "score": result.get("score", 0.0)
            }
            
            # Add optional fields if present
            if "raw_content" in result:
                formatted_result["raw_content"] = result["raw_content"]
            if "published_date" in result:
                formatted_result["published_date"] = result["published_date"]
            if "favicon" in result:
                formatted_result["favicon"] = result["favicon"]
                
            formatted.append(formatted_result)
        return formatted
        
    async def extract_url(
        self,
        urls: List[str],
        include_images: bool = False,
        extract_depth: Literal["basic", "advanced"] = "basic"
    ) -> Dict[str, Any]:
        """
        Extract clean content from specific URLs (no search).
        
        Perfect for extracting articles, documentation, or reference pages.
        
        Args:
            urls: List of URLs to extract (max 20)
            include_images: Extract images from pages
            extract_depth: "basic" (1 credit per 5 URLs) or "advanced" (2 credits per 5 URLs)
            
        Returns:
            Extracted content in markdown format
        """
        if not self.client:
            return {"success": False, "error": "Tavily not configured", "results": []}
        
        try:
            response = await self.client.extract(
                urls=urls[:20],  # Max 20 URLs
                include_images=include_images,
                extract_depth=extract_depth
            )
            
            logger.info(
                "url_extraction_completed",
                urls_requested=len(urls),
                successful=len(response.get("results", [])),
                failed=len(response.get("failed_results", []))
            )
            
            return {
                "success": True,
                "results": response.get("results", []),
                "failed_results": response.get("failed_results", []),
                "response_time": response.get("response_time", 0)
            }
        except Exception as e:
            logger.error("url_extraction_failed", error=str(e))
            return {"success": False, "error": str(e), "results": []}
    
    async def search_domain_specific(
        self,
        query: str,
        include_domains: List[str],
        max_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search within specific trusted domains only.
        
        Example domains for novel research:
        - ["britannica.com", "wikipedia.org"] - Encyclopedia
        - ["ncbi.nlm.nih.gov"] - Medical research
        - ["nasa.gov", "space.com"] - Space/science
        - ["history.com", "smithsonianmag.com"] - Historical
        
        Args:
            query: Search query
            include_domains: Whitelist of domains
            max_results: Number of results
            
        Returns:
            Results from specified domains only
        """
        return await self.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_domains=include_domains,
            include_answer=True
        )
    
    def format_context(self, search_results: Dict[str, Any], include_raw: bool = False) -> str:
        """
        Format search results as context for AI model.
        
        Args:
            search_results: Dictionary from search() method
            include_raw: Include full raw_content if available
            
        Returns:
            Formatted string for model context
        """
        if not search_results.get("success"):
            return ""
            
        context_parts = ["=== WEB SEARCH RESULTS ===\n"]
        
        # Add direct answer if available
        if search_results.get("answer"):
            context_parts.append(f"Quick Answer: {search_results['answer']}\n")
            
        # Add images if available
        images = search_results.get("images", [])
        if images:
            context_parts.append(f"\nRelated Images ({len(images)}):\n")
            for img in images[:5]:  # Limit to 5 images
                if isinstance(img, dict):
                    context_parts.append(f"- {img.get('url')}: {img.get('description', 'N/A')}\n")
                else:
                    context_parts.append(f"- {img}\n")
            
        # Add search results
        context_parts.append("\nSources:\n")
        for i, result in enumerate(search_results.get("results", []), 1):
            context_parts.append(
                f"\n{i}. {result['title']}\n"
                f"   URL: {result['url']}\n"
            )
            
            # Add publish date for news
            if result.get("published_date"):
                context_parts.append(f"   Published: {result['published_date']}\n")
            
            # Add main content
            context_parts.append(f"   {result['content']}\n")
            
            # Optionally add full raw content for deep research
            if include_raw and result.get("raw_content"):
                context_parts.append(f"   Full Content:\n   {result['raw_content'][:2000]}...\n")
            
        context_parts.append("\n=== END SEARCH RESULTS ===\n")
        
        return "".join(context_parts)
    
    def create_research_prompt(self, query: str, search_results: Dict[str, Any]) -> str:
        """
        Create optimized prompt combining query with search results.
        
        Perfect for feeding to AI models for synthesis.
        
        Args:
            query: Original user question
            search_results: Results from search() method
            
        Returns:
            Formatted prompt for AI
        """
        if not search_results.get("success"):
            return f"User Question: {query}\n\n(No search results available)"
        
        prompt_parts = [
            "Based on the following web research, please answer the user's question:\n",
            self.format_context(search_results),
            f"\nUser Question: {query}\n",
            "\nPlease provide a comprehensive answer using the search results above. ",
            "Cite sources by number when referencing specific information."
        ]
        
        return "".join(prompt_parts)


# Global instance
search_service = SearchService()
