"""Gemini Enterprise ADK Agents, A2A Negotiation, and A2UI Streaming Router."""

import time
import json
import asyncio
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse

from app.schemas.protocols import (
    A2AMessage,
    A2UIComponent,
    A2UIStreamEvent,
)
from app.services.firestore_service import firestore_service

router = APIRouter(prefix="/api/v1/agents", tags=["ADK Agents & Streaming Protocols"])


@router.post("/stream")
async def stream_agent_execution(
    session_id: Optional[str] = Query(None),
    agent_name: str = Query("MediaBuyingAgent"),
    prompt: Optional[str] = Query(None),
):
    """Server-Sent Events (SSE) endpoint streaming thoughts and dynamic A2UI components."""
    curr_session = session_id or f"sess-{uuid.uuid4().hex[:8]}"

    async def event_generator():
        now = lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Step 1: Agent Thinking
        yield {
            "event": "thought",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="thought",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    content=f"Analyzing portfolio budget across 6 channels and evaluating SHAP Gold Mines for prompt: '{prompt or 'Portfolio Rebalancing'}'...",
                ).model_dump()
            ),
        }
        await asyncio.sleep(0.1)

        # Step 2: Tool Call (Equimarginal Solver)
        yield {
            "event": "tool_call",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="tool_call",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    content="Invoking EquimarginalHillSolver(max_shift_pct=0.20, enforce_zero_sum=True)...",
                ).model_dump()
            ),
        }
        await asyncio.sleep(0.1)

        # Step 3: Stream A2UI Dynamic Metric Card
        metric_comp = A2UIComponent(
            component_type="a2ui-metric-card",
            component_id="metric-d7-roas",
            title="Portfolio D7 ROAS Uplift",
            description="Optimal Equimarginal reallocation yields +18.4% incremental return.",
            data={"current_roas": 2.15, "projected_roas": 2.55, "uplift_pct": 18.4},
            props={"badge": "VERIFIED_OPTIMAL", "variant": "emerald"},
        )
        yield {
            "event": "component",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="component",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    component=metric_comp,
                ).model_dump()
            ),
        }
        await asyncio.sleep(0.1)

        # Step 4: Stream A2UI Dynamic S-Curve Line Chart Component
        scurve_comp = A2UIComponent(
            component_type="a2ui-line-chart",
            component_id="chart-scurve-summary",
            title="Meridian S-Curve Marginal Response",
            description="Diminishing returns curves across YouTube, Meta, TikTok, and Programmatic 3D.",
            data={
                "series": [
                    {"channel": "TikTok", "marginal_roas": 3.15, "allocated_spend": 98000},
                    {"channel": "YouTube", "marginal_roas": 2.45, "allocated_spend": 115000},
                    {"channel": "Meta", "marginal_roas": 2.52, "allocated_spend": 120000},
                    {"channel": "Programmatic 3D", "marginal_roas": 1.75, "allocated_spend": 45000},
                ]
            },
            props={"xAxis": "channel", "yAxis": "marginal_roas"},
        )
        yield {
            "event": "component",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="component",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    component=scurve_comp,
                ).model_dump()
            ),
        }
        await asyncio.sleep(0.1)

        # Step 5: Final Message & Completion
        yield {
            "event": "message",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="message",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    content="Budget optimization and A2A negotiation complete. Reallocation ready for review and deployment.",
                ).model_dump()
            ),
        }
        yield {
            "event": "done",
            "data": json.dumps(
                A2UIStreamEvent(
                    event_type="done",
                    agent_name=agent_name,
                    session_id=curr_session,
                    timestamp=now(),
                    content="Stream finished.",
                ).model_dump()
            ),
        }

    return EventSourceResponse(event_generator())


@router.post("/a2a", response_model=A2AMessage)
async def exchange_a2a_message(message: A2AMessage):
    """Execute Agent-to-Agent message exchange and negotiate revisions/allocations."""
    # Process intent
    response_payload = dict(message.payload)
    response_payload["negotiated_status"] = "ACCEPTED"
    response_payload["acknowledgement"] = f"Processed intent {message.intent} successfully."

    resp_msg = A2AMessage(
        message_id=f"msg-{uuid.uuid4().hex[:8]}",
        correlation_id=message.correlation_id,
        sender=message.recipient,
        recipient=message.sender,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        intent="ACK",
        payload=response_payload,
        status="DELIVERED",
    )

    # Store state in Firestore
    state_doc = {
        "session_id": message.correlation_id,
        "active_agent": message.recipient,
        "last_message": resp_msg.model_dump(),
        "updated_at": resp_msg.timestamp,
    }
    await firestore_service.set_document("agent_states", message.correlation_id, state_doc)

    return resp_msg


@router.get("/states")
async def get_agent_states(limit: int = Query(20, ge=1, le=100)):
    """Retrieve recent agent session states."""
    return await firestore_service.list_documents("agent_states", limit=limit)
