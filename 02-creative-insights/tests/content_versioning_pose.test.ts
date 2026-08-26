import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Versioning Pose Prompt', () => {
    test('contains pose consistency instruction', () => {
        const filePath = path.join(__dirname, '../components/ContentVersioning.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('pose, posture, and body language of any characters');
    });
});
