"""
Prompt template management system.

Loads, validates, and renders prompt templates with variable substitution.
Templates are stored in YAML format with metadata and slot definitions.
"""

import yaml
from pathlib import Path
from typing import Dict, Any, Optional

import structlog

logger = structlog.get_logger()

_template_cache: Dict[str, Dict[str, Any]] = {}


class PromptTemplate:
    """
    Prompt template with variable slots and metadata.
    
    Templates define:
    - Template text with {variable} placeholders
    - Metadata (intended model, token limits, etc.)
    - Validation rules for required variables
    """
    
    def __init__(self, template_id: str, data: Dict[str, Any]):
        """
        Initialize prompt template.
        
        Args:
            template_id: Unique template identifier
            data: Template data from YAML
        """
        self.template_id = template_id
        self.name = data.get("name", template_id)
        self.description = data.get("description", "")
        self.template_text = data.get("template", "")
        self.system_prompt = data.get("system_prompt")
        self.variables = data.get("variables", [])
        self.metadata = data.get("metadata", {})
    
    def render(self, variables: Dict[str, str]) -> str:
        """
        Render template with provided variables.
        
        Args:
            variables: Dictionary of variable name -> value
            
        Returns:
            Rendered prompt text
            
        Raises:
            ValueError: If required variables are missing
        """
        # Check required variables
        missing = [var for var in self.variables if var not in variables]
        if missing:
            raise ValueError(f"Missing required variables: {missing}")
        
        # Simple string substitution (can be enhanced with jinja2)
        rendered = self.template_text
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            rendered = rendered.replace(placeholder, str(value))
        
        return rendered
    
    def get_system_prompt(self) -> Optional[str]:
        """Get system prompt if defined."""
        return self.system_prompt


def load_templates() -> None:
    """
    Load all prompt templates from config/prompt_templates directory.
    
    Templates are cached in memory after first load.
    """
    global _template_cache
    
    if _template_cache:
        return  # Already loaded
    
    project_root = Path(__file__).parent.parent.parent
    templates_dir = project_root / "config" / "prompt_templates"
    
    if not templates_dir.exists():
        logger.warning("prompt_templates_directory_not_found", path=str(templates_dir))
        return
    
    for template_file in templates_dir.glob("*.yaml"):
        try:
            with open(template_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            
            template_id = template_file.stem
            _template_cache[template_id] = data
            
            logger.info("template_loaded", template_id=template_id, file=template_file.name)
            
        except Exception as e:
            logger.error("template_load_failed", file=template_file.name, error=str(e))
    
    logger.info("templates_loaded", count=len(_template_cache))


def get_template(template_id: str) -> PromptTemplate:
    """
    Get a prompt template by ID.
    
    Args:
        template_id: Template identifier (filename without .yaml)
        
    Returns:
        PromptTemplate: Template instance
        
    Raises:
        ValueError: If template not found
    """
    load_templates()  # Ensure templates are loaded
    
    if template_id not in _template_cache:
        raise ValueError(f"Template not found: {template_id}")
    
    return PromptTemplate(template_id, _template_cache[template_id])


def list_templates() -> Dict[str, str]:
    """
    List all available templates.
    
    Returns:
        Dict mapping template_id -> description
    """
    load_templates()
    
    return {
        template_id: data.get("description", "No description")
        for template_id, data in _template_cache.items()
    }


def clear_template_cache() -> None:
    """Clear template cache (useful for testing or hot-reloading)."""
    global _template_cache
    _template_cache = {}
