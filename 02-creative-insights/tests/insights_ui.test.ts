import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Insights UI Adjustments', () => {
    test('RunwayAnalysis.tsx imports Trash2', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        const importRegex = /import\s+{[^}]*Trash2[^}]*}\s+from\s+['"]lucide-react['"]/;
        expect(content).toMatch(importRegex);
    });

    test('RunwayAnalysis.tsx uses Trash2 in delete button', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('<Trash2 size={');
    });

    test('RunwayAnalysis.tsx has row layout for type selector', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('flex flex-row items-center gap-2');
    });
});
