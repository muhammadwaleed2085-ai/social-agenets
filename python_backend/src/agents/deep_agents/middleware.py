"""
Skill middleware for dynamic, on-demand skill loading.

Follows the official LangChain skills pattern:
https://docs.langchain.com/oss/python/langchain/multi-agent/skills
"""

from typing import Callable

from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain.messages import SystemMessage

from .skills import load_skill, load_skill_registry


class SkillMiddleware(AgentMiddleware):
    """Inject available skills into the system prompt and register load_skill tool."""

    tools = [load_skill]

    def __init__(self) -> None:
        skills = load_skill_registry()
        self.skills_count = len(skills)
        self.skills_prompt = "\n".join(
            f"- **{skill['name']}**: {skill['description']}".strip()
            for skill in skills
        )

    def _build_skills_addendum(self) -> str:
        return (
            f"\n\n## Available Skills ({self.skills_count} total)\n\n"
            f"{self.skills_prompt}\n\n"
            "Use the load_skill tool when you need detailed information about "
            "how to handle a specific type of request."
        )

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        skills_addendum = self._build_skills_addendum()
        new_content = list(request.system_message.content_blocks) + [
            {"type": "text", "text": skills_addendum}
        ]
        new_system_message = SystemMessage(content=new_content)
        modified_request = request.override(system_message=new_system_message)
        return handler(modified_request)

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        skills_addendum = self._build_skills_addendum()
        new_content = list(request.system_message.content_blocks) + [
            {"type": "text", "text": skills_addendum}
        ]
        new_system_message = SystemMessage(content=new_content)
        modified_request = request.override(system_message=new_system_message)
        return await handler(modified_request)
