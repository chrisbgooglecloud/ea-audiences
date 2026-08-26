import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Versioning Fix', () => {
    test('calls generateImageWithReference with array', () => {
        const filePath = path.join(__dirname, '../components/ContentVersioning.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('generateImageWithReference(prompt, [uploadedImage]');
    });
});
