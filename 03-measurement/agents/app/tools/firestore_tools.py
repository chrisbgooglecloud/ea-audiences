"""Firestore persistence tools for ADK Agents."""

import os
import time
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("agents.tools.firestore_tools")

# In-memory backing cache for fast execution & offline testing
_IN_MEMORY_STATE: Dict[str, Dict[str, Any]] = {
    "campaigns": {
        "camp-apex-s22-relaunch": {
            "campaign_id": "camp-apex-s22-relaunch",
            "title": "Apex Legends Season 22 Global Relaunch",
            "franchise": "Apex Legends",
            "status": "ACTIVE",
            "target_budget": 500000.0,
            "target_cpi": 4.50,
            "target_d7_roas": 2.20,
            "created_at": "2026-08-01T00:00:00Z",
        },
        "camp-eafc-fut26-kickoff": {
            "campaign_id": "camp-eafc-fut26-kickoff",
            "title": "EA Sports FC 26 Ultimate Team Global Kickoff",
            "franchise": "EA Sports FC",
            "status": "ACTIVE",
            "target_budget": 850000.0,
            "target_cpi": 3.80,
            "target_d7_roas": 2.85,
            "created_at": "2026-08-02T00:00:00Z",
        },
        "camp-bf6-reveal": {
            "campaign_id": "camp-bf6-reveal",
            "title": "Battlefield 6 Worldwide Gameplay Reveal",
            "franchise": "Battlefield",
            "status": "IN_PREDICTION",
            "target_budget": 1200000.0,
            "target_cpi": 6.20,
            "target_d7_roas": 1.95,
            "created_at": "2026-08-05T00:00:00Z",
        }
    },
    "creative_assets": {},
    "attribution_models": {},
    "scenarios": {},
    "agent_states": {}
}


def get_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve campaign configuration and KPIs from Firestore.
    
    Args:
        campaign_id: Unique campaign identifier.
    """
    if os.getenv("ENABLE_LIVE_FIRESTORE", "").lower() == "true":
        try:
            from google.cloud import firestore
            db = firestore.Client(
                project=os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app"),
                database=os.getenv("FIRESTORE_DATABASE", "(default)"),
            )
            doc = db.collection("campaigns").document(campaign_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            logger.debug(f"Firestore get_campaign in-memory lookup: {e}")
        
    return _IN_MEMORY_STATE["campaigns"].get(campaign_id)


def save_creative_metadata(asset_id: str, metadata: Dict[str, Any]) -> bool:
    """Save multimodal creative tags and metadata to Firestore /creative_assets collection.
    
    Args:
        asset_id: Creative asset UUID.
        metadata: Extracted creative tags, storybeats, mechanics, surfaces.
    """
    _IN_MEMORY_STATE["creative_assets"][asset_id] = metadata
    if os.getenv("ENABLE_LIVE_FIRESTORE", "").lower() == "true":
        try:
            from google.cloud import firestore
            db = firestore.Client(
                project=os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app"),
                database=os.getenv("FIRESTORE_DATABASE", "(default)"),
            )
            db.collection("creative_assets").document(asset_id).set(metadata, merge=True)
            return True
        except Exception as e:
            logger.debug(f"Firestore save_creative_metadata cached in-memory: {e}")
    return True


def save_agent_state(session_id: str, active_agent: str, payload: Dict[str, Any]) -> bool:
    """Save agent conversation state, A2A messages, or A2UI dynamic payload to Firestore /agent_states.
    
    Args:
        session_id: Session/Conversation UUID.
        active_agent: Name of active ADK agent.
        payload: State payload to persist.
    """
    record = {
        "session_id": session_id,
        "active_agent": active_agent,
        "payload": payload,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _IN_MEMORY_STATE["agent_states"][session_id] = record
    if os.getenv("ENABLE_LIVE_FIRESTORE", "").lower() == "true":
        try:
            from google.cloud import firestore
            db = firestore.Client(
                project=os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app"),
                database=os.getenv("FIRESTORE_DATABASE", "(default)"),
            )
            db.collection("agent_states").document(session_id).set(record, merge=True)
            return True
        except Exception as e:
            logger.debug(f"Firestore save_agent_state cached in-memory: {e}")
    return True


def get_agent_state(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve persisted agent state and A2A conversation history for a session."""
    if os.getenv("ENABLE_LIVE_FIRESTORE", "").lower() == "true":
        try:
            from google.cloud import firestore
            db = firestore.Client(
                project=os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app"),
                database=os.getenv("FIRESTORE_DATABASE", "(default)"),
            )
            doc = db.collection("agent_states").document(session_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception:
            pass
    return _IN_MEMORY_STATE["agent_states"].get(session_id)
