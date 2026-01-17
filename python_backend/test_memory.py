
import asyncio
from src.agents.deep_agents.agent import get_agent

async def test_multi_turn():
    agent = get_agent()
    thread_id = "test_thread_567"
    config = {"configurable": {"thread_id": thread_id}}
    
    print(f"--- First Turn (Thread: {thread_id}) ---")
    content1 = ""
    async for event in agent.astream_events(
        {"messages": [("user", "Hello! I want to write a blog about AI. My name is Alice.")]},
        config=config,
        version="v2",
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"].content
            if isinstance(chunk, str):
                content1 += chunk
            elif isinstance(chunk, list):
                for part in chunk:
                    if isinstance(part, dict) and part.get("type") == "text":
                        content1 += part.get("text", "")
    print(f"Response: {content1}\n")
    
    print(f"--- Second Turn (Thread: {thread_id}) ---")
    content2 = ""
    async for event in agent.astream_events(
        {"messages": [("user", "What was my name and what do I want to write about?")]},
        config=config,
        version="v2",
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"].content
            if isinstance(chunk, str):
                content2 += chunk
            elif isinstance(chunk, list):
                for part in chunk:
                    if isinstance(part, dict) and part.get("type") == "text":
                        content2 += part.get("text", "")
    print(f"Response: {content2}\n")

if __name__ == "__main__":
    asyncio.run(test_multi_turn())
