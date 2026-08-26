import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Import Fix', () => {
    test('SyntheticTesting.tsx imports FileText', () => {
        const filePath = path.join(__dirname, '../components/SyntheticTesting.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if FileText is in the import list from lucide-react
        const importRegex = /import\s+{[^}]*FileText[^}]*}\s+from\s+['"]lucide-react['"]/;
        expect(content).toMatch(importRegex);
    });
});
