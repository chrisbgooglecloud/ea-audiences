#!/bin/bash

echo "Running test for start_local.sh..."

# Mock npm and node to prevent actual execution
npm() {
  echo "Mock npm called"
}
node() {
  echo "Mock node called"
}
export -f npm
export -f node

# Test Case 1: Missing GEMINI_API_KEY
echo "Testing with missing GEMINI_API_KEY..."
unset GEMINI_API_KEY

# Run the script
./start_local.sh > /tmp/test_output.log 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
  echo "Sub-test 1 PASSED: Script failed as expected when GEMINI_API_KEY is missing."
else
  echo "Sub-test 1 FAILED: Script did not fail as expected. Exit code: $EXIT_CODE"
  cat /tmp/test_output.log
  exit 1
fi

# Test Case 2: Present GEMINI_API_KEY
echo "Testing with present GEMINI_API_KEY..."
export GEMINI_API_KEY="mock_key"

# Run the script
./start_local.sh > /tmp/test_output.log 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "Sub-test 2 PASSED: Script proceeded as expected when GEMINI_API_KEY is present."
else
  echo "Sub-test 2 FAILED: Script failed unexpectedly. Exit code: $EXIT_CODE"
  cat /tmp/test_output.log
  exit 1
fi

echo "All tests for start_local.sh PASSED."
exit 0
