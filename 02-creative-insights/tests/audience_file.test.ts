import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Audience Generator Personas File', () => {
    test('file exists and has valid content', () => {
        const filePath = path.join(__dirname, '../public/data/configuration/audience_generator_personas.json');
        
        // Check if file exists
        expect(fs.existsSync(filePath)).toBe(true);
        
        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        
        expect(Array.isArray(json)).toBe(true);
        expect(json).toHaveLength(3);
        
        expect(json[0].name).toBe('The Family Member');
        expect(json[1].name).toBe('The PCS Officer');
        expect(json[2].name).toBe('The Transitioning Veteran');
    });
});
