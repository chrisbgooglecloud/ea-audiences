"""BigQuery Data Warehouse Tools for ADK Agents."""

import os
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger("ea.audiences.tools.bq")


def query_telemetry_events(player_id: str = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Queries time-series player telemetry events from BigQuery."""
    project_id = os.getenv("GCP_PROJECT_ID", "jamie-bq-test")
    dataset_id = os.getenv("BQ_DATASET_ID", "ea_marketing_intelligence")

    try:
        from google.cloud import bigquery
        client = bigquery.Client(project=project_id)
        
        where_clause = f"WHERE player_id = '{player_id}'" if player_id else ""
        query = f"""
        SELECT event_id, player_id, game_id, event_timestamp, event_type, match_outcome,
               loss_streak_count, frustration_score, tilt_index, spend_amount_usd
        FROM `{project_id}.{dataset_id}.fct_player_telemetry_events`
        {where_clause}
        ORDER BY event_timestamp DESC
        LIMIT {limit}
        """
        query_job = client.query(query)
        results = [dict(row) for row in query_job]
        return results
    except Exception as e:
        logger.warning(f"BigQuery telemetry query deferred to local dataset: {e}")
        data_path = os.path.join(os.path.dirname(__file__), "../../../data/telemetry_match_events.json")
        if os.path.exists(data_path):
            with open(data_path) as f:
                events = json.load(f)
            if player_id:
                events = [ev for ev in events if ev["player_id"] == player_id]
            return events[:limit]
        return []
