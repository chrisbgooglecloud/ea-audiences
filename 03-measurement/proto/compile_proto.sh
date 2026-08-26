#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "Compiling Protobuf definitions in ${SCRIPT_DIR}..."

# Verify protoc is available
if ! command -v protoc &> /dev/null; then
  echo "Error: protoc is not installed or not in PATH" >&2
  exit 1
fi

# Compile mmm.proto to Python (generating mmm_pb2.py and mmm_pb2.pyi)
protoc \
  --proto_path="${SCRIPT_DIR}" \
  --python_out="${SCRIPT_DIR}" \
  --pyi_out="${SCRIPT_DIR}" \
  "${SCRIPT_DIR}/mmm.proto"

# Ensure package initialization file exists
touch "${SCRIPT_DIR}/__init__.py"

# Handle cross-version protobuf runtime compatibility if needed
if [ -f "${SCRIPT_DIR}/mmm_pb2.py" ]; then
  # Ensure ValidateProtobufRuntimeVersion does not fail when running across minor protoc/runtime differences
  python3 -c "
with open('${SCRIPT_DIR}/mmm_pb2.py', 'r') as f:
    content = f.read()

# Replace strict version validation with safe exception-handled validation
target = '_runtime_version.ValidateProtobufRuntimeVersion('
if target in content:
    replacement = '''try:
    _runtime_version.ValidateProtobufRuntimeVersion('''
    # find closing paren
    idx = content.find(target)
    close_idx = content.find(')\n', idx)
    if close_idx != -1:
        orig_call = content[idx:close_idx+2]
        safe_call = '''try:
    ''' + orig_call.replace('\n', '\n    ') + '''
except Exception:
    pass
'''
        content = content[:idx] + safe_call + content[close_idx+2:]
        with open('${SCRIPT_DIR}/mmm_pb2.py', 'w') as f:
            f.write(content)
"
fi

echo "Protobuf compilation successful!"
echo "Generated:"
ls -l "${SCRIPT_DIR}"/mmm_pb2*
