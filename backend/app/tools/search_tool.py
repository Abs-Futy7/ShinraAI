"""Optional web search tool wrapper using SerperDevTool."""
from __future__ import annotations

import os


def get_serper_tool():
    """Return a SerperDevTool instance if the API key is configured."""
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise EnvironmentError("SERPER_API_KEY not set")
    from crewai_tools import SerperDevTool
    return SerperDevTool()
