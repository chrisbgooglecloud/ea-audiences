import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sample Customer Data File', () => {
    test('file exists and has valid content', () => {
        const filePath = path.join(__dirname, '../public/data/configuration/microsite_sample_data.json');
        
        // Check if file exists
        expect(fs.existsSync(filePath)).toBe(true);
        
        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        
        // Check for expected fields in sample data
        const firstItem = json[0];
        expect(firstItem).toHaveProperty('name');
        expect(firstItem).toHaveProperty('location');
        expect(firstItem).toHaveProperty('Browse_history');
        expect(firstItem).toHaveProperty('topChannel');
        expect(firstItem).toHaveProperty('condition');
    });
});
