import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Text Overflow Fix', () => {
    test('RunwayAnalysis.tsx has break-words on summary text', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('break-words">{summaryObj.why_it_matters}');
    });

    test('RunwayAnalysis.tsx removes truncate on title', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).not.toContain('truncate max-w-xs" title={title}>{title}');
    });
});
