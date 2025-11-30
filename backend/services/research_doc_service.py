"""
Research Document Integration Service

Provides semantic search and line-number citation for RESEARCH_SOURCES_COMPILATION.md.
Used by agents in debate mode to cite authoritative sources.
"""

import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import re


class ResearchDocumentService:
    """
    Service for searching and citing the RESEARCH_SOURCES_COMPILATION.md document.
    
    Features:
    - Load 8,239-line research document
    - Semantic search for relevant passages
    - Line number tracking for citations
    - Genre-specific section extraction
    - Craft technique lookup
    """
    
    def __init__(self, doc_path: Optional[str] = None):
        """
        Initialize research document service.
        
        Args:
            doc_path: Path to RESEARCH_SOURCES_COMPILATION.md 
                     (defaults to docs/RESEARCH_SOURCES_COMPILATION.md)
        """
        if doc_path is None:
            # Default to docs folder in project root
            project_root = Path(__file__).parent.parent.parent
            doc_path = project_root / "docs" / "RESEARCH_SOURCES_COMPILATION.md"
        
        self.doc_path = Path(doc_path)
        self.content: List[str] = []
        self.line_index: Dict[int, str] = {}
        self.genre_sections: Dict[str, Dict[str, int]] = {}
        
        # Load document on initialization
        self._load_document()
        self._build_index()
    
    def _load_document(self):
        """Load research document into memory"""
        if not self.doc_path.exists():
            raise FileNotFoundError(f"Research document not found: {self.doc_path}")
        
        with open(self.doc_path, 'r', encoding='utf-8') as f:
            self.content = f.readlines()
        
        # Build line index (1-based for human-readable citations)
        self.line_index = {i + 1: line for i, line in enumerate(self.content)}
        
        print(f"✅ Loaded research document: {len(self.content)} lines")
    
    def _build_index(self):
        """
        Build index of genre sections for fast lookup.
        
        Identifies sections like:
        - Task 1: Christian, Romance, Fantasy, Science Fiction
        - Task 2: Mystery, Thriller, Horror, Historical
        - Etc.
        """
        current_task = None
        current_genre = None
        
        for line_num, line in self.line_index.items():
            line_lower = line.lower().strip()
            
            # Detect task headers
            if line_lower.startswith("task"):
                current_task = line.strip()
                continue
            
            # Detect genre headers (look for bold markdown or section headers)
            if line_lower.startswith("###") or line_lower.startswith("**"):
                # Extract genre name
                genre_match = re.search(r'[#*\s]*([A-Za-z\s]+?)[\s*:#]*', line)
                if genre_match:
                    current_genre = genre_match.group(1).strip().lower()
                    
                    if current_task and current_genre:
                        if current_genre not in self.genre_sections:
                            self.genre_sections[current_genre] = {}
                        
                        self.genre_sections[current_genre]['start'] = line_num
                        self.genre_sections[current_genre]['task'] = current_task
        
        print(f"✅ Indexed {len(self.genre_sections)} genre sections")
    
    def search(
        self,
        query: str,
        max_results: int = 5,
        genre_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search research document for relevant passages.
        
        Args:
            query: Search query (keywords or semantic search)
            max_results: Maximum number of results to return
            genre_filter: Optional genre to filter results (e.g., "romance", "mystery")
            
        Returns:
            List of results with line numbers, content, and relevance scores
        """
        results = []
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        
        # Determine search range
        start_line = 1
        end_line = len(self.content)
        
        if genre_filter and genre_filter.lower() in self.genre_sections:
            genre_section = self.genre_sections[genre_filter.lower()]
            start_line = genre_section.get('start', 1)
            # Find end by looking for next genre section
            end_line = start_line + 500  # Default window
        
        # Simple keyword matching (TODO: Upgrade to semantic/vector search)
        for line_num in range(start_line, min(end_line + 1, len(self.content) + 1)):
            line = self.line_index.get(line_num, "")
            line_lower = line.lower()
            
            # Check for exact phrase match
            if query_lower in line_lower:
                score = 1.0
            else:
                # Check for keyword overlap
                line_terms = set(line_lower.split())
                overlap = query_terms.intersection(line_terms)
                score = len(overlap) / len(query_terms) if query_terms else 0
            
            if score > 0.3:  # Relevance threshold
                # Get context (surrounding lines)
                context_start = max(1, line_num - 2)
                context_end = min(len(self.content), line_num + 2)
                context = ''.join([
                    self.line_index.get(i, "") 
                    for i in range(context_start, context_end + 1)
                ])
                
                results.append({
                    'line_number': line_num,
                    'content': line.strip(),
                    'context': context.strip(),
                    'score': score
                })
        
        # Sort by relevance score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:max_results]
    
    def get_line(self, line_number: int, context_lines: int = 2) -> Optional[Dict[str, Any]]:
        """
        Get specific line with context for debate citations.
        
        Args:
            line_number: Line number to retrieve (1-based)
            context_lines: Number of surrounding lines to include
            
        Returns:
            Dict with line content, context, and metadata
        """
        if line_number not in self.line_index:
            return None
        
        # Get context
        context_start = max(1, line_number - context_lines)
        context_end = min(len(self.content), line_number + context_lines)
        
        context = ''.join([
            self.line_index.get(i, "") 
            for i in range(context_start, context_end + 1)
        ])
        
        return {
            'line_number': line_number,
            'content': self.line_index[line_number].strip(),
            'context': context.strip(),
            'context_range': f"Lines {context_start}-{context_end}"
        }
    
    def get_genre_section(self, genre: str) -> Optional[Dict[str, Any]]:
        """
        Get entire section for a specific genre.
        
        Args:
            genre: Genre name (e.g., "romance", "mystery", "fantasy")
            
        Returns:
            Dict with section content and metadata
        """
        genre_lower = genre.lower()
        
        if genre_lower not in self.genre_sections:
            return None
        
        section = self.genre_sections[genre_lower]
        start_line = section.get('start', 1)
        
        # Find end of section (next genre or task)
        end_line = start_line + 500  # Default window
        for line_num in range(start_line + 1, len(self.content) + 1):
            line = self.line_index.get(line_num, "")
            if line.strip().startswith("###") or line.strip().startswith("Task"):
                end_line = line_num - 1
                break
        
        # Extract section content
        content = ''.join([
            self.line_index.get(i, "")
            for i in range(start_line, end_line + 1)
        ])
        
        return {
            'genre': genre,
            'task': section.get('task', 'Unknown'),
            'line_range': f"Lines {start_line}-{end_line}",
            'start_line': start_line,
            'end_line': end_line,
            'content': content.strip()
        }
    
    def search_craft_technique(self, technique: str) -> List[Dict[str, Any]]:
        """
        Search for specific craft techniques (Sanderson's Laws, Save the Cat, etc.).
        
        Args:
            technique: Craft technique name
            
        Returns:
            List of relevant passages with line numbers
        """
        # Common craft technique keywords
        technique_keywords = {
            'sanderson': ['sanderson', 'magic system', 'magic law'],
            'save the cat': ['save the cat', 'beat sheet'],
            'hero journey': ['hero\'s journey', 'monomyth', 'campbell'],
            'three act': ['three-act', 'three act', 'act structure'],
            'romance beats': ['romance', 'emotional beat', 'hea'],
            'mystery clues': ['mystery', 'clue', 'red herring', 'fair play']
        }
        
        # Find matching keywords
        query_terms = []
        technique_lower = technique.lower()
        
        for key, keywords in technique_keywords.items():
            if key in technique_lower or technique_lower in key:
                query_terms.extend(keywords)
                break
        
        if not query_terms:
            query_terms = [technique]
        
        # Search using combined keywords
        query = ' '.join(query_terms)
        return self.search(query, max_results=10)
    
    def get_all_genres(self) -> List[str]:
        """Get list of all indexed genres"""
        return sorted(self.genre_sections.keys())
    
    def format_citation(self, line_number: int, style: str = "inline") -> str:
        """
        Format citation for debate arguments.
        
        Args:
            line_number: Line number to cite
            style: Citation style ("inline", "academic", "casual")
            
        Returns:
            Formatted citation string
        """
        if line_number not in self.line_index:
            return f"[Line {line_number}: Not found]"
        
        content = self.line_index[line_number].strip()
        
        if style == "inline":
            return f"(research doc line {line_number})"
        elif style == "academic":
            return f"(RESEARCH_SOURCES_COMPILATION.md, line {line_number})"
        elif style == "casual":
            return f"According to line {line_number} of the research doc"
        else:
            return f"[Line {line_number}]"


# Global instance for shared use
_research_doc_service: Optional[ResearchDocumentService] = None


def get_research_doc_service() -> ResearchDocumentService:
    """Get or create global research document service instance"""
    global _research_doc_service
    
    if _research_doc_service is None:
        _research_doc_service = ResearchDocumentService()
    
    return _research_doc_service
