"""Pytest configuration for 00-data-foundation test suite."""

import os
import sys
from pathlib import Path

# Add 00-data-foundation directory to sys.path
TEST_DIR = Path(__file__).resolve().parent
DATA_FOUNDATION_DIR = TEST_DIR.parent
if str(DATA_FOUNDATION_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_FOUNDATION_DIR))

# Add project root directory to sys.path
PROJECT_ROOT = DATA_FOUNDATION_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
