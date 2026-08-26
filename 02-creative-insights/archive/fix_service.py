import re

rl_path = '/Users/curtisgross/Documents/github/ailab-next/ralphlauren-app/services/geminiService.ts'
qvc_path = '/Users/curtisgross/Documents/github/ailab-next/qvc-app/services/geminiService.ts'

with open(rl_path, 'r') as f:
    rl_content = f.read()

# Extract analyzeRunwayVideo
# It starts at 'export const analyzeRunwayVideo' and ends before the next export (compileRunwayAnalyses)
m1 = re.search(r'export const analyzeRunwayVideo = async.*?\}\s*;\s*(?=export const compileRunwayAnalyses)', rl_content, re.DOTALL)
analyze_func = m1.group(0) if m1 else ""

# Extract compileRunwayAnalyses
# It starts at 'export const compileRunwayAnalyses' and ends before generateAgentSummary
m2 = re.search(r'export const compileRunwayAnalyses = async.*?\}\s*;\s*(?=export const generateAgentSummary)', rl_content, re.DOTALL)
compile_func = m2.group(0) if m2 else ""

def adapt_to_proxy(func_text):
    # Remove getClient
    func_text = func_text.replace('const client = await getClient();', '')
    
    # Replace SDK call with proxy call
    # From: const response = await client.models.generateContent({
    # To:   const response = await callGenAiProxy("generateContent", {
    func_text = func_text.replace('client.models.generateContent', 'callGenAiProxy("generateContent"')
    
    # Replace response text extraction
    # From: const text = response?.text || "{}";
    # To:   const text = extractTextFromResponse(response) || "{}";
    func_text = func_text.replace('const text = response?.text || "{}";', 'const text = extractTextFromResponse(response) || "{}";')
    
    # Change Ralph Lauren references to QVC for branding
    func_text = func_text.replace('Ralph Lauren', 'QVC')
    
    return func_text

analyze_adapted = adapt_to_proxy(analyze_func)
compile_adapted = adapt_to_proxy(compile_func)

with open(qvc_path, 'a') as f:
    f.write("\n\n")
    f.write(analyze_adapted)
    f.write("\n\n")
    f.write(compile_adapted)

print("Functions adapted and appended.")
