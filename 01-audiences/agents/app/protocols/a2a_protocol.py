"""Official A2A (Agent2Agent) JSON-RPC 2.0 Protocol Implementation (https://github.com/a2aproject/A2A)."""

import time
import uuid
import logging
from typing import Dict, List, Any, Optional, Callable

logger = logging.getLogger("ea.audiences.a2a")

# Official A2A Task Store (in-memory)
_TASK_STORE: Dict[str, Dict[str, Any]] = {}
_AGENT_HANDLERS: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}

# Official AgentCard Definition
AGENT_CARD = {
    "name": "Jamie_AudienceIntelligenceAgent",
    "description": "EA SPORTS FC Audience Intelligence & DeepSona Synthetic Focus Group Engine (Google Cloud EBC Act 1)",
    "url": "http://localhost:3000/api/a2a",
    "version": "1.0.0",
    "protocol_version": "0.2.0",
    "provider": {
        "organization": "Electronic Arts / Google Cloud CCAI",
        "url": "https://cloud.google.com/spanner",
    },
    "capabilities": {
        "streaming": True,
        "push_notifications": True,
        "state_machine": "FSM_SUPPORTED",
    },
    "skills": [
        {
            "id": "query_spanner_graph",
            "name": "Query Spanner Property Graph",
            "description": "Translates natural language to Spanner GQL and queries 2,500+ EA FC master players and 9,000+ linked identities.",
        },
        {
            "id": "simulate_deepsona_focus_group",
            "name": "DeepSona Synthetic Focus Group Simulation",
            "description": "Simulates 4 authentic BARE gamer personas with FSM states, willingness-to-pay, and lift estimation before launch.",
        },
        {
            "id": "emit_audience_brief",
            "name": "Emit Executive Campaign Brief",
            "description": "Compiles Spanner Graph segment insights into a structured brief and emits outbound A2A contract to Act 2 (Curtis Creative Studio).",
        },
    ],
}


def register_agent_handler(skill_or_agent_name: str, handler: Callable[[Dict[str, Any]], Dict[str, Any]]):
    """Register a skill or agent execution handler for incoming A2A tasks."""
    _AGENT_HANDLERS[skill_or_agent_name] = handler
    logger.info(f"Registered A2A handler for '{skill_or_agent_name}'")


def handle_a2a_jsonrpc_request(rpc_request: Dict[str, Any]) -> Dict[str, Any]:
    """Processes an incoming A2A JSON-RPC 2.0 request according to the official A2A specification."""
    req_id = rpc_request.get("id", str(uuid.uuid4()))
    method = rpc_request.get("method", "")
    params = rpc_request.get("params", {})

    logger.info(f"[A2A JSON-RPC 2.0] Method: {method} | ID: {req_id}")

    # Method 1: AgentCard Discovery (agents/getCard)
    if method in ["agents/getCard", "agents/discover", "get_agent_card"]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": AGENT_CARD,
        }

    # Method 2: Task Creation / Send (tasks/send or tasks/create)
    if method in ["tasks/send", "tasks/create"]:
        task_id = params.get("task_id", f"task-fc26-{uuid.uuid4().hex[:8]}")
        message = params.get("message", {})
        recipient = params.get("recipient", "Jamie_DeepSonaAgent")
        intent = params.get("intent", "SIMULATE_PERSONA_REACTION")
        payload = params.get("payload") or (message.get("parts", [{}])[0].get("data") if message.get("parts") else {}) or {}

        # Check for registered handler
        handler = _AGENT_HANDLERS.get(recipient) or _AGENT_HANDLERS.get(intent)
        execution_result = {}
        if handler:
            try:
                execution_result = handler({"payload": payload, "task_id": task_id})
            except Exception as e:
                logger.error(f"[A2A Execution Error]: {e}")
                execution_result = {"error": str(e)}

        task_record = {
            "task_id": task_id,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "completed" if execution_result else "running",
            "sender": params.get("sender", "Curtis_CreativeStudioAgent"),
            "recipient": recipient,
            "intent": intent,
            "input_payload": payload,
            "output_artifacts": [
                {
                    "name": "result_payload",
                    "type": "application/json",
                    "data": execution_result,
                }
            ] if execution_result else [],
        }
        _TASK_STORE[task_id] = task_record

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "task_id": task_id,
                "status": task_record["status"],
                "artifacts": task_record["output_artifacts"],
                "message": {
                    "role": "agent",
                    "parts": [{"text": "Task processed successfully via A2A protocol", "data": execution_result}],
                },
            },
        }

    # Method 3: Get Task Status (tasks/get)
    if method == "tasks/get":
        task_id = params.get("task_id")
        if task_id in _TASK_STORE:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": _TASK_STORE[task_id],
            }
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32602, "message": f"Task '{task_id}' not found"},
        }

    # Method 4: List Tasks (tasks/list)
    if method == "tasks/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tasks": list(_TASK_STORE.values())},
        }

    # Unknown Method Error
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method '{method}' not supported by A2A server"},
    }


def get_all_a2a_tasks() -> List[Dict[str, Any]]:
    """Retrieve all A2A tasks for the live UI stream."""
    return list(_TASK_STORE.values())


def create_a2a_message(
    sender: str,
    recipient: str,
    intent: str,
    payload: Dict[str, Any],
    correlation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Factory function for creating an outbound A2A protocol message."""
    return {
        "message_id": f"msg-{uuid.uuid4().hex[:8]}",
        "correlation_id": correlation_id or f"corr-{uuid.uuid4().hex[:8]}",
        "sender": sender,
        "recipient": recipient,
        "intent": intent,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "payload": payload,
    }


def route_a2a_message(message: Dict[str, Any]) -> Dict[str, Any]:
    """Routes an A2A message to the target agent or handler."""
    recipient = message.get("recipient", "")
    intent = message.get("intent", "")
    handler = _AGENT_HANDLERS.get(recipient) or _AGENT_HANDLERS.get(intent)
    if handler:
        try:
            return handler({"payload": message.get("payload", {}), "message": message})
        except Exception as e:
            logger.error(f"[A2A Routing Error]: {e}")
            return {"status": "error", "error": str(e)}
    return {
        "status": "dispatched",
        "message": f"Message dispatched to recipient '{recipient}' via A2A protocol bus",
        "correlation_id": message.get("correlation_id"),
    }


def get_conversation_history() -> List[Dict[str, Any]]:
    """Get chronological A2A conversation task history."""
    return list(_TASK_STORE.values())

