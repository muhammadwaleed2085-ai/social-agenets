"""
Content Strategist Agent - Service
Main chat function using LangChain create_agent
"""
import logging
from typing import Dict

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .schemas import ChatStrategistRequest, ChatStrategistResponse
from .prompts import get_content_strategist_system_prompt
from ...config import settings

logger = logging.getLogger(__name__)

# In-memory conversation store (per thread)
_conversation_store: Dict[str, list] = {}


async def content_strategist_chat(
    request: ChatStrategistRequest
) -> ChatStrategistResponse:
    """
    Chat with the content strategist agent.
    
    Simple ChatGPT-style interaction:
    - User sends message
    - LLM processes and returns response
    
    Args:
        request: Chat request with message and thread ID from frontend
        
    Returns:
        ChatStrategistResponse with AI response
    """
    try:
        # Use thread ID from frontend (required)
        thread_id = request.threadId
        
        logger.info(f"Content strategist chat - Thread: {thread_id}, Message: {request.message[:50]}...")
        
        # Get or create conversation history
        if thread_id not in _conversation_store:
            _conversation_store[thread_id] = []
        
        conversation_history = _conversation_store[thread_id]
        
        # Create simple Google Gemini model
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7,
        )
        
        # Build messages with system prompt and history
        messages = [
            SystemMessage(content=get_content_strategist_system_prompt())
        ]
        
        # Add conversation history
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current user message
        messages.append(HumanMessage(content=request.message))
        
        # Invoke the model
        response = await model.ainvoke(messages)
        
        # Extract response content
        response_content = response.content if hasattr(response, 'content') else str(response)
        
        # Store messages in conversation history
        _conversation_store[thread_id].append({"role": "user", "content": request.message})
        _conversation_store[thread_id].append({"role": "assistant", "content": response_content})
        
        # Keep conversation history manageable (last 20 messages)
        if len(_conversation_store[thread_id]) > 20:
            _conversation_store[thread_id] = _conversation_store[thread_id][-20:]
        
        logger.info(f"Content strategist response generated for thread {thread_id}")
        
        return ChatStrategistResponse(
            response=response_content,
            threadId=thread_id,
            contentGenerated=False,
            readyToGenerate=False,
            isGeneratingMedia=False
        )
        
    except Exception as e:
        logger.error(f"Content strategist chat error: {e}", exc_info=True)
        raise


async def get_content_agent_memory():
    """Get the conversation memory store"""
    return _conversation_store


async def close_content_agent_memory():
    """Clear conversation memory"""
    global _conversation_store
    _conversation_store = {}
    logger.info("Content agent memory cleared")
