#!/usr/bin/env python3
"""Standalone E2E Test Suite Runner for EA Creative Intelligence & Predictive Measurement Platform.

Executes test tiers across Track B (Data Foundation & Backend Microservices)
and generates formatted execution summaries.
"""

import os
import sys
import time
import argparse
import pytest

# Ensure root directory and measurement directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MEASUREMENT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(MEASUREMENT_DIR, ".."))
for p in [MEASUREMENT_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)


class TierSummaryPlugin:
    """Pytest plugin to collect test execution counts and durations per tier."""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.tier_counts = {
            "Tier 1: Feature Coverage (Features 1-12)": {"passed": 0, "failed": 0, "total": 0},
            "Tier 2: Boundary & Corner Cases (Features 1-12)": {"passed": 0, "failed": 0, "total": 0},
            "Tier 3: Cross-Feature Combinations": {"passed": 0, "failed": 0, "total": 0},
            "Tier 4: Real-World Scenarios (Scenario 1)": {"passed": 0, "failed": 0, "total": 0},
        }

    def pytest_runtest_logreport(self, report):
        if report.when == "call":
            nodeid = report.nodeid
            tier_key = None
            if "tier1_features" in nodeid:
                tier_key = "Tier 1: Feature Coverage (Features 1-12)"
            elif "tier2_boundaries" in nodeid:
                tier_key = "Tier 2: Boundary & Corner Cases (Features 1-12)"
            elif "tier3_combinations" in nodeid:
                tier_key = "Tier 3: Cross-Feature Combinations"
            elif "tier4_real_world" in nodeid:
                tier_key = "Tier 4: Real-World Scenarios (Scenario 1)"

            if tier_key:
                self.tier_counts[tier_key]["total"] += 1
                if report.passed:
                    self.tier_counts[tier_key]["passed"] += 1
                    self.passed += 1
                elif report.failed:
                    self.tier_counts[tier_key]["failed"] += 1
                    self.failed += 1
                elif report.skipped:
                    self.skipped += 1


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description="EA Measurement Platform E2E Test Runner")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4], help="Run a specific tier (1-4)")
    parser.add_argument("--track-b", action="store_true", default=True, help="Run Track B test suites (default: True)")
    parser.add_argument("pytest_extra_args", nargs="*", help="Extra arguments forwarded to pytest")
    args, unknown = parser.parse_known_args()

    track_b_files = [
        os.path.join(CURRENT_DIR, "tier1_features", "test_t1_data_foundation.py"),
        os.path.join(CURRENT_DIR, "tier1_features", "test_t1_backend_services.py"),
        os.path.join(CURRENT_DIR, "tier2_boundaries", "test_t2_data_boundaries.py"),
        os.path.join(CURRENT_DIR, "tier2_boundaries", "test_t2_backend_boundaries.py"),
        os.path.join(CURRENT_DIR, "tier3_combinations", "test_t3_data_to_backend.py"),
        os.path.join(CURRENT_DIR, "tier4_real_world", "test_t4_eafc_apex_collision_scenario.py"),
    ]

    if args.tier == 1:
        target_files = [track_b_files[0], track_b_files[1]]
    elif args.tier == 2:
        target_files = [track_b_files[2], track_b_files[3]]
    elif args.tier == 3:
        target_files = [track_b_files[4]]
    elif args.tier == 4:
        target_files = [track_b_files[5]]
    else:
        target_files = track_b_files

    print("=" * 80)
    print("  EA CREATIVE INTELLIGENCE & PREDICTIVE MEASUREMENT PLATFORM")
    print("  TRACK B: DATA FOUNDATION & BACKEND MICROSERVICES E2E TEST RUNNER")
    print("=" * 80)
    print(f"Test Directory: {CURRENT_DIR}")
    print(f"Timestamp:      {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    print(f"Target Suites:  {len(target_files)} files")
    print("-" * 80)

    plugin = TierSummaryPlugin()
    pytest_args = target_files + [
        "-q",
        "--tb=short",
        "-W", "ignore::DeprecationWarning",
        "-W", "ignore::pydantic.warnings.PydanticDeprecatedSince20",
    ] + args.pytest_extra_args + unknown

    start_time = time.perf_counter()
    exit_code = pytest.main(pytest_args, plugins=[plugin])
    elapsed = time.perf_counter() - start_time

    print("\n" + "=" * 80)
    print("  E2E TEST SUITE EXECUTION SUMMARY")
    print("=" * 80)
    print(f"{'Tier Name':<50} | {'Passed':<8} | {'Failed':<8} | {'Total':<8}")
    print("-" * 80)

    total_passed = 0
    total_failed = 0
    total_tests = 0

    for tier, counts in plugin.tier_counts.items():
        if counts["total"] > 0 or args.tier is None:
            print(f"{tier:<50} | {counts['passed']:<8} | {counts['failed']:<8} | {counts['total']:<8}")
            total_passed += counts["passed"]
            total_failed += counts["failed"]
            total_tests += counts["total"]

    print("-" * 80)
    print(f"{'TOTAL ACROSS ALL TIERS':<50} | {total_passed:<8} | {total_failed:<8} | {total_tests:<8}")
    print(f"Elapsed Time:   {elapsed:.2f} seconds")
    print(f"Overall Status: {'PASSED (100%)' if exit_code == 0 and total_failed == 0 else 'FAILED'}")
    print("=" * 80 + "\n")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
