import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Versioning Prompt', () => {
    test('contains color consistency instruction', () => {
        const filePath = path.join(__dirname, '../components/ContentVersioning.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('colors of all text and backgrounds stay exactly the same');
    });
});
