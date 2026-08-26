import os
import glob
import re

components_dir = "components"

for filepath in glob.glob(os.path.join(components_dir, "**/*.tsx"), recursive=True):
    with open(filepath, "r") as f:
        content = f.read()

    original = content
    # Remove from interface ExampleProps { companyContext: ... }
    content = re.sub(r'companyContext\s*:\s*\{\s*name\s*:\s*string[^}]*\}\s*;?', '', content)
    content = re.sub(r'setCompanyContext\s*:\s*\([^)]*\)\s*=>\s*void\s*;?', '', content)

    # Empty interfaces after removal might trigger lint warnings, but they are acceptable for now
    content = re.sub(r'interface\s+\w+Props\s*\{\s*\}', '', content)

    # Remove from FC signature: ({ companyContext }) =>
    content = re.sub(r'\{\s*companyContext\s*(?:,\s*setCompanyContext)?\s*\}', '{}', content)
    content = re.sub(r'\{\s*setCompanyContext\s*(?:,\s*companyContext)?\s*\}', '{}', content)
    
    # Fix instances where it became React.FC<SomeProps> = ({})
    # or React.FC = ({}) => 
    content = re.sub(r':\s*React\.FC(?:<\w+Props>)?\s*=\s*\(\{\s*(?:[A-Za-z0-9_]+(?:\s*:\s*[A-Za-z0-9_]+)?\s*,\s*)*\}\)', lambda m: m.group(0).replace('{}', ''), content)

    if content != original:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Fixed props in {filepath}")

