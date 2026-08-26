"""FastAPI application for EA Audiences ADK Agent fleet and A2A negotiation endpoints."""

import os
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.app.agent import root_agent
from agents.app.protocols.a2a_protocol import (
    route_a2a_message,
    create_a2a_message,
    get_conversation_history,
    get_all_active_traces,
)
from agents.app.schemas import (
    A2AMessage,
    DeepSonaSimulationResponse,
    AudienceNLQueryRequest,
    AudienceNLQueryResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ea.audiences.fastapi")

app = FastAPI(
    title="EA Engagement Intelligence Engine - ADK Multi-Agent Service",
    version="1.0.0",
    description="Google Agent Development Kit (ADK) Multi-Agent Fleet for 01-audiences (Jamie Pourturk).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "HEALTHY", "agent": "Jamie_RootOrchestratorAgent", "version": "1.0.0"}


@app.post("/a2a/route")
def handle_a2a_message_endpoint(msg: Dict[str, Any]):
    """Standard A2A Protocol Router Endpoint."""
    logger.info(f"Received A2A message on HTTP endpoint: {msg.get('sender')} -> {msg.get('recipient')}")
    response = route_a2a_message(msg)
    return response


@app.get("/a2a/traces")
def get_traces():
    """Retrieve all A2A trace messages for live negotiation monitor."""
    return {"traces": get_all_active_traces()}


@app.post("/deepsona/simulate", response_model=DeepSonaSimulationResponse)
def simulate_deepsona(req: Dict[str, Any]):
    """Direct invocation of DeepSona synthetic persona simulation."""
    campaign_id = req.get("campaign_id", "camp-demo-01")
    franchise = req.get("franchise", "Apex Legends")
    creative_title = req.get("creative_title", "Apex Season 22 Squad Breach Cut")
    proposed_spend = req.get("proposed_spend", 120000.0)
    target_roas = req.get("target_roas", 2.45)
    archetypes = req.get("archetypes")
    
    return root_agent.deepsona_agent.simulate_campaign_reaction(
        campaign_id=campaign_id,
        franchise=franchise,
        creative_title=creative_title,
        proposed_spend=proposed_spend,
        target_roas=target_roas,
        target_archetypes=archetypes,
    )


@app.post("/audiences/nl-query", response_model=AudienceNLQueryResponse)
def audience_query(req: AudienceNLQueryRequest):
    """Natural language audience segmentation endpoint."""
    return root_agent.audience_agent.query_audience(
        user_query=req.query,
        franchise=req.franchise,
        limit=req.limit,
    )


@app.post("/a2a/emit-creative-brief")
def emit_creative_brief(req: Dict[str, Any]):
    """Outbound trigger to send AudienceBrief to Curtis Gross (02-creative-insights)."""
    return root_agent.emit_audience_brief_to_creative_insights(
        friction_point=req.get("friction_point", "Apex Season 22 Tier 15 Unlock Resistance"),
        target_archetype=req.get("target_archetype", "COMPETITIVE_GRINDER"),
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
