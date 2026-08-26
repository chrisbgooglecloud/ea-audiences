import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Adjustments', () => {
    test('index.css contains max-w-7xl override', () => {
        const filePath = path.join(__dirname, '../public/index.css');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('.max-w-7xl {');
        expect(content).toContain('max-width: 110rem !important;');
    });

    test('Navigation.tsx has reduced padding', () => {
        const filePath = path.join(__dirname, '../components/Navigation.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if p-6 was changed to p-3 or similar
        expect(content).toContain('p-3 border-b'); // Line 98
        expect(content).toContain('p-2 space-y-1'); // Line 109
    });
});
