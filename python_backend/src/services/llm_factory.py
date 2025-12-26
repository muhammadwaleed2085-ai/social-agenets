"""
LLM Factory Service
Multi-provider LLM support with dynamic model creation
"""
import logging
from typing import Optional, Dict, Any, List

from ..config import settings

logger = logging.getLogger(__name__)


# Custom exceptions
class ModelNotAllowedError(Exception):
    """Raised when a model is not in the allowlist"""
    pass


class UnsupportedProviderError(Exception):
    """Raised when the provider is not supported"""
    pass


class MissingAPIKeyError(Exception):
    """Raised when the required API key is not configured"""
    pass


# Model allowlist - approved models for use
MODEL_ALLOWLIST: List[str] = [
    # OpenAI models
    "openai:gpt-4o",
    "openai:gpt-4o-mini",
    "openai:gpt-4-turbo",
    "openai:gpt-4",
    "openai:gpt-3.5-turbo",
    # Anthropic models
    "anthropic:claude-3-5-sonnet-20241022",
    "anthropic:claude-3-5-haiku-20241022",
    "anthropic:claude-3-opus-20240229",
    "anthropic:claude-3-sonnet-20240229",
    "anthropic:claude-3-haiku-20240307",
    # Google Gemini models
    "google-genai:gemini-2.0-flash-exp",
    "google-genai:gemini-1.5-pro",
    "google-genai:gemini-1.5-flash",
    "google-genai:gemini-1.5-flash-8b",
    # Groq models
    "groq:llama-3.3-70b-versatile",
    "groq:llama-3.1-70b-versatile",
    "groq:llama-3.1-8b-instant",
    "groq:mixtral-8x7b-32768",
]


def create_dynamic_model(model_id: str, **kwargs) -> Any:
    """
    Create a LangChain chat model dynamically based on provider
    
    Args:
        model_id: Model identifier in format "provider:model_name"
        **kwargs: Additional model configuration
        
    Returns:
        LangChain chat model instance
    """
    if model_id not in MODEL_ALLOWLIST:
        raise ModelNotAllowedError(f"Model '{model_id}' is not in the allowlist")
    
    if ":" not in model_id:
        raise ValueError(f"Invalid model_id format: {model_id}. Expected 'provider:model_name'")
    
    provider, model_name = model_id.split(":", 1)
    
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise MissingAPIKeyError("OpenAI API key not configured")
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name,
            api_key=settings.OPENAI_API_KEY,
            **kwargs
        )
    
    elif provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise MissingAPIKeyError("Anthropic API key not configured")
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model_name,
            api_key=settings.ANTHROPIC_API_KEY,
            **kwargs
        )
    
    elif provider == "google-genai":
        if not settings.gemini_key:
            raise MissingAPIKeyError("Google Gemini API key not configured")
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.gemini_key,
            **kwargs
        )
    
    elif provider == "groq":
        if not settings.GROQ_API_KEY:
            raise MissingAPIKeyError("Groq API key not configured")
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=model_name,
            api_key=settings.GROQ_API_KEY,
            **kwargs
        )
    
    else:
        raise UnsupportedProviderError(f"Provider '{provider}' is not supported")


class LLMFactory:
    """
    Factory class for managing LLM providers and model creation
    """
    
    def __init__(self):
        self._initialized = False
        self._available_providers: Dict[str, bool] = {}
        self._default_model_id = settings.DEFAULT_MODEL_ID or "openai:gpt-4o-mini"
    
    async def initialize(self) -> None:
        """Initialize the factory and check available providers"""
        logger.info("Initializing LLM Factory...")
        
        # Check which providers are configured
        self._available_providers = {
            "openai": bool(settings.OPENAI_API_KEY),
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "google-genai": bool(settings.gemini_key),
            "groq": bool(settings.GROQ_API_KEY),
        }
        
        available = [p for p, configured in self._available_providers.items() if configured]
        if available:
            logger.info(f"Available providers: {', '.join(available)}")
        else:
            logger.warning("No LLM providers configured")
        
        self._initialized = True
        logger.info("LLM Factory initialized successfully")
    
    async def close(self) -> None:
        """Cleanup resources"""
        logger.info("Closing LLM Factory...")
        self._initialized = False
    
    def is_provider_available(self, provider: str) -> bool:
        """Check if a provider is available"""
        return self._available_providers.get(provider, False)
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return [p for p, available in self._available_providers.items() if available]
    
    def create_model(self, model_id: Optional[str] = None, **kwargs) -> Any:
        """
        Create a LLM model instance
        
        Args:
            model_id: Model identifier (defaults to configured default)
            **kwargs: Additional model configuration
            
        Returns:
            LangChain chat model instance
        """
        if not self._initialized:
            raise RuntimeError("LLM Factory not initialized. Call initialize() first.")
        
        model_id = model_id or self._default_model_id
        
        # Validate provider is available
        if ":" in model_id:
            provider = model_id.split(":")[0]
            if not self.is_provider_available(provider):
                raise MissingAPIKeyError(f"Provider '{provider}' is not configured")
        
        return create_dynamic_model(model_id, **kwargs)
    
    def get_default_model_id(self) -> str:
        """Get the default model ID"""
        return self._default_model_id
    
    def list_models(self, provider: Optional[str] = None) -> List[str]:
        """
        List available models
        
        Args:
            provider: Optional filter by provider
            
        Returns:
            List of model IDs
        """
        if provider:
            return [m for m in MODEL_ALLOWLIST if m.startswith(f"{provider}:")]
        return MODEL_ALLOWLIST.copy()
