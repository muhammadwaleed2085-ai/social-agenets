"""
Playwright Browser Tools for Content Strategist Agent

Install dependencies:
    pip install playwright lxml
    playwright install
"""

import logging
from typing import List, Optional
from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)

# Lazy initialization - tools will be loaded when first needed
_browser_tools: Optional[List[BaseTool]] = None


async def get_browser_tools() -> List[BaseTool]:
    """
    Get Playwright browser tools with async lazy initialization.
    Must be called from an async context.
    """
    global _browser_tools
    
    if _browser_tools is not None:
        return _browser_tools
    
    try:
        from playwright.async_api import async_playwright
        from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
        
        # Start async playwright
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        
        # Create toolkit with async browser
        toolkit = PlayWrightBrowserToolkit.from_browser(async_browser=browser)
        _browser_tools = toolkit.get_tools()
        
        logger.info(f"Loaded {len(_browser_tools)} Playwright browser tools")
        return _browser_tools
        
    except Exception as e:
        logger.error(f"Failed to load Playwright tools: {e}")
        return []


# Empty list for import - actual tools loaded lazily
browser_tools: List[BaseTool] = []
