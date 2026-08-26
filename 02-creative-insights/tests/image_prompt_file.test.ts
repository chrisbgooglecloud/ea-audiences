import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Image Prompt File', () => {
    test('file exists and contains prompt', () => {
        const filePath = path.join(__dirname, '../image_prompt.md');
        
        expect(fs.existsSync(filePath)).toBe(true);
        
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('COLOR CONSISTENCY:');
        expect(content).toContain('colors of all text and backgrounds stay exactly the same');
    });
});
