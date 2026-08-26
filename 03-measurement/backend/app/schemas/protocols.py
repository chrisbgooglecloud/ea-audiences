"""A2A (Agent-to-Agent) and A2UI (Agent-to-User-Interface) protocol schemas."""

from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field


class A2AMessage(BaseModel):
    """Structured Agent-to-Agent message envelope for inter-agent communication."""
    message_id: str = Field(..., description="Unique UUID for this message")
    correlation_id: str = Field(..., description="Trace/Conversation correlation ID")
    sender: str = Field(
        ..., description="Originating agent (e.g., 'MediaBuyingAgent', 'TaggingAgent', 'AnalyticsAgent')"
    )
    recipient: str = Field(
        ..., description="Target agent (e.g., 'TaggingAgent', 'MediaBuyingAgent')"
    )
    timestamp: str
    intent: str = Field(
        ..., description="'REVISE_CREATIVE', 'QUERY_AUDIENCE', 'PROPOSE_ALLOCATION', 'REQUEST_EXPLANATION', 'ACK', 'REJECT'"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict, description="Structured message payload"
    )
    status: str = Field(default="SENT", description="'SENT', 'DELIVERED', 'PROCESSED', 'REJECTED'")


class A2UIComponent(BaseModel):
    """Dynamic A2UI web component payload rendered client-side."""
    component_type: str = Field(
        ..., description="'a2ui-metric-card', 'a2ui-bar-chart', 'a2ui-line-chart', 'a2ui-recommendation-card', 'a2ui-grid-scatter', 'a2ui-persona-card'"
    )
    component_id: str
    title: str
    description: Optional[str] = None
    data: Any = Field(default_factory=dict)
    props: Dict[str, Any] = Field(default_factory=dict)


class A2UIStreamEvent(BaseModel):
    """Single event emitted over Server-Sent Events (SSE) stream."""
    event_type: str = Field(
        ..., description="'thought', 'tool_call', 'tool_result', 'component', 'message', 'done', 'error'"
    )
    agent_name: str
    session_id: str
    timestamp: str
    content: Optional[str] = None
    component: Optional[A2UIComponent] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
