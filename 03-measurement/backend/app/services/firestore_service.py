"""Cloud Firestore Native Service with In-Memory Resilient Cache.

Provides asynchronous CRUD access to /campaigns, /creative_assets, /attribution_models,
/scenarios, /metro_geospine, and /agent_states collections.
"""

import os
import time
import logging
from typing import List, Dict, Optional, Any

from app.config import settings

logger = logging.getLogger("app.services.firestore_service")


class FirestoreService:
    """Enterprise Firestore service managing document state across all marketing collections."""

    def __init__(self):
        self.db = None
        self._memory_store: Dict[str, Dict[str, Dict[str, Any]]] = {
            "campaigns": {},
            "creative_assets": {},
            "attribution_models": {},
            "scenarios": {},
            "metro_geospine": {},
            "agent_states": {},
        }
        self._initialize_db()

    def _initialize_db(self):
        """Initialize Google Cloud Firestore client."""
        try:
            from google.cloud import firestore

            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"):
                self.db = firestore.AsyncClient(
                    project=settings.project_id,
                    database=settings.firestore_database,
                )
                logger.info("Firestore AsyncClient initialized successfully")
            else:
                logger.info("Firestore running in memory-store mode for local development")
        except Exception as e:
            logger.warning(f"Firestore native client deferred, using in-memory store: {e}")
            self.db = None

    async def get_document(
        self, collection_name: str, document_id: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve single document by collection and ID."""
        if self.db:
            try:
                doc_ref = self.db.collection(collection_name).document(document_id)
                doc = await doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.warning(f"Firestore get_document error ({collection_name}/{document_id}): {e}")

        # In-memory fallback
        return self._memory_store.get(collection_name, {}).get(document_id)

    async def set_document(
        self, collection_name: str, document_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Upsert a document into specified collection."""
        if collection_name not in self._memory_store:
            self._memory_store[collection_name] = {}
        self._memory_store[collection_name][document_id] = data

        if self.db:
            try:
                doc_ref = self.db.collection(collection_name).document(document_id)
                await doc_ref.set(data)
            except Exception as e:
                logger.warning(f"Firestore set_document error ({collection_name}/{document_id}): {e}")

        return data

    async def list_documents(
        self, collection_name: str, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List documents in a collection."""
        if self.db:
            try:
                docs_ref = self.db.collection(collection_name).limit(limit)
                docs = await docs_ref.get()
                results = [d.to_dict() for d in docs]
                if results:
                    return results
            except Exception as e:
                logger.warning(f"Firestore list_documents error ({collection_name}): {e}")

        # In-memory fallback
        items = list(self._memory_store.get(collection_name, {}).values())
        return items[:limit]

    async def delete_document(self, collection_name: str, document_id: str) -> bool:
        """Delete a document."""
        if collection_name in self._memory_store and document_id in self._memory_store[collection_name]:
            del self._memory_store[collection_name][document_id]

        if self.db:
            try:
                doc_ref = self.db.collection(collection_name).document(document_id)
                await doc_ref.delete()
            except Exception as e:
                logger.warning(f"Firestore delete_document error ({collection_name}/{document_id}): {e}")

        return True


firestore_service = FirestoreService()
