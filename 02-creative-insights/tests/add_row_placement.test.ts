import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Add Row Placement', () => {
    test('RunwayAnalysis.tsx prepends new row', () => {
        const filePath = path.join(__dirname, '../components/RunwayAnalysis.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('setRows([newRow, ...rows])');
    });
});
