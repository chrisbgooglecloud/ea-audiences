import re

with open("App.tsx", "r") as f:
    content = f.read()

# Replace passing companyContext down as a prop
content = re.sub(r'\bcompanyContext=\{companyContext\}\s*', '', content)
content = re.sub(r'setCompanyContext=\{setCompanyContext\}', '', content)
content = re.sub(r'setCompanyContext=\{saveCompanyContext\}', '', content)

# Remove the broken saveCompanyContext and loadCompanyContext functions
content = re.sub(r'const saveCompanyContext.*?\};', '', content, flags=re.DOTALL)
content = re.sub(r'const loadCompanyContext.*?\};.*?loadCompanyContext\(\);', '', content, flags=re.DOTALL)

with open("App.tsx", "w") as f:
    f.write(content)

