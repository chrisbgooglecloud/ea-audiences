import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Insights Actions Adjustments', () => {
    test('RunwayAnalysis.tsx imports RotateCw', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        const importRegex = /import\s+{[^}]*RotateCw[^}]*}\s+from\s+['"]lucide-react['"]/;
        expect(content).toMatch(importRegex);
    });

    test('RunwayAnalysis.tsx uses RotateCw in re-analyze button', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('<RotateCw size={');
    });

    test('RunwayAnalysis.tsx uses Eye in view button', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('<Eye size={');
    });

    test('RunwayAnalysis.tsx has row layout for actions', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('flex flex-row items-center gap-1 mx-auto w-fit');
    });
});
