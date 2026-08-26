import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Versioning Layout', () => {
    test('has wider container and 3 columns', () => {
        const filePath = path.join(__dirname, '../components/ContentVersioning.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('max-w-7xl mx-auto');
        expect(content).toContain('lg:grid-cols-3');
    });
});
