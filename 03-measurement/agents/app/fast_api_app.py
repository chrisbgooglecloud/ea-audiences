"""FastAPI application server for Gemini Enterprise ADK Multi-Agent Fleet."""

import os
import json
import time
import uuid
import asyncio
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents.app.agent import root_agent, RootOrchestratorAgent
from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
)
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.schemas import (
    A2AMessage,
    A2UIStreamEvent,
    FranchiseEnum,
)

logger = logging.getLogger("agents.fast_api_app")

app = FastAPI(
    title="EA Creative Intelligence & Agentic Measurement Fleet",
    description="Production Gemini Enterprise ADK Multi-Agent Fleet with A2A and A2UI Protocols",
    version="1.0.0",
)

# CORS middleware for Next.js dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentRunRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or task for agent fleet")
    franchise: Optional[str] = Field(default="Apex Legends")
    campaign_id: Optional[str] = Field(default="camp-apex-s22-relaunch")
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class A2AMessageRequest(BaseModel):
    sender: str
    recipient: str
    intent: str
    payload: Dict[str, Any]
    correlation_id: Optional[str] = None


@app.get("/health")
@app.get("/")
def health_check():
    """Health check and service status."""
    return {
        "status": "HEALTHY",
        "service": "ea-agentic-measurement-fleet",
        "gemini_models": {
            "heavy_model": "gemini-3.6-flash",
            "fast_model": "gemini-3.5-flash-lite",
            "location": os.getenv("GEMINI_LOCATION", "global"),
        },
        "agents": ["TaggingAgent", "AnalyticsAgent", "MediaBuyingAgent"],
        "protocols": ["A2A", "A2UI v0.8+"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/.well-known/agent-card.json")
def get_agent_card():
    """Returns the A2A Agent Card specification for Gemini Enterprise Agent Registry."""
    card_path = os.path.join(os.path.dirname(__file__), "agent_card.json")
    if os.path.exists(card_path):
        with open(card_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "name": "eagames-ebc-demo-ge-app",
        "description": "EA Creative Intelligence & Agentic Measurement Fleet",
        "version": "2.0.0",
    }


@app.post("/api/v1/agents/run")
def run_agent(req: AgentRunRequest):
    """Execute agent fleet synchronously with structured response."""
    context = req.context or {}
    context["franchise"] = req.franchise
    context["campaign_id"] = req.campaign_id
    
    result = root_agent.route_request(req.prompt, context)
    return {
        "session_id": req.session_id or f"sess-{uuid.uuid4().hex[:8]}",
        "prompt": req.prompt,
        "response": result,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.post("/api/v1/agents/stream")
async def stream_agent(req: AgentRunRequest):
    """Server-Sent Events (SSE) streaming endpoint delivering real-time agent thoughts,
    tool calls, and dynamic A2UI component payloads.
    """
    session_id = req.session_id or f"sess-{uuid.uuid4().hex[:8]}"
    franchise = req.franchise or "Apex Legends"

    async def event_generator():
        # 1. Thought event
        yield A2UIProtocolGenerator.format_sse_event(
            event_type="thought",
            agent_name="RootOrchestratorAgent",
            session_id=session_id,
            content=f"Received objective: '{req.prompt}'. Inspecting task domain and routing to specialist agents...",
        )
        await asyncio.sleep(0.05)

        prompt_lower = req.prompt.lower()

        # 2. Media Buying / Budget Pacing Branch
        if any(w in prompt_lower for w in ["budget", "allocate", "pacing", "meridian", "reallocate", "s-curve", "hill"]):
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="tool_call",
                agent_name="MediaBuyingAgent",
                session_id=session_id,
                content="Executing Equimarginal Hill Saturation solver with 20% pacing clamp and zero-sum constraint...",
            )
            await asyncio.sleep(0.05)

            channels = [
                {"channel": "YouTube Paid", "current_spend": 120000.0, "base_roas": 3.2, "half_saturation_s": 65000.0, "hill_slope_k": 1.35},
                {"channel": "Meta Ads", "current_spend": 90000.0, "base_roas": 2.8, "half_saturation_s": 50000.0, "hill_slope_k": 1.25},
                {"channel": "TikTok", "current_spend": 70000.0, "base_roas": 2.4, "half_saturation_s": 40000.0, "hill_slope_k": 1.20},
                {"channel": "Programmatic 3D", "current_spend": 40000.0, "base_roas": 1.9, "half_saturation_s": 30000.0, "hill_slope_k": 1.15},
            ]
            opt = root_agent.media_buying_agent.execute_budget_reallocation(channels)

            # Metric card for Net Delta & ROI
            metric_card = A2UIProtocolGenerator.build_metric_card(
                component_id="metric-budget-opt",
                title="Equimarginal Portfolio Optimization",
                value=f"+{opt['revenue_uplift_pct']}% Uplift",
                subtitle=f"Net Delta: ${opt['budget_net_delta']:.2f} (Zero-Sum Satisfied)",
                delta=f"+${opt['total_projected_revenue'] - sum(c['current_spend']*2.5 for c in channels):,.0f} Rev",
                trend="up",
                badge="Meridian Hill Solver",
            )
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="component",
                agent_name="MediaBuyingAgent",
                session_id=session_id,
                component=metric_card,
            )

            # S-Curve Chart
            scurve_card = A2UIProtocolGenerator.build_scurve_chart(
                component_id="chart-scurves",
                title="Channel Marginal Response S-Curves",
                channels=opt["channel_allocations"],
            )
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="component",
                agent_name="MediaBuyingAgent",
                session_id=session_id,
                component=scurve_card,
            )
            await asyncio.sleep(0.05)

        # 3. Multimodal Tagging Branch
        elif any(w in prompt_lower for w in ["tag", "multimodal", "video", "mechanic"]):
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="tool_call",
                agent_name="TaggingAgent",
                session_id=session_id,
                content="Extracting gameplay mechanics and classifying asset across EA 6 surfaces...",
            )
            await asyncio.sleep(0.05)

            tag_res = root_agent.tagging_agent.analyze_creative("asset-sample-01", franchise=franchise)
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="component",
                agent_name="TaggingAgent",
                session_id=session_id,
                component=A2UIProtocolGenerator.build_metric_card(
                    component_id="metric-tagging-summary",
                    title="Asset Multimodal Intelligence",
                    value=f"{len(tag_res.detected_mechanics)} Mechanics",
                    subtitle=f"Funnel Stage: {tag_res.funnel_stage.value}",
                    badge="Pydantic Enforced",
                ),
            )
            await asyncio.sleep(0.05)

        # 4. Analytics & 9-Grid Attribution Branch
        else:
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="tool_call",
                agent_name="AnalyticsAgent",
                session_id=session_id,
                content="Computing SHAP marginal ROAS weights and mapping features onto Tactical 9-Grid...",
            )
            await asyncio.sleep(0.05)

            grid_points = root_agent.analytics_agent.generate_tactical_grid(franchise)
            insights = root_agent.analytics_agent.explain_attribution_insights(franchise, grid_points)

            # 9-Grid Scatter Component
            grid_card = A2UIProtocolGenerator.build_tactical_9grid_scatter(
                component_id="scatter-9grid",
                title="Tactical 9-Grid Attribution Matrix",
                points=[p.model_dump() for p in grid_points],
                franchise=franchise,
            )
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="component",
                agent_name="AnalyticsAgent",
                session_id=session_id,
                component=grid_card,
            )

            # Recommendation Card
            recom_card = A2UIProtocolGenerator.build_recommendation_card(
                component_id="recom-strategic-actions",
                title="AI Strategic Recommendations (P0/P1/P2)",
                recommendations=insights["key_recommendations"],
            )
            yield A2UIProtocolGenerator.format_sse_event(
                event_type="component",
                agent_name="AnalyticsAgent",
                session_id=session_id,
                component=recom_card,
            )
            await asyncio.sleep(0.05)

        # Done event
        yield A2UIProtocolGenerator.format_sse_event(
            event_type="done",
            agent_name="RootOrchestratorAgent",
            session_id=session_id,
            content="Multi-agent orchestration and UI hydration complete.",
        )

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# A2A Message Endpoints
@app.post("/a2a/messages")
def send_a2a_message(req: A2AMessageRequest):
    """Post an A2A message to the inter-agent routing bus."""
    msg = create_a2a_message(
        sender=req.sender,
        recipient=req.recipient,
        intent=req.intent,
        payload=req.payload,
        correlation_id=req.correlation_id,
    )
    res = route_a2a_message(msg)
    return {
        "dispatched": msg,
        "response": res,
    }


@app.get("/a2a/messages/{correlation_id}")
def get_a2a_trace(correlation_id: str):
    """Retrieve full audit trace of A2A messages for a correlation ID."""
    history = get_conversation_history(correlation_id)
    return {
        "correlation_id": correlation_id,
        "message_count": len(history),
        "messages": history,
    }


# Subagent Direct Endpoints
@app.post("/subagents/tagging")
def direct_tagging(req: Dict[str, Any]):
    asset_id = req.get("asset_id", f"asset-{uuid.uuid4().hex[:6]}")
    franchise = req.get("franchise", "Apex Legends")
    custom_inst = req.get("custom_instructions")
    return root_agent.tagging_agent.analyze_creative(asset_id, franchise=franchise, custom_instructions=custom_inst).model_dump()


@app.post("/subagents/analytics")
def direct_analytics(req: Dict[str, Any]):
    franchise = req.get("franchise", "Apex Legends")
    return root_agent.analytics_agent.explain_attribution_insights(franchise=franchise)


@app.post("/subagents/media-buying")
def direct_media_buying(req: Dict[str, Any]):
    channels = req.get("channels", [
        {"channel": "YouTube Paid", "current_spend": 120000.0, "base_roas": 3.2},
        {"channel": "Meta Ads", "current_spend": 90000.0, "base_roas": 2.8},
    ])
    total_budget = req.get("total_budget")
    return root_agent.media_buying_agent.execute_budget_reallocation(channels, total_budget=total_budget)
