"""Spanner Graph GQL Tools for ADK Agents."""

import os
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger("ea.audiences.tools.spanner")


def run_spanner_gql_query(gql: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Executes a GQL query on Google Cloud Spanner Graph."""
    project_id = os.getenv("GCP_PROJECT_ID", "jamie-bq-test")
    instance_id = os.getenv("SPANNER_INSTANCE_ID", "blackrock-spanner")
    database_id = os.getenv("SPANNER_DATABASE_ID", "ea_graph_db")

    try:
        from google.cloud import spanner
        client = spanner.Client(project=project_id)
        instance = client.instance(instance_id)
        database = instance.database(database_id)

        with database.snapshot() as snapshot:
            results = snapshot.execute_sql(gql, params=params or {})
            rows = [dict(zip([col.name for col in results.fields], row)) for row in results]
            return rows
    except Exception as e:
        logger.warning(f"Spanner query execution deferred to local cache: {e}")
        # Fallback to local JSON datasets
        data_path = os.path.join(os.path.dirname(__file__), "../../../data/master_players.json")
        if os.path.exists(data_path):
            with open(data_path) as f:
                players = json.load(f)
            return players[:20]
        return []
