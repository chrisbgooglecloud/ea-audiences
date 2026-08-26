import os
import glob
import re

components_dir = "components"

for filepath in glob.glob(os.path.join(components_dir, "**/*.tsx"), recursive=True):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Check if the file has destructuring but also uses companyContext.name incorrectly
    new_content = re.sub(r'companyContext\.name', 'name', content)
    new_content = re.sub(r'companyContext\.description\s*\?\s*`([^`]*)`\s*:\s*\'\'', 'description ? `\g<1>` : \'\'', new_content)
    new_content = re.sub(r'companyContext\.description', 'description', new_content)
    
    # Guidelines isn't destructured by default, let's just strip it if it causes errors or replace with ''
    new_content = re.sub(r'\$\{companyContext\.guidelines\s*\?\s*`[^`]*`\s*:\s*\'\'\}', '', new_content)

    if new_content != content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

