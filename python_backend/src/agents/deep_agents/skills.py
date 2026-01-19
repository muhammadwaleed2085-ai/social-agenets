"""
Dynamic skill loading utilities.

Follows the official LangChain skills pattern:
https://docs.langchain.com/oss/python/langchain/multi-agent/skills
"""

from functools import lru_cache
from pathlib import Path
from typing import TypedDict

import yaml
from langchain_core.tools import tool

AGENT_DIR = Path(__file__).parent
SKILLS_ROOT = AGENT_DIR / "skills"


class SkillSpec(TypedDict):
    name: str
    description: str
    content: str
    path: str


def _normalize_skill_name(value: str) -> str:
    return value.strip().lower().replace("_", "-")


def _parse_skill_file(path: Path) -> SkillSpec | None:
    raw = path.read_text(encoding="utf-8")
    front_matter = {}
    body = raw
    if raw.startswith("---"):
        parts = raw.split("---", 2)
        if len(parts) == 3:
            front_matter = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
    name = front_matter.get("name") or path.parent.name
    description = front_matter.get("description") or ""
    content = body.strip() or raw.strip()
    return {
        "name": str(name),
        "description": str(description).strip(),
        "content": content,
        "path": str(path),
    }


@lru_cache
def _load_skill_registry(skills_root: Path) -> tuple[SkillSpec, ...]:
    if not skills_root.exists():
        return tuple()
    skills: list[SkillSpec] = []
    for skill_path in skills_root.rglob("SKILL.md"):
        parsed = _parse_skill_file(skill_path)
        if parsed:
            skills.append(parsed)
    return tuple(skills)


def load_skill_registry(skills_root: Path | None = None) -> tuple[SkillSpec, ...]:
    return _load_skill_registry(skills_root or SKILLS_ROOT)


@tool
def load_skill(skill_name: str) -> str:
    """Load the full content of a skill into the agent context.

    Args:
        skill_name: The name of the skill to load.
    """
    skills = load_skill_registry()
    normalized = _normalize_skill_name(skill_name)
    for skill in skills:
        if _normalize_skill_name(skill["name"]) == normalized:
            return f"Loaded skill: {skill['name']}\n\n{skill['content']}"
    available = ", ".join(skill["name"] for skill in skills)
    return f"Skill '{skill_name}' not found. Available skills: {available}"
