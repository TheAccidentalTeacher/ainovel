"""
AI service layer for OpenAI and Anthropic integration.

Provides unified interface for interacting with multiple AI providers
with automatic fallback and retry logic.
"""

from typing import Optional, List, Dict, Any, AsyncIterator
from enum import Enum

import structlog
import httpx
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from config.settings import get_settings
from models.schemas import AIProvider, AIConfig

logger = structlog.get_logger()


class AIService:
    """
    Unified AI service supporting OpenAI and Anthropic.
    
    Handles model selection, prompt formatting, API calls, and error handling.
    """
    
    def __init__(self):
        """Initialize AI service with API clients."""
        settings = get_settings()
        
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        
        # Configure Anthropic client with connection pooling and timeouts
        if settings.anthropic_api_key:
            http_client = httpx.AsyncClient(
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
                timeout=httpx.Timeout(timeout=300.0, connect=10.0, read=300.0, write=30.0)
            )
            self.anthropic_client = AsyncAnthropic(
                api_key=settings.anthropic_api_key,
                http_client=http_client,
                max_retries=3
            )
        else:
            self.anthropic_client = None
        
        self.settings = settings
    
    async def generate_text(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate text using specified AI provider and configuration.
        
        Args:
            prompt: User prompt/input
            config: AI configuration (model, temperature, etc.)
            system_prompt: Optional system prompt for context
            
        Returns:
            Dict containing:
                - content: Generated text
                - tokens_used: Total tokens consumed
                - model: Model identifier used
                - provider: Provider used
                - finish_reason: Completion reason
                
        Raises:
            ValueError: If provider/model not available
            Exception: On API errors
        """
        if config.provider == AIProvider.ANTHROPIC:
            return await self._generate_anthropic(prompt, config, system_prompt)
        elif config.provider == AIProvider.OPENAI:
            return await self._generate_openai(prompt, config, system_prompt)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")
    
    async def _generate_anthropic(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate text using Anthropic Claude."""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        try:
            messages = [{"role": "user", "content": prompt}]
            
            kwargs: Dict[str, Any] = {
                "model": config.model_name,
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
                "messages": messages,
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            if config.top_p is not None:
                kwargs["top_p"] = config.top_p
            
            if config.stop_sequences:
                kwargs["stop_sequences"] = config.stop_sequences
            
            logger.info(
                "anthropic_request",
                model=config.model_name,
                max_tokens=config.max_tokens,
                temperature=config.temperature
            )
            
            # Set timeout to 20 minutes for long-running operations
            # The client now has built-in retry logic (max_retries=3)
            response = await self.anthropic_client.messages.create(**kwargs, timeout=1200.0)
            
            content = response.content[0].text if response.content else ""
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            
            logger.info(
                "anthropic_response",
                model=config.model_name,
                tokens_used=tokens_used,
                finish_reason=response.stop_reason
            )
            
            return {
                "content": content,
                "tokens_used": tokens_used,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "model": response.model,
                "provider": "anthropic",
                "finish_reason": response.stop_reason,
            }
            
        except Exception as e:
            logger.error("anthropic_generation_failed", error=str(e), model=config.model_name, exc_info=True)
            raise
    
    async def generate_text_stream(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Stream text generation using specified AI provider.
        
        Args:
            prompt: User prompt/input
            config: AI configuration (model, temperature, etc.)
            system_prompt: Optional system prompt for context
            
        Yields:
            Text chunks as they are generated
            
        Raises:
            ValueError: If provider/model not available
            Exception: On API errors
        """
        if config.provider == AIProvider.ANTHROPIC:
            async for chunk in self._generate_anthropic_stream(prompt, config, system_prompt):
                yield chunk
        elif config.provider == AIProvider.OPENAI:
            async for chunk in self._generate_openai_stream(prompt, config, system_prompt):
                yield chunk
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")
    
    async def _generate_anthropic_stream(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream text generation using Anthropic Claude."""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")
        
        try:
            messages = [{"role": "user", "content": prompt}]
            
            kwargs: Dict[str, Any] = {
                "model": config.model_name,
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
                "messages": messages,
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            if config.top_p is not None:
                kwargs["top_p"] = config.top_p
            
            if config.stop_sequences:
                kwargs["stop_sequences"] = config.stop_sequences
            
            logger.info(
                "anthropic_stream_request",
                model=config.model_name,
                max_tokens=config.max_tokens,
                temperature=config.temperature
            )
            
            async with self.anthropic_client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
            
            logger.info("anthropic_stream_complete", model=config.model_name)
            
        except Exception as e:
            logger.error("anthropic_stream_failed", error=str(e), model=config.model_name)
            raise
    
    async def _generate_openai_stream(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream text generation using OpenAI GPT."""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            kwargs: Dict[str, Any] = {
                "model": config.model_name,
                "messages": messages,
                "temperature": config.temperature,
                "max_tokens": config.max_tokens,
                "stream": True,
            }
            
            if config.top_p is not None:
                kwargs["top_p"] = config.top_p
            
            if config.frequency_penalty is not None:
                kwargs["frequency_penalty"] = config.frequency_penalty
            
            if config.presence_penalty is not None:
                kwargs["presence_penalty"] = config.presence_penalty
            
            if config.stop_sequences:
                kwargs["stop"] = config.stop_sequences
            
            logger.info(
                "openai_stream_request",
                model=config.model_name,
                max_tokens=config.max_tokens,
                temperature=config.temperature
            )
            
            stream = await self.openai_client.chat.completions.create(**kwargs)
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            
            logger.info("openai_stream_complete", model=config.model_name)
            
        except Exception as e:
            logger.error("openai_stream_failed", error=str(e), model=config.model_name)
            raise
    
    async def _generate_openai(
        self,
        prompt: str,
        config: AIConfig,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate text using OpenAI GPT."""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            kwargs: Dict[str, Any] = {
                "model": config.model_name,
                "messages": messages,
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
            }
            
            if config.top_p is not None:
                kwargs["top_p"] = config.top_p
            
            if config.frequency_penalty is not None:
                kwargs["frequency_penalty"] = config.frequency_penalty
            
            if config.presence_penalty is not None:
                kwargs["presence_penalty"] = config.presence_penalty
            
            if config.stop_sequences:
                kwargs["stop"] = config.stop_sequences
            
            logger.info(
                "openai_request",
                model=config.model_name,
                max_tokens=config.max_tokens,
                temperature=config.temperature
            )
            
            response = await self.openai_client.chat.completions.create(**kwargs)
            
            content = response.choices[0].message.content or ""
            tokens_used = response.usage.total_tokens if response.usage else 0
            
            logger.info(
                "openai_response",
                model=config.model_name,
                tokens_used=tokens_used,
                finish_reason=response.choices[0].finish_reason
            )
            
            return {
                "content": content,
                "tokens_used": tokens_used,
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0,
                "model": response.model,
                "provider": "openai",
                "finish_reason": response.choices[0].finish_reason,
            }
            
        except Exception as e:
            logger.error("openai_generation_failed", error=str(e), model=config.model_name)
            raise
    
    def get_available_models(self, provider: AIProvider) -> List[str]:
        """
        Get list of available models for a provider.
        
        Args:
            provider: AI provider
            
        Returns:
            List of model identifiers
        """
        if provider == AIProvider.ANTHROPIC:
            return [
                "claude-3-5-sonnet-20241022",
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307",
            ]
        elif provider == AIProvider.OPENAI:
            return [
                "gpt-4-turbo-preview",
                "gpt-4-1106-preview",
                "gpt-4",
                "gpt-4-32k",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k",
            ]
        return []


# Global service instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """
    Get or create the global AI service instance.
    
    Returns:
        AIService: Singleton AI service
    """
    global _ai_service
    
    if _ai_service is None:
        _ai_service = AIService()
    
    return _ai_service
