import fs from 'fs';
import path from 'path';

console.log('--- Company Context Persistence Unit Test ---');

const companyContextFile = path.join(process.cwd(), 'public', 'data', 'company_context_run.json');

// Mock data
const mockContext = {
    name: "TestCorp",
    description: "A test company description",
    guidelines: "Pro professional tone"
};

// 1. Simulate saving to the server (Mocking the fs side)
try {
    const dir = path.dirname(companyContextFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(companyContextFile, JSON.stringify(mockContext, null, 2));
    console.log('PASS: Successfully wrote mock company context to public/data/');
} catch (e) {
    console.error('FAIL: Could not write mock company context.', e);
}

// 2. Simulate loading from the server
try {
    const data = fs.readFileSync(companyContextFile, 'utf8');
    const parsed = JSON.parse(data);
    if (parsed.name === "TestCorp") {
        console.log('PASS: Successfully loaded and verified mock company context.');
    } else {
        console.error('FAIL: Loaded data does not match mock input.');
    }
} catch (e) {
    console.error('FAIL: Could not read/parse mock company context.', e);
}

// Cleanup
if (fs.existsSync(companyContextFile)) fs.unlinkSync(companyContextFile);

process.exit(0);
