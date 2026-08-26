"""A2A (Agent-to-Agent) Cross-Agent Routing and Negotiation Protocol Runtime."""

import time
import uuid
import logging
from typing import Dict, List, Any, Optional, Callable
from agents.app.schemas import A2AMessage

logger = logging.getLogger("agents.protocols.a2a")

# In-memory message store indexed by correlation_id and message_id
_MESSAGE_BUS: Dict[str, List[Dict[str, Any]]] = {}
_AGENT_HANDLERS: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}


def register_agent_handler(agent_name: str, handler: Callable[[Dict[str, Any]], Dict[str, Any]]):
    """Register a message processing handler for a specific agent."""
    _AGENT_HANDLERS[agent_name] = handler


def create_a2a_message(
    sender: str,
    recipient: str,
    intent: str,
    payload: Dict[str, Any],
    correlation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Constructs a structured A2A protocol message envelope.
    
    Args:
        sender: Sending agent name (e.g. 'MediaBuyingAgent').
        recipient: Target agent name (e.g. 'TaggingAgent').
        intent: Intent string ('REVISE_CREATIVE', 'SIMULATE_PERSONA_REACTION', 'PROPOSE_ALLOCATION', 'ACK').
        payload: Message body parameters.
        correlation_id: Optional trace ID. If omitted, a new UUID is generated.
        
    Returns:
        Structured A2A message dictionary.
    """
    msg_id = f"msg-{uuid.uuid4().hex[:10]}"
    corr_id = correlation_id or f"corr-{uuid.uuid4().hex[:8]}"
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    message = {
        "message_id": msg_id,
        "correlation_id": corr_id,
        "sender": sender,
        "recipient": recipient,
        "timestamp": timestamp,
        "intent": intent,
        "payload": payload,
        "status": "SENT",
    }
    
    # Store on message bus
    _MESSAGE_BUS.setdefault(corr_id, []).append(message)
    logger.info(f"[A2A BUS] {sender} -> {recipient} | Intent: {intent} | ID: {msg_id}")
    return message


def route_a2a_message(message: Dict[str, Any]) -> Dict[str, Any]:
    """Routes an A2A message to the destination agent handler and returns the response."""
    recipient = message.get("recipient", "")
    corr_id = message.get("correlation_id", "")
    
    if recipient in _AGENT_HANDLERS:
        try:
            handler = _AGENT_HANDLERS[recipient]
            response_payload = handler(message)
            
            # Construct ACK / Response envelope
            resp_msg = {
                "message_id": f"msg-{uuid.uuid4().hex[:10]}",
                "correlation_id": corr_id,
                "sender": recipient,
                "recipient": message.get("sender", "Unknown"),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "intent": f"ACK_{message.get('intent')}",
                "payload": response_payload,
                "status": "PROCESSED",
            }
            _MESSAGE_BUS.setdefault(corr_id, []).append(resp_msg)
            return resp_msg
        except Exception as e:
            logger.error(f"[A2A ERROR] Handling failed for {recipient}: {e}")
            err_msg = {
                "message_id": f"msg-{uuid.uuid4().hex[:10]}",
                "correlation_id": corr_id,
                "sender": recipient,
                "recipient": message.get("sender", "Unknown"),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "intent": "REJECT",
                "payload": {"error": str(e)},
                "status": "REJECTED",
            }
            _MESSAGE_BUS.setdefault(corr_id, []).append(err_msg)
            return err_msg
            
    # If no local handler registered, acknowledge as queued
    ack_msg = {
        "message_id": f"msg-{uuid.uuid4().hex[:10]}",
        "correlation_id": corr_id,
        "sender": recipient or "SystemBus",
        "recipient": message.get("sender", "Unknown"),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "intent": "ACK_QUEUED",
        "payload": {"status": "DELIVERED", "note": "Message dispatched to agent queue"},
        "status": "DELIVERED",
    }
    _MESSAGE_BUS.setdefault(corr_id, []).append(ack_msg)
    return ack_msg


def get_conversation_history(correlation_id: str) -> List[Dict[str, Any]]:
    """Retrieve full trace of A2A messages for a correlation ID."""
    return _MESSAGE_BUS.get(correlation_id, [])
